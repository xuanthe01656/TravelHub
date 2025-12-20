// PrivacyPolicy.jsx
import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

function PrivacyPolicy({ isLogged, welcomeMessage, handleLogout }) {
    useDocumentTitle('Chính sách bảo mật');
  // Tự động cuộn lên đầu trang khi truy cập
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={handleLogout} 
      />
      
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:py-12 md:px-6">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 p-8 md:p-16 border border-white relative overflow-hidden">
          
          {/* Trang trí background nhẹ nhàng */}
          <div className="absolute top-0 left-0 w-40 h-40 bg-emerald-50 rounded-br-full -ml-20 -mt-20 opacity-60"></div>

          <header className="relative mb-12">
            <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-emerald-600 font-black text-sm uppercase tracking-[0.2em]">Privacy Center</span>
            </div>
            <h1 className="text-4xl font-black text-slate-800">Chính sách bảo mật</h1>
            <div className="h-1.5 w-24 bg-emerald-500 mt-4 rounded-full"></div>
            <p className="text-slate-400 text-sm mt-6 font-medium italic">Cập nhật lần cuối: 19/12/2025</p>
          </header>

          <div className="space-y-12 text-slate-600 leading-relaxed relative">
            
            <section className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100/50 text-slate-700">
              <p>
                Chúng tôi coi trọng quyền riêng tư của bạn. Là một nền tảng <strong>B2C Affiliate</strong>, TravelHub đóng vai trò cầu nối thông tin. Mọi giao dịch tài chính sẽ được thực hiện trực tiếp trên nền tảng của đối tác để đảm bảo an toàn tuyệt đối cho bạn.
              </p>
            </section>

            {/* Mục 1 */}
            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-baseline gap-3">
                <span className="text-emerald-500 text-3xl">1.</span>
                Dữ liệu chúng tôi thu thập
              </h2>
              <div className="grid gap-6 pl-0 md:pl-10">
                <div className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-emerald-200 transition-colors">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">1.1 Dữ liệu bạn cung cấp</h3>
                  <p>Họ tên, email, số điện thoại khi đăng ký tài khoản. Chúng tôi <strong>không</strong> thu thập số thẻ tín dụng hoặc mật khẩu thanh toán.</p>
                </div>

                <div className="bg-white border border-slate-100 p-5 rounded-2xl hover:border-emerald-200 transition-colors">
                  <h3 className="text-lg font-bold text-slate-800 mb-2">1.2 Dữ liệu tự động</h3>
                  <p>Địa chỉ IP, loại trình duyệt và hành vi tìm kiếm nhằm tối ưu hóa kết quả hiển thị phù hợp với nhu cầu của bạn.</p>
                </div>
              </div>
            </section>

            {/* Mục 2 */}
            <section className="relative">
              <div className="absolute -left-4 top-0 bottom-0 w-1 bg-emerald-100 rounded-full"></div>
              <h2 className="text-2xl font-black text-slate-800 mb-4 pl-4">2. Cách sử dụng dữ liệu</h2>
              <p className="pl-4">
                Thông tin của bạn giúp chúng tôi cá nhân hóa trải nghiệm du lịch, gửi mã giảm giá đặc quyền và cải thiện thuật toán tìm kiếm vé máy bay/khách sạn từ các đối tác Affiliate.
              </p>
            </section>

            {/* Mục 3 */}
            <section>
              <h2 className="text-2xl font-black text-slate-800 mb-4">3. Chia sẻ dữ liệu</h2>
              <p>
                Để hoàn tất việc đặt vé, chúng tôi sẽ chuyển hướng và chia sẻ các thông tin tìm kiếm cần thiết với đối tác Affiliate (Hãng bay, Khách sạn). Chúng tôi <strong>không bán</strong> dữ liệu cá nhân của bạn cho bất kỳ bên quảng cáo thứ ba nào.
              </p>
            </section>

            {/* Mục 4 & 5 */}
            <div className="grid md:grid-cols-2 gap-8">
                <section className="bg-slate-50 p-6 rounded-3xl">
                    <h2 className="text-xl font-black text-slate-800 mb-3">4. Bảo mật</h2>
                    <p className="text-sm">Sử dụng giao thức mã hóa SSL/TLS để bảo vệ dữ liệu trong quá trình bạn tìm kiếm thông tin trên trang web.</p>
                </section>
                <section className="bg-slate-50 p-6 rounded-3xl">
                    <h2 className="text-xl font-black text-slate-800 mb-3">5. Quyền của bạn</h2>
                    <p className="text-sm">Bạn có quyền truy cập, yêu cầu chỉnh sửa hoặc xóa vĩnh viễn dữ liệu tài khoản bất cứ lúc nào trong phần cài đặt.</p>
                </section>
            </div>

          </div>

          <footer className="mt-16 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-medium text-center md:text-left">
              Mọi thắc mắc vui lòng gửi về: <span className="text-blue-600">privacy@travelhub.com</span>
            </p>
            <button 
                onClick={() => window.print()}
                className="text-slate-500 text-sm font-bold hover:text-blue-600 transition-colors flex items-center gap-2"
            >
                🖨️ In bản chính sách
            </button>
          </footer>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default PrivacyPolicy;