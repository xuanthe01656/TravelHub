import { useMemo, useReducer, useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Select from 'react-select'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import FlightRowLeg from '../components/FlightRowLeg';
import {
  FaPlaneDeparture, FaPlaneArrival, FaPlane, FaShoppingCart, FaLock, FaReceipt,
  FaInfoCircle, FaHome, FaPhoneAlt, FaUserCircle, FaCalendarAlt, FaUsers,
  FaChair, FaCar, FaGlobe, FaBars, FaTimes, FaCreditCard, FaSpinner,
  FaWallet, FaUniversity, FaArrowLeft, FaClock, FaTicketAlt,
  FaStar, FaQuoteLeft, FaBlog, FaMapMarkerAlt, FaShip, FaTrain, FaUmbrellaBeach,FaBusAlt,FaArrowRight
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';
const initialState = {
  from: '',
  to: '',
  departureDate: '',
  returnDate: '',
  tripType: 'oneway',
  passengers: '',
  class: '',
};
function reducer(state, action) {
  switch (action.type) {
      case 'CHANGE':
        return { ...state, [action.field]: action.value };
      case 'RESET':
        return initialState;
      case 'UPDATE_FIELD': 
        return { ...state, [action.field]: action.value };
      case 'SWAP':
        return { ...state, from: state.to, to: state.from };
      default:
        return state;
  }
}
const validationSchema = Yup.object({
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
const airports = {
  HAN: { lat: 21.221111, lon: 105.807222, city: 'Hà Nội' },         
  SGN: { lat: 10.8188, lon: 106.6519, city: 'TP. Hồ Chí Minh' },    
  DAD: { lat: 16.043889, lon: 108.199444, city: 'Đà Nẵng' },
  HPH: { lat: 20.819167, lon: 106.724722, city: 'Hải Phòng' },       
  VDO: { lat: 21.117778, lon: 107.414167, city: 'Vân Đồn' },
  HUI: { lat: 16.401667, lon: 107.702778, city: 'Huế' },             
  PQC: { lat: 10.171667, lon: 103.991111, city: 'Phú Quốc' },
  BMV: { lat: 12.668056, lon: 108.12, city: 'Buôn Ma Thuột' },
  TBB: { lat: 13.049444, lon: 109.333611, city: 'Tuy Hòa' },
  CAH: { lat: 9.175556, lon: 105.179444, city: 'Cà Mau' },
  VCL: { lat: 15.406111, lon: 108.705556, city: 'Chu Lai' },
  VCS: { lat: 8.7325, lon: 106.628889, city: 'Côn Đảo' },
  VTG: { lat: 10.366667, lon: 107.083333, city: 'Vũng Tàu' },
  VDH: { lat: 17.515, lon: 106.590556, city: 'Đồng Hới' },
  PXU: { lat: 14.004444, lon: 108.017222, city: 'Pleiku' },
  UIH: { lat: 13.955, lon: 109.042222, city: 'Quy Nhơn' },
  VKG: { lat: 9.959722, lon: 105.133889, city: 'Rạch Giá' },
  THD: { lat: 19.901667, lon: 105.467778, city: 'Thanh Hóa' },       
  DLI: { lat: 11.750556, lon: 108.373611, city: 'Đà Lạt' },          
  CXR: { lat: 11.998153, lon: 109.219372, city: 'Nha Trang' },       
  VCA: { lat: 10.085278, lon: 105.711944, city: 'Cần Thơ' },         
  VII: { lat: 18.7375, lon: 105.670833, city: 'Vinh' },
  SIN: { lat: 1.3644, lon: 103.9915, city: 'Singapore' },
  BKK: { lat: 13.6811, lon: 100.7472, city: 'Bangkok' },
  TYO: { lat: 35.5523, lon: 139.7798, city: 'Tokyo' },
  SEL: { lat: 37.4602, lon: 126.4407, city: 'Seoul' },
};

const airportOptions = Object.keys(airports).map((iata) => ({
    value: iata,
    label: `${airports[iata].city} (${iata})`,
}));
const safeRender = (data) => {
  if (typeof data === 'object' && data !== null) {
    return data.name || data.code || 'N/A';
  }
  return data || 'N/A';
};

const formatCurrency = (n) => {
  return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VND';
};

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

function Flights() {
  const [formState, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [flights, setFlights] = useState([]);
  const [cheapFlights, setCheapFlights] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [fromPos, setFromPos] = useState(null);
  const [toPos, setToPos] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [sortBy, setSortBy] = useState('price'); 
  const [bannerVisible, setBannerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const bankGuide = location.state?.bankGuide;
  const isLogged = localStorage.getItem('token');
  const tokenErrorHandled = useRef(false);
  const handleTokenError = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (tokenErrorHandled.current) return true;
      tokenErrorHandled.current = true;
      localStorage.removeItem('token');
      setUserProfile(null);
      toast.error('Phiên đăng nhập hết hạn.');
      if (!['/flights', '/hotels', '/cars', '/tours'].includes(window.location.pathname)) {
        navigate('/login');
      }
      return true;
    }
    return false;
  };
  useDocumentTitle('Đặt vé máy bay');
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
      toast.success('Yêu cầu chuyển khoản đã được tạo! Vui lòng thanh toán.', { autoClose: 5000 });
    }
  }, [isLogged, bankGuide, navigate, location.pathname]);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/user/profile', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setUserProfile(response.data);
    } catch (err) { handleTokenError(err); }
  };

  const fetchCheapFlights = async () => {
  try {
    let url = '/api/flights/cheap';

    if ("geolocation" in navigator) {
      const coords = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null), // Nếu user từ chối, trả về null
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
    data.sort((a, b) => (a.priceVND || 0) - (b.priceVND || 0));
    setCheapFlights(data);
  } catch (err) {
    console.error("Lỗi lấy vé rẻ:", err);
  }
};

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('/api/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchases(response.data || []);
    } catch (err) { handleTokenError(err); }
  };

  const handleChange = (field, value) => {
    dispatch({ type: 'CHANGE', field, value });
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSearch = async (e, isReal, isSingaporeAir) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    setFromPos(null);
    setToPos(null);
    try {
      await validationSchema.validate(formState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/flights', { params: {...formState, isReal, isSingaporeAir} });
      let results = response.data || [];
      if (formState.tripType === 'roundtrip') {
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
      const fromIATA = formState.from;
      const toIATA = formState.to;
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

  const handleSelectFlight = (flight) => {
    if (!isLogged) {
      toast.warn('Vui lòng đăng nhập để mua vé.');
      navigate('/login');
      return;
    }
    const payload = formState.tripType === 'roundtrip' ? {
      outboundFlight: flight.outboundFlight,
      returnFlight: flight.returnFlight,
      totalPrice: flight.totalPrice,
      passengers: formState.passengers || flight.passengers || 1,
      class: formState.class || flight.class || 'economy',
    } : {
      flight: flight,
      passengers: formState.passengers || flight.passengers || 1,
      class: formState.class || flight.class || 'economy',
    };
    navigate('/confirmation', { state: { flightData: payload, tripType: formState.tripType } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserProfile(null);
    toast.info('Đã đăng xuất!');
    navigate('/login');
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
      title: 'Top 10 địa điểm du lịch hè 2025 không thể bỏ qua', 
      excerpt: 'Từ những bãi biển xanh ngắt tại Phú Quốc đến không gian se lạnh của Sapa, đây là những tọa độ đang làm mưa làm gió...', 
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      date: '20/12/2024',
      category: 'Cẩm nang'
    },
    { 
      title: 'Mẹo đặt vé máy bay và phòng khách sạn giá rẻ', 
      excerpt: 'Làm thế nào để săn được vé 0 đồng? Thời điểm nào đặt phòng là tốt nhất? Hãy cùng TravelHub khám phá bí kíp tiết kiệm...', 
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&w=600&q=80',
      date: '18/12/2024',
      category: 'Kinh nghiệm'
    },
    { 
      title: 'Hành trình khám phá ẩm thực đường phố Hà Nội', 
      excerpt: 'Phở, bún chả, chả cá Lã Vọng... nét tinh hoa ẩm thực nghìn năm văn hiến khiến bất kỳ thực khách nào cũng phải say đắm...', 
      image: 'https://images.unsplash.com/photo-1567129937968-cdad8f0d5a3a?auto=format&fit=crop&w=600&q=80',
      date: '15/12/2024',
      category: 'Ẩm thực'
    },
  ];

  const otherServices = [
    // { icon: <FaBusAlt />, name: 'Vé Xe Bus', path: '/bus' },
    // { icon: <FaTrain />, name: 'Vé Tàu', path: '/train' },
    // { icon: <FaShip />, name: 'Du Thuyền', path: '/cruise' },
    // { icon: <FaUmbrellaBeach />, name: 'Tour Biển', path: '/beach-tours' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 font-sans relative">
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={handleLogout} 
      />
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full blur-2xl animate-float"></div>
      </div>
      <div className="w-full relative z-10 overflow-hidden">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0} slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }} navigation={true}
          className="w-full h-[180px] md:h-[320px]"
        >
          {[{
            color: "from-indigo-600 to-purple-600",
            title: "Khuyến Mãi Đặc Biệt",
            desc: "Giảm tới 50% cho chuyến bay nội địa.",
            btn: "Khám Phá",
            url:"https://www.shutterstock.com/image-photo/white-passenger-airplane-flying-sky-600nw-2331577059.jpg"
          }, {
            color: "from-emerald-500 to-teal-500",
            title: "Bay Quốc Tế Giá Sốc",
            desc: "Chỉ từ 2.000.000 VND cho các chặng bay ASEAN.",
            btn: "Đặt Ngay",
            url:"https://media.istockphoto.com/id/1366213348/photo/sunset-sky-from-an-airplane-wing-view-of-the-horizon-and-sun-lights.jpg?s=612x612&w=0&k=20&c=yvelEAeFk7Sr4KbEuQxsy4daspwWuasG6muHG3gUlmk="
          }, {
            color: "from-orange-500 to-rose-500",
            title: "Vi Vu Cuối Tuần",
            desc: "Ưu đãi vé khứ hồi cho cặp đôi.",
            btn: "Xem Ngay",
            url:"https://www.shutterstock.com/image-photo/bottomup-view-white-passenger-airplane-600nw-2619924563.jpg"
          }].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div className={`relative bg-black/40 text-blue w-full h-full flex flex-col items-center justify-center text-center p-4`} style={{ backgroundImage: `url(${banner.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <h2 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 drop-shadow-md animate-fadeInUp">{banner.title}</h2>
                <p className="text-sm md:text-xl mb-4 md:mb-8 max-w-2xl opacity-90">{banner.desc}</p>
                <button className="bg-white text-slate-900 px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg hover:scale-105 transition transform flex items-center gap-2 text-sm md:text-base">
                  <FaPlane /> {banner.btn}
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 -mt-10 md:-mt-16 relative z-20 overflow-x-clip md:overflow-x-visible">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex flex-wrap justify-center space-x-4">
              <button className="py-2 px-4 text-sm font-medium flex items-center gap-2 transition-all text-blue-600 border-b-2 border-blue-600">
                <FaPlane /> Chuyến bay
              </button>
            </nav>
          </div>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="animate-in fade-in duration-500">
              {/* Trip Type Selector */}
              <div className="flex justify-center md:justify-start gap-4 mb-6">
                {['oneway', 'roundtrip'].map((type) => (
                  <label key={type} className={`cursor-pointer px-5 py-2.5 rounded-full text-sm font-bold transition-all ${formState.tripType === type ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                    <input type="radio" name="tripType" value={type} checked={formState.tripType === type} onChange={(e) => handleChange('tripType', e.target.value)} className="hidden" />
                    {type === 'oneway' ? 'Một chiều' : 'Khứ hồi'}
                  </label>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                <div className="md:col-span-2 lg:col-span-5 grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 items-end">
                  <div className="w-full relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Điểm đi</label>
                    <Select options={airportOptions} styles={customSelectStyles} value={airportOptions.find((opt) => opt.value === formState.from)} onChange={opt => handleChange('from', opt?.value)} placeholder="Chọn điểm đi" />
                    {errors.from && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.from}</p>}
                  </div>
                  
                  <div className="flex justify-center pb-5">
                    <button type="button" onClick={() => dispatch({ type: 'SWAP' })} className="p-2.5 bg-slate-50 hover:bg-blue-50 text-blue-600 rounded-full border border-slate-200 transition-all shadow-sm active:scale-90">
                      <span className="text-xl">⇄</span>
                    </button>
                  </div>
    
                  <div className="w-full relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Điểm đến</label>
                    <Select options={airportOptions} styles={customSelectStyles} value={airportOptions.find((opt) => opt.value === formState.to)} onChange={opt => handleChange('to', opt?.value)} placeholder="Chọn điểm đến" />
                    {errors.to && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.to}</p>}
                  </div>
                </div>
                <div className={`md:col-span-1 lg:col-span-4 grid gap-3 ${formState.tripType === 'roundtrip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Ngày đi</label>
                    <input type="date" className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" value={formState.departureDate} onChange={(e) => handleChange('departureDate', e.target.value)} />
                    {errors.departureDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.departureDate}</p>}
                  </div>
                  {formState.tripType === 'roundtrip' && (
                    <div className="relative pb-5">
                      <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Ngày về</label>
                      <input type="date" className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" value={formState.returnDate} onChange={(e) => handleChange('returnDate', e.target.value)} />
                      {errors.returnDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.returnDate}</p>}
                    </div>
                  )}
                </div>
                <div className="md:col-span-1 lg:col-span-3 grid grid-cols-2 gap-3">
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Hành khách</label>
                    <select className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-700 shadow-sm outline-none appearance-none cursor-pointer" value={formState.passengers} onChange={(e) => handleChange('passengers', e.target.value)}>
                      {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Khách</option>)}
                    </select>
                    {errors.passengers && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.passengers}</p>}
                  </div>
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Hạng vé</label>
                    <select className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-700 shadow-sm outline-none appearance-none cursor-pointer" value={formState.class} onChange={(e) => handleChange('class', e.target.value)}>
                      <option value="economy">Phổ thông</option>
                      <option value="business">Thương gia</option>
                    </select>
                    {errors.class && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.class}</p>}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 mt-6 md:mt-6">
                {/* <SearchButton label="Google Sheet" color="emerald" onClick={(e) => handleSearch(e, false, false)} loading={loading} /> */}
                <SearchButton label="Amadeus" color="indigo" onClick={(e) => handleSearch(e, true, false)} loading={loading} />
                {/* <SearchButton label="Singapore Air" color="blue" onClick={(e) => handleSearch(e, false, true)} loading={loading} /> */}
              </div>
            </div>
          </form>
        </div>
        {cheapFlights.length > 0 && (
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
        {hasSearched && flights.length > 0 && (
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
        )}
        {hasSearched && flights.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto shadow-md mb-4 flex items-center justify-center">
              <FaPlane className="text-4xl text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Không tìm thấy chuyến bay</h3>
            <p className="text-slate-500 mt-2">Vui lòng thử thay đổi ngày hoặc địa điểm khác.</p>
          </div>
        )}
        <div className="mt-16 max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
                <FaMapMarkerAlt className="text-blue-500 animate-bounce" />
                Điểm đến phổ biến
              </h3>
              <p className="text-slate-500 mt-2 text-sm md:text-base">Gợi ý những hành trình tuyệt vời nhất dành cho bạn</p>
            </div>
          </div>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true, dynamicBullets: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 4 },
            }}
            className="pb-14 destination-swiper"
          >
            {popularDestinations.map((dest, idx) => (
              <SwiperSlide key={idx}>
                <div 
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col"
                  onClick={() => {
                    // Logic: Khi click vào card, tự điền điểm đến vào form search
                    dispatch({ type: 'UPDATE_FIELD', field: 'to', value: dest.name }); 
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img 
                      src={dest.image} 
                      alt={dest.name} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                    <div className="absolute bottom-4 left-5">
                      <h4 className="text-xl font-black text-white tracking-tight drop-shadow-lg">
                        {dest.name}
                      </h4>
                      <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                        <FaMapMarkerAlt className="text-blue-400" /> {dest.location}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
                      <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">{dest.priceLabel}</p>
                      <p className="text-blue-600 font-black text-sm">{formatCurrency(dest.price)}</p>
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-5">
                      {dest.description}
                    </p>
                    
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Khám phá ngay</span>
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                        <FaArrowRight className="-rotate-45 group-hover:rotate-0 transition-transform" />
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-12">
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
        </div>

        <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FaQuoteLeft className="text-purple-500"/> Đánh giá từ khách hàng</h3>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20}
            slidesPerView={1}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000 }}
            breakpoints={{
              640: { slidesPerView: 2 },
              1024: { slidesPerView: 3 },
            }}
            className="pb-10"
          >
            {testimonials.map((testimonial, idx) => (
              <SwiperSlide key={idx}>
                <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 h-full">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`text-yellow-400 ${i < Math.floor(testimonial.rating) ? 'fill-current' : 'opacity-30'}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mb-4">"{testimonial.content}"</p>
                  <span className="text-sm font-bold text-slate-800">- {testimonial.name}</span>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        <div className="mt-16 max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <FaBlog className="text-red-500 animate-pulse"/> Bài viết mới nhất
            </h3>
            <button className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors">
              Xem tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogPosts.map((post, idx) => (
              <article 
                key={idx} 
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer"
                onClick={() => {
                  navigate('/blog/' + post.id)
                }}
              >
                {/* Hình ảnh bài viết */}
                <div className="relative h-52 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-tighter shadow-sm">
                    {post.category || 'Tin tức'}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  {/* Ngày đăng */}
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                    <span>{post.date || '22/12/2025'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>5 phút đọc</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-700">Đọc thêm</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {isLogged && purchases.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FaReceipt className="text-blue-500"/> Lịch sử đặt vé</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((p, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.from}</div>
                      <FaArrowLeft className="rotate-180 text-slate-300" />
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.to}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'Đã hủy' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.status || 'Hoàn tất'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Ngày mua:</span>
                      <span className="font-medium">{new Date(p.date).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tổng tiền:</span>
                      <span className="font-bold text-slate-800">{formatCurrency(p.totalPrice || p.price)}</span>
                    </div>
                    {p.bankName && <div className="text-xs text-slate-400 mt-2 pt-2 border-t">TT qua {p.bankName}: {p.bankNote}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      {bankGuide && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
            <button onClick={() => navigate(location.pathname, { replace: true, state: {} })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><FaTimes className="text-xl" /></button>
            <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
              <FaUniversity /> Chuyển khoản ngay
            </h3>
            <p className="text-sm text-slate-600 mb-4">Quét mã QR hoặc chuyển khoản thủ công trong <strong>{bankGuide.expireMinutes} phút</strong>.</p>
            
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6">
              {bankGuide.vietQR ? (
                <div className="flex justify-center mb-4">
                  <img src={bankGuide.vietQR} alt="VietQR" className="w-48 h-48 rounded-xl shadow-md border-4 border-white" />
                </div>
              ) : null}
              <div className="flex justify-between text-sm"><span className="text-slate-500">Ngân hàng:</span> <span className="font-bold">{bankGuide.bank}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Số TK:</span> <span className="font-bold font-mono text-lg">{bankGuide.accountNumber}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Chủ TK:</span> <span className="font-bold">{bankGuide.accountName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Nội dung:</span> <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{bankGuide.content}</span></div>
              <div className="flex justify-between text-sm items-center pt-2 border-t"><span className="text-slate-500">Số tiền:</span> <span className="font-black text-xl text-red-500">{formatCurrency(bankGuide.amount)}</span></div>
            </div>
            
            <button onClick={() => navigate(location.pathname, { replace: true, state: {} })} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
              Đã Chuyển Khoản Xong
            </button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
const SearchButton = ({ label, color, onClick, loading }) => {
  const colors = {
    emerald: 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200',
    indigo: 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200',
    blue: 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
  };
  return (
    <button type="button" onClick={onClick} disabled={loading}
      className={`h-[50px] ${colors[color]} text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2`}
    >
      {loading ? <FaSpinner className="animate-spin" /> : label}
    </button>
  );
};

export default Flights;