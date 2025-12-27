import React from 'react';
import { FaCar, FaUserFriends, FaCog, FaGasPump, FaArrowRight, FaCheckCircle, FaSnowflake } from 'react-icons/fa';

const CarCard = ({ car, onSelect, pickupDate, dropoffDate }) => {
  if (!car) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "--/--";
    const d = new Date(dateString);
    return isNaN(d.getTime()) 
      ? dateString 
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Ảnh xe */}
      <div className="relative h-48 overflow-hidden bg-slate-100">
        <img 
          src={car.image || `https://placehold.co/600x400?text=${encodeURIComponent(car.name)}`} 
          alt={car.name} 
          className="w-full h-full object-contain p-4"
        />
        <div className="absolute top-4 left-4 bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
          {car.category || 'Premium'}
        </div>
      </div>

      <div className="p-6 space-y-5 flex-grow">
        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dịch vụ thuê xe</span>
          <h4 className="text-lg font-black text-slate-800 leading-tight mt-1">{car.name}</h4>
          <p className="text-xs text-slate-500 font-medium">Cung cấp bởi: {car.vendor || 'Đối tác uy tín'}</p>
        </div>

        {/* Thông số kỹ thuật xe */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <FaUserFriends className="text-blue-500 text-sm" />
            <span className="text-xs font-bold">{car.seats || 5} Chỗ</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <FaCog className="text-blue-500 text-sm" />
            <span className="text-xs font-bold">{car.transmission || 'Tự động'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <FaGasPump className="text-blue-500 text-sm" />
            <span className="text-xs font-bold">{car.fuelType || 'Xăng'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <FaSnowflake className="text-blue-500 text-sm" />
            <span className="text-xs font-bold">Điều hòa</span>
          </div>
        </div>

        {/* Lịch trình thuê */}
        <div className="bg-blue-50/50 rounded-2xl p-4 flex items-center gap-4 border border-blue-100">
          <div className="flex-1 text-center">
            <div className="text-sm font-black text-slate-800">{formatDate(pickupDate)}</div>
            <div className="text-[9px] font-bold text-blue-500 uppercase">Nhận xe</div>
          </div>
          <div className="w-8 h-[1px] bg-blue-200"></div>
          <div className="flex-1 text-center">
            <div className="text-sm font-black text-slate-800">{formatDate(dropoffDate)}</div>
            <div className="text-[9px] font-bold text-blue-500 uppercase">Trả xe</div>
          </div>
        </div>
      </div>

      {/* Footer giá tiền */}
      <div className="bg-slate-50/80 p-6 flex items-center justify-between border-t border-slate-100 mt-auto">
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase">Trọn gói</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-blue-600">{(car.price || 0).toLocaleString()}</span>
            <span className="text-sm font-bold text-blue-600">{car.currency || 'VND'}</span>
          </div>
        </div>
        <button 
          onClick={() => onSelect(car)} 
          className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
        >
          THUÊ XE <FaArrowRight className="text-[10px]" />
        </button>
      </div>
    </div>
  );
};

export default CarCard;