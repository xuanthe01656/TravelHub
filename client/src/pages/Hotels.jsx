import { useMemo, useReducer, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import Select from 'react-select'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import HotelCard from '../components/HotelCard';
import {
  FaPlane, FaReceipt, FaCalendarAlt, FaGlobe, FaTimes, FaSpinner,
  FaWallet, FaUniversity, FaArrowLeft, FaTicketAlt, FaHotel,
  FaStar, FaQuoteLeft, FaBlog, FaMapMarkerAlt, FaShip, FaTrain, 
  FaUmbrellaBeach, FaBusAlt, FaArrowRight, FaCar
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialState = {
  location: '',
  checkInDate: '',
  checkOutDate: '',
  rooms: 1,
  guests: 2,
};

function reducer(state, action) {
  switch (action.type) {
      case 'CHANGE':
          return { ...state, [action.field]: action.value };
      case 'RESET':
          return initialState;
      default:
          return state;
  }
}

const validationSchema = Yup.object({
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

// Demo data - Tối ưu cho khách sạn
const popularDestinations = [
  {
    name: 'Phú Quốc',
    image: 'https://image.vietnam.travel/sites/default/files/styles/top_banner/public/2019-08/what%20to%20do%20in%20phu%20quoc.jpg?itok=l8yXbDaN',
    priceLabel: 'Khách sạn từ',
    price: 1500000,
    description: 'Resort 5 sao view biển, bao gồm bữa sáng và hồ bơi vô cực tuyệt đẹp.',
    location: 'Việt Nam'
  },
  {
    name: 'Đà Lạt',
    image: 'https://sungetawaystravel.com/wp-content/uploads/2025/04/Vietnam-Coffee-Plantations-1-1024x683.jpg',
    priceLabel: 'Khách sạn từ',
    price: 800000,
    description: 'Khách sạn phong cách Pháp, gần chợ đêm và hồ Xuân Hương thơ mộng.',
    location: 'Việt Nam'
  },
  {
    name: 'Hạ Long',
    image: 'https://i.natgeofe.com/n/88df07fb-7277-4997-9215-9002b8afa918/00000165-aa56-d88f-adff-baff1bc90000.jpg?wp=1&w=1884.75&h=1060.5',
    priceLabel: 'Khách sạn từ',
    price: 1200000,
    description: 'Khách sạn 4 sao view vịnh, dịch vụ tham quan vịnh Hạ Long kèm theo.',
    location: 'Việt Nam'
  },
  {
    name: 'Hội An',
    image: 'https://static.vinwonders.com/production/Taking-a-Hoi-An-lantern-boat-ride.jpg',
    priceLabel: 'Khách sạn từ',
    price: 900000,
    description: 'Homestay phố cổ, trải nghiệm làm đèn lồng và ăn cao lầu đặc sản.',
    location: 'Việt Nam'
  },
  {
    name: 'Sapa',
    image: 'http://www.sapa-tour.net/wp-content/uploads/2014/08/Sapa-Rice-Terrace.jpg',
    priceLabel: 'Khách sạn từ',
    price: 700000,
    description: 'Khách sạn view ruộng bậc thang, phòng ấm áp với lò sưởi mùa đông.',
    location: 'Việt Nam'
  },
  {
    name: 'Bangkok',
    image: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80',
    priceLabel: 'Khách sạn từ',
    price: 1800000,
    description: 'Khách sạn 5 sao trung tâm, gần BTS và trung tâm thương mại Siam.',
    location: 'Thái Lan'
  },
  {
    name: 'Nha Trang',
    image: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/08/58/26/62/photo0jpg.jpg?w=900&h=500&s=1',
    priceLabel: 'Khách sạn từ',
    price: 1100000,
    description: 'Resort bãi biển Trần Phú, spa thư giãn và nhà hàng hải sản tươi ngon.',
    location: 'Việt Nam'
  },
  {
    name: 'Singapore',
    image: 'https://images.unsplash.com/photo-1525596662741-e94ff9f26de1?auto=format&fit=crop&w=800&q=80',
    priceLabel: 'Khách sạn từ',
    price: 3500000,
    description: 'Marina Bay Sands - Khách sạn biểu tượng với hồ bơi trên tầng cao nhất.',
    location: 'Singapore'
  },
];

const testimonials = [
  { name: 'Nguyễn Văn A', content: 'Khách sạn sạch đẹp, nhân viên thân thiện, view phòng tuyệt vời!', rating: 5 },
  { name: 'Trần Thị B', content: 'Đặt phòng dễ dàng, giá cả hợp lý, sẽ quay lại lần sau.', rating: 4.5 },
  { name: 'Lê Văn C', content: 'Vị trí trung tâm, tiện đi lại, bữa sáng ngon.', rating: 5 },
  { name: 'Phạm Thị D', content: 'Hồ bơi đẹp, spa thư giãn, dịch vụ 5 sao.', rating: 4.8 },
];

const blogPosts = [
  { 
    title: 'Top 10 khách sạn view biển đẹp nhất Việt Nam', 
    excerpt: 'Khám phá những resort nghỉ dưỡng sang trọng bên bờ biển xanh trong...', 
    image: 'https://via.placeholder.com/300x200?text=Beach+Resort' 
  },
  { 
    title: 'Bí quyết đặt phòng khách sạn giá rẻ', 
    excerpt: 'Hướng dẫn chi tiết cách săn deal khách sạn tiết kiệm nhất...', 
    image: 'https://via.placeholder.com/300x200?text=Hotel+Deal' 
  },
  { 
    title: 'Checklist chuẩn bị khi đi nghỉ khách sạn', 
    excerpt: 'Những vật dụng cần thiết và lưu ý quan trọng cho chuyến đi...', 
    image: 'https://via.placeholder.com/300x200?text=Travel+Tips' 
  },
];

const otherServices = [
  { icon: <FaPlane />, name: 'Vé Máy Bay', path: '/flights' },
  { icon: <FaCar />, name: 'Thuê Xe', path: '/cars' },
  { icon: <FaBusAlt />, name: 'Vé Xe Bus', path: '/bus' },
  { icon: <FaTrain />, name: 'Vé Tàu', path: '/train' },
];

const safeRender = (data) => {
  if (typeof data === 'object' && data !== null) {
    return data.name || data.code || 'N/A';
  }
  return data || 'N/A';
};

const formatCurrency = (n) => {
  return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VND';
};

function Hotels() {
  const [hotelState, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [hotels, setHotels] = useState([]);
  const [cheapHotels, setCheapHotels] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
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
  
  useDocumentTitle('Đặt khách sạn');
  
  useEffect(() => {
    fetchCheapHotels();
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

  const fetchCheapHotels = async () => {
    try {
      const response = await axios.get('/api/hotels/cheap');
      let cheap = response.data || [];
      cheap.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      setCheapHotels(cheap);
    } catch (err) { console.error("Lỗi lấy khách sạn rẻ", err); }
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

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      await validationSchema.validate(hotelState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/hotels', { params: hotelState });
      let results = response.data || [];
      results.sort((a, b) => sortBy === 'price' 
        ? (a.price ?? 0) - (b.price ?? 0)
        : 0
      );
      setHotels(results);
      toast.success(`Tìm thấy ${results.length} khách sạn!`);
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

  const handleSelectHotel = (hotel) => {
    if (!isLogged) {
      toast.warn('Vui lòng đăng nhập để đặt khách sạn.');
      navigate('/login');
      return;
    }
    navigate('/confirmation', { state: { hotelData: { ...hotel, passengers: hotelState.guests || hotel.guests || 1 } } });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserProfile(null);
    toast.info('Đã đăng xuất!');
    navigate('/login');
  };

  const welcomeMessage = isLogged && userProfile ? `Chào, ${userProfile.name}!` : 'Chào bạn!';
  
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
      
      {/* Banner Slider */}
      <div className="w-full">
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
            desc: "Giảm tới 50% cho khách sạn nội địa.",
            btn: "Khám Phá"
          }, {
            color: "from-emerald-500 to-teal-500",
            title: "Khách Sạn Quốc Tế Giá Sốc",
            desc: "Chỉ từ 1.000.000 VND cho các khách sạn ASEAN.",
            btn: "Đặt Ngay"
          }, {
            color: "from-orange-500 to-rose-500",
            title: "Nghỉ Dưỡng Cuối Tuần",
            desc: "Ưu đãi phòng cho cặp đôi.",
            btn: "Xem Ngay"
          }].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div className={`bg-gradient-to-r ${banner.color} text-white w-full h-full flex flex-col items-center justify-center text-center p-4`}>
                <h2 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 drop-shadow-md animate-fadeInUp">{banner.title}</h2>
                <p className="text-sm md:text-xl mb-4 md:mb-8 max-w-2xl opacity-90">{banner.desc}</p>
                <button className="bg-white text-slate-900 px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg hover:scale-105 transition transform flex items-center gap-2 text-sm md:text-base">
                  <FaHotel /> {banner.btn}
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 -mt-10 md:-mt-16 relative z-10">
        {/* Search Form */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex flex-wrap justify-center space-x-4">
              <button className="py-2 px-4 text-sm font-medium flex items-center gap-2 transition-all text-blue-600 border-b-2 border-blue-600">
                <FaHotel /> Khách sạn
              </button>
            </nav>
          </div>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                <div className="md:col-span-2 lg:col-span-5 relative pb-5">
                  <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Vị trí</label>
                  <Select 
                    options={airportOptions} 
                    styles={customSelectStyles} 
                    value={airportOptions.find((opt) => opt.value === hotelState.location)} 
                    onChange={opt => handleChange('location', opt?.value)} 
                    placeholder="Bạn muốn nghỉ ở đâu?" 
                  />
                  {errors.location && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.location}</p>}
                </div>
                
                <div className="md:col-span-1 lg:col-span-4 grid grid-cols-2 gap-3">
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Nhận phòng</label>
                    <input 
                      type="date" 
                      className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" 
                      value={hotelState.checkInDate} 
                      onChange={(e) => handleChange('checkInDate', e.target.value)} 
                    />
                    {errors.checkInDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.checkInDate}</p>}
                  </div>
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Trả phòng</label>
                    <input 
                      type="date" 
                      className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" 
                      value={hotelState.checkOutDate} 
                      onChange={(e) => handleChange('checkOutDate', e.target.value)} 
                    />
                    {errors.checkOutDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.checkOutDate}</p>}
                  </div>
                </div>
                
                <div className="md:col-span-1 lg:col-span-3 grid grid-cols-2 gap-3">
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Phòng</label>
                    <select 
                      className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-700 shadow-sm outline-none appearance-none cursor-pointer" 
                      value={hotelState.rooms} 
                      onChange={(e) => handleChange('rooms', e.target.value)}
                    >
                      {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Phòng</option>)}
                    </select>
                    {errors.rooms && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.rooms}</p>}
                  </div>
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Khách</label>
                    <select 
                      className="w-full h-[48px] px-3 border border-slate-200 rounded-xl bg-white font-bold text-sm text-slate-700 shadow-sm outline-none appearance-none cursor-pointer" 
                      value={hotelState.guests} 
                      onChange={(e) => handleChange('guests', e.target.value)}
                    >
                      {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Khách</option>)}
                    </select>
                    {errors.guests && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.guests}</p>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 mt-6 md:mt-8">
                <SearchButton 
                  label="Tìm Kiếm Khách Sạn" 
                  color="indigo" 
                  onClick={handleSearch} 
                  loading={loading} 
                />
              </div>
            </div>
          </form>
        </div>

        {/* Cheap Hotels */}
        {cheapHotels.length > 0 && (
          <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FaTicketAlt className="text-orange-500"/> Khách sạn rẻ đề xuất
          </h3>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            spaceBetween={20} slidesPerView={1}
            navigation pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
            className="pb-10"
          >
            {cheapHotels.map((h, idx) => (
              <SwiperSlide key={idx} className="pb-8">
                <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-700">{h.location}</span>
                      <span className="text-[10px] text-slate-400">Vị trí</span>
                    </div>
                    <FaHotel className="text-blue-400 text-lg" />
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-slate-700">{h.name}</span>
                      <span className="text-[10px] text-slate-400">Khách sạn</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2"><FaCalendarAlt className="text-blue-500" /> {new Date(h.checkInDate).toLocaleDateString('vi-VN')} - {new Date(h.checkOutDate).toLocaleDateString('vi-VN')}</div>
                    <div className="flex items-center gap-2 font-bold text-red-500 text-lg"><FaWallet /> {formatCurrency(h.price)}</div>
                  </div>
                  <button onClick={() => handleSelectHotel(h)} className="w-full py-2 rounded-xl bg-blue-100 text-blue-700 font-bold hover:bg-blue-600 hover:text-white transition">
                    Chọn Ngay
                  </button>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && hotels.length > 0 && (
        <div className="mt-12 animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tighter">Ưu đãi phòng tốt nhất</h3>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-1">
                {hotels.length} khách sạn khả dụng tại {hotelState.location || "điểm bạn chọn"}
              </p>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
              <span className="text-[10px] font-black text-slate-400 ml-2 uppercase">Sắp xếp:</span>
              <select 
                value={sortBy} 
                onChange={(e) => setSortBy(e.target.value)} 
                className="bg-slate-50 px-4 py-2 rounded-xl font-bold text-blue-600 text-xs outline-none border-none cursor-pointer"
              >
                <option value="price">Giá từ thấp đến cao</option>
                <option value="name">Tên khách sạn (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Render bằng HotelCard theo lưới 2 cột */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {hotels.map((h, index) => (
              <HotelCard 
                key={h.id || index} 
                hotel={h} 
                onSelect={handleSelectHotel}
                // Truyền dữ liệu ngày từ reducer state vào card
                checkIn={hotelState.checkInDate} 
                checkOut={hotelState.checkOutDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {hasSearched && hotels.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto shadow-md mb-4 flex items-center justify-center">
            <FaHotel className="text-4xl text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700">Không tìm thấy khách sạn</h3>
          <p className="text-slate-500 mt-2">Vui lòng thử thay đổi ngày hoặc địa điểm khác.</p>
        </div>
      )}

      {/* Popular Destinations */}
      <div className="mt-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
              <FaMapMarkerAlt className="text-blue-500 animate-bounce" /> Khách sạn phổ biến
            </h3>
          </div>
        </div>    
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={20}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 3000 }}
          breakpoints={{
            640: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
          className="pb-10"
        >
          {popularDestinations.map((dest, idx) => (
              <SwiperSlide key={idx}>
                <div 
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col"
                  onClick={() => {
                    // Logic: Khi click vào card, tự điền điểm đến vào form search
                    // setFormData(prev => ({ ...prev, destination: dest.name }));
                    // window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Other Services */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FaGlobe className="text-green-500"/> Dịch vụ khác
        </h3>
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

      {/* Testimonials */}
      <div className="mt-12">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FaQuoteLeft className="text-purple-500"/> Đánh giá từ khách hàng
        </h3>
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

      {/* Blog Posts */}
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

      {/* Purchase History */}
      {isLogged && purchases.length > 0 && (
        <div className="mt-16">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FaReceipt className="text-blue-500"/> Lịch sử đặt phòng
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {purchases.map((p, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.location || p.from}</div>
                    <FaArrowLeft className="rotate-180 text-slate-300" />
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.name || p.to}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'Đã hủy' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {p.status || 'Hoàn tất'}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  <div className="flex justify-between">
                    <span>Ngày đặt:</span>
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

    {/* Bank Guide Modal */}
    {bankGuide && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
          <button onClick={() => navigate(location.pathname, { replace: true, state: {} })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
            <FaTimes className="text-xl" />
          </button>
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

const HotelRowLeg = ({ label, data, icon }) => {
if (!data) return null;
const hotelName = safeRender(data.name);
return (
  <div className="flex items-start gap-4">
    <div className="bg-slate-100 p-3 rounded-full mt-1">{icon}</div>
    <div className="flex-1">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-4 mb-1">
        <div>
          <div className="text-lg font-black text-slate-800">{new Date(data.checkInDate).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
          <div className="text-xs font-bold text-slate-500">Check-in</div>
        </div>
        <div className="flex-1 border-t-2 border-dotted border-slate-300 relative top-[-4px]"></div>
        <div className="text-right">
          <div className="text-lg font-black text-slate-800">{new Date(data.checkOutDate).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
          <div className="text-xs font-bold text-slate-500">Check-out</div>
        </div>
      </div>
      <div className="text-sm text-slate-600 flex items-center gap-2">
        <span className="font-bold text-blue-700">{hotelName}</span>
        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
        <span className="text-slate-500">{data.location}</span>
      </div>
    </div>
  </div>
);
};

export default Hotels;