import React from 'react';
import { FaHotel, FaMapMarkerAlt, FaArrowRight, FaStar, FaCheckCircle } from 'react-icons/fa';

const HotelCard = ({ hotel, onSelect, checkIn, checkOut }) => {
  if (!hotel) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "--/--";
    const d = new Date(dateString);
    // Trả về định dạng DD/MM/YYYY
    return isNaN(d.getTime()) 
      ? dateString 
      : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="flex flex-col bg-white rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      <div className="relative h-48 overflow-hidden">
        <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
          {hotel.roomType}
        </div>
      </div>

      <div className="p-6 space-y-5 flex-grow">
        <div>
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Khách sạn</span>
            <div className="flex items-center gap-1 text-orange-500 font-bold text-xs">
              <FaStar /> 4.0+
            </div>
          </div>
          <h4 className="text-lg font-black text-slate-800 leading-tight mt-1 line-clamp-1">{hotel.name}</h4>
          <div className="flex items-center gap-1 text-slate-500 mt-1">
            <FaMapMarkerAlt className="text-[10px] text-blue-500" />
            <span className="text-[10px] font-bold uppercase text-slate-400">
               Tọa độ: {hotel.location?.lat?.toFixed(2)}, {hotel.location?.lng?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {hotel.amenities?.slice(0, 3).map((item, idx) => (
            <span key={idx} className="text-[9px] font-bold bg-slate-50 text-slate-500 px-2 py-1 rounded-md border border-slate-100 flex items-center gap-1">
              <FaCheckCircle className="text-green-500" /> {item.replace(/_/g, ' ')}
            </span>
          ))}
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-4">
          <div className="flex-1 text-center">
            <div className="text-sm font-black text-slate-800">{formatDate(checkIn)}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Nhận phòng</div>
          </div>
          <div className="w-8 h-[1px] bg-slate-200"></div>
          <div className="flex-1 text-center">
            <div className="text-sm font-black text-slate-800">{formatDate(checkOut)}</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase">Trả phòng</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/80 p-6 flex items-center justify-between border-t border-slate-100 mt-auto">
        <div>
          <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-tight">Tổng cộng</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-orange-600">{(hotel.price || 0).toLocaleString()}</span>
            <span className="text-sm font-bold text-orange-600">{hotel.currency}</span>
          </div>
        </div>
        <button onClick={() => onSelect(hotel)} className="px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center gap-2">
          ĐẶT NGAY <FaArrowRight className="text-[10px]" />
        </button>
      </div>
    </div>
  );
};

export default HotelCard;