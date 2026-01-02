import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function useTokenHandler() {
  const navigate = useNavigate();
  const tokenErrorHandled = useRef(false);

  const handleTokenError = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (tokenErrorHandled.current) return true;
      tokenErrorHandled.current = true;
      localStorage.removeItem('token');
      toast.error('Phiên đăng nhập hết hạn.');
      if (!['/cars', '/hotels', '/flights', '/dashboard'].includes(window.location.pathname)) {
        navigate('/login');
      }
      return true;
    }
    return false;
  };

  return handleTokenError;
}