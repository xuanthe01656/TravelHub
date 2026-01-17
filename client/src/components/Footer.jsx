import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaPlaneDeparture, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt,
  FaFacebookF, FaLinkedinIn, FaInstagram, FaTwitter, FaPaperPlane
} from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation('common');

  return (
    <footer className="bg-white border-t border-slate-100 pt-20 pb-10 px-6 mt-20 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">

          {/* Brand */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg">
                <FaPlaneDeparture className="text-xl" />
              </div>
              <span className="font-black text-2xl tracking-tighter text-slate-800">
                Travel<span className="text-blue-600">Hub</span>
              </span>
            </div>
            
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm">
              {t('footer.company.description')}
            </p>

            {/* Newsletter */}
            <div className="pt-2">
              <p className="text-slate-800 font-bold text-sm mb-3">
                {t('footer.newsletter.title')}
              </p>
              <div className="flex gap-2 max-w-sm">
                <input 
                  type="email" 
                  placeholder={t('footer.newsletter.placeholder')}
                  className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-sm w-full outline-none focus:border-blue-300"
                />
                <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700">
                  <FaPaperPlane className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-slate-900 font-black text-sm uppercase tracking-widest">
              {t('footer.legal.title')}
            </h4>
            <ul className="space-y-3">
              {['about', 'privacy', 'terms', 'faq'].map(key => (
                <li key={key}>
                  <Link
                    to={`/${key === 'faq' ? 'fqa' : key}`}
                    className="text-slate-500 hover:text-blue-600 text-sm font-medium"
                  >
                    {t(`footer.legal.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3 space-y-5">
            <h4 className="text-slate-900 font-black text-sm uppercase tracking-widest">
              {t('footer.contact.title')}
            </h4>
            <ul className="space-y-4">
              <li className="flex gap-3 text-sm">
                <FaMapMarkerAlt className="text-blue-600 mt-1" />
                <span className="text-slate-500">{t('footer.contact.address')}</span>
              </li>
              <li className="flex gap-3 text-sm">
                <FaPhoneAlt className="text-blue-600 mt-1" />
                <span className="text-slate-500 font-bold">{t('footer.contact.phone')}</span>
              </li>
              <li className="flex gap-3 text-sm">
                <FaEnvelope className="text-blue-600 mt-1" />
                <span className="text-slate-500">{t('footer.contact.email')}</span>
              </li>
            </ul>
          </div>

          {/* Trust */}
          <div className="lg:col-span-3 space-y-6 flex flex-col items-start lg:items-end">
            <h4 className="text-slate-900 font-black text-sm uppercase tracking-widest">
              {t('footer.trust.title')}
            </h4>

            <img
              src="https://chinhphu.vn/images/da-thong-bao-bo-cong-thuong.png"
              alt="Bộ Công Thương"
              className="w-36 opacity-80"
            />

            <div className="flex gap-3">
              {[FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white">
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-20 pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-medium text-slate-400">
            © {new Date().getFullYear()} TravelHub. {t('footer.copyright')}
          </p>
          <div className="flex gap-6 text-[11px] font-bold text-slate-400 uppercase">
            <span>{t('footer.tax')}</span>
            <Link to="/termsofuse">{t('footer.legal.terms')}</Link>
            <Link to="/privacypolicy">{t('footer.legal.privacy')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
