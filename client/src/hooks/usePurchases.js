import { useState, useEffect } from 'react';
import axios from 'axios';

export default function usePurchases(isLogged, handleTokenError) {
  const [purchases, setPurchases] = useState([]);

  const fetchPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get('/api/purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPurchases(response.data || []);
    } catch (err) {
      handleTokenError(err);
    }
  };

  useEffect(() => {
    if (isLogged) {
      fetchPurchases();
    }
  }, [isLogged]);

  return { purchases, fetchPurchases };
}