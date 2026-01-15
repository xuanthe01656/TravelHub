require('dotenv').config({ path: '../.env' });

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const path = require("path");
const port = process.env.PORT || 3001;
const amadeus = require("./amadeus");
const http = require('http');
const { Server } = require('socket.io');
const axios = require("axios");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const crypto = require('crypto');
const NodeCache = require('node-cache');
const myCache = new NodeCache({ stdTTL: 1800, checkperiod: 600 });
app.set("trust proxy", 1);
const buildPath = path.join(__dirname, '..', 'dist');
app.use(express.static(buildPath));
const origin = process.env.FRONTEND_URL

app.use(cors({
  origin: origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
const {
  getFlights,
  saveFlightsToSheet,
  getPurchases,
  addPurchase,
} = require('./sheetsService');
const {
  getUsers,
  getUserByEmail,
  getUserById,
  addUser
} = require('./dbService');
const pool = require('./db');
const sessionStore = new MySQLStore({
  clearExpired: true,
  checkExpirationInterval: 900000, // Dọn dẹp session hết hạn mỗi 15 phút
  expiration: 15 * 60 * 60 * 1000, // Session sống 15 tiếng
}, pool);
app.use(session({
  secret: process.env.SESSION_SECRET,   
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  proxy: true,
  cookie: { 
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 
  }
}));
app.use(passport.initialize());
app.use(passport.session());
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách user:', err);
    res.status(500).json({ error: 'Không thể lấy dữ liệu người dùng' });
  }
});
app.get('/api/setup-database', async (req, res) => {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(100),
      email VARCHAR(150) UNIQUE,
      password VARCHAR(255) NULL,
      login_provider VARCHAR(20) NOT NULL DEFAULT 'local',
      provider_id VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_social_login (login_provider, provider_id)
    );
  `;

  try {
    const [result] = await pool.query(createTableQuery);
    res.status(200).json({ message: "Bảng 'users' đã được tạo thành công!", result });
  } catch (err) {
    console.error('Lỗi tạo bảng:', err);
    res.status(500).json({ error: 'Không thể tạo bảng', details: err.message });
  }
});
app.get('/api/setup-content-db', async (req, res) => {
  const createPromotionsTable = `
    CREATE TABLE IF NOT EXISTS promotions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      service_type ENUM('flight', 'hotel', 'car', 'shuttle') NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      button_text VARCHAR(50) DEFAULT 'Khám Phá',
      image_url TEXT,
      discount_value VARCHAR(50),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  const createBlogsTable = `
    CREATE TABLE IF NOT EXISTS blogs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      excerpt TEXT,
      content LONGTEXT, -- Dùng cho nội dung chi tiết bài viết
      image_url TEXT,
      category VARCHAR(50),
      author_name VARCHAR(100) DEFAULT 'TravelHub Team',
      published_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createPromotionsTable);
    await pool.query(createBlogsTable);
    res.status(200).json({ message: "Đã tạo bảng 'promotions' và 'blogs' thành công!" });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo bảng', details: err.message });
  }
});
app.get('/api/setup-extra-db', async (req, res) => {
  // Bảng Điểm đến phổ biến
  const createDestinationsTable = `
    CREATE TABLE IF NOT EXISTS popular_destinations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      location VARCHAR(100),
      image_url TEXT,
      price_from DECIMAL(10, 2), -- Giá thấp nhất để đi đến đó
      rating DECIMAL(2, 1) DEFAULT 5.0,
      is_trending BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Bảng Đánh giá khách hàng
  const createTestimonialsTable = `
    CREATE TABLE IF NOT EXISTS testimonials (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(100) NOT NULL,
      user_avatar TEXT,
      role VARCHAR(100) DEFAULT 'Khách hàng', -- Ví dụ: Chuyên gia du lịch, Blogger...
      content TEXT NOT NULL,
      rating INT DEFAULT 5,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await pool.query(createDestinationsTable);
    await pool.query(createTestimonialsTable);
    res.status(200).json({ message: "Đã tạo bảng Destinations và Testimonials thành công!" });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi tạo bảng', details: err.message });
  }
}); 
  const server = http.createServer(app);
  
  const io = new Server(server, {
    cors: {
      origin: true,
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  
  io.on('connection', (socket) => {
    console.log("Kết nối mới:", socket.id);

    socket.on("join", (role) => {
      if (role === "admin") {
        socket.join("admin_group");
        console.log(`Admin kết nối: ${socket.id}`);
      }
    });
  
    socket.on("client_msg", (data) => {
      const payload = {
        senderId: socket.id,
        text: data.text,
        time: new Date().toLocaleTimeString()
      };
      io.to("admin_group").emit("admin_receive_msg", payload);
    });

    socket.on("admin_reply_msg", ({ targetId, text }) => {
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
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        "default-src": ["'self'"],
        "connect-src": [
          "'self'", 
          "https://test.api.amadeus.com", 
          "wss://*.railway.app",
          "https://*.railway.app",
          "ws:",
          "wss:"
        ],
        "img-src": ["'self'", "data:", "https:"],
        "script-src": [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'"
        ],
        "style-src": ["'self'", "'unsafe-inline'"],
      },
    },
  })
);
app.use(compression());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 
});
app.use(limiter);

// const secretKey = process.env.JWT_SECRET || 'fallback-secret';
// const authenticateToken = (req, res, next) => {
//   const authHeader = req.headers['authorization'];
//   const token = authHeader && authHeader.split(' ')[1];
//   if (!token) return res.status(401).json({ message: 'Token required' });

//   jwt.verify(token, secretKey, (err, user) => {
//     if (err) return res.status(403).json({ message: 'Invalid or expired token' });
//     req.user = user;
//     next();
//   });
// };
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL}/auth/google/callback`,
  proxy: true
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await getUserByEmail(email);

    if (!user) {
      user = await addUser({
        name: profile.displayName,
        email: email,
        loginProvider: 'google',
        providerId: profile.id
      });
    } else if (user.loginProvider !== 'google') {
      return done(null, false, { message: `Email này đã được dùng để đăng nhập bằng ${user.loginProvider}` });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: `${process.env.SERVER_URL}/auth/facebook/callback`,
  profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails ? profile.emails[0].value : null;
    if (!email) return done(null, false, { message: 'Không lấy được email từ Facebook' });

    let user = await getUserByEmail(email);

    if (!user) {
      user = await addUser({
        name: profile.displayName,
        email: email,
        loginProvider: 'facebook',
        providerId: profile.id
      });
    } else if (user.loginProvider !== 'facebook') {
      return done(null, false, { message: `Email này đã được dùng để đăng nhập bằng ${user.loginProvider}` });
    }

    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await getUserById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login` }), (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&provider=google`);
});
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: `${process.env.FRONTEND_URL}/login` }), (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/login?token=${token}&provider=facebook`);
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await getUserByEmail(email);
    
    if (!user) return res.status(401).json({ message: 'Tài khoản không tồn tại' });
    if (user.loginProvider !== 'local') {
      return res.status(401).json({ message: `Tài khoản này dùng đăng nhập bằng ${user.loginProvider}` });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Mật khẩu không chính xác' });

    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({ message: 'Đăng nhập thành công', user: { name: user.name, email: user.email } });
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
// API Register
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });

  try {
    const existingUser = await getUserByEmail(email);
    if (existingUser) return res.status(400).json({ message: 'Email đã được sử dụng' });

    const passwordHash = await bcrypt.hash(password, 10);
    await addUser({
      name,
      email,
      passwordHash,
      loginProvider: 'local'
    });

    res.status(201).json({ message: 'Đăng ký thành công!' });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Bạn chưa đăng nhập' });
};
app.get('/api/session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false });
  }
});
app.get('/api/user/profile', isAuthenticated, (req, res) => {
  if (!req.user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    loginProvider: req.user.loginProvider
  });
});
app.post('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ message: 'Lỗi server khi đăng xuất' });
    
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: 'Không thể hủy session' });
      
      res.clearCookie('connect.sid');
      res.status(200).json({ message: 'Logout thành công' });
    });
  });
});
const normalizeInput = (str) => str ? str.trim().toUpperCase() : null;
const transformFlightOffer = (offer, dictionaries, numAdults) => {
  const getSegmentDetails = (itinerary) => {
    const firstSegment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];
    
    const carrierCode = firstSegment.carrierCode;
    const carrierName = dictionaries.carriers[carrierCode] || carrierCode;
    const aircraftCode = firstSegment.aircraft.code;
    const aircraftName = dictionaries.aircraft[aircraftCode] || aircraftCode;

    return {
      origin: firstSegment.departure.iataCode,
      destination: lastSegment.arrival.iataCode,
      departureTime: firstSegment.departure.at, 
      arrivalTime: lastSegment.arrival.at,      
      duration: itinerary.duration.replace('PT', '').replace('H', 'h ').replace('M', 'm'),
      flightNumber: `${firstSegment.carrierCode} ${firstSegment.number}`,
      airline: carrierName,
      logo: `https://pics.avs.io/200/200/${firstSegment.carrierCode}.png`, 
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

  // Ưu tiên lấy giá chi tiết theo từng hành khách
  let totalPriceEUR = 0;
  let perPassengerEUR = 0;

  if (offer.travelerPricings && offer.travelerPricings.length > 0) {
    const prices = offer.travelerPricings.map(tp => parseFloat(tp.price.total));
    totalPriceEUR = prices.reduce((sum, p) => sum + p, 0);
    perPassengerEUR = totalPriceEUR / prices.length;
  } else {
    // fallback nếu không có travelerPricings
    totalPriceEUR = parseFloat(offer.price.grandTotal || offer.price.total);
    perPassengerEUR = totalPriceEUR / numAdults;
  }

  const totalPriceVND = Math.round(totalPriceEUR * exchangeRate);
  const perPassengerVND = Math.round(perPassengerEUR * exchangeRate);

  return {
    id: offer.id,
    type: offer.itineraries.length > 1 ? 'roundtrip' : 'oneway',
    price: {
      total: totalPriceVND,
      perPassenger: perPassengerVND,
      currency: 'VND'
    },
    outbound: getSegmentDetails(offer.itineraries[0]),
    inbound: offer.itineraries[1] ? getSegmentDetails(offer.itineraries[1]) : null,
    bookingToken: offer.id,
    validatingAirlineCodes: offer.validatingAirlineCodes
  };
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

    if (!origin || !destination || !departureDate) {
      return res.status(400).json({ message: 'Vui lòng nhập Điểm đi, Điểm đến và Ngày đi.' });
    }

    const cacheKey = `flight:${origin}:${destination}:${departureDate}:${returnDate || ''}:${numAdults}:${seatClass}`;
    const cachedData = myCache.get(cacheKey);
    
    if (cachedData) {
      console.log(">>> Flight Cache Hit");
      return res.json(cachedData);
    }
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
      max: 20
    };

    if (tripType === 'roundtrip' && returnDate) {
      amadeusParams.returnDate = returnDate;
    }

    console.log(">>> Fetching Flights from Amadeus...");
    const response = await amadeus.shopping.flightOffersSearch.get(amadeusParams);

    const dictionaries = response.result.dictionaries || { carriers: {}, aircraft: {} };
    const offers = response.data || [];

    const formattedResults = offers.map(offer => transformFlightOffer(offer, dictionaries, numAdults));
    if (formattedResults.length > 0) {
      myCache.set(cacheKey, formattedResults, 900);
    }

    res.json(formattedResults);

  } catch (err) {
    console.error('Flight API Error:', err);
    
    if (err.response) {
      const errorDetail = err.response.data?.errors?.[0];
      if (errorDetail?.code === 400 || errorDetail?.title === 'INVALID FORMAT') {
        return res.status(400).json({ message: "Dữ liệu tìm kiếm không hợp lệ (Mã sân bay hoặc ngày tháng)." });
      }
    }
    
    res.status(500).json({ message: 'Không tìm thấy chuyến bay phù hợp hoặc lỗi hệ thống.' });
  }
});

  app.get('/api/flights/cheap', async (req, res) => {
    try {
      const { lat, lng } = req.query;
      let originCode = 'SGN';

      // 1. Xác định sân bay xuất phát từ GPS (nếu có)
      if (lat && lng) {
        const cacheKeyAirport = `airport_${lat}_${lng}`;
        const cachedAirport = myCache.get(cacheKeyAirport);

        if (cachedAirport) {
          originCode = cachedAirport;
        } else {
          try {
            const airportRes = await amadeus.referenceData.locations.airports.get({
              longitude: lng,
              latitude: lat,
              sort: 'distance',
              'page[limit]': 1
            });
            if (airportRes.data.length > 0) {
              originCode = airportRes.data[0].iataCode;
              myCache.set(cacheKeyAirport, originCode);
            }
          } catch (e) {
            console.error("Lỗi Amadeus (Airports):", e.code);
          }
        }
      }

      // 2. Kiểm tra cache
      const cacheKeyFlights = `cheap_flights_${originCode}`;
      const cachedFlights = myCache.get(cacheKeyFlights);
      if (cachedFlights) {
        console.log(`Trả về dữ liệu từ Cache cho: ${originCode}`);
        return res.json(cachedFlights);
      }

      // 3. Tạo danh sách 7 ngày gần nhất (từ ngày mai)
      const today = new Date();
      today.setDate(today.getDate() + 1);
      const dates = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
      }

      // 4. Gọi API từng ngày, cách nhau 2s
      const exchangeRate = 25400;
      const allResults = [];

      for (const date of dates) {
        try {
          const response = await amadeus.shopping.flightDestinations.get({
            origin: originCode,
            departureDate: date,
            oneWay: true
          });

          const formatted = response.data.map(f => ({
            origin: f.origin,
            destination: f.destination,
            departureDate: f.departureDate,
            priceVND: Math.round(f.price.total * exchangeRate),
            isGpsBased: !!(lat && lng)
          }));

          allResults.push(...formatted);
        } catch (apiErr) {
          if (apiErr.code === 'ClientError' && apiErr.response.statusCode === 429) {
            return res.status(429).json({
              message: "Hệ thống đang quá tải, vui lòng thử lại sau vài phút",
              error: "Rate limit exceeded"
            });
          }
          console.error("Lỗi Amadeus (Flights):", apiErr);
        }

        // Delay 2 giây trước khi gọi request tiếp theo
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // 5. Lọc vé rẻ nhất cho mỗi điểm đến
      const cheapestByDestination = {};
      for (const flight of allResults) {
        const dest = flight.destination;
        if (!cheapestByDestination[dest] || flight.priceVND < cheapestByDestination[dest].priceVND) {
          cheapestByDestination[dest] = flight;
        }
      }

      let cheapestFlights = Object.values(cheapestByDestination);

      // 6. Sắp xếp theo giá tăng dần và lấy top 10
      cheapestFlights.sort((a, b) => a.priceVND - b.priceVND);
      cheapestFlights = cheapestFlights.slice(0, 10);

      // 7. Lưu cache và trả kết quả
      myCache.set(cacheKeyFlights, cheapestFlights);
      res.json(cheapestFlights);

    } catch (err) {
      console.error("Lỗi hệ thống:", err);
      res.status(500).json({ message: "Không thể lấy thông tin vé máy bay" });
    }
  });

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
      const results = response.data.map(transformHotelData);
      
      if (results.length > 0) {
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
  const transformCarData = (data, isTransfer = false, rates = { EUR: 27000, USD: 25500, VND: 1 }) => {
    if (!data) return null;
  
    // 1. Xử lý tiền tệ linh hoạt (Hỗ trợ EUR, USD, VND...)
    const getPriceVND = () => {
      let amount = 0;
      let currency = 'EUR';
  
      if (isTransfer) {
        // Dữ liệu Transfer: Ưu tiên converted, sau đó quotation
        const priceSource = data.converted || data.quotation;
        amount = parseFloat(priceSource?.monetaryAmount || 0);
        currency = priceSource?.currencyCode || 'EUR';
      } else {
        // Dữ liệu Car Rental
        amount = parseFloat(data.price?.total || 0);
        currency = data.price?.currency || 'EUR';
      }
  
      const rate = rates[currency] || rates['EUR']; // Mặc định dùng EUR nếu không khớp
      return Math.round(amount * rate);
    };
  
    const totalVND = getPriceVND();
  
    // 2. Logic cho ĐƯA ĐÓN (Transfer)
    if (isTransfer) {
      const seatCount = data.vehicle?.seats?.[0]?.count || 4;
      const bagCount = data.vehicle?.baggages?.[0]?.count || 2;
  
      // Quy đổi quãng đường MI -> KM
      let distanceValue = data.distance?.value || 0;
      if (data.distance?.unit === 'MI') {
        distanceValue = Math.round((distanceValue * 1.60934) * 10) / 10;
      }
      const distanceStr = distanceValue > 0 ? `Quãng đường: ${distanceValue} Km` : null;
  
      return {
        id: data.id,
        isTransfer: true, // Thêm flag để CarCard nhận diện
        name: data.vehicle.description || "Xe đưa đón riêng",
        vendor: data.serviceProvider?.name || "Đối tác vận chuyển",
        image: data.vehicle.imageURL || "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2",
        
        vehicle: {
          name: data.vehicle.description,
          seats: seatCount,
          transmission: 'Có tài xế',
          fuel: bagCount // Trả về số lượng Vali để render cạnh icon Vali
        },
  
        pricing: {
          totalVND: totalVND,
          currency: 'VND'
        },
  
        category: data.vehicle.category === 'BU' ? 'Business' : 'Standard',
        tags: [
          ...(data.cancellationRules?.some(r => r.feeValue === "0") ? ["Hủy miễn phí"] : []),
          ...(distanceStr ? [distanceStr] : [])
        ],
        pickupTime: data.start?.dateTime ? data.start.dateTime.split('T')[1].substring(0, 5) : '24/7'
      };
    }
  
    // 3. Logic cho TỰ LÁI (Rental)
    return {
      id: data.id,
      isTransfer: false, // Flag nhận diện xe tự lái
      name: data.vehicle?.description || "Xe tự lái",
      vendor: data.provider?.name || "Đối tác uy tín",
      image: data.image || `https://placehold.co/600x400?text=${data.vehicle?.category}`,
      
      vehicle: {
        name: data.vehicle?.description,
        seats: data.vehicle?.nbSeats || 5,
        transmission: data.vehicle?.transmissionType === 'Automatic' ? 'Tự động' : 'Số sàn',
        fuel: data.vehicle?.fuelType || 'Xăng/Dầu'
      },
  
      pricing: {
        totalVND: totalVND,
        currency: 'VND'
      },
  
      category: data.vehicle?.category || 'Tiêu chuẩn',
      tags: [],
      pickupTime: null
    };
  };
  app.get('/api/cars', async (req, res) => {
    try {
      const {
        serviceType,
        pickup, pickupAddress, pickupLat, pickupLon,
        dropoff, dropoffAddress, dropoffLat, dropoffLon,
        pickupDate, dropoffDate,
        passengers = 1, cityName, postalCode, pickupCountry, dropoffCountry
      } = req.query;
  
      // Cache Key
      const cacheKey = `cars_${serviceType}_${pickup || pickupLat}_${dropoff || dropoffLat}_${pickupDate}`;
      const cached = myCache.get(cacheKey);
      if (cached) return res.json(cached);
      const rates = { 
        USD: 25400, 
        EUR: 27200, 
        VND: 1 
      };
      let result = [];
  
      if (serviceType === 'rental') {
        // --- THUÊ XE TỰ LÁI (Giữ nguyên logic cũ) ---
        const response = await amadeus.shopping.carRentals.get({
          pickUpLocation: pickup,
          pickUpDate: pickupDate.split('T')[0],
          ...(dropoffDate && { dropOffDate: dropoffDate.split('T')[0] })
        });
        if (response.data) {
          result = response.data.map(car => transformCarData(car,false, rates));
        }
  
      } else if (serviceType === 'transfer') {
        const formatAddr = (addr) => {
        if (!addr) return "";
            let clean = addr.replace(/\r?\n|\r/g, " ").trim();
            return clean.length > 35 ? clean.substring(0, 32) + "..." : clean;
        };
    
        const transferBody = {
            startDateTime: pickupDate.includes('T') 
                ? (pickupDate.length === 16 ? `${pickupDate}:00` : pickupDate) 
                : `${pickupDate}T10:00:00`,
            passengers: parseInt(passengers),
            transferType: "PRIVATE"
        };
    
        // 2. Xử lý Điểm đón (Start)
        if (pickup && pickup.length === 3) {
            transferBody.startLocationCode = pickup.toUpperCase();
        } else {
            // Cắt ngắn addressLine để tránh lỗi 11823
            transferBody.startAddressLine = formatAddr(pickupAddress);
            transferBody.startCityName = cityName || "DA NANG";
            transferBody.startZipCode = postalCode || "84236";
            transferBody.startCountryCode = pickupCountry || "VN";
            transferBody.startGeoCode = `${pickupLat},${pickupLon}`;
        }
    
        // 3. Xử lý Điểm trả (End) tương tự
        if (dropoff && dropoff.length === 3) {
            transferBody.endLocationCode = dropoff.toUpperCase();
        } else {
            transferBody.endAddressLine = formatAddr(dropoffAddress);
            transferBody.endCityName = cityName || "DA NANG";
            transferBody.endZipCode = postalCode || "84236";
            transferBody.endCountryCode = dropoffCountry || "VN";
            transferBody.endGeoCode = `${dropoffLat},${dropoffLon}`;
        }
  
        console.log(">>> Body Transfer gửi Amadeus (Flattened):", JSON.stringify(transferBody));
  
        try {
          // Gửi POST với body phẳng
          const response = await amadeus.shopping.transferOffers.post(JSON.stringify(transferBody));
          console.log(JSON.stringify(response.result.data));
          if (response.result && response.result.data) {
            result = response.result.data.map(offer => transformCarData(offer,true, rates));
            console.log(`>>> Tìm thấy ${result.length} xe đưa đón.`);
          }
        } catch (err) {
          console.error(">>> Lỗi chi tiết từ Amadeus:", err.response?.result?.errors || err.message);
          result = [];
        }
      }
  
      myCache.set(cacheKey, result);
      res.json(result);
  
    } catch (err) {
      console.error("--- Lỗi API Tổng ---", err);
      res.status(500).json([]);
    }
  });
const geoCache = new NodeCache({ stdTTL: 3600 }); // cache 1h

app.get("/api/geocode", async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 3) return res.json([]);

  const cached = geoCache.get(q);
  if (cached) return res.json(cached);

  try {
    const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: { q, format: "json", addressdetails: 1, limit: 5 },
      headers: { "User-Agent": "travel-webapp-amadeus" }
    });

    const result = data.map(item => ({
      fullAddress: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      country: item.address?.country_code?.toUpperCase()
    }));

    geoCache.set(q, result);
    res.json(result);
  } catch (err) {
    console.error("Geocode error:", err);
    if (err.response) {
      res.status(err.response.status).json({ error: "Geocode failed", status: err.response.status, data: err.response.data });
    } else if (err.request) {
      res.status(500).json({ error: "No response from geocode service", details: err.message });
    } else {
      res.status(500).json({ error: "Geocode request setup failed", details: err.message });
    }
  }
});

app.post('/api/buy-ticket', isAuthenticated, async (req, res) => {
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
app.post('/api/buy-ticket/wallet', isAuthenticated, async (req, res) => {
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

app.post('/api/buy-ticket/bank', isAuthenticated, async (req, res) => {
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
app.get('/api/purchases', isAuthenticated, async (req, res) => {
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
app.get((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});
app.use((req, res) => { res.sendFile(path.join(buildPath, 'index.html')); });
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});