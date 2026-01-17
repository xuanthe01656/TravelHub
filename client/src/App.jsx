import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Helmet } from 'react-helmet-async';

// Pages
import './i18n';
import Register from './pages/Register'; 
import Login from './pages/LoginPage'; 
import Dashboard from './pages/Dashboard';
import Flights from './pages/Flights';
import Hotels from './pages/Hotels';
import Cars from './pages/Cars';
import Confirmation from './pages/Payment'; 
import ThankYouPage from './pages/ThankYouPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Profile from './pages/Profile';
import BlogPage from './pages/BlogPage';
import About from './pages/About';
import BlogDetail from './pages/BlogDetail';
import TermsOfUse from './pages/TermsOfUse';
import FAQ from './pages/FAQ';
import AdminChat from './components/Admin/AdminChat';
import AdminDashboard from './pages/Admin/AdminDashboard';


// Components
import ChatBox from './components/ChatBox';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import ContactWidgets from './components/ContactWidgets';

import './App.css';

// Cấu hình Axios
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL;


const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [auth, setAuth] = useState({ isLogged: false, user: null, loading: true });

  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname === '/admin-support';

  // Hàm làm mới trạng thái Auth - Dùng chung toàn App
  const refreshAuth = useCallback(async () => {
    try {
      const res = await axios.get('/api/session');
      if (res.data && res.data.loggedIn) {
        setAuth({ isLogged: true, user: res.data.user, loading: false });
      } else {
        setAuth({ isLogged: false, user: null, loading: false });
      }
    } catch (err) {
      setAuth({ isLogged: false, user: null, loading: false });
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  useEffect(() => {
    if (!auth.loading && auth.isLogged && location.pathname === '/login') {
      console.log("Đã tìm thấy session từ Google, đang vào Dashboard...");
      navigate('/dashboard', { replace: true });
    }
  }, [auth.isLogged, auth.loading, location.pathname, navigate]);

  // Hàm xử lý Logout
  const handleLogout = async () => {
    try {
      await axios.post('/api/logout');
      setAuth({ isLogged: false, user: null, loading: false });
      toast.info("Đã đăng xuất tài khoản");
      navigate('/login');
    } catch (err) {
      toast.error("Lỗi khi đăng xuất");
    }
  };

  if (auth.loading) return <div className="loading">Đang tải dữ liệu...</div>;

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login onLoginSuccess={refreshAuth} />} />
        <Route path="/register" element={<Register />} />

        {/* Public Routes - Truyền props để Header bên trong nhận dữ liệu */}
        <Route path="/dashboard" element={
          <Dashboard isLogged={auth.isLogged} user={auth.user} handleLogout={handleLogout} />
        } />
        <Route path="/flights" element={
          <Flights isLogged={auth.isLogged} user={auth.user} handleLogout={handleLogout} />
        } />
        <Route path="/hotels" element={
          <Hotels isLogged={auth.isLogged} user={auth.user} handleLogout={handleLogout} />
        } />
        <Route path="/cars" element={
          <Cars isLogged={auth.isLogged} user={auth.user} handleLogout={handleLogout} />
        } />

        {/* Private Routes */}
        <Route path="/profile" element={
          auth.isLogged ? 
          <Profile isLogged={auth.isLogged} user={auth.user} handleLogout={handleLogout} /> : 
          <Navigate to="/login" replace />
        } />

        {/* Other Routes */}
        <Route path="/blogs" element={<BlogPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsofuse" element={<TermsOfUse />} />
        <Route path="/fqa" element={<FAQ />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/admin-support" element={<AdminChat />} />
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* Điều hướng mặc định */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {!isAdminPage && (
        <>
          <ContactWidgets />
          <ChatBox />
        </>
      )}
      
      <BackToTop />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "@id": "https://travelhub-production.up.railway.app/#organization",
            "name": "TravelHub",
            "url": "https://travelhub-production.up.railway.app",
            "logo": {
              "@type": "ImageObject",
              "url": "https://travelhub-production.up.railway.app/logo.png"
            },
            "description": "Nền tảng tìm kiếm và so sánh dịch vụ du lịch theo mô hình Affiliate.",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "customer support",
              "email": "support@travelhub.com",
              "availableLanguage": ["vi", "en"]
            }
          })}
        </script>
      </Helmet>

      <AppContent />
    </BrowserRouter>
  );
}


export default App;