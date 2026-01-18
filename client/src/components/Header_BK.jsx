import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

import {
 FaPlaneDeparture,
 FaBars,
 FaTimes,
 FaPlane,
 FaHome,
 FaCar,
 FaSignOutAlt,
 FaUserCog,
 FaGlobe
} from 'react-icons/fa';

const Header = ({ isLogged, welcomeMessage, handleLogout }) => {
 const navigate = useNavigate();
 const { t, i18n } = useTranslation();

 const [menuOpen, setMenuOpen] = useState(false);

 // Local auth fallback
 const [localAuth, setLocalAuth] = useState({
  isLogged,
  name: welcomeMessage
 });

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
  document.body.style.overflow = menuOpen ? 'hidden' : '';
  return () => (document.body.style.overflow = '');
 }, [menuOpen]);

 const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
 };

 const navItems = [
  { name: t('nav.home'), icon: <FaHome />, path: '/dashboard' },
  { name: t('nav.flights'), icon: <FaPlane />, path: '/flights' },
  { name: t('nav.hotels'), icon: <FaHome />, path: '/hotels' },
  { name: t('nav.cars'), icon: <FaCar />, path: '/cars' }
 ];

 const getNavLinkClass = ({ isActive }) => {
  const base =
   'flex items-center gap-3 px-5 py-4 lg:py-2 lg:px-4 rounded-xl transition-all font-bold text-[15px] lg:text-sm w-full lg:w-auto';
  return `${base} ${
   isActive
    ? 'bg-blue-600 text-white lg:bg-blue-50 lg:text-blue-600'
    : 'text-slate-600 hover:bg-slate-50 hover:text-blue-600'
  }`;
 };

 return (
  <header className="bg-white/95 backdrop-blur-md sticky top-0 z-[1000] shadow-sm border-b border-slate-100">
   <div className="max-w-7xl mx-auto flex items-center justify-between p-3 md:p-4">

    {/* Logo */}
    <div
     className="flex items-center text-blue-600 font-black text-xl md:text-2xl cursor-pointer"
     onClick={() => navigate('/')}
    >
     <FaPlaneDeparture className="mr-2 text-2xl md:text-3xl" />
     TravelHub
    </div>

    {/* Mobile menu button */}
    <button
     className="lg:hidden text-2xl text-slate-700"
     onClick={() => setMenuOpen(!menuOpen)}
    >
     {menuOpen ? <FaTimes /> : <FaBars />}
    </button>

    {/* Overlay */}
    {menuOpen && (
     <div
      className="fixed inset-0 bg-black/50 z-[900] lg:hidden"
      onClick={() => setMenuOpen(false)}
     />
    )}

    {/* Navigation */}
    <nav
     className={`fixed lg:static top-0 right-0 h-screen lg:h-auto w-[280px] lg:w-auto bg-white lg:bg-transparent z-[950]
     transform transition-transform duration-300
     ${menuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
     flex flex-col lg:flex-row gap-4 p-6 lg:p-0`}
    >

     {/* Mobile Header */}
     <div className="lg:hidden flex justify-between items-center mb-6">
      <span className="font-black text-blue-600 text-lg">Menu</span>
     </div>

     {/* Nav Items */}
     <div className="flex flex-col lg:flex-row gap-2">
      {navItems.map(item => (
       <NavLink
        key={item.path}
        to={item.path}
        className={getNavLinkClass}
        onClick={() => setMenuOpen(false)}
       >
        <span className="text-xl lg:text-base">{item.icon}</span>
        {item.name}
       </NavLink>
      ))}
     </div>

     {/* Mobile Language Switch */}
     <div className="lg:hidden mt-6">
      <div className="flex items-center gap-2 mb-3 text-sm font-bold text-slate-500">
       <FaGlobe /> Language
      </div>
      <div className="flex gap-2">
       {['vi', 'en'].map(lng => (
        <button
         key={lng}
         onClick={() => changeLanguage(lng)}
         className={`flex-1 py-3 rounded-xl font-black text-sm ${
          i18n.language === lng
           ? 'bg-blue-600 text-white'
           : 'bg-slate-100 text-slate-600'
         }`}
        >
         {lng === 'vi' ? 'Tiếng Việt' : 'English'}
        </button>
       ))}
      </div>
     </div>
     <div className="lg:hidden mt-auto pt-6 border-t border-slate-100">
      {localAuth.isLogged ? (
       <>
        <NavLink
         to="/profile"
         onClick={() => setMenuOpen(false)}
         className="flex items-center gap-3 px-5 py-4 rounded-xl bg-slate-50 font-bold"
        >
         <FaUserCog className="text-blue-600" />
         {t('profile.title')}
        </NavLink>
        <button
         onClick={handleLogout}
         className="mt-3 w-full bg-red-50 text-red-600 py-4 rounded-xl font-black"
        >
         {t('auth.logout')}
        </button>
       </>
      ) : (
       <button
        onClick={() => navigate('/login')}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-black"
       >
        {t('auth.login')}
       </button>
      )}
     </div>
    </nav>
    <div className="hidden lg:flex items-center gap-3">
     <div className="flex gap-1">
      {['vi', 'en'].map(lng => (
       <button
        key={lng}
        onClick={() => changeLanguage(lng)}
        className={`px-3 py-1.5 rounded-xl text-xs font-black ${
         i18n.language === lng
          ? 'bg-blue-600 text-white'
          : 'bg-slate-100 text-slate-600'
        }`}
       >
        {lng.toUpperCase()}
       </button>
      ))}
     </div>

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
   </div>
  </header>
 );
};

export default Header;