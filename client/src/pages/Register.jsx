import { useReducer, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as Yup from 'yup';
import InputField from '../components/InputField';
import { toast } from 'react-toastify';
import axios from 'axios';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FcGoogle } from 'react-icons/fc';
import useDocumentTitle from '../hooks/useDocumentTitle';

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'CHANGE': return { ...state, [action.field]: action.value };
    case 'RESET': return initialState;
    default: return state;
  }
}

const validationSchema = Yup.object({
  name: Yup.string().required('Vui lòng nhập họ và tên'),
  email: Yup.string().email('Email không hợp lệ').required('Vui lòng nhập email'),
  password: Yup.string().min(6, 'Mật khẩu tối thiểu 6 ký tự').required('Vui lòng nhập mật khẩu'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu'),
  agreeToTerms: Yup.boolean().oneOf([true], 'Bạn cần đồng ý với điều khoản'),
});

function Register() {
  const [formState, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle('Đăng ký thành viên');
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    dispatch({ type: 'CHANGE', field: name, value: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await validationSchema.validate(formState, { abortEarly: false });
      setErrors({});
      const response = await axios.post('/api/register', {
        name: formState.name,
        email: formState.email,
        password: formState.password,
      });
      if (response.status === 201) {
        toast.success('Đăng ký thành viên thành công!');
        navigate('/login');
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        err.inner.forEach(error => { formattedErrors[error.path] = error.message; });
        setErrors(formattedErrors);
      } else {
        toast.error(err.response?.data?.message || 'Lỗi đăng ký, vui lòng thử lại sau');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-12 font-sans">
      <div className="w-full max-w-[480px] bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/60 p-8 md:p-12 border border-white">
        
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl text-3xl mb-4 animate-bounce">
            ✈️
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Trở thành thành viên</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Nhận ngay ưu đãi cho chuyến bay đầu tiên</p>
        </div>

        {/* Đăng ký nhanh với Google */}
        <button onClick={() => window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/google`} type="button" className="w-full flex items-center justify-center gap-3 py-3.5 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-[0.98] mb-8">
          <FcGoogle className="text-2xl" />
          <span>Đăng ký nhanh qua Google</span>
        </button>

        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
            <span className="bg-white px-4 text-nowrap">Hoặc dùng Email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <InputField
            label="Họ và tên"
            name="name"
            placeholder="Ví dụ: Nguyễn Văn A"
            value={formState.name}
            error={errors.name}
            onChange={handleChange}
          />

          <InputField
            label="Địa chỉ Email"
            name="email"
            type="email"
            placeholder="nguyen@email.com"
            value={formState.email}
            error={errors.email}
            onChange={handleChange}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField
              label="Mật khẩu"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formState.password}
              error={errors.password}
              onChange={handleChange}
            />
            <InputField
              label="Xác nhận"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formState.confirmPassword}
              error={errors.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2">
            <div className="flex items-start cursor-pointer group">
              <div className="relative flex items-center mt-0.5">
                <input
                  id="agree"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formState.agreeToTerms}
                  onChange={handleChange}
                  className="peer h-5 w-5 appearance-none rounded-md border-2 border-slate-200 bg-white checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer"
                />
                <svg className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none ml-[3px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <label htmlFor="agree" className="ml-3 text-[13px] text-slate-600 font-medium leading-snug cursor-pointer group-hover:text-slate-800 transition-colors">
                Tôi đồng ý với các{' '}
                <Link to="../termsofuse" className="text-blue-600 font-bold hover:underline">
                  Điều khoản sử dụng
                </Link>{' '}
                và{' '}
                <Link to="../privacypolicy" className="text-blue-600 font-bold hover:underline">
                  Chính sách bảo mật
                </Link> 
                của TravelHub.
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-[11px] text-red-500 font-bold mt-1 ml-8 animate-pulse italic">! {errors.agreeToTerms}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-[0_10px_20px_-10px_rgba(37,99,235,0.4)] transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
          >
            {loading ? <AiOutlineLoading3Quarters className="animate-spin text-xl" /> : "KHÁM PHÁ NGAY"}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center text-sm font-medium">
          <span className="text-slate-500">Đã có tài khoản?</span>{' '}
          <Link to="/login" className="text-blue-600 font-black hover:underline underline-offset-4">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;