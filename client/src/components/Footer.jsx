import React from 'react';
import { FaPlaneDeparture } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-[#0f172a] text-slate-400 py-12 px-6 mt-12 rounded-t-[3rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg flex items-center gap-2">
            <FaPlaneDeparture className="text-blue-500" /> TravelHub
          </h3>
          <p className="text-sm leading-relaxed">
            Mã số doanh nghiệp: 0123456789<br/>
            Địa chỉ: TP. Đà Nẵng<br/>
            Hotline: 028.1234.5678
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-white font-bold text-lg">Hỗ trợ</h3>
          <ul className="text-sm space-y-2">
            <li><a href="../privacypolicy" className="hover:text-blue-400 transition">Chính sách bảo mật</a></li>
            <li><a href="../termsofuse" className="hover:text-blue-400 transition">Điều khoản sử dụng</a></li>
            <li><a href="../fqa" className="hover:text-blue-400 transition">Câu hỏi thường gặp</a></li>
          </ul>
        </div>
        
        <div className="space-y-4 text-center md:text-right">
          <div className="flex justify-center md:justify-end">
            <img 
              src="https://chinhphu.vn/images/da-thong-bao-bo-cong-thuong.png" 
              alt="BCT" 
              className="w-32 opacity-80 hover:opacity-100 transition" 
            />
          </div>
          <p className="text-xs">© 2025 TravelHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;