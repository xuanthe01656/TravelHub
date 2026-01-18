import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  FaPlaneDeparture, FaBars, FaTimes, FaPlane, FaHome,
  FaCar, FaSignOutAlt, FaUserCog, FaChevronDown,
  FaHotel, FaGlobe, FaMoneyBillWave, FaCheck
} from 'react-icons/fa';

const Header = ({ isLogged, welcomeMessage, handleLogout }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [localAuth, setLocalAuth] = useState({
    isLogged,
    name: welcomeMessage
   });
  const [activeDropdown, setActiveDropdown] = useState(null); 
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'VND');
  
  const [mobileSettingOpen, setMobileSettingOpen] = useState(null);
  const langRef = useRef(null);
  const currRef = useRef(null);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  const currencies = [
    { code: 'VND', symbol: '₫', name: 'VNĐ' },
    { code: 'USD', symbol: '$', name: 'USD' },
    { code: 'EUR', symbol: '€', name: 'EUR' }
  ];

  const currentLang = languages.find(l => l.code === (i18n.language || 'vi')) || languages[0];
  const currentCurr = currencies.find(c => c.code === currency) || currencies[0];
useEffect(() => {
  setLocalAuth({ isLogged, name: welcomeMessage });
 }, [isLogged, welcomeMessage]);

 // Self-heal session check
 useEffect(() => {
  if (!isLogged) {
   axios.get('/api/session')
    .then(res => {
     if (res.data?.loggedIn) {
      setLocalAuth({
       isLogged: true,
       name: res.data.user.name
      });
     }
    })
    .catch(() => {});
  }
 }, [isLogged]);
 useEffect(() => {
    if (menuOpen) {
      // Ngăn scroll trên desktop
      document.body.style.overflow = 'hidden';
      // Ngăn scroll trên iOS Safari (touchmove)
      document.body.style.touchAction = 'none';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
      document.body.style.position = 'static';
      setMobileSettingOpen(null);
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.body.style.touchAction = 'unset';
      document.body.style.position = 'static';
    };
  }, [menuOpen]);

  // Đóng dropdown desktop khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        if (activeDropdown === 'lang') setActiveDropdown(null);
      }
      if (currRef.current && !currRef.current.contains(e.target)) {
        if (activeDropdown === 'currency') setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
    setMobileSettingOpen(null);
  };

  const changeCurrency = (code) => {
    setCurrency(code);
    localStorage.setItem('currency', code);
    setMobileSettingOpen(null);
  };

  const navItems = [
    { name: t('nav.home'), icon: <FaHome />, path: '/dashboard' },
    { name: t('nav.flights'), icon: <FaPlane />, path: '/flights' },
    { name: t('nav.hotels'), icon: <FaHotel />, path: '/hotels' },
    { name: t('nav.cars'), icon: <FaCar />, path: '/cars' }
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-[1000] border-b border-slate-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        
        {/* --- LOGO --- */}
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 group-hover:rotate-12 transition-transform duration-300">
            <FaPlaneDeparture className="text-xl" />
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-800 hidden sm:block">
            Travel<span className="text-blue-600">Hub</span>
          </span>
          {/* Mobile Logo Text */}
          <span className="font-black text-xl tracking-tighter text-slate-800 sm:hidden">
            Travel<span className="text-blue-600">Hub</span>
          </span>
        </div>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300
                ${isActive 
                  ? 'bg-white text-blue-600 shadow-md scale-105' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}
              `}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* --- DESKTOP ACTIONS --- */}
        <div className="hidden lg:flex items-center gap-3">
          
          {/* Currency Dropdown */}
          <div className="relative" ref={currRef}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'currency' ? null : 'currency')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all text-sm font-bold text-slate-700 border border-transparent hover:border-slate-200"
            >
              <span className="text-blue-600 font-black">{currentCurr.symbol}</span>
              <span>{currentCurr.code}</span>
              <FaChevronDown className={`text-[10px] transition-transform ${activeDropdown === 'currency' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'currency' && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {currencies.map(c => (
                  <button
                    key={c.code}
                    onClick={() => changeCurrency(c.code)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${currency === c.code ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span>{c.name}</span>
                    <span className="opacity-50">{c.symbol}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Language Dropdown */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setActiveDropdown(activeDropdown === 'lang' ? null : 'lang')}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-100 transition-all text-sm font-bold text-slate-700 border border-transparent hover:border-slate-200"
            >
              <span className="text-lg">{currentLang.flag}</span>
              <FaChevronDown className={`text-[10px] transition-transform ${activeDropdown === 'lang' ? 'rotate-180' : ''}`} />
            </button>
            {activeDropdown === 'lang' && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${i18n.language === l.code ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                  >
                    <span className="text-lg">{l.flag}</span>
                    {l.native}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="h-8 w-[1px] bg-slate-200 mx-2" />
           {localAuth.isLogged ? (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
                <NavLink to="/profile" className="flex items-center gap-2">
                <FaUserCog className="text-blue-600" />
                <span className="font-bold text-sm max-w-[120px] truncate">
                  {localAuth.name}
                </span>
                </NavLink>
                <button onClick={handleLogout}>
                <FaSignOutAlt className="text-slate-400 hover:text-red-500" />
                </button>
              </div>
              ) : (
              <button
                onClick={() => navigate('/login')}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black"
              >
                {t('auth.login')}
              </button>
            )}
        </div>
        <button 
          className="lg:hidden p-2 text-slate-600 text-xl hover:bg-slate-100 rounded-full transition-colors" 
          onClick={() => setMenuOpen(true)}
        >
          <FaBars />
        </button>
      </div>
      <div className={`fixed inset-0 z-[1500] lg:hidden ${menuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
        
        <div className={`absolute right-0 top-0 w-[85%] max-w-[320px] bg-slate-50 shadow-2xl transition-transform duration-300 flex flex-col ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}
          style={{height: '100vh'}}
        >
          
          {/* 1. Header Sidebar */}
          <div className="p-6 bg-white flex items-center justify-between border-b border-slate-100">
            <span className="font-black text-slate-800 uppercase tracking-widest text-sm">{t('common.menu')}</span>
            <button className="p-2 bg-slate-100 rounded-full text-slate-500" onClick={() => setMenuOpen(false)}><FaTimes /></button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* 2. Profile Section */}
            {localAuth.isLogged ? (
              <div className="p-6 bg-white mb-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-blue-100">
                  {welcomeMessage?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter">{welcomeMessage}</p>
                  <p className="font-black text-slate-800 leading-tight">{localAuth.name}</p>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-200">
                  {t('auth.login')}
                </button>
              </div>
            )}

            {/* 3. Main Nav */}
            <div className="px-4 space-y-1 mb-6">
              {navItems.map(item => (
                <NavLink key={item.path} to={item.path} onClick={() => setMenuOpen(false)} 
                  className={({ isActive }) => `flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-white'}`}>
                  <span className="text-xl">{item.icon}</span>
                  {item.name}
                </NavLink>
              ))}
            </div>

            {/* 4. NEW MODERN DROPDOWNS (LANGUAGE & CURRENCY) */}
            <div className="px-4 space-y-3">
              <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{t('common.settings')}</p>
              
              {/* Language Selector */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setMobileSettingOpen(mobileSettingOpen === 'lang' ? null : 'lang')}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center"><FaGlobe /></div>
                    <span className="font-bold text-slate-700 text-sm">{t('common.language')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{currentLang.name}</span>
                    <FaChevronDown className={`text-[10px] text-slate-300 transition-transform ${mobileSettingOpen === 'lang' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 bg-slate-50 ${mobileSettingOpen === 'lang' ? 'max-h-40 border-t border-slate-50' : 'max-h-0'}`}>
                  {languages.map(l => (
                    <button key={l.code} onClick={() => changeLanguage(l.code)} className="w-full p-4 flex items-center justify-between hover:bg-blue-50">
                      <div className="flex items-center gap-3">
                        <span>{l.flag}</span>
                        <span className={`text-sm ${i18n.language === l.code ? 'font-black text-blue-600' : 'font-medium text-slate-600'}`}>{l.name}</span>
                      </div>
                      {i18n.language === l.code && <FaCheck className="text-blue-600 text-xs" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency Selector */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setMobileSettingOpen(mobileSettingOpen === 'curr' ? null : 'curr')}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-green-50 text-green-500 flex items-center justify-center"><FaMoneyBillWave /></div>
                    <span className="font-bold text-slate-700 text-sm">{t('common.currency')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400">{currentCurr.code}</span>
                    <FaChevronDown className={`text-[10px] text-slate-300 transition-transform ${mobileSettingOpen === 'curr' ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                <div className={`overflow-hidden transition-all duration-300 bg-slate-50 ${mobileSettingOpen === 'curr' ? 'max-h-60 border-t border-slate-50' : 'max-h-0'}`}>
                  {currencies.map(c => (
                    <button key={c.code} onClick={() => changeCurrency(c.code)} className="w-full p-4 flex items-center justify-between hover:bg-blue-50">
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-bold text-slate-400">{c.symbol}</span>
                        <span className={`text-sm ${currency === c.code ? 'font-black text-blue-600' : 'font-medium text-slate-600'}`}>{c.name}</span>
                      </div>
                      {currency === c.code && <FaCheck className="text-blue-600 text-xs" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 5. Footer Sidebar */}
          <div className="p-6">
            {isLogged && (
              <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 p-4 bg-red-50 text-red-600 rounded-2xl font-black transition-active active:scale-95">
                <FaSignOutAlt />
                {t('auth.logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;