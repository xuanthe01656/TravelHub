import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function usePurchases(isLogged, handleAuthError) {
  const [purchases, setPurchases] = useState([]);

  // Dùng useCallback để tránh hàm bị khởi tạo lại vô ích
  const fetchPurchases = useCallback(async () => {
    // Nếu isLogged chưa xác định hoặc false thì không gọi API
    if (!isLogged) return;

    try {
      // Axios tự động gửi Cookie kèm theo nhờ withCredentials: true đã cấu hình global
      const response = await axios.get('/api/purchases');
      setPurchases(response.data || []);
    } catch (err) {
      // Xử lý lỗi session (ví dụ: 401 Unauthorized) thông qua handler tập trung
      if (handleAuthError) {
        handleAuthError(err);
      } else {
        console.error("Lỗi khi lấy lịch sử mua hàng:", err);
      }
    }
  }, [isLogged, handleAuthError]);

  useEffect(() => {
    if (isLogged) {
      fetchPurchases();
    } else {
      setPurchases([]); // Xóa danh sách khi user logout
    }
  }, [isLogged, fetchPurchases]);

  return { purchases, fetchPurchases };
}