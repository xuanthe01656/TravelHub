import { useMemo, useReducer, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Select from 'react-select'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import FlightRowLeg from '../components/FlightRowLeg';
import HotelCard from '../components/HotelCard';
import CarCard from '../components/CarCard';
import reducer from '../utils/reducer';
import { airports, airportOptions } from '../utils/airports';
import formatCurrency from '../utils/formatCurrency';
import handleChange from '../utils/handleChange';
import useAuthHandler from '../hooks/useTokenHandler';
import usePurchases from '../hooks/usePurchases';
import BankGuideModal from '../components/Common/BankGuideModal';
import PurchaseHistory from '../components/Common/PurchaseHistory';
import TestimonialsSwiper from '../components/Common/TestimonialsSwiper';
import BlogPostsGrid from '../components/Common/BlogPostsGrid';
import PopularDestinationsSwiper from '../components/Common/PopularDestinationsSwiper';
import SearchButton from '../components/Common/SearchButton';
import {
  FaPlaneDeparture, FaPlaneArrival, FaPlane, FaShoppingCart, FaLock, FaReceipt,
  FaInfoCircle, FaHome, FaPhoneAlt, FaUserCircle, FaCalendarAlt, FaUsers,
  FaChair, FaCar, FaGlobe, FaBars, FaTimes, FaCreditCard, FaSpinner,
  FaWallet, FaUniversity, FaArrowLeft, FaClock, FaTicketAlt, FaHotel, FaBusAlt, FaMapMarkedAlt,
  FaStar, FaQuoteLeft, FaBlog, FaMapMarkerAlt, FaShip, FaTrain, FaUmbrellaBeach,FaArrowRight,FaUserFriends,FaShuttleVan
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
const initialFlightState = {
  from: '',
  to: '',
  departureDate: '',
  returnDate: '',
  tripType: 'oneway',
  passengers: '',
  class: '',
};

const initialHotelState = {
  location: '',
  checkInDate: '',
  checkOutDate: '',
  rooms: 1,
  guests: 2,
};

const initialCarState = {
  pickup: '',
  dropoff: '',
  pickupDate: '',
  dropoffDate: '',
  driverAge: 25,
  serviceType: 'rental',
  pickupLat: null,
  pickupLon: null,
  dropoffLat: null,
  dropoffLon: null, 
  passengers: 1,
  pickupAddress: '',
  dropoffAddress: '',
  transferDirection: 'to_airport',
};

const flightValidationSchema = Yup.object({
  from: Yup.string().required('Điểm đi không được để trống'),
  to: Yup.string().required('Điểm đến không được để trống'),
  tripType: Yup.string().oneOf(['oneway', 'roundtrip']).notRequired(),
  departureDate: Yup.date()
  .transform((value, originalValue) => (originalValue === '' ? null : value))
  .nullable()
  .required('Ngày đi không được để trống')
  .typeError('Ngày không hợp lệ')
  .test('min-departure-date', 'Ngày đi phải từ hôm nay trở đi', function(value) {
    if (!value) return true;
    const today = new Date().setHours(0, 0, 0, 0);
    return value.getTime() >= today;
  }),
  returnDate: Yup.date()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .nullable()
    .when('tripType', {
      is: 'roundtrip',
      then: (schema) => schema
        .required('Ngày về không được để trống') 
        .test('return-date-min', 'Ngày về phải sau ngày đi', function(value) {
          const { departureDate } = this.parent;
          if (!value || !departureDate) return true;
          return value.getTime() >= new Date(departureDate).getTime();
        }),
      otherwise: (schema) => schema.notRequired(),
    }),

  passengers: Yup.number()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .nullable()
    .notRequired(),
  class: Yup.string().nullable().notRequired(),
});

const hotelValidationSchema = Yup.object({
  location: Yup.string().required('Vị trí không được để trống'),
  checkInDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .required('Ngày check-in không được để trống')
    .typeError('Ngày không hợp lệ')
    .test('min-checkin-date', 'Ngày check-in phải từ hôm nay trở đi', function(value) {
      if (!value) return true;
      const today = new Date().setHours(0, 0, 0, 0);
      return value.getTime() >= today;
    }),
  checkOutDate: Yup.date()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .nullable()
    .required('Ngày check-out không được để trống')
    .test('checkout-date-min', 'Ngày check-out phải sau ngày check-in', function(value) {
      const { checkInDate } = this.parent;
      if (!value || !checkInDate) return true;
      return value.getTime() > new Date(checkInDate).getTime();
    }),
  rooms: Yup.number().min(1, 'Số phòng ít nhất là 1').required(),
  guests: Yup.number().min(1, 'Số khách ít nhất là 1').required(),
});

const carValidationSchema = Yup.object({
  // 1. Điểm nhận/trả chung (Dành cho Thuê xe tự lái)
  pickup: Yup.string().when('serviceType', {
    is: 'rental',
    then: (schema) => schema.required('Vui lòng chọn điểm nhận xe'),
    otherwise: (schema) => schema.notRequired(),
  }),
  dropoff: Yup.string().when('serviceType', {
    is: 'rental',
    then: (schema) => schema.required('Vui lòng chọn điểm trả xe'),
    otherwise: (schema) => schema.notRequired(),
  }),

  // 2. Địa chỉ cụ thể (Dành cho Đưa đón sân bay - Sửa lỗi thiếu ở file cũ)
  pickupAddress: Yup.string().when(['serviceType', 'transferDirection'], {
    is: (serviceType, transferDirection) => 
      serviceType === 'transfer' && transferDirection === 'to_airport',
    then: (schema) => schema.required('Vui lòng nhập địa chỉ đón (Nhà/KS)'),
  }),
  dropoffAddress: Yup.string().when(['serviceType', 'transferDirection'], {
    is: (serviceType, transferDirection) => 
      serviceType === 'transfer' && transferDirection === 'from_airport',
    then: (schema) => schema.required('Vui lòng nhập địa chỉ trả (Nhà/KS)'),
  }),

  // 3. Validation Ngày tháng
  pickupDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .required('Ngày nhận xe/đón không được để trống')
    .test('min-date', 'Ngày chọn không được ở quá khứ', (value) => {
      if (!value) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value >= today;
    }),

  dropoffDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .when('serviceType', {
      is: 'rental',
      then: (schema) => schema.required('Ngày trả xe không được để trống')
        .test('is-after-pickup', 'Ngày trả phải sau ngày nhận', function(value) {
          const { pickupDate } = this.parent;
          return value && pickupDate && value > new Date(pickupDate);
        }),
      otherwise: (schema) => schema.notRequired(),
    }),

  // 4. Các trường số lượng
  serviceType: Yup.string().oneOf(['rental', 'transfer']).required(),
  
  driverAge: Yup.number()
    .when('serviceType', {
      is: 'rental',
      then: (schema) => schema.min(18, 'Tài xế phải từ 18 tuổi trở lên').required('Vui lòng nhập tuổi'),
    }),
    
  passengers: Yup.number()
    .when('serviceType', {
      is: 'transfer',
      then: (schema) => schema.min(1, 'Ít nhất phải có 1 hành khách').required('Vui lòng nhập số khách'),
    }),
});

function FlightMap({ fromPos, toPos, center }) {
  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {fromPos && <Marker position={fromPos}><Popup>Điểm đi</Popup></Marker>}
      {toPos && <Marker position={toPos}><Popup>Điểm đến</Popup></Marker>}
      {fromPos && toPos && <Polyline positions={[fromPos, toPos]} pathOptions={{ color: '#2563eb', weight: 3, dashArray: '10, 10' }} />}
    </MapContainer>
  );
}

function Dashboard() {
  const [flightState, flightDispatch] = useReducer(reducer, initialFlightState);
  const [hotelState, hotelDispatch] = useReducer(reducer, initialHotelState);
  const [carState, carDispatch] = useReducer(reducer, initialCarState);
  const [errors, setErrors] = useState({});
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [cars, setCars] = useState([]);
  const [cheapFlights, setCheapFlights] = useState([]);
  const [isLogged, setIsLogged] = useState(false);
  const handleAuthError = useAuthHandler();
  const { purchases, fetchPurchases } = usePurchases(isLogged, handleAuthError);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [fromPos, setFromPos] = useState(null);
  const [toPos, setToPos] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [sortBy, setSortBy] = useState('price'); 
  const [bannerVisible, setBannerVisible] = useState(false);
  const [activeService, setActiveService] = useState('flights');
  const navigate = useNavigate();
  const location = useLocation();
  const bankGuide = location.state?.bankGuide;
  const [activeField, setActiveField] = useState(null); 
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const fetchCheapFlights = useCallback(async () => {
    try {
      let url = '/api/flights/cheap';
  
      if ("geolocation" in navigator) {
        const coords = await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { timeout: 5000 }
          );
        });
  
        if (coords) {
          url += `?lat=${coords.lat}&lng=${coords.lng}`;
        }
      }
  
      const response = await axios.get(url);
      const data = response.data || [];
      
      // Sắp xếp theo giá tăng dần
      const sortedData = [...data].sort((a, b) => (a.priceVND || 0) - (b.priceVND || 0));
      
      setCheapFlights(sortedData);
    } catch (err) {
      console.error("Lỗi lấy vé rẻ:", err);
    }
  }, []);
  const fetchUserProfile = useCallback(async () => {
    try {
      // Axios tự động gửi Cookie kèm theo nhờ withCredentials: true
      const response = await axios.get('/api/user/profile'); 
      setUserProfile(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log("Phiên đăng nhập hết hạn hoặc chưa đăng nhập.");
        // Bạn có thể gọi handleAuthError(err) ở đây nếu muốn đá user về trang login
      } else {
        console.error("Lỗi khi lấy profile:", err);
      }
    }
  }, [handleAuthError])
  useDocumentTitle('Trang chủ');
  useEffect(() => {
    fetchCheapFlights();
  
    if (isLogged) {
      fetchPurchases();
      fetchUserProfile();
    } else {
      setUserProfile(null);
    }
  
    setBannerVisible(true);
  
    if (bankGuide) {
      toast.success('Yêu cầu chuyển khoản đã được tạo!', { 
        autoClose: 5000,
        toastId: 'bank-guide-toast'
      });
    }
  }, [isLogged, bankGuide, fetchCheapFlights, fetchPurchases, fetchUserProfile]);
 

  const handleChange = (dispatch, field, value) => {
    dispatch({ type: 'CHANGE', field, value });
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFlightSearch = async (e, isReal, isSingaporeAir) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setFromPos(null);
    setToPos(null);
    try {
      await flightValidationSchema.validate(flightState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/flights', { params: {...flightState, isReal, isSingaporeAir} });
      let results = response.data || [];
      if (flightState.tripType === 'roundtrip') {
        results.sort((a, b) => sortBy === 'price' 
          ? (a.totalPrice ?? 0) - (b.totalPrice ?? 0)
          : new Date(a.outboundFlight?.departureDate ?? 0) - new Date(b.outboundFlight?.departureDate ?? 0)
        );
      } else {
        results.sort((a, b) => sortBy === 'price' 
          ? (a.priceVND ?? 0) - (b.priceVND ?? 0)
          : new Date(a.departureDate ?? 0) - new Date(b.departureDate ?? 0)
        );
      }
      setFlights(results);
      toast.success(`Tìm thấy ${results.length} chuyến bay!`);
      const fromIATA = flightState.from;
      const toIATA = flightState.to;
      if (fromIATA && toIATA && airports[fromIATA] && airports[toIATA]) {
        setFromPos([airports[fromIATA].lat, airports[fromIATA].lon]);
        setToPos([airports[toIATA].lat, airports[toIATA].lon]);
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        err.inner.forEach((error) => formattedErrors[error.path] = error.message);
        setErrors(formattedErrors);
      } else {
        toast.error('Lỗi tìm kiếm: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleHotelSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      await hotelValidationSchema.validate(hotelState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/hotels', { params: hotelState });
      let results = response.data || [];
      results.sort((a, b) => sortBy === 'price' ? (a.price ?? 0) - (b.price ?? 0) : 0);
      setHotels(results);
      toast.success(`Tìm thấy ${results.length} khách sạn!`);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        err.inner.forEach((error) => formattedErrors[error.path] = error.message);
        setErrors(formattedErrors);
      } else {
        toast.error('Lỗi tìm kiếm khách sạn: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCarSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
  
    try {
      // 1. Validate dữ liệu
      await carValidationSchema.validate(carState, { abortEarly: false });
      setErrors({});
  
      // 2. Chuẩn bị Payload sạch (chỉ gửi những gì cần thiết)
      const isTransfer = carState.serviceType === 'transfer';
      const isToAirport = carState.transferDirection === 'to_airport';
  
      const cleanParams = {
        serviceType: carState.serviceType,
        pickupDate: carState.pickupDate,
        passengers: carState.passengers,
        // Rental
        dropoffDate: !isTransfer ? carState.dropoffDate : undefined,
        driverAge: !isTransfer ? carState.driverAge : undefined,
      };
  
      // 3. Logic xử lý Điểm đón/trả thông minh
      if (isTransfer) {
        if (isToAirport) {
          // Đi từ nhà (Địa chỉ) -> Sân bay (IATA)
          cleanParams.pickupAddress = carState.pickupAddress;
          cleanParams.pickupLat = carState.pickupLat;
          cleanParams.pickupLon = carState.pickupLon;
          cleanParams.dropoff = carState.dropoff; // Mã IATA sân bay
        } else {
          // Đi từ Sân bay (IATA) -> Nhà (Địa chỉ)
          cleanParams.pickup = carState.pickup; // Mã IATA sân bay
          cleanParams.dropoffAddress = carState.dropoffAddress;
          cleanParams.dropoffLat = carState.dropoffLat;
          cleanParams.dropoffLon = carState.dropoffLon;
        }
      } else {
        // Nếu là Rental: Thường chỉ dùng mã IATA sân bay
        cleanParams.pickup = carState.pickup;
        cleanParams.dropoff = carState.dropoff || carState.pickup;
      }
  
      console.log(">>> Gửi API với params:", cleanParams);
  
      // 4. Gọi API
      const response = await axios.get('/api/cars', { params: cleanParams });
      let results = response.data || [];
  
      // 5. Sắp xếp & Hiển thị
      results.sort((a, b) => sortBy === 'price' ? (a.price ?? 0) - (b.price ?? 0) : 0);
      setCars(results);
      toast.success(`Tìm thấy ${results.length} xe!`);
  
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        err.inner?.forEach((error) => {
          if (error.path) formattedErrors[error.path] = error.message;
        });
        setErrors(formattedErrors);
        toast.error("Vui lòng kiểm tra lại thông tin!");
      } else {
        console.error("Lỗi tìm kiếm:", err);
        toast.error("Không thể tìm thấy xe phù hợp.");
      }
    } finally {
      setLoading(false);
    }
  };
  const searchAddress = async (text, field) => {
    if (text.length < 3) {
      setAddressSuggestions([]);
      setActiveField(null);
      return;
    }
    // Đánh dấu field nào đang được tìm kiếm để hiển thị dropdown đúng vị trí
    setActiveField(field); 

    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(text)}`);
      const data = await res.json();
      // Đảm bảo data trả về có cấu trúc: [{ fullAddress, lat, lon }, ...]
      setAddressSuggestions(data);
    } catch (error) {
      console.error("Lỗi Geocoding:", error);
      setAddressSuggestions([]);
    }
  };
  const handleSelectFlight = (flight) => {
    if (!isLogged) {
      toast.warn('Vui lòng đăng nhập để mua vé.');
      navigate('/login');
      return;
    }
    const payload = flightState.tripType === 'roundtrip' ? {
      outboundFlight: flight.outboundFlight,
      returnFlight: flight.returnFlight,
      totalPrice: flight.totalPrice,
      passengers: flightState.passengers || flight.passengers || 1,
      class: flightState.class || flight.class || 'economy',
    } : {
      flight: flight,
      passengers: flightState.passengers || flight.passengers || 1,
      class: flightState.class || flight.class || 'economy',
    };
    navigate('/confirmation', { state: { flightData: payload, tripType: flightState.tripType } });
  };

  const handleSelectHotel = (hotel) => {
    if (!isLogged) {
      toast.warn('Vui lòng đăng nhập để đặt.');
      navigate('/login');
      return;
    }
    navigate('/confirmation', { state: { hotelData: { ...hotel, ...hotelState } } });
  };

  const handleSelectCar = (car) => {
    if (!isLogged) {
      toast.warn('Vui lòng đăng nhập để đặt.');
      navigate('/login');
      return;
    }
    navigate('/confirmation', { state: { carData: { ...car, ...carState } } });
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
      localStorage.removeItem('token'); 
      
      setUserProfile(null);
      toast.info('Đã đăng xuất thành công!');
      navigate('/login');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      toast.error('Không thể đăng xuất, vui lòng thử lại!');
    }
  };

  const welcomeMessage = isLogged && userProfile ? `Chào, ${userProfile.name}!` : 'Chào bạn!';
  const center = useMemo(() => fromPos && toPos ? [(fromPos[0] + toPos[0]) / 2, (fromPos[1] + toPos[1]) / 2] : [16, 106], [fromPos, toPos]);
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      borderRadius: '12px', 
      minHeight: '48px',   
      borderColor: state.isFocused ? '#2563eb' : '#e5e7eb', 
      boxShadow: state.isFocused ? '0 0 0 2px rgba(37, 99, 235, 0.2)' : 'none',
      '&:hover': { borderColor: '#2563eb' },
      transition: 'all 0.3s ease',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, borderRadius: '12px', overflow: 'hidden', zIndex: 9999 }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#eff6ff' : 'transparent',
      color: state.isSelected ? 'white' : '#374151',
      cursor: 'pointer',
    }),
  };

  // Demo data for new sections
  const popularDestinations = [
    {
      name: 'Phú Quốc',
      image: 'https://image.vietnam.travel/sites/default/files/styles/top_banner/public/2019-08/what%20to%20do%20in%20phu%20quoc.jpg?itok=l8yXbDaN',
      priceLabel: 'Vé máy bay từ',
      price: 1250000,
      description: 'Trải nghiệm cáp treo hòn Thơm và lặn ngắm san hô tại quần đảo An Thới.',
      location: 'Việt Nam'
    },
    {
      name: 'Đà Lạt',
      image: 'https://sungetawaystravel.com/wp-content/uploads/2025/04/Vietnam-Coffee-Plantations-1-1024x683.jpg',
      priceLabel: 'Xe giường nằm từ',
      price: 280000,
      description: 'Thưởng thức cafe trong sương mù và check-in các vườn hoa rực rỡ sắc màu.',
      location: 'Việt Nam'
    },
    {
      name: 'Hạ Long',
      image: 'https://i.natgeofe.com/n/88df07fb-7277-4997-9215-9002b8afa918/00000165-aa56-d88f-adff-baff1bc90000.jpg?wp=1&w=1884.75&h=1060.5',
      priceLabel: 'Xe Limousine từ',
      price: 450000,
      description: 'Chiêm ngưỡng di sản thiên nhiên thế giới với hàng ngàn đảo đá vôi kỳ vĩ.',
      location: 'Việt Nam'
    },
    {
      name: 'Hội An',
      image: 'https://static.vinwonders.com/production/Taking-a-Hoi-An-lantern-boat-ride.jpg',
      priceLabel: 'Vé máy bay từ',
      price: 950000,
      description: 'Thả đèn hoa đăng trên dòng sông Hoài và dạo quanh phố cổ đèn lồng lung linh.',
      location: 'Việt Nam'
    },
    {
      name: 'Sapa',
      image: 'http://www.sapa-tour.net/wp-content/uploads/2014/08/Sapa-Rice-Terrace.jpg',
      priceLabel: 'Tàu hỏa/Xe từ',
      price: 550000,
      description: 'Chinh phục đỉnh Fansipan và khám phá bản sắc văn hóa vùng cao Tây Bắc.',
      location: 'Việt Nam'
    },
    {
      name: 'Băng Cốc',
      image: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Vé máy bay từ',
      price: 3200000,
      description: 'Thiên đường mua sắm sầm uất và những ngôi chùa vàng lộng lẫy tại Thái Lan.',
      location: 'Thái Lan'
    },
    {
      name: 'Nha Trang',
      image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/08/58/26/62/photo0jpg.jpg?w=900&h=500&s=1',
      priceLabel: 'Vé máy bay/Xe từ',
      price: 680000,
      description: 'Tận hưởng kỳ nghỉ tại vịnh biển đẹp nhất thế giới với các khu vui chơi giải trí sôi động.',
      location: 'Việt Nam'
    },
    {
      name: 'Singapore',
      image: 'https://images.unsplash.com/photo-1525596662741-e94ff9f26de1?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Vé máy bay từ',
      price: 4800000,
      description: 'Khám phá thành phố tương lai với Garden by the Bay và đảo Sentosa náo nhiệt.',
      location: 'Singapore'
    },
  ];

  const testimonials = [
    { name: 'Nguyễn Văn A', content: 'Dịch vụ tuyệt vời, giá cả hợp lý!', rating: 5 },
    { name: 'Trần Thị B', content: 'Hỗ trợ nhanh chóng, chuyến đi suôn sẻ.', rating: 4.5 },
    { name: 'Lê Văn C', content: 'Giao diện dễ sử dụng, nhiều ưu đãi.', rating: 5 },
    { name: 'Phạm Thị D', content: 'Đã đặt nhiều lần, rất hài lòng.', rating: 4.8 },
  ];

  const blogPosts = [
    { 
      title: 'Top 10 địa điểm du lịch hè 2026 không thể bỏ qua', 
      excerpt: 'Từ những bãi biển xanh ngắt tại Phú Quốc đến không gian se lạnh của Sapa, đây là những tọa độ đang làm mưa làm gió...', 
      // Ảnh bãi biển trong xanh nhiệt đới
      image: 'https://images.pexels.com/photos/457882/pexels-photo-457882.jpeg?auto=compress&cs=tinysrgb&w=600',
      date: '10/01/2026',
      category: 'Cẩm nang'
    },
    { 
      title: 'Mẹo đặt vé máy bay và phòng khách sạn giá rẻ', 
      excerpt: 'Làm thế nào để săn được vé 0 đồng? Thời điểm nào đặt phòng là tốt nhất? Hãy cùng TravelHub khám phá bí kíp tiết kiệm...', 
      // Ảnh hộ chiếu và vé máy bay/điện thoại check-in
      image: 'https://images.pexels.com/photos/385997/pexels-photo-385997.jpeg?auto=compress&cs=tinysrgb&w=600',
      date: '08/01/2026',
      category: 'Kinh nghiệm'
    },
    { 
      title: 'Hành trình khám phá ẩm thực đường phố Hà Nội', 
      excerpt: 'Phở, bún chả, chả cá Lã Vọng... nét tinh hoa ẩm thực nghìn năm văn hiến khiến bất kỳ thực khách nào cũng phải say đắm...', 
      // Ảnh ẩm thực đường phố/món ăn đặc trưng
      image: 'https://images.pexels.com/photos/2454533/pexels-photo-2454533.jpeg?auto=compress&cs=tinysrgb&w=600',
      date: '05/01/2026',
      category: 'Ẩm thực'
    },
  ];
  const otherServices = [
    // { icon: <FaBusAlt />, name: 'Vé Xe Bus', path: '/bus' },
    // { icon: <FaTrain />, name: 'Vé Tàu', path: '/train' },
    // { icon: <FaShip />, name: 'Du Thuyền', path: '/cruise' },
    // { icon: <FaUmbrellaBeach />, name: 'Tour Biển', path: '/beach-tours' },
  ];

  const renderForm = () => {
    switch (activeService) {
      case 'flights':
        return (
          <div className="animate-in fade-in duration-500">
            {/* Trip Type Selector */}
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
              {['oneway', 'roundtrip'].map((type) => (
                <label key={type} className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${flightState.tripType === type ? 'bg-white shadow-md text-blue-600' 
                : 'text-slate-500 hover:bg-slate-200/50'}`}>
                  <input type="radio" name="tripType" value={type} checked={flightState.tripType === type} onChange={(e) => handleChange(flightDispatch, 'tripType', e.target.value, errors, setErrors)} className="hidden" />
                  {type === 'oneway' ? 'Một chiều' : 'Khứ hồi'}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
              <div className="md:col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
                <div className="w-full relative pb-5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Điểm đi</label>
                  <Select options={airportOptions} styles={customSelectStyles} value={airportOptions.find((opt) => opt.value === flightState.from)} onChange={opt => handleChange(flightDispatch, 'from', opt?.value, errors, setErrors)} placeholder="Chọn điểm đi" />
                  {errors.from && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.from}</p>}
                </div>
                
                <div className="flex justify-center pb-5">
                  <button type="button" onClick={() => flightDispatch({ type: 'SWAP', field1: 'from', field2: 'to' })} className="p-2.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-full border border-slate-200 transition-all shadow-sm active:scale-90">
                    <span className="text-xl">⇄</span>
                  </button>
                </div>
  
                <div className="w-full relative pb-5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Điểm đến</label>
                  <Select options={airportOptions} styles={customSelectStyles} value={airportOptions.find((opt) => opt.value === flightState.to)} onChange={opt => handleChange(flightDispatch, 'to', opt?.value, errors, setErrors)} placeholder="Chọn điểm đến" />
                  {errors.to && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.to}</p>}
                </div>
              </div>
              <div className={`md:col-span-1 lg:col-span-4 grid gap-3 ${flightState.tripType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                <div className="relative pb-5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Ngày đi</label>
                  <input type="date" className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" value={flightState.departureDate} onChange={(e) => handleChange(flightDispatch, 'departureDate', e.target.value, errors, setErrors)} />
                  {errors.departureDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.departureDate}</p>}
                </div>
                {flightState.tripType === 'roundtrip' && (
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Ngày về</label>
                    <input type="date" className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" value={flightState.returnDate} onChange={(e) => handleChange(flightDispatch, 'returnDate', e.target.value, errors, setErrors)} />
                    {errors.returnDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.returnDate}</p>}
                  </div>
                )}
              </div>
              <div className="md:col-span-1 lg:col-span-3 grid grid-cols-2 gap-3">
                <div className="relative pb-5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Hành khách</label>
                  <select className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-700 shadow-sm outline-none appearance-none cursor-pointer" value={flightState.passengers} onChange={(e) => handleChange(flightDispatch, 'passengers', e.target.value, errors, setErrors)}>
                    {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Khách</option>)}
                  </select>
                  {errors.passengers && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.passengers}</p>}
                </div>
                <div className="relative pb-5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Hạng vé</label>
                  <select className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-700 shadow-sm outline-none appearance-none cursor-pointer" value={flightState.class} onChange={(e) => handleChange(flightDispatch, 'class', e.target.value, errors, setErrors)}>
                    <option value="economy">Phổ thông</option>
                    <option value="business">Thương gia</option>
                  </select>
                  {errors.class && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.class}</p>}
                </div>
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-12 mt-6">
              {/* <SearchButton label="Google Sheet" color="emerald" onClick={(e) => handleFlightSearch(e, false, false)} loading={loading} />
              <SearchButton label="Amadeus" color="indigo" onClick={(e) => handleFlightSearch(e, true, false)} loading={loading} />
              <SearchButton label="Singapore Air" color="blue" onClick={(e) => handleFlightSearch(e, false, true)} loading={loading} /> */}
              <SearchButton label="Tìm máy bay" color="emerald" onClick={handleFlightSearch} loading={loading} />
            </div>
          </div>
        );
  
      case 'hotels':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 animate-in fade-in duration-500">
            <div className="md:col-span-2 lg:col-span-5 relative pb-5">
              <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Vị trí</label>
              <Select options={airportOptions} styles={customSelectStyles} value={airportOptions.find((opt) => opt.value === hotelState.location)} onChange={opt => handleChange(hotelDispatch, 'location', opt?.value, errors, setErrors)} placeholder="Bạn muốn nghỉ ở đâu?" />
              {errors.location && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.location}</p>}
            </div>
            <div className="md:col-span-1 lg:col-span-4 grid grid-cols-2 gap-3">
              <div className="relative pb-5">
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Nhận phòng</label>
                <input type="date" className="w-full h-[48px] px-4 border border-slate-200 rounded-xl font-bold text-sm shadow-sm" value={hotelState.checkInDate} onChange={(e) => handleChange(hotelDispatch, 'checkInDate', e.target.value, errors, setErrors)} />
                {errors.checkInDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.checkInDate}</p>}
              </div>
              <div className="relative pb-5">
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Trả phòng</label>
                <input type="date" className="w-full h-[48px] px-4 border border-slate-200 rounded-xl font-bold text-sm shadow-sm" value={hotelState.checkOutDate} onChange={(e) => handleChange(hotelDispatch, 'checkOutDate', e.target.value, errors, setErrors)} />
                {errors.checkOutDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.checkOutDate}</p>}
              </div>
            </div>
            <div className="md:col-span-1 lg:col-span-3 grid grid-cols-2 gap-3">
              <div className="relative pb-5">
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Phòng</label>
                <select className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm shadow-sm outline-none" value={hotelState.rooms} onChange={(e) => handleChange(hotelDispatch, 'rooms', e.target.value, errors, setErrors)}>
                  {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Phòng</option>)}
                </select>
                {errors.rooms && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.rooms}</p>}
              </div>
              <div className="relative pb-5">
                <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Khách</label>
                <select className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm shadow-sm outline-none" value={hotelState.guests} onChange={(e) => handleChange(hotelDispatch, 'guests', e.target.value, errors, setErrors)}>
                  {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Khách</option>)}
                </select>
                {errors.guests && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.guests}</p>}
              </div>
            </div>
            <div className="md:col-span-2 lg:col-span-12 mt-6">
              <SearchButton label="Tìm khách sạn" color="emerald" onClick={handleHotelSearch} loading={loading} />
            </div>
          </div>
        );
  
        case 'cars':
          const isTransfer = carState.serviceType === 'transfer';
          const isToAirport = carState.transferDirection === 'to_airport';

          return (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto p-4">
              {/* TABS DỊCH VỤ */}
              <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
                {['rental', 'transfer'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      handleChange(carDispatch, 'serviceType', type, errors, setErrors);
                      setErrors({});
                    }}
                    className={`px-8 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      carState.serviceType === type 
                        ? 'bg-white shadow-md text-blue-600' 
                        : 'text-slate-500 hover:bg-slate-200/50'
                    }`}
                  >
                    {type === 'rental' ? 'Thuê xe tự lái' : 'Đưa đón sân bay'}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* KHỐI 1: ĐỊA ĐIỂM */}
                <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-[1fr_48px_1fr] gap-2 items-start">
                  
                  {/* CỘT TRÁI: PICKUP (Điểm đón) */}
                  <div className="relative min-h-[85px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">
                      {isTransfer ? (isToAirport ? 'Điểm đón (Nhà/KS)' : 'Sân bay đón') : 'Điểm nhận xe'}
                    </label>
                    
                    {isTransfer && isToAirport ? (
                      // Trường hợp Đưa đi sân bay: Nhập địa chỉ thủ công
                      <div className="relative group">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Nhập địa chỉ đón..."
                          className={`w-full h-[52px] pl-10 pr-4 bg-white border ${errors.pickupAddress ? 'border-red-500' : 'border-slate-200'} rounded-xl font-semibold text-sm outline-none focus:border-blue-500`}
                          value={carState.pickupAddress || ''}
                          onChange={(e) => {
                            handleChange(carDispatch, 'pickupAddress', e.target.value, errors, setErrors);
                            searchAddress(e.target.value, 'pickup');
                          }}
                        />
                        {/* Gợi ý cho Pickup */}
                        {activeField === 'pickup' && addressSuggestions.length > 0 && (
                          <ul className="absolute z-[100] bg-white border rounded-xl mt-1 w-full max-h-60 overflow-y-auto shadow-2xl">
                            {addressSuggestions.map((sug, idx) => (
                              <li key={idx} onClick={() => {
                                handleChange(carDispatch, 'pickupAddress', sug.fullAddress, errors, setErrors);
                                handleChange(carDispatch, 'pickupLat', sug.latitude, errors, setErrors);
                                handleChange(carDispatch, 'pickupLon', sug.longitude, errors, setErrors);
                                handleChange(carDispatch, 'pickupCountry', sug.country, errors, setErrors);
                                setAddressSuggestions([]);
                              }} className="px-3 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b last:border-none">
                                {sug.fullAddress}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      // Trường hợp Thuê xe HOẶC Đón từ sân bay: Chọn List Sân bay
                      <Select
                        options={airportOptions}
                        styles={customSelectStyles}
                        placeholder="Chọn sân bay..."
                        value={airportOptions.find(opt => opt.value === carState.pickup)}
                        onChange={opt => handleChange(carDispatch, 'pickup', opt?.value, errors, setErrors)}
                      />
                    )}
                    {errors.pickup && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.pickup}</p>}
                  </div>

                  {/* NÚT CHUYỂN ĐỔI */}
                  <div className="flex justify-center pt-8">
                    <button
                      type="button"
                      onClick={() => carDispatch({ type: 'TOGGLE_DIRECTION' })}
                      className={`w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 shadow-sm transition-transform duration-500 ${!isTransfer ? 'opacity-20 cursor-default' : 'active:scale-90'}`}
                      disabled={!isTransfer}
                    >
                      <FaArrowRight className={isToAirport ? '' : 'rotate-180'} />
                    </button>
                  </div>

                  {/* CỘT PHẢI: DROPOFF (Điểm trả) */}
                  <div className="relative min-h-[85px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">
                      {isTransfer ? (isToAirport ? 'Sân bay đến' : 'Điểm trả (Nhà/KS)') : 'Điểm trả xe'}
                    </label>

                    {isTransfer && !isToAirport ? (
                      // Trường hợp Đón từ sân bay về nhà: Nhập địa chỉ trả thủ công
                      <div className="relative group">
                        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Nhập địa chỉ trả..."
                          className={`w-full h-[52px] pl-10 pr-4 bg-white border ${errors.dropoffAddress ? 'border-red-500' : 'border-slate-200'} rounded-xl font-semibold text-sm outline-none focus:border-blue-500`}
                          value={carState.dropoffAddress || ''}
                          onChange={(e) => {
                            handleChange(carDispatch, 'dropoffAddress', e.target.value, errors, setErrors);
                            searchAddress(e.target.value, 'dropoff');
                          }}
                        />
                        {/* Gợi ý cho Dropoff */}
                        {activeField === 'dropoff' && addressSuggestions.length > 0 && (
                          <ul className="absolute z-[100] bg-white border rounded-xl mt-1 w-full max-h-60 overflow-y-auto shadow-2xl">
                            {addressSuggestions.map((sug, idx) => (
                              <li key={idx} onClick={() => {
                                handleChange(carDispatch, 'dropoffAddress', sug.fullAddress, errors, setErrors);
                                handleChange(carDispatch, 'dropoffLat', sug.latitude, errors, setErrors);
                                handleChange(carDispatch, 'dropoffLon', sug.longitude, errors, setErrors);
                                handleChange(carDispatch, 'dropoffCountry', sug.country, errors, setErrors);
                                setAddressSuggestions([]);
                              }} className="px-3 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b last:border-none">
                                {sug.fullAddress}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : (
                      // Trường hợp Thuê xe HOẶC Đi ra sân bay: Chọn List Sân bay
                      <Select
                        options={airportOptions}
                        styles={customSelectStyles}
                        placeholder="Chọn sân bay..."
                        value={airportOptions.find(opt => opt.value === carState.dropoff)}
                        onChange={opt => handleChange(carDispatch, 'dropoff', opt?.value, errors, setErrors)}
                      />
                    )}
                    {errors.dropoff && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.dropoff}</p>}
                  </div>
                </div>

                {/* KHỐI 2: THỜI GIAN & KHÁCH */}
                <div className="lg:col-span-4 grid grid-cols-2 gap-3 items-start">
                  <div className="relative min-h-[85px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">
                      {isTransfer ? 'Ngày & Giờ đón' : 'Ngày nhận xe'}
                    </label>
                    <div className="relative">
                      {isTransfer ? <FaClock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> : <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
                      <input
                        type={isTransfer ? "datetime-local" : "date"}
                        className={`w-full h-[52px] pl-10 pr-2 border ${errors.pickupDate ? 'border-red-500' : 'border-slate-200'} rounded-xl font-bold text-sm outline-none focus:border-blue-500`}
                        value={carState.pickupDate || ''}
                        onChange={(e) => handleChange(carDispatch, 'pickupDate', e.target.value, errors, setErrors)}
                        min={isTransfer ? new Date().toISOString().slice(0, 16) : new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  <div className="relative min-h-[85px]">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">
                      {isTransfer ? 'Số khách' : 'Ngày trả'}
                    </label>
                    <div className="relative">
                      {isTransfer ? (
                        <>
                          <FaUserFriends className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min="1"
                            className={`w-full h-[52px] pl-10 pr-4 border ${errors.passengers ? 'border-red-500' : 'border-slate-200'} rounded-xl font-bold text-sm outline-none focus:border-blue-500`}
                            value={carState.passengers || ''}
                            onChange={(e) => handleChange(carDispatch, 'passengers', e.target.value, errors, setErrors)}
                          />
                        </>
                      ) : (
                        <>
                          <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="date"
                            className={`w-full h-[52px] pl-10 pr-2 border ${errors.dropoffDate ? 'border-red-500' : 'border-slate-200'} rounded-xl font-bold text-sm outline-none focus:border-blue-500`}
                            value={carState.dropoffDate || ''}
                            onChange={(e) => handleChange(carDispatch, 'dropoffDate', e.target.value, errors, setErrors)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* KHỐI 3: SEARCH */}
                <div className="lg:col-span-2 pt-[22px]">
                  <SearchButton label="Tìm xe" color="emerald" onClick={handleCarSearch} loading={loading} />
                </div>
              </div>
            </div>
          );
      default:
        return null;
    }
  };
  const renderResults = () => {
    if (!hasSearched) return null;
    switch (activeService) {
      case 'flights':
        if (flights.length === 0 && !loading) {
          return (
            <div className="text-center py-20 animate-fade-in">
              <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto shadow-md mb-4 flex items-center justify-center">
                <FaPlane className="text-4xl text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Không tìm thấy chuyến bay</h3>
              <p className="text-slate-500 mt-2">Vui lòng thử thay đổi ngày hoặc địa điểm khác.</p>
            </div>
          );
        }
        
        return (
          <div className="mt-12 animate-fade-in">
            {/* Header kết quả */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-800">Kết quả tìm kiếm</h3>
                <p className="text-slate-500 text-sm font-medium">Tìm thấy {flights.length} lựa chọn tốt nhất cho bạn</p>
              </div>
              
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-xs font-bold text-slate-400">SẮP XẾP:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  className="bg-transparent font-bold text-blue-600 outline-none cursor-pointer text-sm"
                >
                  <option value="price">Giá tốt nhất</option>
                  <option value="date">Giờ cất cánh</option>
                </select>
              </div>
            </div>
        
            {/* GRID HIỂN THỊ: 1 cột trên Mobile, 2 cột trên Desktop (lg:grid-cols-2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {flights.map((flight, index) => {
                const hasReturn = !!flight.inbound;
        
                return (
                  <div 
                    key={flight.id || index} 
                    className="flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                  >
                    {/* Nội dung chuyến bay (Phần trên) */}
                    <div className="p-6 space-y-8 flex-grow">
                      <FlightRowLeg 
                        label={hasReturn ? "Chiều đi" : "Chuyến bay"} 
                        data={flight.outbound} 
                        icon={<FaPlaneDeparture className="text-blue-500 text-lg" />} 
                      />
        
                      {hasReturn && (
                        <div className="relative pt-6">
                          <div className="absolute top-0 left-0 w-full border-t border-dashed border-slate-200"></div>
                          <FlightRowLeg 
                            label="Chiều về" 
                            data={flight.inbound} 
                            icon={<FaPlaneArrival className="text-purple-500 text-lg" />} 
                          />
                        </div>
                      )}
                    </div>
        
                    {/* Phần giá và nút chọn (Phần dưới) */}
                    <div className="bg-slate-50/50 p-6 flex items-center justify-between border-t border-slate-100 mt-auto">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-orange-600 tracking-tighter">
                            {(flight.price?.total || 0).toLocaleString()}
                          </span>
                          <span className="text-sm font-bold text-orange-600">₫</span>
                        </div>
                        <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                          {(flight.price?.perPassenger || 0).toLocaleString()}₫ x {flight.passengers || 1} khách
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => handleSelectFlight(flight)} 
                        className="px-7 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
                      >
                        CHỌN VÉ <FaArrowRight className="text-[10px]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
        
            {/* Bản đồ */}
            {fromPos && toPos && (
              <div className="mt-12 h-[350px] w-full rounded-3xl overflow-hidden shadow-2xl border-4 border-white">
                <Suspense fallback={<div className="bg-slate-50 h-full w-full flex items-center justify-center text-slate-300 font-bold italic">Đang tải bản đồ hành trình...</div>}>
                  <FlightMap fromPos={fromPos} toPos={toPos} center={center} />
                </Suspense>
              </div>
            )}
          </div>
        );
      case 'hotels':
        // Phần logic hiển thị danh sách khách sạn
        if (hotels.length === 0 && !loading) {
          return (
            <div className="text-center py-20 animate-fade-in bg-white rounded-[40px] shadow-sm border border-dashed border-slate-200">
              <FaHotel className="text-6xl text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700">Không tìm thấy khách sạn phù hợp</h3>
              <p className="text-slate-500 mt-2">Hãy thử thay đổi thành phố hoặc ngày lưu trú khác.</p>
            </div>
          );
        }
        
        return (
          <div className="mt-12 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Ưu đãi phòng tốt nhất</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                  {/* LẤY TỪ hotelState */}
                  {hotels.length} khách sạn khả dụng tại {hotelState.location || "điểm bạn chọn"}
                </p>
              </div>
              
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 ml-2">SẮP XẾP:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 px-4 py-2 rounded-xl font-bold text-blue-600 text-xs outline-none border-none cursor-pointer"
                >
                  <option value="price">Giá từ thấp đến cao</option>
                  <option value="rating">Đánh giá tốt nhất</option>
                </select>
              </div>
            </div>
        
            {/* Grid hiển thị 2 cột */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {hotels.map((h, index) => (
                <HotelCard 
                  key={h.id || index} 
                  hotel={h} 
                  onSelect={handleSelectHotel}
                  // TRUYỀN TỪ hotelState - Đây là lý do lúc trước bị trống
                  checkIn={hotelState.checkInDate}
                  checkOut={hotelState.checkOutDate}
                />
              ))}
            </div>
          </div>
        );
      case 'cars':
        if (cars.length === 0 && !loading) {
          return (
            <div className="text-center py-20">
              <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto shadow-md mb-4 flex items-center justify-center">
                <FaCar className="text-4xl text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Không tìm thấy xe</h3>
              <p className="text-slate-500 mt-2">Vui lòng thử thay đổi ngày hoặc địa điểm khác.</p>
            </div>
          );
        }
        return (
          <div className="mt-12">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Xe sẵn sàng cho bạn</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                  Tìm thấy {cars.length} lựa chọn tại {airports[carState.pickup]?.city || "điểm bạn chọn"}
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 ml-2 uppercase">Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} 
                  className="bg-slate-50 px-4 py-2 rounded-xl font-bold text-blue-600 text-xs outline-none cursor-pointer">
                  <option value="price">Giá thấp nhất</option>
                  <option value="rating">Đánh giá tốt nhất</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map((c, index) => (
              <CarCard 
                key={c.id || index} 
                car={c} 
                onSelect={handleSelectCar}
                pickupDate={carState.pickupDate}
                dropoffDate={carState.dropoffDate}
                isTransfer={carState.serviceType === 'transfer'}
              />
            ))}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 font-sans relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full blur-2xl animate-float"></div>
      </div>
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={handleLogout} 
      />
      <div className="w-full relative z-10 overflow-hidden shadow-2xl rounded-2xl">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          className="w-full h-[280px] md:h-[420px]" 
        >
          {[
            {
              title: "Vé Máy Bay Nội Địa & Quốc Tế",
              desc: "Hàng ngàn chặng bay với giá vé cạnh tranh nhất thị trường.",
              btn: "Đặt Vé Máy Bay",
              icon: <FaPlane />,
              url: "https://images.pexels.com/photos/1004584/pexels-photo-1004584.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            },
            {
              title: "Khách Sạn & Resort Cao Cấp",
              desc: "Tận hưởng kỳ nghỉ mơ ước tại những điểm đến hàng đầu thế giới.",
              btn: "Tìm Khách Sạn",
              icon: <FaHotel />,
              url: "https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            },
            {
              title: "Thuê Xe Tự Lái Linh Hoạt",
              desc: "Chủ động hành trình với dịch vụ thuê xe 4-7 chỗ đa dạng.",
              btn: "Thuê Xe Ngay",
              icon: <FaCar />,
              url: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            },
            {
              title: "Xe Đưa Đón Sân Bay",
              desc: "Dịch vụ đưa đón tận nơi, đúng giờ, an toàn và chuyên nghiệp.",
              btn: "Đặt Xe Đưa Đón",
              icon: <FaShuttleVan />,
              url: "https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            }
          ].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div 
                className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 text-white" 
                style={{ 
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7)), url(${banner.url})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="max-w-4xl px-4 animate-fadeIn">
                  <h2 className="text-2xl md:text-5xl font-extrabold mb-4 drop-shadow-2xl tracking-tight uppercase">
                    {banner.title}
                  </h2>
                  
                  <p className="text-sm md:text-2xl mb-8 opacity-100 font-light drop-shadow-md italic">
                    {banner.desc}
                  </p>
                  
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-7 py-2 md:px-12 md:py-4 rounded-full font-bold shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center gap-3 mx-auto text-sm md:text-xl">
                    {banner.icon} {banner.btn}
                  </button>
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 -mt-10 md:-mt-16 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex flex-wrap justify-center space-x-4">
              {['flights', 'hotels', 'cars'].map((service) => (
                <button
                  key={service}
                  onClick={() => {
                    setActiveService(service);
                    setHasSearched(false);
                    setErrors({});
                  }}
                  className={`py-2 px-4 text-sm font-medium flex items-center gap-2 transition-all ${
                    activeService === service 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {service === 'flights' && <FaPlane />}
                  {service === 'hotels' && <FaHotel />}
                  {service === 'cars' && <FaCar />}
                  {service === 'flights' ? 'Chuyến bay' : service === 'hotels' ? 'Khách sạn' : service === 'cars' ? 'Xe' : ''}
                </button>
              ))}
            </nav>
          </div>
          <form onSubmit={(e) => e.preventDefault()}>
            {renderForm()}
          </form>
        </div>
        {activeService === 'flights' && cheapFlights.length > 0 && (
        <div className="mt-12">
          <div className="flex flex-col mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FaTicketAlt className="text-orange-500"/> Vé rẻ đề xuất
            </h3>
            {cheapFlights[0]?.isGpsBased && (
              <p className="text-xs text-green-600 font-medium">✨ Đang hiển thị vé gần vị trí của bạn</p>
            )}
          </div>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
            className="pb-10"
          >
            {cheapFlights.map((f, idx) => (
              <SwiperSlide key={idx} className="pb-8">
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-700">{f.origin}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Điểm đi</span>
                    </div>
                    <div className="flex flex-col items-center opacity-40">
                      <FaPlane className="text-blue-500 text-lg" />
                      <div className="w-10 h-[2px] bg-slate-300 mt-1"></div>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-700">{f.destination}</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Điểm đến</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-500" /> 
                      {new Date(f.departureDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center gap-2 font-bold text-red-500 text-lg">
                      <FaWallet /> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(f.priceVND)}
                    </div>
                  </div>

                  <button 
                    onClick={() => handleSelectFlight(f)} 
                    className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-700 font-bold hover:bg-blue-600 hover:text-white transition-all duration-300"
                  >
                    Chọn Vé Ngay
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
        {renderResults()}
        <PopularDestinationsSwiper popularDestinations={popularDestinations} title="Địa điểm phổ biến" subtitle="Gợi ý những điểm tốt nhất dành cho bạn" onCardClick={(dest) => { /* logic tự điền form */ }} />        {/* <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FaGlobe className="text-green-500"/> Dịch vụ khác</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {otherServices.map((service, idx) => (
              <button
                key={idx}
                onClick={() => navigate(service.path)}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all flex flex-col items-center justify-center gap-2 border border-slate-100"
              >
                <div className="text-3xl text-blue-600">{service.icon}</div>
                <span className="text-sm font-bold text-slate-700">{service.name}</span>
              </button>
            ))}
          </div>
        </div> */}

        <TestimonialsSwiper testimonials={testimonials} />
        <BlogPostsGrid blogPosts={blogPosts} />
        <PurchaseHistory isLogged={isLogged} purchases={purchases} title="Lịch sử đặt vé" />
      </main>
      <BankGuideModal bankGuide={bankGuide} />
      <Footer />
    </div>
  );
}

export default Dashboard;