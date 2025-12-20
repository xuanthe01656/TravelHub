import React from 'react';
import { useNavigate } from 'react-router-dom';

function ThankYouPage() {
  const navigate = useNavigate();

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container" style={{ 
      maxWidth: '500px', 
      margin: 'auto', 
      padding: '40px', 
      textAlign: 'center', 
      border: '1px solid #ddd', 
      borderRadius: '10px', 
      background: '#f8f9fa' 
    }}>
      <h2>Cảm ơn bạn đã mua vé máy bay! 🎉</h2>
      <p>Đơn hàng của bạn đã được xử lý thành công. Chúng tôi sẽ gửi xác nhận qua email trong thời gian sớm nhất.</p>
      <p>Nếu bạn có bất kỳ câu hỏi nào, hãy liên hệ hỗ trợ tại support@vebay.com.</p>
      <button 
        onClick={handleBackToDashboard} 
        style={{ 
          padding: '10px 20px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer', 
          marginTop: '20px' 
        }}
      >
        Quay Về Dashboard
      </button>
    </div>
  );
}

export default ThankYouPage;