import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import {
  FaPlane,
  FaHandshake,
  FaShieldAlt,
  FaGlobeAsia,
  FaSearch,
  FaUsers
} from 'react-icons/fa';

function About({ isLogged, welcomeMessage, handleLogout }) {
  useDocumentTitle('Giới thiệu TravelHub');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
        <Helmet>
            <script type="application/ld+json">
                {JSON.stringify({
                "@context": "https://schema.org",
                "@type": "AboutPage",
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": "https://travelhub-production.up.railway.app/about"
                },
                "name": "Giới thiệu TravelHub",
                "url": "https://travelhub-production.up.railway.app/about",
                "inLanguage": "vi-VN",
                "isPartOf": {
                    "@type": "WebSite",
                    "name": "TravelHub",
                    "url": "https://travelhub-production.up.railway.app"
                },
                "about": {
                    "@type": "Organization",
                    "name": "TravelHub",
                    "url": "https://travelhub-production.up.railway.app",
                    "logo": {
                    "@type": "ImageObject",
                    "url": "https://travelhub-production.up.railway.app/logo.png"
                    }
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "TravelHub",
                    "url": "https://travelhub-production.up.railway.app"
                },
                "dateModified": "2025-12-19"
                })}
            </script>
        </Helmet>
    <div className="flex flex-col min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header
        isLogged={isLogged}
        welcomeMessage={welcomeMessage}
        handleLogout={handleLogout}
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pt-12 pb-20 md:pt-20">

        {/* HERO */}
        <section className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest mb-6">
            <FaGlobeAsia /> Về chúng tôi
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-slate-900 mb-6">
            TravelHub – Nền tảng tìm kiếm & so sánh dịch vụ du lịch
          </h1>

          <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto">
            Chúng tôi giúp bạn tìm ra lựa chọn tốt nhất từ các đối tác du lịch uy tín toàn cầu,
            một cách minh bạch, nhanh chóng và an toàn.
          </p>
        </section>

        {/* WHO WE ARE */}
        <section className="grid md:grid-cols-2 gap-12 mb-24 items-center">
          <div>
            <h2 className="text-3xl font-black mb-6 text-slate-900">
              TravelHub là ai?
            </h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              TravelHub là nền tảng <strong>Meta Search & Affiliate</strong> trong lĩnh vực du lịch,
              chuyên cung cấp công cụ tìm kiếm, so sánh và định hướng đặt vé máy bay,
              khách sạn và các dịch vụ liên quan.
            </p>
            <p className="text-slate-600 leading-relaxed">
              Chúng tôi <strong>không trực tiếp bán vé</strong> và
              <strong>không xử lý thanh toán</strong>. Thay vào đó, TravelHub đóng vai trò
              cầu nối giữa người dùng và các đối tác cung cấp dịch vụ đã được kiểm chứng.
            </p>
          </div>

          <div className="bg-white rounded-[2.5rem] shadow-xl p-8">
            <ul className="space-y-5 text-slate-700 font-medium">
              <li className="flex items-center gap-4">
                <FaSearch className="text-blue-600" />
                Tìm kiếm & so sánh giá theo thời gian thực
              </li>
              <li className="flex items-center gap-4">
                <FaPlane className="text-blue-600" />
                Dữ liệu từ hãng bay & OTA quốc tế
              </li>
              <li className="flex items-center gap-4">
                <FaUsers className="text-blue-600" />
                Phục vụ khách hàng B2C toàn cầu
              </li>
            </ul>
          </div>
        </section>

        {/* DATA & PARTNERS */}
        <section className="mb-24">
          <h2 className="text-3xl font-black text-center mb-12 text-slate-900">
            Nguồn dữ liệu & đối tác
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <FaHandshake className="text-3xl text-blue-600 mb-4" />
              <h3 className="font-black text-lg mb-3">Đối tác uy tín</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Kết nối với các hệ thống toàn cầu như GDS, OTA và hãng hàng không quốc tế
                thông qua API chính thức.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <FaShieldAlt className="text-3xl text-blue-600 mb-4" />
              <h3 className="font-black text-lg mb-3">Minh bạch & an toàn</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                TravelHub không lưu trữ thông tin thanh toán, mọi giao dịch được xử lý
                trực tiếp bởi đối tác.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <FaGlobeAsia className="text-3xl text-blue-600 mb-4" />
              <h3 className="font-black text-lg mb-3">Dữ liệu toàn cầu</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Giá và tình trạng chỗ được cập nhật theo thời gian thực,
                giúp người dùng tiếp cận lựa chọn tối ưu nhất.
              </p>
            </div>
          </div>
        </section>

        {/* VISION */}
        <section className="bg-gradient-to-br from-blue-700 to-blue-600 rounded-[3rem] p-10 md:p-16 text-white text-center shadow-2xl shadow-blue-200">
          <h2 className="text-3xl md:text-4xl font-black mb-6">
            Tầm nhìn của TravelHub
          </h2>
          <p className="text-blue-100 max-w-3xl mx-auto text-lg font-medium">
            Trở thành nền tảng trung gian du lịch đáng tin cậy hàng đầu,
            nơi người dùng có thể tiếp cận dữ liệu minh bạch,
            còn đối tác có thể mở rộng thị trường một cách bền vững.
          </p>
        </section>

      </main>

      <Footer />
    </div>
    </>
  );
}

export default About;
