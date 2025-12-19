// server.js - Backend Node.js/Express cho các API
require('dotenv').config({ path: '../.env' });

const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const app = express();
const port = process.env.PORT || 3001;
const amadeus = require("./amadeus");

const {
  getUsers,
  addUser,
  getFlights,
  saveFlightsToSheet,
  getPurchases,
  addPurchase,
} = require('./sheetsService');

// Danh sách sân bay (có thể mở rộng từ config)
const airports = [
    'SGN', // Tân Sơn Nhất - TP.HCM
    'HAN', // Nội Bài - Hà Nội
    'DAD', // Đà Nẵng
    'PQC', // Phú Quốc
    'CXR', // Cam Ranh - Nha Trang
    'VCA', // Cần Thơ
    'VII', // Vinh
    'HUI', // Phú Bài - Huế
    'DLI', // Liên Khương - Đà Lạt
    'HPH', // Cát Bi - Hải Phòng
    'VDO', // Vân Đồn - Quảng Ninh
    'DIN', // Điện Biên
    'VDH', // Đồng Hới
    'THD', // Thọ Xuân - Thanh Hóa
    'VCL', // Chu Lai
    'TBB', // Tuy Hòa
    'VKG', // Rạch Giá
    'PXU', // Pleiku
    'BMV', // Buôn Ma Thuột
    'CAH', // Cà Mau
    'VCS', // Côn Đảo
  ];  

  // Hàm generate flights (có thể thay bằng API thật sau)
  function generateFlights(count = 400) {
    const flights = [];
    const exchangeRate = 24000; 

    // 1. Danh sách các hãng bay
    const airlines = [
      { code: "SQ", name: "Singapore Airlines" },
      { code: "VN", name: "Vietnam Airlines" },
      { code: "VJ", name: "VietJet Air" },
      { code: "QH", name: "Bamboo Airways" },
      { code: "VU", name: "Vietravel Airlines" },
      { code: "KE", name: "Korean Air" },
      { code: "JL", name: "Japan Airlines" }
    ];

    const aircrafts = [
      "Airbus A350-900",
      "Boeing 787-10",
      "Airbus A321neo",
      "Boeing 737 MAX 8",
      "Airbus A320"
    ];

    const fareOptions = [
      { cabinClass: "Y", class: "economy", family: "Value" },
      { cabinClass: "Y", class: "economy", family: "Standard" },
      { cabinClass: "C", class: "business", family: "Flexi" }
    ];

    const airports = ["HAN", "SGN", "DAD", "SIN", "NRT", "ICN", "PQC"];

    for (let i = 1; i <= count; i++) {
      const from = airports[Math.floor(Math.random() * airports.length)];
      let to;
      do {
        to = airports[Math.floor(Math.random() * airports.length)];
      } while (to === from);

      // Random hãng bay
      const selectedAirline = airlines[Math.floor(Math.random() * airlines.length)];

      const now = new Date();
      const year = now.getFullYear();
      const month = 12;
      const day = Math.floor(Math.random() * 30) + 1;
      const departureDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      const hour = 5 + Math.floor(Math.random() * 17); // Bay từ 5h sáng đến 10h đêm
      const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
      const departureDateTime = new Date(`${departureDate}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`);

      const durationHours = 1 + Math.floor(Math.random() * 4);
      const arrivalDateTime = new Date(departureDateTime.getTime() + durationHours * 60 * 60 * 1000);

      // Giá ngẫu nhiên tùy theo hãng (VD: VJ rẻ hơn SQ)
      let basePrice = selectedAirline.code === "VJ" ? 80 : 250;
      const priceSGD = Math.floor(Math.random() * 200 + basePrice);
      const priceVND = priceSGD * exchangeRate;

      const fare = fareOptions[Math.floor(Math.random() * fareOptions.length)];
      const aircraftName = aircrafts[Math.floor(Math.random() * aircrafts.length)];

      flights.push({
        id: `FLIGHT-${i}`,
        originAirportCode: from,
        destinationAirportCode: to,
        departureDate,
        departureDateTime: departureDateTime.toISOString(),
        arrivalDateTime: arrivalDateTime.toISOString(),
        flightDuration: `${durationHours}h ${minute === 0 ? "00" : minute}m`,
        
        // Thông tin hãng bay
        airline: selectedAirline.name,
        airlineCode: selectedAirline.code,
        flightNumber: `${selectedAirline.code}${Math.floor(Math.random() * 900) + 100}`,
        
        // QUAN TRỌNG: Để aircraft là String để tránh lỗi React Object
        aircraft: aircraftName, 
        
        // Thông tin giá và hạng ghế
        priceSGD,
        priceVND,
        class: fare.class, // economy, business
        cabinClass: fare.cabinClass, // Y, C
        fareFamilyName: fare.family,
        passengers: 1 // Sẽ được cập nhật khi query
      });
    }
    return flights;
  }

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

