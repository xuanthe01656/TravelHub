import React, { useState,useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { 
  FaPlaneDeparture, FaBars, FaTimes, FaPlane, FaHome, 
  FaCar, FaSignOutAlt, FaUserCog 
} from 'react-icons/fa';

const Header = ({ isLogged, welcomeMessage, handleLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = ''; 
    }
  
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);
  const navItems = [
    { name: 'Trang Chủ', icon: <FaHome />, path: '/dashboard' },
    { name: 'Vé Máy Bay', icon: <FaPlane />, path: '/flights' },
    { name: 'Khách Sạn', icon: <FaHome />, path: '/hotels' },
    { name: 'Đặt Xe', icon: <FaCar />, path: '/cars' },
  ];

  const getNavLinkClass = ({ isActive }) => {
    const baseClass = "flex items-center gap-3 px-5 py-4 lg:py-2 lg:px-4 rounded-xl transition-all font-bold text-[15px] lg:text-sm whitespace-nowrap w-full lg:w-auto";
    const activeClass = "bg-blue-600 text-white lg:bg-blue-50 lg:text-blue-600 shadow-md lg:shadow-none";
    const inactiveClass = "text-slate-600 hover:bg-slate-50 hover:text-blue-600";
    return `${baseClass} ${isActive ? activeClass : inactiveClass}`;
  };

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-800 p-3 md:p-4 sticky top-0 z-[100] shadow-sm border-b border-slate-100 font-sans">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <div 
          className="text-xl md:text-2xl font-black flex items-center cursor-pointer text-blue-600 tracking-tighter shrink-0 relative z-[110]" 
          onClick={() => navigate('/')}
        >
          <FaPlaneDeparture className="mr-2 text-2xl md:text-3xl" /> TravelHub
        </div>

        {/* Menu Toggle Button */}
        <button 
          className="lg:hidden text-slate-700 text-2xl p-2 relative z-[130]" 
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Overlay: Sửa lỗi nhìn xuyên thấu bằng cách làm mờ nền phía sau */}
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[115] lg:hidden animate-in fade-in duration-300" 
            onClick={() => setMenuOpen(false)} 
          />
        )}

        {/* Navigation Drawer: Sửa lại màu nền bg-white đặc */}
        <nav className={`
          fixed lg:relative top-0 right-0 h-screen lg:h-auto w-[280px] lg:w-auto 
          bg-white lg:bg-transparent shadow-[-10px_0_30px_rgba(0,0,0,0.1)] lg:shadow-none 
          transition-all duration-300 ease-in-out z-[120] lg:z-auto
          flex flex-col lg:flex-row items-start lg:items-center gap-2 lg:gap-4 p-6 lg:p-0
          ${menuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full lg:translate-x-0 opacity-0 lg:opacity-100'}
          ${menuOpen ? 'visible' : 'invisible lg:visible'}
        `}>
          {/* Mobile Menu Header */}
          <div className="flex justify-between items-center lg:hidden mb-8 w-full border-b border-slate-100 pb-4">
            <span className="font-black text-xl text-blue-600">Menu</span>
            {/* <button onClick={() => setMenuOpen(false)} className="p-2 text-slate-400 hover:text-red-500">
              <FaTimes className="text-xl" />
            </button> */}
          </div>

          {/* Nav Links */}
          <div className="flex flex-col lg:flex-row gap-2 lg:gap-1 w-full lg:w-auto overflow-y-auto">
            {navItems.map((item) => (
              <NavLink 
                key={item.name} 
                to={item.path} 
                className={getNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                <span className="text-xl lg:text-base">{item.icon}</span> 
                {item.name}
              </NavLink>
            ))}
          </div>
          <div className="mt-auto lg:hidden w-full border-t border-slate-100 pt-6 space-y-3">
            {isLogged ? (
              <>
                <NavLink 
                  to="/profile" 
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-slate-50 text-slate-700 font-bold text-[15px] w-full border border-slate-100"
                  onClick={() => setMenuOpen(false)}
                >
                  <FaUserCog className="text-xl text-blue-600" /> Trang cá nhân
                </NavLink>
                <button 
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-50 text-red-600 font-bold text-[15px] w-full border border-red-100"
                >
                  <FaSignOutAlt className="text-xl" /> Đăng xuất
                </button>
              </>
            ) : (
              <button 
                onClick={() => { navigate('/login'); setMenuOpen(false); }}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-200 active:scale-[0.98] transition-all"
              >
                Đăng Nhập Ngay
              </button>
            )}
          </div>
        </nav>
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {isLogged ? (
            <div className="flex items-center bg-slate-50 rounded-2xl p-1 pr-3 border border-slate-100">
              <NavLink 
                to="/profile" 
                className={({ isActive }) => `
                  flex items-center gap-2 p-1.5 rounded-xl transition-all group
                  ${isActive ? 'bg-white shadow-sm ring-1 ring-blue-100' : 'hover:bg-white hover:shadow-sm'}
                `}
                title="Quản lý tài khoản"
              >
                <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-200 shadow-lg group-hover:bg-blue-700 transition-colors">
                  <FaUserCog className="text-sm" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Thành viên</span>
                  <span className="text-sm font-black text-slate-700 max-w-[120px] truncate">
                    {welcomeMessage?.replace('Chào, ', '') || 'Bạn'}
                  </span>
                </div>
              </NavLink>
              
              <div className="w-[1px] h-6 bg-slate-200 mx-2"></div>
              <button 
                onClick={handleLogout} 
                className="text-slate-400 hover:text-red-500 transition-colors p-1.5"
                title="Đăng xuất"
              >
                <FaSignOutAlt className="text-xl" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')} 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-200/50 transition-all active:scale-95 flex items-center gap-2"
            >
              Đăng Nhập
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;