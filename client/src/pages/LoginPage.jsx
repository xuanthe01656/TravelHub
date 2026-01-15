import { useReducer, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import InputField from '../components/InputField';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialState = { email: '', password: '', remember: false };

function reducer(state, action) {
  switch (action.type) {
    case 'CHANGE': return { ...state, [action.field]: action.value };
    case 'RESET': return initialState;
    default: return state;
  }
}

const validationSchema = Yup.object({
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: Yup.string().min(6, 'Mật khẩu phải từ 6 ký tự').required('Vui lòng nhập mật khẩu'),
});

function Login() {
  const [formState, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle('Đăng nhập');

  // Kiểm tra session hiện có (Sử dụng Cookie tự động)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('/api/session');
        if (response.data.loggedIn) {
          navigate('/dashboard');
        }
      } catch (err) {
        // Nếu chưa đăng nhập thì ở lại trang login, không cần xóa localStorage nữa
      }
    };
    checkSession();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    dispatch({
      type: 'CHANGE',
      field: name,
      value: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await validationSchema.validate(formState, { abortEarly: false });
      setErrors({});
      
      // Gửi yêu cầu login - Backend sẽ tự động set Cookie (connect.sid)
      const response = await axios.post('/api/login', formState);
      
      if (response.status === 200) {
        // Lưu ý: Không cần localStorage.setItem('token') nữa vì dùng Session
        toast.success('Chào mừng bạn quay trở lại!');
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        err.inner.forEach(error => { formattedErrors[error.path] = error.message; });
        setErrors(formattedErrors);
      } else {
        toast.error(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-10 font-sans">
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/60 overflow-hidden border border-white">
        
        {/* Banner đầu trang */}
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-2xl font-bold">Chào bạn quay lại!</h2>
          <p className="text-blue-100 text-sm mt-1 font-medium italic">
            Đăng nhập để đặt vé nhanh hơn
          </p>
        </div>

        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label="Email của bạn"
              name="email"
              type="email"
              placeholder="nguyenvana@gmail.com"
              value={formState.email}
              error={errors.email}
              onChange={handleChange}
            />
            
            <div className="relative">
              <InputField
                label="Mật khẩu"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formState.password}
                error={errors.password}
                onChange={handleChange}
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-center items-center"
            >
              {loading ? <AiOutlineLoading3Quarters className="animate-spin text-xl" /> : 'ĐĂNG NHẬP NGAY'}
            </button>
          </form>

          {/* Đăng nhập MXH */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
              <span className="bg-white px-4">Hoặc dùng</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/google`} className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-95">
              <FcGoogle className="text-2xl" /> <span>Google</span>
            </button>
            <button onClick={() => window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/facebook`} className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-95">
              <FaFacebook className="text-2xl text-[#1877F2]" /> <span>Facebook</span>
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-slate-500 font-medium">
            Bạn chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 font-black hover:underline underline-offset-4">Đăng ký</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;