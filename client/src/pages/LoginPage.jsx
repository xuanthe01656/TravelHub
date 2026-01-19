import { useReducer, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';
import * as Yup from 'yup';
import InputField from '../components/InputField';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { HiOutlineTranslate } from 'react-icons/hi';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { HiChevronDown } from 'react-icons/hi';



const initialState = { email: '', password: '', remember: false };
const FlagIcon = ({ lang }) => {
  if (lang === 'vi') {
    return (
      <svg className="w-5 h-5 rounded-full object-cover shadow-sm" viewBox="0 0 30 20">
        <rect width="30" height="20" fill="#da251d" />
        <polygon points="15,4 11.47,14.85 20.72,8.15 9.28,8.15 18.53,14.85" fill="#ffff00" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 rounded-full object-cover shadow-sm" viewBox="0 0 60 30">
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4" />
      <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
      <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
    </svg>
  );
};
function reducer(state, action) {
  switch (action.type) {
    case 'CHANGE': return { ...state, [action.field]: action.value };
    case 'RESET': return initialState;
    default: return state;
  }
}

const createValidationSchema = (t) =>
  Yup.object({
    email: Yup.string()
      .email(t('auth:form.email.invalid'))
      .required(t('auth:form.email.required')),
    password: Yup.string()
      .min(6, t('auth:form.password.min'))
      .required(t('auth:form.password.required')),
  });


function Login() {
  const [formState, dispatch] = useReducer(reducer, initialState);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  useDocumentTitle(t('auth:title.login'));
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langRef.current && !langRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsLangOpen(false);
  };
  useEffect(() => {
    if (isRedirecting) return;
    const checkSession = async () => {
      try {
        const response = await axios.get('/api/session');
        if (response.data && typeof response.data === 'object' && response.data.loggedIn === true) {
          console.log("Đã đăng nhập, chuyển sang Dashboard");
          navigate('/dashboard');
        } else {
          console.log("Chưa đăng nhập, ở lại trang Login");
        }
      } catch (err) {
        console.log("Không có phiên làm việc hợp lệ.");
      }
    };
    checkSession();
  }, [navigate,isRedirecting]);
  const handleSocialLogin = (url) => {
    console.log("URL chuyển hướng:", url);
    setIsRedirecting(true);
    window.location.href = url;
  };
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
    setErrors({});
    setLoading(true);
  
    try {
      const schema = createValidationSchema(t);
      await schema.validate(formState, { abortEarly: false });
  
      const response = await axios.post('/api/login', formState);
      if (response.status === 200) {
        toast.success(t('auth:toast.welcome'));
        window.location.href = '/dashboard'; 
      }
    } catch (err) {
      if (err.name === 'ValidationError') {
        const formattedErrors = {};
        err.inner.forEach(error => { 
          formattedErrors[error.path] = error.message; 
        });
        setErrors(formattedErrors);
      } else {
        toast.error(err.response?.data?.message || t('auth:toast.invalid'));
      }
    } finally { 
      setLoading(false); 
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-10 font-sans">
      <div className="fixed top-6 right-6 z-50" ref={langRef}>
        <button 
          onClick={() => setIsLangOpen(!isLangOpen)}
          className="flex items-center gap-2.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-all text-sm font-bold text-slate-700 active:scale-95"
        >
          <FlagIcon lang={i18n.language} />
          <span className="uppercase">{i18n.language}</span>
          <HiChevronDown className={`text-lg transition-transform duration-300 ${isLangOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isLangOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-1.5">
              <button
                onClick={() => changeLanguage('vi')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${i18n.language === 'vi' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <FlagIcon lang="vi" />
                <span className="font-bold">Tiếng Việt</span>
                {i18n.language === 'vi' && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </button>
              
              <button
                onClick={() => changeLanguage('en')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${i18n.language === 'en' ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-600'}`}
              >
                <FlagIcon lang="en" />
                <span className="font-bold">English</span>
                {i18n.language === 'en' && <div className="ml-auto w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="w-full max-w-[420px] bg-white rounded-[2.5rem] shadow-2xl shadow-blue-100/60 overflow-hidden border border-white">
        
        <div className="bg-blue-600 p-8 text-white text-center">
          <div className="text-4xl mb-3">👋</div>
          <h2 className="text-2xl font-bold">{t('auth:banner.welcomeBack')}</h2>
          <p className="text-blue-100 text-sm mt-1 font-medium italic">
            {t('auth:banner.subtitle')}
          </p>
        </div>

        <div className="p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <InputField
              label={t('auth:form.email.label')}
              name="email"
              type="email"
              placeholder={t('auth:form.email.label')}
              value={formState.email}
              error={errors.email}
              onChange={handleChange}
            />
            
            <div className="relative">
              <InputField
                label={t('auth:form.password.label')}
                name="password"
                type="password"
                placeholder={t('auth:form.password.placeholder')}
                value={formState.password}
                error={errors.password}
                onChange={handleChange}
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700">
                  {t('auth:form.forgotPassword')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-200 transition-all active:scale-[0.98] flex justify-center items-center"
            >
              {loading ? (
                <AiOutlineLoading3Quarters className="animate-spin text-xl" />
              ) : (
                t('auth:actions.login')
              )}
            </button>
          </form>
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
              <span className="bg-white px-4">{t('auth:social.or')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => handleSocialLogin(`${import.meta.env.VITE_SERVER_URL}/auth/google`)} className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-95">
              <FcGoogle className="text-2xl" /> <span><span>{t('auth:social.google')}</span></span>
            </button>
            <button type="button"  onClick={() => handleSocialLogin(`${import.meta.env.VITE_SERVER_URL}/auth/facebook`)} className="flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all font-bold text-slate-700 active:scale-95">
              <FaFacebook className="text-2xl text-[#1877F2]" /> <span><span>{t('auth:social.facebook')}</span></span>
            </button>
          </div>

          <p className="mt-10 text-center text-sm text-slate-500 font-medium">
            {t('auth:footer.noAccount')}{' '}
            <Link to="/register" className="text-blue-600 font-black hover:underline underline-offset-4">{t('auth:actions.register')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;