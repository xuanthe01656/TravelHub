// PrivacyPolicy.jsx
import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaLock, FaUserShield, FaDatabase, FaExchangeAlt, FaPrint, FaEnvelope } from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { Helmet } from 'react-helmet-async';


function PrivacyPolicy({ isLogged, welcomeMessage, handleLogout }) {
  useDocumentTitle('Chính sách bảo mật');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PrivacyPolicy",
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": "https://travelhub-production.up.railway.app/privacypolicy"
            },
            "name": "Chính sách bảo mật TravelHub",
            "url": "https://travelhub-production.up.railway.app/privacypolicy",
            "inLanguage": "vi-VN",
            "dateModified": "2025-12-19",
            "isPartOf": {
              "@type": "WebSite",
              "name": "TravelHub",
              "url": "https://travelhub-production.up.railway.app"
            },
            "publisher": {
              "@type": "Organization",
              "name": "TravelHub",
              "url": "https://travelhub-production.up.railway.app",
              "logo": {
                "@type": "ImageObject",
                "url": "https://travelhub-production.up.railway.app/logo.png"
              }
            }
          })}
        </script>
      </Helmet>

    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={handleLogout} 
      />
      
      {/* Container chính: Đồng bộ khoảng cách với FAQ/Terms */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-24 pb-16 md:pt-32">
        
        {/* Header Section: Sử dụng tông Emerald cho Privacy */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            Privacy Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">Chính sách bảo mật</h1>
          <p className="mt-4 text-slate-500 font-medium italic text-sm">Cập nhật lần cuối: 19/12/2025</p>
        </div>

        {/* Nội dung chính trong Card trắng */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/50 p-8 md:p-14 border border-slate-100 relative overflow-hidden">
          {/* Họa tiết trang trí Emerald nhẹ nhàng */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-50 rounded-full blur-[80px] opacity-50 -ml-20 -mt-20"></div>

          <div className="space-y-12 relative z-10">
            
            {/* Tóm tắt mô hình bảo mật Affiliate */}
            <section className="bg-emerald-50/50 p-6 md:p-8 rounded-3xl border border-emerald-100 flex gap-4 items-start">
              <FaLock className="text-emerald-600 text-xl shrink-0 mt-1" />
              <p className="font-semibold text-slate-700 leading-relaxed">
                Chúng tôi hiểu rằng dữ liệu của bạn là tài sản quý giá nhất. Với tư cách là nền tảng <span className="text-emerald-700">Affiliate Marketing</span>, TravelHub cam kết không bao giờ thu thập thông tin tài chính trực tiếp của người dùng.
              </p>
            </section>
            
            <div className="grid gap-12 text-slate-600 leading-relaxed">
              
              {/* Mục 1 */}
              <section>
                <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-3">
                  <span className="text-emerald-500">1.</span> Dữ liệu thu thập
                </h2>
                <div className="grid md:grid-cols-2 gap-4 ml-0 md:ml-8">
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all">
                    <FaUserShield className="text-emerald-500 mb-3 text-lg" />
                    <h3 className="font-bold text-slate-800 mb-2">Thông tin định danh</h3>
                    <p className="text-sm font-medium">Email, họ tên và số điện thoại. Chúng tôi chỉ lưu giữ để quản lý tài khoản thành viên của bạn.</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all">
                    <FaDatabase className="text-emerald-500 mb-3 text-lg" />
                    <h3 className="font-bold text-slate-800 mb-2">Dữ liệu hành vi</h3>
                    <p className="text-sm font-medium">Dữ liệu hành vi ẩn danh (lịch sử tìm kiếm, tương tác) nhằm cải thiện trải nghiệm và gợi ý kết quả phù hợp.</p>
                  </div>
                </div>
              </section>

              {/* Mục 2 */}
              <section className="border-l-4 border-emerald-100 pl-8">
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  2. Cách sử dụng thông tin
                </h2>
                <p className="font-medium">
                  TravelHub sử dụng dữ liệu của bạn để cá nhân hóa kết quả tìm kiếm, gửi thông báo giảm giá độc quyền và cải thiện tốc độ tải dữ liệu từ API của các đối tác hàng không liên kết.
                </p>
              </section>

              {/* Mục 3 */}
              <section>
                <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                  <FaExchangeAlt className="text-emerald-500" /> 3. Chia sẻ dữ liệu
                </h2>
                <p className="ml-8 font-medium">
                  Khi bạn tiến hành đặt vé, các thông tin cơ bản sẽ được chuyển tiếp an toàn theo yêu cầu chủ động của bạn sang hệ thống của đối tác (Hãng bay/Khách sạn). Chúng tôi <strong>không bao giờ bán</strong> thông tin cá nhân của bạn cho các bên quảng cáo.
                </p>
              </section>

              {/* Bảo mật & Quyền lợi */}
              <div className="grid md:grid-cols-2 gap-6 border-t border-slate-50 pt-10">
                <div className="p-6 rounded-3xl bg-slate-900 text-white">
                  <h3 className="font-black mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></div> Bảo mật SSL
                  </h3>
                  <p className="text-xs text-slate-400 leading-loose">
                    Toàn bộ dữ liệu truyền tải giữa thiết bị của bạn và TravelHub đều được mã hóa theo tiêu chuẩn quân đội SSL/TLS.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-emerald-600 text-white">
                  <h3 className="font-black mb-2 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div> Quyền của bạn
                  </h3>
                  <p className="text-xs text-emerald-50 leading-loose">
                    Bạn có toàn quyền yêu cầu trích xuất dữ liệu hoặc xóa vĩnh viễn tài khoản trong trang cài đặt cá nhân của mình.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer Card: Đồng bộ với Terms */}
          <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3 text-slate-500 font-medium text-sm">
              <FaEnvelope className="text-emerald-500" />
              <span>Liên hệ: <span className="text-slate-900 font-bold">privacy@travelhub.com</span></span>
            </div>
            
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              <FaPrint /> In bản chính sách
            </button>
          </footer>
        </div>
      </main>
      
      <Footer />
    </div>
    </>
  );
}

export default PrivacyPolicy;