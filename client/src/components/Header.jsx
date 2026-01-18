import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import {
  FaPlaneDeparture, FaBars, FaTimes, FaPlane, FaHome,
  FaCar, FaSignOutAlt, FaUserCog, FaChevronDown, FaWallet
} from 'react-icons/fa';

const Header = ({ isLogged, welcomeMessage, handleLogout }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // States
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'lang' | 'currency' | null
  const [currency, setCurrency] = useState(localStorage.getItem('currency') || 'VND');
  
  const langRef = useRef(null);
  const currRef = useRef(null);

  const languages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', native: 'Tiếng Việt' },
    { code: 'en', name: 'English', flag: '🇺🇸', native: 'English' }
  ];

  const currencies = [
    { code: 'VND', symbol: '₫', name: 'Việt Nam Đồng' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' }
  ];

  const currentLang = languages.find(l => l.code === (i18n.language || 'vi')) || languages[0];
  const currentCurr = currencies.find(c => c.code === currency) || currencies[0];

  // Close dropdowns on click outside
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
    setActiveDropdown(null);
  };

  const changeCurrency = (code) => {
    setCurrency(code);
    localStorage.setItem('currency', code);
    setActiveDropdown(null);
  };

  const navItems = [
    { name: t('nav.home'), icon: <FaHome />, path: '/dashboard' },
    { name: t('nav.flights'), icon: <FaPlane />, path: '/flights' },
    { name: t('nav.hotels'), icon: <FaHome />, path: '/hotels' },
    { name: t('nav.cars'), icon: <FaCar />, path: '/cars' }
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-[1000] border-b border-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
            <FaPlaneDeparture className="text-xl" />
          </div>
          <span className="font-black text-xl tracking-tighter text-slate-800 hidden sm:block">
            Travel<span className="text-blue-600">Hub</span>
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/50 p-1 rounded-2xl">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all
                ${isActive ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-blue-600'}
              `}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Desktop Actions */}
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

          {/* User Profile / Login */}
          {isLogged ? (
            <div className="flex items-center gap-3 pl-2">
              <NavLink to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                  {welcomeMessage?.charAt(0).toUpperCase() || <FaUserCog />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-slate-400 font-bold leading-none uppercase">Member</span>
                  <span className="text-sm font-black text-slate-700 max-w-[100px] truncate">{welcomeMessage}</span>
                </div>
              </NavLink>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-blue-100 transition-all active:scale-95"
            >
              {t('auth.login')}
            </button>
          )}
        </div>

        {/* Mobile Button */}
        <button className="lg:hidden p-2 text-slate-600 text-xl" onClick={() => setMenuOpen(true)}>
          <FaBars />
        </button>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-[2000] lg:hidden transition-all duration-300 ${menuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity ${menuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMenuOpen(false)} />
        <div className={`absolute right-0 top-0 h-full w-[300px] bg-white shadow-2xl transition-transform duration-300 p-6 flex flex-col ${menuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between mb-8">
            <span className="font-black text-blue-600">TRAVELHUB</span>
            <button className="p-2 bg-slate-100 rounded-full" onClick={() => setMenuOpen(false)}><FaTimes /></button>
          </div>

          <div className="space-y-2 mb-8">
            {navItems.map(item => (
              <NavLink key={item.path} to={item.path} onClick={() => setMenuOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 transition-all">
                <span className="text-xl text-blue-600/50">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </div>

          {/* Mobile Lang & Currency */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Currency</p>
              <select 
                value={currency} 
                onChange={(e) => changeCurrency(e.target.value)}
                className="bg-transparent font-bold text-sm outline-none w-full"
              >
                {currencies.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
              </select>
            </div>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Language</p>
              <select 
                value={i18n.language} 
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent font-bold text-sm outline-none w-full"
              >
                {languages.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-auto">
            {isLogged ? (
              <button onClick={handleLogout} className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black transition-active active:scale-95">
                {t('auth.logout')}
              </button>
            ) : (
              <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 transition-active active:scale-95">
                {t('auth.login')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;