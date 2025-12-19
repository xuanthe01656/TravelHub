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
      
      <main className="flex-1 max-w-4xl mx-auto w-full p-6 md:py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <FaQuestionCircle /> Help Center
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Câu hỏi thường gặp</h1>
          <p className="mt-4 text-slate-500 font-medium">Tìm câu trả lời nhanh nhất cho các thắc mắc của bạn về TravelHub</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index} 
              className={`group border border-slate-100 rounded-[2rem] bg-white transition-all duration-300 ${
                openIndex === index ? 'shadow-xl shadow-blue-100 ring-2 ring-blue-500' : 'hover:shadow-lg'
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 md:p-8 text-left"
              >
                <span className={`text-lg font-bold transition-colors ${openIndex === index ? 'text-blue-600' : 'text-slate-700'}`}>
                  {index + 1}. {faq.q}
                </span>
                <div className={`p-2 rounded-xl transition-transform duration-300 ${openIndex === index ? 'bg-blue-600 text-white rotate-180' : 'bg-slate-50 text-slate-400'}`}>
                  <FaChevronDown />
                </div>
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-500 ease-in-out ${
                  openIndex === index ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 pb-8 pt-0 text-slate-500 leading-relaxed font-medium">
                  <div className="h-[1px] bg-slate-100 mb-6 w-full" />
                  {faq.a}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Box Liên hệ hỗ trợ */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-8 md:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 -mr-32 -mt-32"></div>
          <h3 className="text-2xl font-black mb-4 relative z-10">Bạn vẫn chưa tìm thấy câu trả lời?</h3>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto relative z-10 font-medium">
            Đội ngũ hỗ trợ của chúng tôi luôn sẵn sàng giải đáp các vấn đề về kỹ thuật hoặc gợi ý hành trình cho bạn.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
            <button className="bg-blue-600 hover:bg-blue-700 px-8 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-500/20">
              <FaHeadset /> Chat với chúng tôi
            </button>
            <button className="bg-white/10 hover:bg-white/20 px-8 py-4 rounded-2xl font-black transition-all backdrop-blur-md flex items-center justify-center gap-2">
              <FaExternalLinkAlt className="text-sm" /> Gửi yêu cầu hỗ trợ
            </button>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default FAQ;