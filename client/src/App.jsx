import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import TermsOfUse from './pages/TermsOfUse';
import FAQ from './pages/FAQ';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/hotels" element={<Hotels />} />
        <Route path="/cars" element={<Cars />} />
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
        <Route path="/" element={<Navigate to="/Dashboard" />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  );
}


export default App;