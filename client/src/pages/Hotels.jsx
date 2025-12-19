// Hotels.jsx
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
  FaWallet, FaUniversity, FaArrowLeft, FaClock, FaTicketAlt, FaHotel
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
  const [formState, dispatch] = useReducer(reducer, initialState);
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
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      await validationSchema.validate(formState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/hotels', { params: formState });
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
    navigate('/confirmation', { state: { hotelData: { ...hotel, passengers: formState.guests || hotel.guests || 1 } } });
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
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Vị trí</label>
                <Select
                  options={airportOptions} styles={customSelectStyles}
                  value={airportOptions.find((opt) => opt.value === formState.location) || null}
                  onChange={opt => handleChange('location', opt?.value || null)}
                  placeholder="Chọn vị trí"
                />
                {errors.location && <p className="text-red-500 text-xs mt-1 font-medium">{errors.location}</p>}
              </div>
              <div className="lg:col-span-4 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Check-in</label>
                  <input type="date" className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formState.checkInDate} onChange={(e) => handleChange('checkInDate', e.target.value)}
                  />
                  {errors.checkInDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.checkInDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Check-out</label>
                  <input type="date" className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formState.checkOutDate} onChange={(e) => handleChange('checkOutDate', e.target.value)}
                  />
                  {errors.checkOutDate && <p className="text-red-500 text-xs mt-1 font-medium">{errors.checkOutDate}</p>}
                </div>
              </div>
              <div className="lg:col-span-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Số phòng</label>
                  <select className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formState.rooms} onChange={(e) => handleChange('rooms', e.target.value)}>
                    {[...Array(10)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                  {errors.rooms && <p className="text-red-500 text-xs mt-1 font-medium">{errors.rooms}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Số khách</label>
                  <select className="w-full h-[48px] px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={formState.guests} onChange={(e) => handleChange('guests', e.target.value)}>
                    {[...Array(20)].map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                  </select>
                  {errors.guests && <p className="text-red-500 text-xs mt-1 font-medium">{errors.guests}</p>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 mt-8">
              <SearchButton label="Tìm Khách sạn" color="indigo" onClick={(e) => handleSearch(e)} loading={loading} />
            </div>
          </form>
        </div>
        {cheapHotels.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FaTicketAlt className="text-orange-500"/> Khách sạn rẻ đề xuất</h3>
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
        {hasSearched && hotels.length > 0 && (
          <div className="mt-12 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="text-2xl font-bold text-slate-800">Kết quả tìm kiếm ({hotels.length})</h3>
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border">
                <span className="text-sm font-medium text-slate-500">Sắp xếp:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-transparent font-bold text-blue-600 outline-none cursor-pointer text-sm">
                  <option value="price">Giá tốt nhất</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {hotels.map((h, index) => {
                const displayPrice = h.price;
                return (
                  <div key={h.id || index} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 overflow-hidden group">
                    <div className="flex flex-col md:flex-row">
                      <div className="flex-1 p-5 space-y-6">
                        <HotelRowLeg 
                          label="Khách sạn" 
                          data={h} 
                          icon={<FaHotel className="text-blue-500" />} 
                        />
                      </div>
                      <div className="bg-slate-50 p-5 md:w-64 flex flex-row md:flex-col justify-between items-center border-t md:border-t-0 md:border-l border-slate-100">
                        <div className="text-left md:text-center">
                          <span className="block text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">Tổng giá</span>
                          <span className="block text-xl md:text-2xl font-black text-orange-600">{formatCurrency(displayPrice)}</span>
                          <span className="text-[10px] text-slate-400">Đã bao gồm thuế & phí</span>
                        </div>
                        <button 
                          onClick={() => handleSelectHotel(h)} 
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
        {hasSearched && hotels.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="bg-white rounded-full p-6 w-24 h-24 mx-auto shadow-md mb-4 flex items-center justify-center">
              <FaHotel className="text-4xl text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Không tìm thấy khách sạn</h3>
            <p className="text-slate-500 mt-2">Vui lòng thử thay đổi ngày hoặc địa điểm khác.</p>
          </div>
        )}
        {isLogged && purchases.length > 0 && (
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><FaReceipt className="text-blue-500"/> Lịch sử đặt</h3>
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