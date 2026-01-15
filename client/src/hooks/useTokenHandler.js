import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function useAuthHandler() {
  const navigate = useNavigate();
  const authErrorHandled = useRef(false);

  const handleAuthError = (error) => {
    // Kiểm tra lỗi 401 (Chưa đăng nhập/Hết hạn) hoặc 403 (Không có quyền)
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      
      // Nếu đã xử lý lỗi này rồi thì bỏ qua để tránh hiện nhiều Toast cùng lúc
      if (authErrorHandled.current) return true;
      authErrorHandled.current = true;

      // KHÔNG CẦN: localStorage.removeItem('token'); 
      // Vì Cookie do trình duyệt quản lý, Server sẽ báo cho trình duyệt nếu session hết hạn.

      toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');

      // Logic điều hướng: Chỉ đá về trang Login nếu họ đang ở các trang cần bảo mật (như /profile, /confirmation)
      // Nếu đang ở Dashboard, Hotels, Flights... thì chỉ cần thông báo chứ không ép chuyển trang
      const publicRoutes = ['/cars', '/hotels', '/flights', '/dashboard', '/blogs'];
      const isPublicRoute = publicRoutes.some(route => window.location.pathname.startsWith(route));

      if (!isPublicRoute) {
        navigate('/login');
      }

      // Reset lại flag sau một khoảng thời gian ngắn để có thể bắt lỗi tiếp theo nếu có
      setTimeout(() => {
        authErrorHandled.current = false;
      }, 5000);

      return true;
    }
    return false;
  };

  return handleAuthError;
}