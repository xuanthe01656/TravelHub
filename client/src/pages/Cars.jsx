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
import {
  FaPlaneDeparture, FaPlaneArrival, FaPlane, FaShoppingCart, FaLock, FaReceipt,
  FaInfoCircle, FaHome, FaPhoneAlt, FaUserCircle, FaCalendarAlt, FaUsers,
  FaChair, FaCar, FaGlobe, FaBars, FaTimes, FaCreditCard, FaSpinner,
  FaWallet, FaUniversity, FaArrowLeft, FaClock, FaTicketAlt, FaHotel, FaBusAlt, FaMapMarkedAlt,
  FaStar, FaQuoteLeft, FaBlog, FaMapMarkerAlt, FaShip, FaTrain, FaUmbrellaBeach, FaArrowRight, FaUserFriends
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialCarState = {
  pickup: '',
  dropoff: '',
  pickupDate: '',
  dropoffDate: '',
  driverAge: 25,
  serviceType: 'rental', 
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
  const isLogged = localStorage.getItem('token');
  const handleTokenError = useTokenHandler();
  const { purchases, fetchPurchases } = usePurchases(isLogged, handleTokenError);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [sortBy, setSortBy] = useState('price'); 
  const navigate = useNavigate();
  const location = useLocation();
  const bankGuide = location.state?.bankGuide;
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null); 
  
  useDocumentTitle('Thuê Xe');

  useEffect(() => {
    if (isLogged) {
      fetchPurchases();
    }
    if (bankGuide) {
      toast.success('Yêu cầu chuyển khoản đã được tạo! Vui lòng thanh toán.', { autoClose: 5000 });
    }
  }, [isLogged, bankGuide, navigate, location.pathname]);

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
      return;
    }
  
    setActiveField(field);
  
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(text)}`
    );
    const data = await res.json();
    setAddressSuggestions(data);
  };  
  const handleCarSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      await carValidationSchema.validate(carState, { abortEarly: false });
      setErrors({});
      const response = await axios.get('/api/cars', { params: carState });
      let results = response.data || [];
      results.sort((a, b) => sortBy === 'price' ? (a.price ?? 0) - (b.price ?? 0) : 0);
      setCars(results);
      toast.success(`Tìm thấy ${results.length} xe!`);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        if (err.inner && err.inner.length > 0) {
          err.inner.forEach((error) => {
            if (error.path) formattedErrors[error.path] = error.message;
          });
        } else if (err.path) {
          formattedErrors[err.path] = err.message;
        }
        setErrors(formattedErrors);
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Đã đăng xuất!');
    navigate('/login');
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
    const isToAirport = carState.transferDirection === 'to_airport'; // Giả sử có field này, nếu không thì cần thêm vào state

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 max-w-6xl mx-auto p-4">
        {/* TABS DỊCH VỤ */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit mb-8 shadow-inner">
          {['rental', 'transfer'].map((type) => (
            <button
              key={type}
              onClick={() => {
                handleChange(carDispatch, 'serviceType', type, errors, setErrors);
                setErrors({}); // Xóa lỗi cũ khi đổi tab
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
          {/* KHỐI 1: ĐỊA ĐIỂM (6 cột) */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-[1fr_48px_1fr] gap-2 items-start">
            
            {/* CỘT TRÁI: PICKUP */}
            <div className="relative min-h-[85px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">
                {isTransfer ? (isToAirport ? 'Điểm đón (Nhà/KS)' : 'Sân bay đón') : 'Điểm nhận xe'}
              </label>
              {isTransfer && isToAirport ? (
                <div className="relative group">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ..."
                    className={`w-full h-[52px] pl-10 pr-4 bg-white border ${errors.pickupAddress ? 'border-red-500' : 'border-slate-200'} rounded-xl font-semibold text-sm outline-none focus:border-blue-500`}
                    value={carState.pickupAddress || ''}
                    onChange={(e) => {
                      handleChange(
                        carDispatch,
                        'pickupAddress',
                        e.target.value,
                        errors,
                        setErrors
                      );
                      searchAddress(e.target.value, 'pickup');
                    }}
                  />
                  {addressSuggestions.length > 0 && ( 
                    <ul className="absolute z-10 bg-white border rounded-xl mt-1 w-full max-h-60 overflow-y-auto shadow-lg"> 
                      {addressSuggestions.map((sug, idx) => ( 
                        <li key={idx} onClick={() => { handleChange(carDispatch, 'pickupAddress', sug.fullAddress, errors, setErrors); setAddressSuggestions([]); // đóng dropdown sau khi chọn 
                      }} className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm" > {sug.fullAddress} </li> ))} </ul> )}
                  {errors.pickupAddress && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.pickupAddress}</p>}
                </div>
              ) : (
                <div className="relative">
                  <Select
                    options={airportOptions}
                    styles={customSelectStyles}
                    placeholder="Chọn điểm..."
                    value={airportOptions.find(opt => opt.value === carState.pickup)}
                    onChange={opt => handleChange(carDispatch, 'pickup', opt?.value, errors, setErrors)}
                  />
                  {errors.pickup && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.pickup}</p>}
                </div>
              )}
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

            {/* CỘT PHẢI: DROPOFF */}
            <div className="relative min-h-[85px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">
                {isTransfer ? (isToAirport ? 'Sân bay đến' : 'Điểm trả (Nhà/KS)') : 'Điểm trả xe'}
              </label>
              {isTransfer && !isToAirport ? (
                <div className="relative group">
                  <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" />
                  <input
                    type="text"
                    placeholder="Nhập địa chỉ trả..."
                    className={`w-full h-[52px] pl-10 pr-4 bg-white border ${errors.dropoffAddress ? 'border-red-500' : 'border-slate-200'} rounded-xl font-semibold text-sm outline-none focus:border-blue-500`}
                    value={carState.dropoffAddress || ''}
                    onChange={(e) => {
                      handleChange(
                        carDispatch,
                        'dropoffAddress',
                        e.target.value,
                        errors,
                        setErrors
                      );
                      searchAddress(e.target.value, 'dropoff');
                    }}
                    // onChange={(e) => handleChange(carDispatch, 'dropoffAddress', e.target.value, errors, setErrors)}
                  />
                  {errors.dropoffAddress && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.dropoffAddress}</p>}
                </div>
              ) : (
                <div className="relative">
                  <Select
                    options={airportOptions}
                    styles={customSelectStyles}
                    placeholder="Chọn điểm..."
                    value={airportOptions.find(opt => opt.value === carState.dropoff)}
                    onChange={(e) => {
                      handleChange(
                        carDispatch,
                        'dropoffAddress',
                        e.target.value,
                        errors,
                        setErrors
                      );
                      searchAddress(e.target.value, 'dropoff');
                    }}
                    // onChange={opt => handleChange(carDispatch, 'dropoff', opt?.value, errors, setErrors)}
                  />
                  {errors.dropoff && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.dropoff}</p>}
                </div>
              )}
            </div>
          </div>

          {/* KHỐI 2: THỜI GIAN & KHÁCH (4 cột) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3 items-start">
            <div className="relative min-h-[85px]">
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-2 ml-1">Ngày đón</label>
              <div className="relative">
                <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className={`w-full h-[52px] pl-10 pr-2 border ${errors.pickupDate ? 'border-red-500' : 'border-slate-200'} rounded-xl font-bold text-sm outline-none focus:border-blue-500`}
                  value={carState.pickupDate || ''}
                  onChange={(e) => handleChange(carDispatch, 'pickupDate', e.target.value, errors, setErrors)}
                />
              </div>
              {errors.pickupDate && <p className="text-red-500 text-[10px] mt-1 absolute font-bold">{errors.pickupDate}</p>}
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
                      placeholder="1"
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
              {errors[isTransfer ? 'passengers' : 'dropoffDate'] && (
                <p className="text-red-500 text-[10px] mt-1 absolute font-bold">
                  {errors[isTransfer ? 'passengers' : 'dropoffDate']}
                </p>
              )}
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
            title: "Khuyến Mãi Thuê Xe",
            desc: "Giảm tới 30% cho thuê xe tự lái.",
            btn: "Khám Phá",
            url:"https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=800&q=80"
          }, {
            color: "from-emerald-500 to-teal-500",
            title: "Đưa Đón Sân Bay Giá Rẻ",
            desc: "Chỉ từ 500.000 VND cho các chuyến đưa đón.",
            btn: "Đặt Ngay",
            url:"https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=800&q=80"
          }, {
            color: "from-orange-500 to-rose-500",
            title: "Xe Cao Cấp Cuối Tuần",
            desc: "Ưu đãi đặc biệt cho thuê xe dài ngày.",
            btn: "Xem Ngay",
            url:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80"
          }].map((banner, idx) => (
            <SwiperSlide key={idx}>
              <div className={`relative bg-black/40 text-blue w-full h-full flex flex-col items-center justify-center text-center p-4`} style={{ backgroundImage: `url(${banner.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
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