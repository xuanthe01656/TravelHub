// TermsOfUse.jsx
import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaShieldAlt, FaInfoCircle, FaBalanceScale } from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

function TermsOfUse({ isLogged, welcomeMessage, handleLogout }) {
  useDocumentTitle('Điều khoản sử dụng');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={handleLogout} 
      />
      
      {/* Tăng pt-24 để tránh bị Header sticky che khuất */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-24 pb-16 md:pt-32">
        
        {/* Header Section đồng bộ với FAQ */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
            <FaShieldAlt /> TravelHub Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Điều khoản sử dụng</h1>
          <p className="mt-4 text-slate-500 font-medium italic text-sm">Cập nhật lần cuối: 19/12/2025</p>
        </div>

        {/* Nội dung chính trong Card trắng */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-14 border border-slate-100 relative overflow-hidden">
          {/* Họa tiết trang trí đồng bộ */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full blur-[80px] opacity-50 -mr-20 -mt-20"></div>

          <div className="space-y-12 relative z-10">
            
            {/* Tóm tắt mô hình Affiliate */}
            <section className="bg-blue-50/50 p-6 md:p-8 rounded-3xl border border-blue-100 flex gap-4 items-start">
              <FaInfoCircle className="text-blue-600 text-xl shrink-0 mt-1" />
              <p className="font-semibold text-slate-700 leading-relaxed">
                Bằng cách sử dụng hệ thống <span className="text-blue-600">B2C Affiliate</span> của TravelHub, bạn hiểu rằng chúng tôi là nền tảng kết nối. Mọi giao dịch tài chính sẽ được thực hiện trực tiếp trên hạ tầng bảo mật của đối tác cung cấp dịch vụ.
              </p>
            </section>
            
            <div className="grid gap-10 text-slate-600 leading-relaxed">
              <section className="bg-slate-50 p-7 rounded-3xl border-l-4 border-blue-600">
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-xs">01</span>
                  Năng lực pháp lý
                </h2>
                <p className="pl-11 font-medium">Bạn phải đủ 18 tuổi hoặc có sự giám sát của người bảo hộ hợp pháp để sử dụng chức năng tìm kiếm và đặt dịch vụ trên nền tảng của chúng tôi.</p>
              </section>
              
              <section className="bg-slate-50 p-7 rounded-3xl border-l-4 border-blue-600">
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-xs">02</span>
                  Đăng ký tài khoản
                </h2>
                <p className="pl-11 font-medium">Chúng tôi khuyến khích cung cấp thông tin chính xác. Điều này giúp API của các hãng bay trả về kết quả cá nhân hóa và chính xác nhất cho hành trình của bạn.</p>
              </section>
              
              <section className="bg-slate-50 p-7 rounded-3xl border-l-4 border-blue-600">
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-xs">03</span>
                  Trách nhiệm thanh toán
                </h2>
                <p className="pl-11 font-medium">
                  TravelHub <strong>không thu phí trực tiếp</strong> từ người dùng. Khi bạn nhấn "Đặt vé", bạn sẽ được chuyển hướng sang trang thanh toán của đối tác (ví dụ: Agoda, Singapore Airlines). Mọi khiếu nại về tiền tệ và hoàn vé sẽ tuân theo chính sách của bên thứ ba đó.
                </p>
              </section>
              
              <section className="bg-slate-50 p-7 rounded-3xl border-l-4 border-blue-600">
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-xs">04</span>
                  Sở hữu trí tuệ
                </h2>
                <p className="pl-11 font-medium">Giao diện, mã nguồn và các thuật toán tìm kiếm là tài sản độc quyền của TravelHub. Việc sao chép dữ liệu (Scraping) mà không có sự đồng ý là vi phạm điều khoản của chúng tôi.</p>
              </section>
            </div>
          </div>

          {/* Footer Card */}
          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 font-medium">
              Bạn có thắc mắc về các điều khoản này? 
              <a href="/fqa" className="ml-2 text-blue-600 font-black hover:text-blue-700 transition-colors uppercase text-xs tracking-wider">
                Xem FAQ ngay
              </a>
            </p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default TermsOfUse;