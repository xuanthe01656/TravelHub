// TermsOfUse.jsx
import React, { useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

// Nhận các props từ App.jsx truyền xuống
function TermsOfUse({ isLogged, welcomeMessage, handleLogout }) {
    useDocumentTitle('Điều khoản sử dụng');
  // Cuộn lên đầu trang khi vào trang này
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
      
      <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-12">
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 p-8 md:p-16 border border-white relative overflow-hidden">
          {/* Trang trí góc trên */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>

          <header className="relative mb-12">
            <span className="text-blue-600 font-black text-sm uppercase tracking-[0.2em]">TravelHub Legal</span>
            <h1 className="text-4xl font-black text-slate-800 mt-2">Điều khoản sử dụng</h1>
            <div className="h-1 w-20 bg-blue-600 mt-4 rounded-full"></div>
            <p className="text-slate-400 text-sm mt-6 font-medium italic">Cập nhật lần cuối: 19/12/2025</p>
          </header>

          <div className="space-y-10 text-slate-600 leading-relaxed">
            <section className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <p className="font-medium text-slate-700">
                Bằng cách sử dụng trang web của chúng tôi theo mô hình <span className="text-blue-600 font-bold">B2C Affiliate</span>, bạn đồng ý với các điều khoản sau. Chúng tôi cung cấp dịch vụ tìm kiếm và hiển thị thông tin; việc thanh toán sẽ được xử lý bởi đối tác liên kết.
              </p>
            </section>
            
            <section>
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-sm">1</span>
                Năng lực pháp lý
              </h2>
              <p className="pl-11">Bạn phải đủ 18 tuổi để sử dụng dịch vụ tìm kiếm và hiển thị thông tin trên nền tảng của chúng tôi.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-sm">2</span>
                Đăng ký tài khoản
              </h2>
              <p className="pl-11">Thông tin đăng ký phải chính xác và được cập nhật để hỗ trợ hệ thống gợi ý các chuyến bay và ưu đãi hiệu quả nhất.</p>
            </section>
            
            <section className="border-l-4 border-blue-100 pl-7">
              <h2 className="text-xl font-black text-slate-800 mb-4">3. Phí và thanh toán</h2>
              <p>Chúng tôi <strong>không xử lý thanh toán trực tiếp</strong>. Bạn sẽ được chuyển hướng đến đối tác Affiliate uy tín để thanh toán và xuất vé. Bạn có trách nhiệm tuân thủ các điều khoản riêng biệt của đối tác đó.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-3">
                <span className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-xl text-sm border-2 border-blue-600 bg-transparent text-blue-600">4</span>
                Sở hữu trí tuệ
              </h2>
              <p className="pl-11">Tất cả nội dung, giao diện, logo và dữ liệu tìm kiếm thuộc sở hữu trí tuệ của TravelHub hoặc các đối tác hàng không liên kết.</p>
            </section>
          </div>

          <div className="mt-16 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm">Bạn có thắc mắc về điều khoản? <a href="/faq" className="text-blue-600 font-bold hover:underline">Xem FAQ</a></p>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default TermsOfUse;