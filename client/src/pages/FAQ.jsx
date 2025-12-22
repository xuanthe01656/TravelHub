// FAQ.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { FaChevronDown, FaQuestionCircle, FaExternalLinkAlt, FaHeadset } from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

function FAQ({ isLogged, welcomeMessage, handleLogout }) {
  const [openIndex, setOpenIndex] = useState(null);
  useDocumentTitle('Câu hỏi thường gặp');
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const faqs = [
    {
      q: "Trang web TravelHub hoạt động như thế nào?",
      a: "Chúng tôi là nền tảng B2C hoạt động theo mô hình Affiliate. TravelHub kết nối trực tiếp với API của các hãng hàng không và khách sạn để giúp bạn tìm kiếm giá rẻ nhất. Khi bạn đặt dịch vụ, chúng tôi sẽ chuyển hướng bạn đến hệ thống của đối tác uy tín để thanh toán an toàn."
    },
    {
      q: "Tôi có thể thanh toán trực tiếp trên TravelHub không?",
      a: "Hiện tại, để đảm bảo an toàn bảo mật tuyệt đối, TravelHub không giữ thông tin thẻ của bạn. Mọi giao dịch thanh toán và xuất vé sẽ được xử lý trực tiếp bởi các đối tác Affiliate (như Amadeus, Singapore Air, Agoda...). Điều này giúp bạn tránh được rủi ro lộ thông tin thanh toán qua bên thứ ba."
    },
    {
      q: "Làm thế nào để tôi thay đổi hoặc hủy vé?",
      a: "Vì giao dịch được thực hiện trực tiếp với đối tác, mọi yêu cầu đổi ngày bay hoặc hoàn tiền cần được thực hiện thông qua tổng đài hỗ trợ của đối tác đó (thông tin có trong email xác nhận đặt vé của bạn). TravelHub chỉ cung cấp công cụ tìm kiếm dữ liệu ban đầu."
    },
    {
      q: "Giá vé hiển thị trên trang có chính xác không?",
      a: "Giá vé được cập nhật theo thời gian thực từ API đối tác. Tuy nhiên, giá có thể thay đổi trong vài phút tùy thuộc vào số lượng chỗ ngồi thực tế. Chúng tôi khuyến khích bạn hoàn tất thủ tục ngay sau khi tìm thấy mức giá ưng ý trên trang đối tác."
    },
    {
      q: "Tôi cần làm gì nếu gặp lỗi trong quá trình thanh toán?",
      a: "Nếu trang thanh toán báo lỗi, hãy kiểm tra lại kết nối mạng hoặc hạn mức thẻ của bạn. Nếu tiền đã bị trừ nhưng không nhận được vé, vui lòng liên hệ trực tiếp với bộ phận chăm sóc khách hàng của đối tác cung cấp dịch vụ (Hãng bay/Khách sạn) để được xử lý nhanh nhất."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={handleLogout} 
      />
      
      {/* Căn chỉnh lại padding-top để đồng bộ với Header Sticky */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pt-12 pb-16 md:pt-20">
        
        {/* Section Title: Đồng bộ với màu Blue-600 của Logo */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-6">
            <FaQuestionCircle className="text-sm" /> Trung tâm hỗ trợ
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter mb-6">
            Câu hỏi thường gặp
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
            Mọi thứ bạn cần biết về mô hình đặt vé của TravelHub.
          </p>
        </div>

        {/* FAQ List: Chuẩn hóa Bo góc và Shadow */}
        <div className="grid gap-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`border border-slate-200/60 rounded-3xl bg-white transition-all duration-500 ${
                openIndex === index ? 'shadow-2xl shadow-blue-100/50 ring-1 ring-blue-500/20' : 'hover:shadow-md'
              }`}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 md:p-7 text-left outline-none"
              >
                <span className={`text-[17px] md:text-lg font-bold pr-8 transition-colors ${openIndex === index ? 'text-blue-600' : 'text-slate-700'}`}>
                  {faq.q}
                </span>
                <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${openIndex === index ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-100 text-slate-400'}`}>
                  <FaChevronDown className="text-xs" />
                </div>
              </button>
              
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-7 pb-7 text-slate-500 leading-relaxed font-medium text-[15px] md:text-base border-t border-slate-50 pt-5">
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Box: Đồng bộ Gradient với Header Logo */}
        <div className="mt-20 bg-gradient-to-br from-blue-700 to-blue-600 rounded-[2.5rem] p-8 md:p-14 text-center text-white relative overflow-hidden shadow-2xl shadow-blue-200">
           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
           <h3 className="text-2xl md:text-3xl font-black mb-4 relative z-10">Bạn cần hỗ trợ trực tiếp?</h3>
           <p className="text-blue-100 mb-10 max-w-lg mx-auto relative z-10 font-medium">
             Đội ngũ chăm sóc khách hàng của chúng tôi luôn trực tuyến để xử lý các yêu cầu khẩn cấp của bạn.
           </p>
           <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
             <button className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black transition-all hover:bg-blue-50 active:scale-95 shadow-lg">
               Liên hệ Hotline
             </button>
             <button className="bg-blue-800/30 backdrop-blur-md text-white border border-blue-400/30 px-8 py-4 rounded-2xl font-black transition-all hover:bg-blue-800/50">
               Gửi Ticket hỗ trợ
             </button>
           </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default FAQ;