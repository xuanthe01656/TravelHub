import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import BlogDetail from './pages/BlogDetail';
import TermsOfUse from './pages/TermsOfUse';
import FAQ from './pages/FAQ';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import ChatBox from './components/ChatBox';
import AdminChat from './components/Admin/AdminChat';
import ScrollToTop from './components/ScrollToTop';
import BackToTop from './components/BackToTop';
import ContactWidgets from './components/ContactWidgets';
import AdminDashboard from './pages/Admin/AdminDashboard';
import axios from 'axios';
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_SERVER_URL

const ProtectedRoute = ({ children }) => {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    axios.get('/api/session')
      .then(res => {
        if (res.data && typeof res.data === 'object' && res.data.loggedIn === true) {
          setIsAuth(true);
        } else {
          setIsAuth(false);
        }
      })
      .catch(() => setIsAuth(false));
  }, []);

  if (isAuth === null) return <div className="loading">Đang kiểm tra...</div>; 

  return isAuth ? children : <Navigate to="/login" replace/>;
};
const AppContent = () => {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin') || location.pathname === '/admin-support';

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/cars" element={<Cars />} />
        <Route path="/blogs" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        <Route path="/privacypolicy" element={<PrivacyPolicy />} />
        <Route path="/termsofuse" element={<TermsOfUse />} />
        <Route path="/fqa" element={<FAQ />} />
        <Route path="/confirmation" element={<Confirmation />} />
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile /> 
            </ProtectedRoute>
          }
        />
        <Route path="/thank-you" element={<ThankYouPage />} />
        <Route path="/" element={<Navigate to="/dashboard"/>} />
        <Route path="/admin-support" element={<AdminChat />} />
        <Route path="/admin" element={<AdminDashboard />} />
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
      <AppContent />
    </BrowserRouter>
  );
}

export default App;