// Cars.jsx
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
import {
  FaPlane, FaShoppingCart, FaLock, FaReceipt,
  FaInfoCircle, FaHome, FaPhoneAlt, FaUserCircle, FaCalendarAlt, FaUsers,
  FaChair, FaCar, FaGlobe, FaBars, FaTimes, FaCreditCard, FaSpinner,
  FaWallet, FaUniversity, FaArrowLeft, FaClock, FaTicketAlt, FaCarSide,
  FaStar, FaQuoteLeft, FaBlog, FaMapMarkerAlt, FaShip, FaTrain, FaUmbrellaBeach, FaBusAlt,FaArrowRight
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialState = {
  pickup: '',
  dropoff: '',
  pickupDate: '',
  dropoffDate: '',
  driverAge: 25,
};

function reducer(state, action) {
  switch (action.type) {
      case 'CHANGE':
          return { ...state, [action.field]: action.value };
      case 'RESET':
          return initialState;
      case 'SWAP':
          return { ...state, pickup: state.dropoff, dropoff: state.pickup };
      default:
          return state;
  }
}

const validationSchema = Yup.object({
  pickup: Yup.string()
    .required('Vui lòng chọn điểm nhận xe'),
  dropoff: Yup.string()
    .required('Vui lòng chọn điểm trả xe'),
  pickupDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .required('Chọn ngày nhận xe')
    .typeError('Ngày nhận không hợp lệ')
    .test('min-pickup-date', 'Ngày nhận xe không hợp lệ', function(value) {
      if (!value) return true;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return value >= today;
    }),
  dropoffDate: Yup.date()
    .transform((value, originalValue) => (originalValue === '' ? null : value))
    .nullable()
    .required('Chọn ngày trả xe')
    .typeError('Ngày trả không hợp lệ')
    .test('is-after-pickup', 'Ngày trả xe không hợp lệ', function(value) {
      const { pickupDate } = this.parent;
      if (!value || !pickupDate) return true;
      
      const pDate = new Date(pickupDate);
      const dDate = new Date(value);
      return dDate.getTime() > pDate.getTime();
    }),
  driverAge: Yup.number()
    .transform((value, originalValue) => (originalValue === '' ? undefined : value))
    .typeError('Tuổi phải là một chữ số')
    .required('Vui lòng nhập tuổi tài xế')
    .min(18, 'Tài xế phải từ 18 tuổi trở lên')
    .max(80, 'Tuổi tài xế không phù hợp'),
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

// Demo data cho các section mới
const popularDestinations = [
  {
    name: 'Phú Quốc',
    image: 'https://image.vietnam.travel/sites/default/files/styles/top_banner/public/2019-08/what%20to%20do%20in%20phu%20quoc.jpg?itok=l8yXbDaN',
    priceLabel: 'Thuê xe từ',
    price: 850000,
    description: 'Khám phá đảo ngọc với xe tự lái, thoải mái di chuyển đến các bãi biển đẹp.',
    location: 'Việt Nam'
  },
  {
    name: 'Đà Lạt',
    image: 'https://sungetawaystravel.com/wp-content/uploads/2025/04/Vietnam-Coffee-Plantations-1-1024x683.jpg',
    priceLabel: 'Thuê xe từ',
    price: 650000,
    description: 'Lái xe qua những con đường hoa, check-in tại các vườn cà phê thơ mộng.',
    location: 'Việt Nam'
  },
  {
    name: 'Hạ Long',
    image: 'https://i.natgeofe.com/n/88df07fb-7277-4997-9215-9002b8afa918/00000165-aa56-d88f-adff-baff1bc90000.jpg?wp=1&w=1884.75&h=1060.5',
    priceLabel: 'Thuê xe từ',
    price: 750000,
    description: 'Tự do khám phá di sản thiên nhiên thế giới với xe riêng của bạn.',
    location: 'Việt Nam'
  },
  {
    name: 'Hội An',
    image: 'https://static.vinwonders.com/production/Taking-a-Hoi-An-lantern-boat-ride.jpg',
    priceLabel: 'Thuê xe từ',
    price: 550000,
    description: 'Dạo quanh phố cổ và các làng nghề truyền thống với xe thuê tiện lợi.',
    location: 'Việt Nam'
  },
];

const testimonials = [
  { name: 'Nguyễn Văn A', content: 'Xe mới, sạch sẽ, giá cả hợp lý. Sẽ thuê lại lần sau!', rating: 5 },
  { name: 'Trần Thị B', content: 'Thủ tục nhanh gọn, nhân viên hỗ trợ nhiệt tình.', rating: 4.5 },
  { name: 'Lê Văn C', content: 'Thuê xe đi Đà Lạt rất tiện, xe chạy êm.', rating: 5 },
  { name: 'Phạm Thị D', content: 'Giá tốt nhất so với các nền tảng khác.', rating: 4.8 },
];

const blogPosts = [
  { title: 'Kinh nghiệm thuê xe tự lái an toàn', excerpt: 'Những lưu ý quan trọng khi thuê xe tự lái lần đầu...', image: 'https://via.placeholder.com/300x200?text=Blog+1' },
  { title: 'Top 5 tuyến đường đẹp nhất Việt Nam', excerpt: 'Khám phá những cung đường tuyệt đẹp cho chuyến road trip...', image: 'https://via.placeholder.com/300x200?text=Blog+2' },
  { title: 'So sánh các loại xe thuê phổ biến', excerpt: 'Chọn loại xe phù hợp với nhu cầu và ngân sách của bạn...', image: 'https://via.placeholder.com/300x200?text=Blog+3' },
];

const otherServices = [
  { icon: <FaPlane />, name: 'Vé Máy Bay', path: '/flights' },
  { icon: <FaHome />, name: 'Khách Sạn', path: '/hotels' },
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

function Cars() {
  const [formState, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [cars, setCars] = useState([]);
  const [cheapCars, setCheapCars] = useState([]);
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
  
  useDocumentTitle('Đặt xe');
  
  useEffect(() => {
    fetchCheapCars();
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

  const fetchCheapCars = async () => {
    try {
      const response = await axios.get('/api/cars/cheap');
      let cheap = response.data || [];
      cheap.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
      setCheapCars(cheap);
    } catch (err) { console.error("Lỗi lấy xe rẻ", err); }
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
      await validationSchema.validate(formState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/cars', { params: formState });
      let results = response.data || [];
      results.sort((a, b) => sortBy === 'price' 
        ? (a.price ?? 0) - (b.price ?? 0)
        : 0
      );
      setCars(results);
      toast.success(`Tìm thấy ${results.length} xe!`);
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

  const handleSelectCar = (car) => {
    if (!isLogged) {
      toast.warn('Vui lòng đăng nhập để thuê xe.');
      navigate('/login');
      return;
    }
    navigate('/confirmation', { state: { carData: { ...car } } });
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
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
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
            desc: "Giảm tới 50% cho thuê xe nội địa.",
            btn: "Khám Phá"
          }, {
            color: "from-emerald-500 to-teal-500",
            title: "Thuê Xe Giá Sốc",
            desc: "Chỉ từ 500.000 VND cho các chuyến đi ASEAN.",
            btn: "Đặt Ngay"
          }, {
            color: "from-orange-500 to-rose-500",
            title: "Du Lịch Cuối Tuần",
            desc: "Ưu đãi thuê xe cho cặp đôi.",
            btn: "Xem Ngay"
          }].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div className={`bg-gradient-to-r ${banner.color} text-white w-full h-full flex flex-col items-center justify-center text-center p-4`}>
                <h2 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4 drop-shadow-md animate-fadeInUp">{banner.title}</h2>
                <p className="text-sm md:text-xl mb-4 md:mb-8 max-w-2xl opacity-90">{banner.desc}</p>
                <button className="bg-white text-slate-900 px-6 py-2 md:px-8 md:py-3 rounded-full font-bold shadow-lg hover:scale-105 transition transform flex items-center gap-2 text-sm md:text-base">
                  <FaCar /> {banner.btn}
                </button>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 -mt-10 md:-mt-16 relative z-10">
        {/* Search Form */}
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 lg:p-8 border border-slate-100 max-w-7xl mx-auto">
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex flex-wrap justify-center space-x-4">
              <button className="py-2 px-4 text-sm font-medium flex items-center gap-2 transition-all text-blue-600 border-b-2 border-blue-600">
                <FaCar /> Thuê xe
              </button>
            </nav>
          </div>
          
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="animate-in fade-in duration-500">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-center">
                  <div className="w-full relative pb-5">
                    <label className="block text-[11px] md:text-xs font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">
                      Điểm nhận
                    </label>
                    <Select
                      options={airportOptions}
                      styles={customSelectStyles}
                      value={airportOptions.find((opt) => opt.value === formState.pickup) || null}
                      onChange={opt => handleChange('pickup', opt?.value || null)}
                      placeholder="Chọn điểm nhận"
                      className="text-sm"
                    />
                    {errors.pickup && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1 absolute left-0 bottom-0 leading-tight">{errors.pickup}</p>}
                  </div>
                  
                  <div className="flex justify-center md:pt-6 pb-5">
                    <button 
                      type="button" 
                      onClick={() => dispatch({ type: 'SWAP' })} 
                      className="p-2 bg-slate-50 hover:bg-blue-100 text-blue-600 rounded-full transition-all transform hover:scale-110 active:scale-95 border border-slate-200 shadow-sm"
                      title="Đổi chiều"
                    >
                      <span className="block text-lg md:text-xl font-bold rotate-90 md:rotate-0">
                        ⇄
                      </span>
                    </button>
                  </div>
                  
                  <div className="w-full relative pb-5">
                    <label className="block text-[11px] md:text-xs font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">
                      Điểm trả
                    </label>
                    <Select
                      options={airportOptions}
                      styles={customSelectStyles}
                      value={airportOptions.find((opt) => opt.value === formState.dropoff) || null}
                      onChange={opt => handleChange('dropoff', opt?.value || null)}
                      placeholder="Chọn điểm trả"
                      className="text-sm"
                    />
                    {errors.dropoff && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1 absolute left-0 bottom-0 leading-tight">{errors.dropoff}</p>}
                  </div>
                </div>
                
                <div className="lg:col-span-4 grid grid-cols-2 gap-3">
                  <div className="relative pb-5">
                    <label className="block text-[11px] md:text-xs font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Ngày nhận</label>
                    <input 
                      type="date" 
                      className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow shadow-sm"
                      value={formState.pickupDate} 
                      onChange={(e) => handleChange('pickupDate', e.target.value)}
                    />
                    {errors.pickupDate && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1 absolute left-0 bottom-0 leading-tight">{errors.pickupDate}</p>}
                  </div>
                  <div className="relative pb-5">
                    <label className="block text-[11px] md:text-xs font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Ngày trả</label>
                    <input 
                      type="date" 
                      className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow shadow-sm"
                      value={formState.dropoffDate} 
                      onChange={(e) => handleChange('dropoffDate', e.target.value)}
                    />
                    {errors.dropoffDate && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1 absolute left-0 bottom-0 leading-tight">{errors.dropoffDate}</p>}
                  </div>
                </div>
                
                <div className="lg:col-span-3 relative pb-5">
                  <label className="block text-[11px] md:text-xs font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Tuổi tài xế</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm transition-shadow shadow-sm"
                      value={formState.driverAge} 
                      onChange={(e) => handleChange('driverAge', e.target.value)}
                      min={18}
                      placeholder="VD: 25"
                    />
                    <span className="absolute right-3 top-3.5 text-xs text-slate-400 font-medium">Tuổi</span>
                  </div>
                  {errors.driverAge && <p className="text-red-500 text-[10px] mt-1 font-medium ml-1 absolute left-0 bottom-0 leading-tight">{errors.driverAge}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-1 mt-6 md:mt-8">
                <SearchButton 
                  label="Tìm Xe Ngay" 
                  color="emerald" 
                  onClick={(e) => handleSearch(e)} 
                  loading={loading} 
                  className="w-full py-3.5 md:py-4 text-lg font-bold shadow-lg shadow-emerald-100 transition-transform active:scale-[0.98]"
                />
              </div>
            </div>
          </form>
        </div>

        {/* Cheap Cars */}
        {cheapCars.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaTicketAlt className="text-orange-500"/> Xe rẻ đề xuất
            </h3>
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={20} slidesPerView={1}
              navigation pagination={{ clickable: true }}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
              className="pb-10"
            >
              {cheapCars.map((c, idx) => (
                <SwiperSlide key={idx} className="pb-8">
                  <div className="bg-white rounded-2xl p-5 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-700">{c.pickup}</span>
                        <span className="text-[10px] text-slate-400">Điểm nhận</span>
                      </div>
                      <FaCar className="text-blue-400 text-lg" />
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-700">{c.dropoff}</span>
                        <span className="text-[10px] text-slate-400">Điểm trả</span>
                      </div>
                    </div>
                    <div className="flex-1 space-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2"><FaCalendarAlt className="text-blue-500" /> {new Date(c.pickupDate).toLocaleDateString('vi-VN')} - {new Date(c.dropoffDate).toLocaleDateString('vi-VN')}</div>
                      <div className="flex items-center gap-2 font-bold text-red-500 text-lg"><FaWallet /> {formatCurrency(c.price)}</div>
                    </div>
                    <button onClick={() => handleSelectCar(c)} className="w-full py-2 rounded-xl bg-blue-100 text-blue-700 font-bold hover:bg-blue-600 hover:text-white transition">
                      Chọn Xe Ngay
                    </button>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}

        {/* Search Results */}
        {hasSearched && cars.length > 0 && (
          <div className="mt-12 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Kết quả tìm kiếm ({cars.length})</h3>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <span className="text-sm font-medium text-slate-500">Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent font-bold text-blue-600 outline-none cursor-pointer text-sm">
                  <option value="price">Giá tốt nhất</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {cars.map((c, index) => {
                const displayPrice = c.price;
                return (
                  <div key={c.id || index} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 overflow-hidden group">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-5 space-y-6">
                        <CarRowLeg 
                          label="Xe" 
                          data={c} 
                          icon={<FaCarSide className="text-blue-500" />} 
                        />
                      </div>
                      <div className="bg-slate-50 p-5 md:w-64 flex flex-row md:flex-col justify-between items-center border-t md:border-t-0 md:border-l border-slate-100">
                        <div className="text-left md:text-center">
                          <span className="block text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Tổng giá</span>
                          <span className="block text-xl md:text-2xl font-black text-orange-600">{formatCurrency(displayPrice)}</span>
                          <span className="text-[10px] text-slate-400">Đã bao gồm thuế & phí</span>
                        </div>
                        <button 
                          onClick={() => handleSelectCar(c)} 
                          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-105 transition transform flex items-center gap-2"
                        >
                          Chọn <FaArrowLeft className="rotate-180" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Results */}
        {hasSearched && cars.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto shadow-md mb-4 flex items-center justify-center">
              <FaCar className="text-4xl text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Không tìm thấy xe</h3>
            <p className="text-slate-500 mt-2">Vui lòng thử thay đổi ngày hoặc địa điểm khác.</p>
          </div>
        )}

        {/* Popular Destinations */}
        <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FaMapMarkerAlt className="text-blue-500"/> Điểm đến phổ biến
          </h3>
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
        <div className="mt-12">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FaBlog className="text-red-500"/> Bài viết mới nhất
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogPosts.map((post, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all">
                <img src={post.image} alt={post.title} className="w-full h-40 object-cover" />
                <div className="p-4">
                  <h4 className="text-lg font-bold text-slate-800 mb-2">{post.title}</h4>
                  <p className="text-sm text-slate-500 mb-4">{post.excerpt}</p>
                  <button className="text-blue-600 font-bold text-sm hover:underline">Đọc thêm →</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Purchase History */}
        {isLogged && purchases.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaReceipt className="text-blue-500"/> Lịch sử thuê
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {purchases.map((p, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.pickup || p.from}</div>
                      <FaArrowLeft className="rotate-180 text-slate-300" />
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.dropoff || p.to}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'Đã hủy' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      {p.status || 'Hoàn tất'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex justify-between">
                      <span>Ngày thuê:</span>
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

const CarRowLeg = ({ label, data, icon }) => {
  if (!data) return null;
  const carModel = safeRender(data.model);
  const carType = safeRender(data.type);
  return (
    <div className="flex items-start gap-4">
      <div className="bg-slate-100 p-3 rounded-full mt-1">{icon}</div>
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
        </div>
        <div className="flex items-center gap-4 mb-1">
          <div>
            <div className="text-lg font-black text-slate-800">{new Date(data.pickupDate).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
            <div className="text-xs font-bold text-slate-500">{data.pickup}</div>
          </div>
          <div className="flex-1 border-t-2 border-dotted border-slate-300 relative top-[-4px]"></div>
          <div className="text-right">
            <div className="text-lg font-black text-slate-800">{new Date(data.dropoffDate).toLocaleTimeString('vi-VN', {hour:'2-digit', minute:'2-digit'})}</div>
            <div className="text-xs font-bold text-slate-500">{data.dropoff}</div>
          </div>
        </div>
        <div className="text-sm text-slate-600 flex items-center gap-2">
          <span className="font-bold text-blue-700">{carModel}</span>
          <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
          <span className="text-slate-500">{carType}</span>
        </div>
      </div>
    </div>
  );
};

export default Cars;