// Khởi tạo flights
(async function initFlights() {
    try {
      let existing = await getFlights();
      if (!existing || existing.length === 0) {
        const seed = generateFlights();
        await saveFlightsToSheet(seed);
        console.log('Flights giả định đã được khởi tạo và lưu vào Google Sheet');
      } else {
        console.log(`Flights sheet đã có ${existing.length} chuyến bay`);
      }
    } catch (e) {
      console.error('Không thể khởi tạo Flights:', e.message);
    }
  })();

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

function normalizeInput(input) {
  if (!input) return null;
  // Sử dụng normalize để loại bỏ dấu
  const key = input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return cityToAirport[key] || input.toUpperCase();
}

// --- API ROUTES ---

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
app.get('/api/flights', async (req, res) => {
  try {
      let { tripType, from, to, departureDate, returnDate, passengers, class: seatClass, isReal, isSingaporeAir } = req.query;

      const numPassengers = passengers ? parseInt(passengers, 10) : 1;
      const fromCode = from ? normalizeInput(from) : null;
      const toCode = to ? normalizeInput(to) : null;
      //console.log(req.query);
      if (!fromCode || !toCode) {
          return res.status(400).json({ message: 'Điểm đi và Điểm đến không được để trống.' });
      }

      // Map hạng ghế sang Amadeus
      const travelClass = {
          economy: "ECONOMY",
          premium: "PREMIUM_ECONOMY",
          business: "BUSINESS",
      }[seatClass] || "ECONOMY";

      // ================================
      // 1) API REAL → Amadeus
      // ================================
      if (isReal === "true") {
          try {
              if (tripType === "roundtrip") {
                  const response = await amadeus.shopping.flightOffersSearch.get({
                      originLocationCode: fromCode,
                      destinationLocationCode: toCode,
                      departureDate: departureDate,
                      returnDate: returnDate,
                      adults: numPassengers,
                      travelClass: travelClass
                  });
                  const exchangeRate = 20400;
                  const roundtripResults = response.data.map(offer => {
                    const outboundItinerary = offer.itineraries[0];
                    const returnItinerary = offer.itineraries[1];
                    const outboundSegment = outboundItinerary.segments[0];
                    const returnSegment = returnItinerary.segments[0];
                    const priceSGD = parseFloat(offer.price.total);
                    const priceVND = Math.round(priceSGD * exchangeRate);
                    const totalPrice = priceVND * numPassengers;
                  
                    return {
                      outboundFlight: {
                        id: outboundSegment.id || Date.now().toString(),
                        originAirportCode: outboundSegment.departure.iataCode,
                        destinationAirportCode: outboundSegment.arrival.iataCode,
                        departureDate: outboundSegment.departure.at.split('T')[0],
                        departureDateTime: outboundSegment.departure.at,
                        arrivalDateTime: outboundSegment.arrival.at,
                        flightDuration: outboundItinerary.duration.replace('PT', '').replace('H', ' giờ ').replace('M', ' phút'),
                        flightNumber: outboundSegment.number,
                        aircraft: outboundSegment.aircraft.code,
                        airline: outboundSegment.carrierCode,
                        priceSGD,
                        priceVND,
                        passengers: numPassengers,
                        class: travelClass
                      },
                      returnFlight: {
                        id: returnSegment.id || Date.now().toString(),
                        originAirportCode: returnSegment.departure.iataCode,
                        destinationAirportCode: returnSegment.arrival.iataCode,
                        departureDate: returnSegment.departure.at.split('T')[0],
                        departureDateTime: returnSegment.departure.at,
                        arrivalDateTime: returnSegment.arrival.at,
                        flightDuration: returnItinerary.duration.replace('PT', '').replace('H', ' giờ ').replace('M', ' phút'),
                        flightNumber: returnSegment.number,
                        aircraft: returnSegment.aircraft.code,
                        airline: returnSegment.carrierCode,
                        priceSGD,
                        priceVND,
                        passengers: numPassengers,
                        class: travelClass
                      },
                      totalPrice,
                      passengers: numPassengers,
                      class: travelClass
                    };
                  });
                  
                  return res.json(roundtripResults);
              }

              // Oneway
              const response = await amadeus.shopping.flightOffersSearch.get({
                  originLocationCode: fromCode,
                  destinationLocationCode: toCode,
                  departureDate: departureDate,
                  adults: numPassengers,
                  travelClass: travelClass
              });
              const exchangeRate = 20400;
              const results = response.data.map(offer => {
                const itinerary = offer.itineraries[0];
                const segment = itinerary.segments[0];
                const priceSGD = parseFloat(offer.price.total);
                const priceVND = Math.round(priceSGD * exchangeRate);
              
                return {
                  id: segment.id || Date.now().toString(),
                  originAirportCode: segment.departure.iataCode,
                  destinationAirportCode: segment.arrival.iataCode,
                  departureDate: segment.departure.at.split('T')[0],
                  departureDateTime: segment.departure.at,
                  arrivalDateTime: segment.arrival.at,
                  flightDuration: itinerary.duration.replace('PT', '').replace('H', ' giờ ').replace('M', ' phút'),
                  flightNumber: segment.number,
                  aircraft: segment.aircraft.code,
                  airline: segment.carrierCode,
                  priceSGD,
                  priceVND,
                  passengers: numPassengers,
                  class: travelClass
                };
              });
              
              return res.json(results);

            } catch (err) {
              console.error("Amadeus error", err);
            
              const errorDetail = {
                message: err.message,
                description: err.description,
                response: err.response?.result, // toàn bộ JSON từ Amadeus
              };
            
              return res.status(500).json({
                message: "Không lấy được dữ liệu từ Amadeus",
                error: errorDetail
              });
            }
                
      }
      // ================================
      // API REAL → Singapore Airlines
      // ================================
      if (isSingaporeAir === "true") {
        try {
          const axios = require("axios");
      
          const response = await axios.post(
            "https://apigw.singaporeair.com/api/uat/v1/commercial/flightavailability/get",
            {
              clientUUID: "05b2fa78-a0f8-4357-97fe-d18506618c3f",
              request: {
                itineraryDetails: [
                  {
                    originAirportCode: fromCode,
                    destinationAirportCode: toCode,
                    departureDate: departureDate,
                    ...(tripType === "roundtrip" && returnDate ? { returnDate } : {})
                  }
                ],
                cabinClass: travelClass === "ECONOMY" ? "Y" : travelClass === "BUSINESS" ? "C" : "Y",
                adultCount: numPassengers,
                childCount: 0,
                infantCount: 0
              }
            },
            {
              headers: {
                "accept": "application/json",
                "apikey": process.env.SIA_API_KEY,
                "Content-Type": "application/json"
              },
              timeout: 10000
            }
          );
      
          const siaData = response.data?.response;
          console.log(siaData);
          const exchangeRate = 20400;
          let results = [];

          if (tripType === 'roundtrip') {
            // For roundtrip, SIA returns flights[0] for outbound, flights[1] for return
            if (siaData?.flights?.length === 2 && siaData?.recommendations) {
              const outboundFlights = siaData.flights[0].segments.flatMap(segment => segment.legs.map(leg => ({
                id: leg.flightNumber,
                originAirportCode: leg.originAirportCode,
                destinationAirportCode: leg.destinationAirportCode,
                departureDate: leg.departureDateTime.split('T')[0],
                departureDateTime: leg.departureDateTime,
                arrivalDateTime: leg.arrivalDateTime,
                flightDuration: leg.flightDuration,
                flightNumber: leg.flightNumber,
                aircraft: leg.aircraft.name,
                airline: leg.operatingAirline.name
              })));
              
              const returnFlights = siaData.flights[1].segments.flatMap(segment => segment.legs.map(leg => ({
                id: leg.flightNumber,
                originAirportCode: leg.originAirportCode,
                destinationAirportCode: leg.destinationAirportCode,
                departureDate: leg.departureDateTime.split('T')[0],
                departureDateTime: leg.departureDateTime,
                arrivalDateTime: leg.arrivalDateTime,
                flightDuration: leg.flightDuration,
                flightNumber: leg.flightNumber,
                aircraft: leg.aircraft.name,
                airline: leg.operatingAirline.name
              })));
              
              // Assume first recommendation for price
              const rec = siaData.recommendations[0];
              const priceSGD = parseFloat(rec.fareSummary.fareTotal.totalAmount);
              const priceVND = Math.round(priceSGD * exchangeRate);
              const totalPrice = priceVND * numPassengers;
              
              // For simplicity, take first outbound and return
              results.push({
                outboundFlight: outboundFlights[0],
                returnFlight: returnFlights[0],
                totalPrice,
                passengers: numPassengers,
                class: travelClass
              });
            }
          } else {
            // Oneway
            if (siaData?.flights && siaData?.recommendations) {
              siaData.flights.forEach((flight, fIdx) => {
                flight.segments.forEach((segment, sIdx) => {
                  const leg = segment.legs[0];
            
                  // lấy giá từ recommendation đầu tiên (có thể mở rộng)
                  const rec = siaData.recommendations[0];
                  const priceSGD = parseFloat(rec.fareSummary.fareTotal.totalAmount);
                  const priceVND = Math.round(priceSGD * exchangeRate);
            
                  results.push({
                    id: `${leg.flightNumber}-${fIdx}-${sIdx}`,
                    originAirportCode: leg.originAirportCode,
                    destinationAirportCode: leg.destinationAirportCode,
                    departureDate: leg.departureDateTime.split('T')[0],
                    departureDateTime: leg.departureDateTime,
                    arrivalDateTime: leg.arrivalDateTime,
                    flightDuration: leg.flightDuration,
                    priceSGD,
                    priceVND,
                    airline: leg.operatingAirline?.name || leg.marketingAirline?.name || "Singapore Airlines",
                    flightNumber: leg.flightNumber,
                    aircraft: leg.aircraft.name,
                    passengers: numPassengers,
                    class: travelClass
                  });
                });
              });
            }
          }
          
          return res.json(results);
        } catch (err) {
          console.error("SingaporeAir error", err);
          return res.status(500).json({
            message: "Không lấy được dữ liệu từ Singapore Airlines",
            error: err.response?.data || err.message
          });
        }
      }

     // ================================
    // 2) API FAKE → Google Sheet
    // ================================
    const allFlights = await getFlights();
    const cleanDepartureDate = (departureDate === '' || !departureDate) ? null : departureDate;
    const cleanReturnDate = (returnDate === '' || !returnDate) ? null : returnDate;
    const cleanSeatClass = (seatClass === '' || !seatClass) ? null : seatClass;
    const exchangeRate = 24000;

    // Hàm bổ trợ để đảm bảo aircraft luôn là String
    const getAircraftName = (val) => {
      if (typeof val === 'object' && val !== null) return val.name || val.code || 'Boeing 787';
      return val || 'Boeing 787';
    };

    if (tripType === 'roundtrip') {
      let outbound = allFlights.filter(f =>
        f.originAirportCode?.toUpperCase() === fromCode?.toUpperCase() && 
        f.destinationAirportCode?.toUpperCase() === toCode?.toUpperCase() && 
        (!cleanDepartureDate || f.departureDate === cleanDepartureDate) && 
        (!cleanSeatClass || f.class === cleanSeatClass)
      );

      let inbound = allFlights.filter(f =>
        f.destinationAirportCode?.toUpperCase() === fromCode?.toUpperCase() &&   
        f.originAirportCode?.toUpperCase() === toCode?.toUpperCase() && 
        (!cleanReturnDate || f.departureDate === cleanReturnDate) && 
        (!cleanSeatClass || f.class === cleanSeatClass)
      );

      const roundtripResults = [];
      outbound.forEach(out => {
        inbound.forEach(ret => {
          // Đảm bảo ngày về >= ngày đi
          if (out.departureDate && ret.departureDate && ret.departureDate >= out.departureDate) {
            const outPriceVND = out.priceVND || (out.priceSGD || 0) * exchangeRate;
            const retPriceVND = ret.priceVND || (ret.priceSGD || 0) * exchangeRate;

            roundtripResults.push({
              outboundFlight: {
                ...out,
                aircraft: getAircraftName(out.aircraft),
                departureDateTime: out.departureDateTime || `${out.departureDate}T08:00:00`,
                arrivalDateTime: out.arrivalDateTime || `${out.departureDate}T10:00:00`,
                priceVND: outPriceVND
              },
              returnFlight: {
                ...ret,
                aircraft: getAircraftName(ret.aircraft),
                departureDateTime: ret.departureDateTime || `${ret.departureDate}T14:00:00`,
                arrivalDateTime: ret.arrivalDateTime || `${ret.departureDate}T16:00:00`,
                priceVND: retPriceVND
              },
              totalPrice: (outPriceVND + retPriceVND) * numPassengers,
              passengers: numPassengers,
              class: cleanSeatClass?.toUpperCase() || "ECONOMY"
            });
          }
        });
      });
      return res.json(roundtripResults);
    }

    // Oneway
    let filteredFlights = allFlights.filter(f =>
      f.originAirportCode?.toUpperCase() === fromCode?.toUpperCase() && 
      f.destinationAirportCode?.toUpperCase() === toCode?.toUpperCase() && 
      (!cleanDepartureDate || f.departureDate === cleanDepartureDate) && 
      (!cleanSeatClass || f.class === cleanSeatClass)
    );

    const results = filteredFlights.map(f => {
      const priceVND = f.priceVND || (f.priceSGD || 0) * exchangeRate;
      return {
        ...f,
        id: f.id || Math.random().toString(36).substr(2, 9),
        aircraft: getAircraftName(f.aircraft),
        departureDateTime: f.departureDateTime || `${f.departureDate}T08:00:00`,
        arrivalDateTime: f.arrivalDateTime || `${f.departureDate}T10:00:00`,
        priceVND: priceVND,
        totalPrice: priceVND * numPassengers,
        passengers: numPassengers,
        class: cleanSeatClass?.toUpperCase() || "ECONOMY"
      };
    });

    return res.json(results);

  } catch (err) {
      console.error('Get flights error:', err);
      res.status(500).json({ message: 'Server error' });
  }
});  

// API Get cheap flights (Public)
app.get('/api/flights/cheap', async (req, res) => {
    try {
      let flights = await getFlights();
      if (!flights || flights.length === 0) {
        flights = generateFlights();
        await saveFlightsToSheet(flights);
      }
      const currentDateStr = new Date().toISOString().split('T')[0];
      const futureFlights = flights.filter(f => f.departureDate >= currentDateStr); // Sửa ở đây
      const cheapest = futureFlights.sort((a, b) => a.price - b.price).slice(0, 10);
      //console.log(futureFlights);
      res.json(cheapest);
    } catch (err) {
      console.error('Get cheap flights error:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });

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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});