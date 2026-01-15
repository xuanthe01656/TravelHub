import { useRef, useCallback } from 'react'; // Thêm useCallback
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function useAuthHandler() {
  const navigate = useNavigate();
  const authErrorHandled = useRef(false);
  const handleAuthError = useCallback((error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      if (authErrorHandled.current) return true;
      authErrorHandled.current = true;

      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      
      const publicRoutes = ['/cars', '/hotels', '/flights', '/dashboard', '/blogs'];
      const isPublicRoute = publicRoutes.some(route => window.location.pathname.startsWith(route));

      if (!isPublicRoute) {
        navigate('/login');
      }

      setTimeout(() => {
        authErrorHandled.current = false;
      }, 5000);

      return true;
    }
    return false;
  }, [navigate]); 

  return handleAuthError;
}