require('dotenv').config({ path: '../.env' });

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const NodeCache = require('node-cache');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 3001;
const amadeus = require("./amadeus");
const myCache = new NodeCache({ stdTTL: 1800, checkperiod: 600 });
const {
  getUsers,
  addUser,
  getFlights,
  saveFlightsToSheet,
  getPurchases,
  addPurchase,
} = require('./sheetsService');
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3001", "http://10.241.243.79:5173","http://10.203.17.131:5173"], 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log("Kết nối mới:", socket.id);

  // Khai báo vai trò
  socket.on("join", (role) => {
    if (role === "admin") {
      socket.join("admin_group");
      console.log(`Admin kết nối: ${socket.id}`);
    }
  });

  // KHÁCH HÀNG GỬI (Khớp với client_msg trong ChatBox.jsx)
  socket.on("client_msg", (data) => {
    const payload = {
      senderId: socket.id, // ID để admin biết ai nhắn
      text: data.text,
      time: new Date().toLocaleTimeString()
    };
    // Gửi cho nhóm admin (Khớp với admin_receive_msg trong AdminChat.jsx)
    io.to("admin_group").emit("admin_receive_msg", payload);
  });

  // ADMIN PHẢN HỒI (Khớp với admin_reply_msg trong AdminChat.jsx)
  socket.on("admin_reply_msg", ({ targetId, text }) => {
    // Gửi về đúng khách hàng (Khớp với admin_reply trong ChatBox.jsx)
    io.to(targetId).emit("admin_reply", {
      text: text,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on('disconnect', () => {
    console.log("Người dùng thoát:", socket.id);
  });
});
// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

const secretKey = process.env.JWT_SECRET || 'fallback-secret';

// Middleware kiểm tra token (để bảo vệ các route cần đăng nhập)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Token required' });

  jwt.verify(token, secretKey, (err, user) => {
    // Nếu token hết hạn hoặc không hợp lệ, trả về 403
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Map city to airport
const cityToAirport = {
    'hcm': 'SGN','hồ chí minh': 'SGN','tp hcm': 'SGN','sài gòn': 'SGN',
    'ha noi': 'HAN','hà nội': 'HAN',
    'da nang': 'DAD','đà nẵng': 'DAD',
    'phu quoc': 'PQC','phú quốc': 'PQC',
    'nha trang': 'CXR','cam ranh': 'CXR',
    'can tho': 'VCA','cần thơ': 'VCA',
    'vinh': 'VII',
    'hue': 'HUI','huế': 'HUI','phu bai': 'HUI','phú bài': 'HUI',
    'da lat': 'DLI','đà lạt': 'DLI','lien khuong': 'DLI','liên khương': 'DLI',
    'hai phong': 'HPH','hải phòng': 'HPH','cat bi': 'HPH','cát bi': 'HPH',
    'van don': 'VDO','vân đồn': 'VDO','quang ninh': 'VDO','quảng ninh': 'VDO',
    'dien bien': 'DIN','điện biên': 'DIN',
    'dong hoi': 'VDH','đồng hới': 'VDH','quang binh': 'VDH','quảng bình': 'VDH',
    'thanh hoa': 'THD','thanh hóa': 'THD','tho xuan': 'THD','thọ xuân': 'THD',
    'chu lai': 'VCL','quang nam': 'VCL','quảng nam': 'VCL',
    'tuy hoa': 'TBB','tuy hòa': 'TBB','phu yen': 'TBB','phú yên': 'TBB',
    'rach gia': 'VKG','rạch giá': 'VKG','kien giang': 'VKG','kiên giang': 'VKG',
    'pleiku': 'PXU','gia lai': 'PXU',
    'buon ma thuot': 'BMV','buôn ma thuột': 'BMV','dak lak': 'BMV','đắk lắk': 'BMV',
    'ca mau': 'CAH','cà mau': 'CAH',
    'con dao': 'VCS','côn đảo': 'VCS'
  };  

// function normalizeInput(input) {
//   if (!input) return null;
//   // Sử dụng normalize để loại bỏ dấu
//   const key = input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
//   return cityToAirport[key] || input.toUpperCase();
// }
// API Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const users = await getUsers();
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      passwordHash,
    };

    await addUser(newUser);
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// API Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = await getUsers();
    const user = users.find(u => u.email === email);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Token hết hạn sau 1 giờ
    const token = jwt.sign({ id: user.id, email: user.email }, secretKey, { expiresIn: '15h' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// API Session (Protected) - Dùng để kiểm tra token còn sống hay không
app.get('/api/session', authenticateToken, (req, res) => {
  res.json({ loggedIn: true, user: req.user });
});
// API Get User Profile (Protected) - Dùng để lấy tên hiển thị
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const users = await getUsers();
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const profile = {
            id: user.id,
            name: user.name,
            email: user.email,
        };

        res.json(profile);
    } catch (err) {
        console.error('Get user profile error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});
//api flights
const normalizeInput = (str) => str ? str.trim().toUpperCase() : null;
const transformFlightOffer = (offer, dictionaries, numAdults) => {
  const getSegmentDetails = (itinerary) => {
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    
    // Tổng hợp danh sách các hãng bay trong hành trình này
    const carrierCode = firstSegment.carrierCode;
    const carrierName = dictionaries.carriers[carrierCode] || carrierCode;
    const aircraftCode = firstSegment.aircraft.code;
    const aircraftName = dictionaries.aircraft[aircraftCode] || aircraftCode;

    return {
      // Thông tin thời gian & địa điểm
      origin: firstSegment.departure.iataCode,
      destination: lastSegment.arrival.iataCode,
      departureTime: firstSegment.departure.at, // ISO String
      arrivalTime: lastSegment.arrival.at,      // ISO String
      
      // Thời lượng bay tổng (bao gồm cả thời gian transit)
      duration: itinerary.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm'),
      
      // Thông tin hãng bay & Chuyến bay
      flightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
      airline: carrierName,
      logo: `https://pics.avs.io/200/200/${firstSegment.carrierCode}.png`, // Logo hãng bay
      aircraft: aircraftName,
      
      stops: itinerary.segments.length - 1, 
      segments: itinerary.segments.map(seg => ({
        from: seg.departure.iataCode,
        to: seg.arrival.iataCode,
        flightNumber: `${seg.carrierCode} ${seg.number}`
      }))
    };
  };

  const exchangeRate = 25500;
  const priceEUR = parseFloat(offer.price.total);
  const priceVND = Math.round(priceEUR * exchangeRate);

  // Xử lý dữ liệu trả về thống nhất
  const result = {
    id: offer.id,
    type: offer.itineraries.length > 1 ? 'roundtrip' : 'oneway',
    price: {
      total: priceVND * numAdults, // Tổng tiền thanh toán
      perPassenger: priceVND,      // Giá vé lẻ
      currency: 'VND'
    },
    outbound: getSegmentDetails(offer.itineraries[0]),
    inbound: offer.itineraries[1] ? getSegmentDetails(offer.itineraries[1]) : null,
    bookingToken: offer.id, 
    validatingAirlineCodes: offer.validatingAirlineCodes
  };

  return result;
};
app.get('/api/flights', async (req, res) => {
  try {
    let {
      from, to, departureDate, returnDate, 
      passengers = '1', 
      seatClass = 'economy',        
      tripType = 'oneway'             
    } = req.query;

    const origin = normalizeInput(from);
    const destination = normalizeInput(to);
    const numAdults = parseInt(passengers, 10) || 1;
    // 1. VALIDATION
    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ message: 'Vui lòng nhập Điểm đi, Điểm đến và Ngày đi.' });
    }
    // 2. CHECK CACHE
    const cacheKey = `flight:${origin}:${destination}:${departureDate}:${returnDate || ''}:${numAdults}:${seatClass}`;
    const cachedData = myCache.get(cacheKey); // Sử dụng myCache (Node-Cache) đã tạo ở bài trước
    if (cachedData) {
      console.log(">>> Flight Cache Hit");
      return res.json(cachedData);
    }
    // 3. PREPARE AMADEUS PARAMS
    const travelClassMap = {
      economy: 'ECONOMY',
      premium: 'PREMIUM_ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST'
    };
    const amadeusParams = {
      originLocationCode: origin,
      destinationLocationCode: destination,
      departureDate: departureDate,
      adults: numAdults,
      travelClass: travelClassMap[seatClass.toLowerCase()] || 'ECONOMY',
      currencyCode: 'EUR',
      max: 20 // Giới hạn 20 kết quả để load cho nhanh
    };

    if (tripType === 'roundtrip' && returnDate) {
      amadeusParams.returnDate = returnDate;
    }
    console.log(">>> Fetching Flights from Amadeus...");
    // 4. CALL API
    const response = await amadeus.shopping.flightOffersSearch.get(amadeusParams);
    // Amadeus trả về Dictionaries chứa tên đầy đủ của hãng bay và máy bay
    const dictionaries = response.result.dictionaries || { carriers: {}, aircraft: {} };
    const offers = response.data || [];
    // 5. TRANSFORM DATA
    const formattedResults = offers.map(offer => transformFlightOffer(offer, dictionaries, numAdults));

    // 6. SAVE CACHE (TTL 15 phút - Giá vé máy bay biến động nhanh hơn khách sạn)
    if (formattedResults.length > 0) {
      myCache.set(cacheKey, formattedResults, 900);
    }

    res.json(formattedResults);

  } catch (err) {
    console.error('Flight API Error:', err);
    
    // Xử lý lỗi đặc thù của Amadeus
    if (err.response) {
      const errorDetail = err.response.data?.errors?.[0];
      if (errorDetail?.code === 400 || errorDetail?.title === 'INVALID FORMAT') {
        return res.status(400).json({ message: "Dữ liệu tìm kiếm không hợp lệ (Mã sân bay hoặc ngày tháng)." });
      }
    }
    
    res.status(500).json({ message: 'Không tìm thấy chuyến bay phù hợp hoặc lỗi hệ thống.' });
  }
});
// API Get cheap flights (Public)
app.get('/api/flights/cheap', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    let originCode = 'SGN'; // Mặc định là Sài Gòn

    // 1. Nếu có GPS, tìm sân bay gần nhất
    if (lat && lng) {
      try {
        const airportRes = await amadeus.referenceData.locations.airports.get({
          longitude: lng,
          latitude: lat,
          sort: 'distance',
          'page[limit]': 1
        });
        if (airportRes.data.length > 0) {
          originCode = airportRes.data[0].iataCode;
        }
      } catch (e) {
        console.error("Lỗi tìm sân bay qua GPS:", e.message);
      }
    }

    // 2. Tìm vé rẻ trong 30 ngày tới từ originCode
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 30);

    const response = await amadeus.shopping.flightDestinations.get({
      origin: originCode,
      departureDate: `${today.toISOString().split('T')[0]},${future.toISOString().split('T')[0]}`,
      oneWay: true
    });

    const exchangeRate = 25400; // Tỉ giá USD/VND

    // 3. Map dữ liệu về cấu trúc chuẩn để Frontend dễ đọc
    const formatted = response.data.map(f => ({
      origin: f.origin,
      destination: f.destination,
      departureDate: f.departureDate,
      priceVND: Math.round(f.price.total * exchangeRate),
      isGpsBased: !!(lat && lng) // Đánh dấu nếu đây là vé tìm theo vị trí
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Amadeus API Error:", err);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
});
// API hotels
const transformHotelData = (offer) => ({
  id: offer.hotel.hotelId,
  name: offer.hotel.name,
  location: {
    lat: offer.hotel.latitude,
    lng: offer.hotel.longitude
  },
  price: parseFloat(offer.offers[0].price.total),
  currency: offer.offers[0].price.currency || 'VND',
  roomType: offer.offers[0].room?.typeEstimated?.category || 'Standard',
  amenities: offer.hotel.amenities || [],
  image: `https://placehold.co/600x400?text=${encodeURIComponent(offer.hotel.name)}`
});
app.get('/api/hotels', async (req, res) => {
  try {
    const { location, checkInDate, checkOutDate, guests, rooms } = req.query;

    if (!location || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Thiếu tham số tìm kiếm." });
    }

    // 1. TẠO CACHE KEY
    const cacheKey = `hotels_${location}_${checkInDate}_${checkOutDate}_${guests}_${rooms}`;

    // 2. KIỂM TRA CACHE TRONG RAM
    const cachedData = myCache.get(cacheKey);
    if (cachedData) {
      console.log(">>> Lấy dữ liệu từ NODE-CACHE (RAM)");
      return res.json(cachedData);
    }

    console.log(">>> Gọi trực tiếp AMADEUS API");

    // 3. LẤY DANH SÁCH HOTEL ID THEO THÀNH PHỐ
    const hotelList = await amadeus.referenceData.locations.hotels.byCity.get({
      cityCode: location
    });

    if (!hotelList.data || hotelList.data.length === 0) {
      return res.json([]);
    }

    const hotelIds = hotelList.data.slice(0, 40).map(h => h.hotelId).join(',');

    // 4. LẤY GIÁ PHÒNG THỰC TẾ
    const response = await amadeus.shopping.hotelOffersSearch.get({
      hotelIds,
      adults: guests || 1,
      checkInDate,
      checkOutDate,
      roomQuantity: rooms || 1,
      currencyCode: 'VND',
      bestRateOnly: true
    });

    // 5. CHUYỂN ĐỔI VÀ LƯU VÀO CACHE
    const results = response.data.map(transformHotelData);
    
    if (results.length > 0) {
      // Lưu vào cache với key vừa tạo
      myCache.set(cacheKey, results); 
    }

    res.json(results);

  } catch (error) {
    console.error("Lỗi API:", error);
    const statusCode = error.response?.status || 500;
    res.status(statusCode).json({ 
      message: error.response?.data?.errors?.[0]?.detail || "Lỗi hệ thống đặt phòng." 
    });
  }
});
// API cars
const transformCarData = (car, exchangeRate = 25400) => {
  return {
    id: car.id,
    provider: car.provider.name,
    vehicle: {
      name: car.vehicle.description,
      type: car.vehicle.category,
      transmission: car.vehicle.transmissionType === 'Automatic' ? 'Tự động' : 'Số sàn',
      fuel: car.vehicle.fuelType || 'Xăng/Dầu',
      seats: car.vehicle.nbSeats || 5
    },
    pricing: {
      totalEUR: parseFloat(car.price.total),
      totalVND: Math.round(car.price.total * exchangeRate),
      currency: 'VND'
    },
    // Ảnh giả lập dựa trên loại xe (vì API xe thường không trả về link ảnh trực tiếp)
    image: `https://source.unsplash.com/800x600/?car,${car.vehicle.category.toLowerCase()}`
  };
};
 app.get('/api/cars', async (req, res) => {
  try {
    const { pickup, pickupDate, dropoffDate } = req.query;

    // 1. Validation
    if (!pickup || !pickupDate) {
      return res.status(400).json({ message: "Thiếu địa điểm hoặc ngày nhận xe." });
    }

    // 2. Kiểm tra Cache (In-memory)
    const cacheKey = `cars_${pickup}_${pickupDate}_${dropoffDate || ''}`;
    const cachedCars = myCache.get(cacheKey);
    if (cachedCars) {
      console.log(">>> Lấy dữ liệu xe từ CACHE");
      return res.json(cachedCars);
    }

    console.log(">>> Gọi Amadeus Car Rental API");

    // 3. Gọi Amadeus API
    // Lưu ý: Trong môi trường Sandbox, Car Rental chủ yếu có dữ liệu tại các sân bay lớn (IATA)
    const response = await amadeus.shopping.carRentals.get({
      pickUpLocation: pickup, // Ví dụ: 'SGN'
      pickUpDate: pickupDate,         // Định dạng: YYYY-MM-DD
      // Nếu có ngày trả xe thì thêm vào, nếu không Amadeus mặc định thuê trong 1 ngày
      ...(dropoffDate && { dropoffDate }) 
    });

    if (!response.data || response.data.length === 0) {
      return res.json([]);
    }

    // 4. Mapping dữ liệu qua Adapter
    const exchangeRate = 25400; // Có thể lấy từ một API tỷ giá khác để chính xác hơn
    const formattedCars = response.data.map(car => transformCarData(car, exchangeRate));

    // 5. Lưu vào Cache (Thời gian sống 30 phút)
    myCache.set(cacheKey, formattedCars);

    res.json(formattedCars);

  } catch (err) {
    console.error("--- Lỗi API Cars ---", err);
    
    // Phân loại lỗi
    if (err.code === 'NetworkError') {
      return res.status(503).json({ message: "Không thể kết nối tới dịch vụ thuê xe." });
    }

    // Với Sandbox, nếu địa điểm không hỗ trợ thuê xe, Amadeus thường trả về lỗi 400
    // Trong trường hợp đó ta trả về mảng rỗng để không làm sập giao diện Frontend
    res.json([]); 
  }
});
// API Buy ticket (Protected)
app.post('/api/buy-ticket', authenticateToken, async (req, res) => {
  try {
    const { flightId, outboundId, returnId, passengers, class: seatClass, method } = req.body;
    const flights = await getFlights();
    const pax = parseInt(passengers) || 1;
    let purchase;

    if (outboundId && returnId) {
      const outbound = flights.find(f => f.id == outboundId);
      const returnFlight = flights.find(f => f.id == returnId);
      if (!outbound || !returnFlight) return res.status(404).json({ message: 'Flight not found' });

      const totalPrice = (outbound.priceVND + returnFlight.priceVND) * pax;
      purchase = {
        userId: req.user.id,
        type: 'roundtrip',
        outboundId: outbound.id,
        returnId: returnFlight.id,
        from: outbound.originAirportCode,
        to: outbound.destinationAirportCode,
        departureDate: outbound.departureDate,
        returnDate: returnFlight.departureDate,
        passengers: pax,
        class: seatClass || outbound.class,
        totalPrice,
        method: method || 'card',
        date: new Date().toISOString(),
        status: 'Hoàn tất'
      };
    } else if (flightId) {
      const flight = flights.find(f => f.id == flightId);
      if (!flight) return res.status(404).json({ message: 'Flight not found' });

      const totalPrice = flight.priceVND * pax;
      purchase = {
        userId: req.user.id,
        type: 'oneway',
        flightId: flight.id,
        from: flight.originAirportCode,
        to: flight.destinationAirportCode,
        departureDate: flight.departureDate,
        passengers: pax,
        class: seatClass || flight.class,
        totalPrice,
        method: method || 'card',
        date: new Date().toISOString(),
        status: 'Hoàn tất'
      };
    } else {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    await addPurchase(purchase);
    res.json({ message: 'Ticket purchased successfully', purchase });
  } catch (err) {
    console.error('Buy ticket error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Thanh toán qua ví điện tử
app.post('/api/buy-ticket/wallet', authenticateToken, async (req, res) => {
  try {
    const { flightId, outboundId, returnId, passengers, class: seatClass, meta } = req.body;
    const { walletProvider } = meta || {};
    const flights = await getFlights();
    const pax = parseInt(passengers) || 1;
    let purchase;

    if (outboundId && returnId) {
      const outbound = flights.find(f => f.id == outboundId);
      const returnFlight = flights.find(f => f.id == returnId);
      if (!outbound || !returnFlight) return res.status(404).json({ message: 'Flight not found' });

      const totalPrice = (outbound.priceVND + returnFlight.priceVND) * pax;
      purchase = {
        userId: req.user.id,
        type: 'roundtrip',
        outboundId: outbound.id,
        returnId: returnFlight.id,
        from: outbound.originAirportCode,
        to: outbound.destinationAirportCode,
        departureDate: outbound.departureDate,
        returnDate: returnFlight.departureDate,
        passengers: pax,
        class: seatClass || outbound.class,
        totalPrice,
        method: 'wallet',
        walletProvider,
        date: new Date().toISOString(),
        status: 'Pending'
      };
    } else if (flightId) {
      const flight = flights.find(f => f.id == flightId);
      if (!flight) return res.status(404).json({ message: 'Flight not found' });

      const totalPrice = flight.priceVND * pax;
      purchase = {
        userId: req.user.id,
        type: 'oneway',
        flightId: flight.id,
        from: flight.originAirportCode,
        to: flight.destinationAirportCode,
        departureDate: flight.departureDate,
        passengers: pax,
        class: seatClass || flight.class,
        totalPrice,
        method: 'wallet',
        walletProvider,
        date: new Date().toISOString(),
        status: 'Pending'
      };
    } else {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    await addPurchase(purchase);

    // Giả lập redirect URL từ ví điện tử
    const redirectUrl = `https://pay.${walletProvider}.vn/checkout?pnr=${purchase.userId}-${Date.now()}`;
    res.json({ message: 'Wallet payment initiated', redirectUrl, purchase });
  } catch (err) {
    console.error('Wallet payment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Thanh toán qua chuyển khoản ngân hàng
const QRCode = require('qrcode');

app.post('/api/buy-ticket/bank', authenticateToken, async (req, res) => {
  try {
    // 1. Kiểm tra req.body xem có dữ liệu không
    if (!req.body.flightDetails) {
      console.error("Lỗi: Không nhận được flightDetails từ Frontend");
      return res.status(400).json({ message: 'Missing flight details' });
    }

    const { passengers, class: seatClass, meta, flightDetails, tripType } = req.body;
    const { bankName, bankNote } = meta || {};
    const pax = parseInt(passengers) || 1;
    
    let purchase;

    if (tripType === 'roundtrip') {
      const outbound = flightDetails.outbound || flightDetails.outboundFlight;
      const inbound = flightDetails.inbound || flightDetails.returnFlight;
      const total = flightDetails.totalPrice;

      purchase = {
        userId: req.user.id,
        type: 'roundtrip',
        outboundId: outbound?.id || '',
        returnId: inbound?.id || '',
        from: outbound?.originAirportCode || '',
        to: outbound?.destinationAirportCode || '',
        departureDate: outbound?.departureDate || '',
        returnDate: inbound?.departureDate || '',
        passengers: pax,
        class: seatClass || outbound?.class || '',
        totalPrice: total,
        method: 'bank',
        bankName,
        bankNote,
        date: new Date().toISOString(),
        status: 'Pending'
      };
    } else {
      const flight = flightDetails.flight;
      const total = flightDetails.totalPrice;

      purchase = {
        userId: req.user.id,
        type: 'oneway',
        flightId: flight?.id || '',
        from: flight?.originAirportCode || '',
        to: flight?.destinationAirportCode || '',
        departureDate: flight?.departureDate || '',
        passengers: pax,
        class: seatClass || flight?.class || '',
        totalPrice: total,
        method: 'bank',
        bankName,
        bankNote,
        date: new Date().toISOString(),
        status: 'Pending'
      };
    }

    console.log("Chuẩn bị ghi vào Sheet:", purchase.from, "đến", purchase.to);
    await addPurchase(purchase);
    console.log("Ghi vào Google Sheets thành công!");

    const transferContent = bankNote || `PNR${purchase.userId}${Date.now().toString().slice(-4)}`;
    const amount = purchase.totalPrice;
    const bankBin = '970436'; 
    const accountNumber = '123456789';
    const accountName = 'CTY FLIGHTBOOKING';

    const vietQRString = `00020101021138540010A00000072701230006${bankBin}${accountNumber}520400005303704540${amount}5802VN5916${accountName}6207${transferContent}6304`;
    const vietQRDataUrl = await QRCode.toDataURL(vietQRString);

    res.json({ 
      message: 'Bank transfer request created', 
      guide: { 
        accountName, accountNumber, bank: bankName, 
        amount, content: transferContent, vietQR: vietQRDataUrl 
      } 
    });

  } catch (err) {
    console.error('Lỗi chi tiết tại Backend:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// API Get purchases (Protected)
app.get('/api/purchases', authenticateToken, async (req, res) => {
    try {
      const purchases = await getPurchases();
      const userPurchases = purchases.filter(p => p.userId === req.user.id);
      res.json(userPurchases); // Bây giờ có full fields như from, to, totalPrice, status
    } catch (err) {
      console.error('Get purchases error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});

server.listen(port, () => {
  console.log(`Server & Socket running on http://localhost:${port}`);
});
