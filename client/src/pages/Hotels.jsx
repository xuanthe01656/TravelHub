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
import reducer from '../utils/reducer';
import { airports, airportOptions } from '../utils/airports';
import formatCurrency from '../utils/formatCurrency';
import handleChange from '../utils/handleChange';
import useTokenHandler from '../hooks/useTokenHandler';
import usePurchases from '../hooks/usePurchases';
import BankGuideModal from '../components/Common/BankGuideModal';
import PurchaseHistory from '../components/Common/PurchaseHistory';
import TestimonialsSwiper from '../components/Common/TestimonialsSwiper';
import BlogPostsGrid from '../components/Common/BlogPostsGrid';
import PopularDestinationsSwiper from '../components/Common/PopularDestinationsSwiper';
import SearchButton from '../components/Common/SearchButton';
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


function Hotels() {
  const [hotelState, hotelDispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [hotels, setHotels] = useState([]);
  const isLogged = localStorage.getItem('token');
  const handleTokenError = useTokenHandler();
  const { purchases, fetchPurchases } = usePurchases(isLogged, handleTokenError);
  const [cheapHotels, setCheapHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [sortBy, setSortBy] = useState('price'); 
  const [bannerVisible, setBannerVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const bankGuide = location.state?.bankGuide;
  
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
  const handleCarSearch = async (e) => {
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
            title: "Khuyến Mãi Khách Sạn",
            desc: "Giảm tới 50% cho đặt phòng cao cấp.",
            btn: "Khám Phá",
            url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"
          }, {
            title: "Resort Nghỉ Dưỡng",
            desc: "Ưu đãi đặc biệt cho kỳ nghỉ cuối tuần.",
            btn: "Đặt Ngay",
            url: "https://images.unsplash.com/photo-1520250491191-9276974f52f9?auto=format&fit=crop&w=800&q=80"
          }, {
            title: "Khách Sạn Trung Tâm",
            desc: "Vị trí tiện lợi, dịch vụ 5 sao.",
            btn: "Xem Ngay",
            url: "https://images.unsplash.com/photo-1549637641-d69588745819?auto=format&fit=crop&w=800&q=80"
          }].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div className={`relative bg-black/40 text-white w-full h-full flex flex-col items-center justify-center text-center p-4`} style={{ backgroundImage: `url(${banner.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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
                    onChange={opt => handleChange(hotelDispatch,'location', opt?.value,errors, setErrors)} 
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
                      onChange={(e) => handleChange(hotelDispatch,'checkInDate', e.target.value,errors, setErrors)} 
                    />
                    {errors.checkInDate && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.checkInDate}</p>}
                  </div>
                  <div className="relative pb-5">
                    <label className="block text-[11px] font-black text-slate-400 uppercase mb-1.5 ml-1 tracking-wider">Trả phòng</label>
                    <input 
                      type="date" 
                      className="w-full h-[48px] px-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-sm text-slate-700 shadow-sm" 
                      value={hotelState.checkOutDate} 
                      onChange={(e) => handleChange(hotelDispatch,'checkOutDate', e.target.value,errors, setErrors)} 
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
                      onChange={(e) => handleChange(hotelDispatch,'rooms', e.target.value,errors, setErrors)}
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
                      onChange={(e) => handleChange(hotelDispatch,'guests', e.target.value,errors, setErrors)}
                    >
                      {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1} Khách</option>)}
                    </select>
                    {errors.guests && <p className="text-red-500 text-[10px] mt-1 font-bold absolute left-0 bottom-0 leading-tight">{errors.guests}</p>}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 mt-6 md:mt-8">
                <SearchButton label="Tìm khách sạn" color="emerald" onClick={handleCarSearch} loading={loading} />
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
      <PopularDestinationsSwiper popularDestinations={popularDestinations} title="Địa điểm thuê khách sạn phổ biến" subtitle="Gợi ý những điểm thuê khách sạn tốt nhất dành cho bạn" onCardClick={(dest) => { /* logic tự điền form */ }} />
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
      <TestimonialsSwiper testimonials={testimonials} />
      {/* Blog Posts */}
      <BlogPostsGrid blogPosts={blogPosts} />
      {/* Purchase History */}
      <PurchaseHistory isLogged={isLogged} purchases={purchases} title="Lịch sử đặt khách sạn" />
    </main>
    {/* Bank Guide Modal */}
    <BankGuideModal bankGuide={bankGuide} />

    <Footer />
  </div>
);
}
export default Hotels;