import { useMemo, useReducer, useState, useEffect, useRef } from 'react';
import { useCallback } from 'react';
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
import CarCard from '../components/CarCard';
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
import { FaCalendarAlt, FaUsers,
  FaChair, FaCar,
  FaWallet, FaUniversity, FaArrowLeft, FaClock, FaTicketAlt, FaHotel, FaBusAlt, FaMapMarkedAlt,
  FaStar, FaQuoteLeft, FaBlog, FaMapMarkerAlt, FaShip, FaTrain, FaUmbrellaBeach, FaArrowRight, FaUserFriends, FaShuttleVan, FaKey, FaRoute
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

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

function Cars() {
  const [carState, carDispatch] = useReducer(reducer, initialCarState);
  const [errors, setErrors] = useState({});
  const [cars, setCars] = useState([]);
  const [isLogged, setIsLogged] = useState(false);
  const handleAuthError = useAuthHandler();
  const { purchases, fetchPurchases } = usePurchases(isLogged, handleAuthError);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState('price'); 
  const navigate = useNavigate();
  const location = useLocation();
  const bankGuide = location.state?.bankGuide;
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); 
  
  useDocumentTitle('Thuê Xe');
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await axios.get('/api/user/profile'); 
      setUserProfile(response.data);
    } catch (err) {
      if (err.response && err.response.status === 401) {
        console.log("Phiên đăng nhập hết hạn hoặc chưa đăng nhập.");
      } else {
        console.error("Lỗi khi lấy profile:", err);
      }
    }
  }, [handleAuthError])
  useEffect(() => {
  
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
  }, [isLogged, bankGuide, fetchPurchases, fetchUserProfile]);
  
  // const fetchPurchases = async () => {
  //   try {
  //     const token = localStorage.getItem('token');
  //     if (!token) return;
  //     const response = await axios.get('/api/purchases', {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setPurchases(response.data || []);
  //   } catch (err) { handleTokenError(err); }
  // };

  //handleChange(carDispatch, field, value, errors, setErrors);
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

  const welcomeMessage = isLogged ? `Chào bạn!` : 'Chào bạn!';
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

  // Demo data for new sections - Adjusted for Cars
  const popularDestinations = [
    {
      name: 'Hà Nội',
      image: 'https://images.unsplash.com/photo-1547448415-e9f5b28e570d?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 500000,
      description: 'Khám phá thủ đô với dịch vụ thuê xe tự lái tiện lợi.',
      location: 'Việt Nam'
    },
    {
      name: 'TP. Hồ Chí Minh',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 450000,
      description: 'Di chuyển dễ dàng trong thành phố sôi động với xe chất lượng cao.',
      location: 'Việt Nam'
    },
    {
      name: 'Đà Nẵng',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 600000,
      description: 'Thuê xe để khám phá bãi biển và cầu Rồng nổi tiếng.',
      location: 'Việt Nam'
    },
    {
      name: 'Phú Quốc',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 700000,
      description: 'Xe 4 chỗ để di chuyển quanh đảo ngọc.',
      location: 'Việt Nam'
    },
    {
      name: 'Nha Trang',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 550000,
      description: 'Thuê xe để khám phá vịnh biển đẹp nhất Việt Nam.',
      location: 'Việt Nam'
    },
    {
      name: 'Bangkok',
      image: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 1200000,
      description: 'Xe đưa đón sân bay và thuê tự lái tại Thái Lan.',
      location: 'Thái Lan'
    },
    {
      name: 'Singapore',
      image: 'https://images.unsplash.com/photo-1525596662741-e94ff9f26de1?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 1500000,
      description: 'Dịch vụ thuê xe cao cấp tại thành phố sư tử.',
      location: 'Singapore'
    },
    {
      name: 'Seoul',
      image: 'https://images.unsplash.com/photo-1525596662741-e94ff9f26de1?auto=format&fit=crop&w=800&q=80',
      priceLabel: 'Thuê xe từ',
      price: 1800000,
      description: 'Xe tự lái để khám phá thủ đô Hàn Quốc.',
      location: 'Hàn Quốc'
    },
  ];

  const testimonials = [
    { name: 'Nguyễn Văn A', content: 'Xe sạch sẽ, dịch vụ thuê xe nhanh chóng!', rating: 5 },
    { name: 'Trần Thị B', content: 'Giá cả hợp lý, xe chạy êm ru.', rating: 4.5 },
    { name: 'Lê Văn C', content: 'Hỗ trợ 24/7, rất hài lòng với dịch vụ đưa đón.', rating: 5 },
    { name: 'Phạm Thị D', content: 'Thuê xe nhiều lần, luôn chất lượng tốt.', rating: 4.8 },
  ];

  const blogPosts = [
    { 
      id:1,
      title: 'Top 10 mẫu xe thuê phổ biến 2025', 
      excerpt: 'Từ xe đô thị nhỏ gọn đến SUV địa hình, đây là những lựa chọn hàng đầu cho chuyến đi của bạn...', 
      image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=600&q=80',
      date: '20/12/2024',
      category: 'Cẩm nang'
    },
    { 
      id:2,
      title: 'Mẹo thuê xe giá rẻ và an toàn', 
      excerpt: 'Làm thế nào để chọn xe phù hợp? Những lưu ý khi thuê xe tự lái? Hãy cùng khám phá...', 
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=600&q=80',
      date: '18/12/2024',
      category: 'Kinh nghiệm'
    },
    { 
      id:3,
      title: 'Hướng dẫn đưa đón sân bay hiệu quả', 
      excerpt: 'Những tip để có chuyến đưa đón suôn sẻ, tránh trễ nãi và tiết kiệm chi phí...', 
      image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=600&q=80',
      date: '15/12/2024',
      category: 'Dịch vụ'
    },
  ];

  const renderForm = () => {
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
  };

  const renderResults = () => {
    if (!hasSearched) return null;
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
      <div className="w-full relative z-10 overflow-hidden shadow-xl rounded-2xl">
        <Swiper
          modules={[Autoplay, Pagination, Navigation]}
          spaceBetween={0}
          slidesPerView={1}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          navigation={true}
          className="w-full h-[250px] md:h-[400px]"
        >
          {[
            {
              title: "Thuê Xe Tự Lái - Tự Do Hành Trình",
              desc: "Đa dạng dòng xe từ 4-7 chỗ, thủ tục đơn giản, nhận xe nhanh chóng.",
              btn: "Thuê Xe Ngay",
              icon: <FaKey />,
              url: "https://images.pexels.com/photos/164634/pexels-photo-164634.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            },
            {
              title: "Đưa Đón Sân Bay Chuyên Nghiệp",
              desc: "Cam kết đúng giờ, tài xế lịch sự, đưa đón tận nơi 24/7.",
              btn: "Đặt Lịch Ngay",
              icon: <FaShuttleVan />,
              url: "https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            },
            {
              title: "Thuê Xe Theo Ngày - Giá Ưu Đãi",
              desc: "Tiết kiệm hơn 30% khi đặt thuê xe dài hạn hoặc thuê theo tuần.",
              btn: "Xem Báo Giá",
              icon: <FaRoute />,
              url: "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            },
            {
              title: "Dòng Xe Cao Cấp & Sang Trọng",
              desc: "Trải nghiệm các dòng xe đời mới nhất cho những chuyến công tác đặc biệt.",
              btn: "Khám Phá",
              icon: <FaCar />,
              url: "https://images.pexels.com/photos/3729464/pexels-photo-3729464.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            }
          ].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div 
                className="relative w-full h-full flex flex-col items-center justify-center text-center p-6 text-white" 
                style={{ 
                  // Overlay kết hợp màu tối phía dưới để làm nổi bật nút bấm
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${banner.url})`, 
                  backgroundSize: 'cover', 
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                <div className="max-w-4xl animate-fadeInUp">
                  {/* Title với hiệu ứng đổ bóng mạnh */}
                  <h2 className="text-2xl md:text-5xl font-extrabold mb-3 drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)] tracking-tight uppercase">
                    {banner.title}
                  </h2>
                  
                  {/* Description rõ ràng hơn */}
                  <p className="text-sm md:text-xl mb-6 md:mb-10 opacity-100 font-medium drop-shadow-md px-4">
                    {banner.desc}
                  </p>
                  
                  {/* Nút bấm màu sắc nổi bật đặc trưng cho mảng Xe (thường dùng xanh hoặc cam) */}
                  <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-2 md:px-12 md:py-4 rounded-full font-bold shadow-2xl transition-all transform hover:scale-110 active:scale-95 flex items-center gap-3 mx-auto text-sm md:text-lg">
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
          <form onSubmit={(e) => e.preventDefault()}>
            {renderForm()}
          </form>
        </div>
        {renderResults()}
        <PopularDestinationsSwiper popularDestinations={popularDestinations} title="Địa điểm thuê xe phổ biến" subtitle="Gợi ý những điểm thuê xe tốt nhất dành cho bạn" onCardClick={(dest) => { /* logic tự điền form */ }} />
        <TestimonialsSwiper testimonials={testimonials} />
        <BlogPostsGrid blogPosts={blogPosts} />
        <PurchaseHistory isLogged={isLogged} purchases={purchases} title="Lịch sử đặt xe" />
      </main>
      <BankGuideModal bankGuide={bankGuide} />
      <Footer />
    </div>
  );
}

export default Cars;