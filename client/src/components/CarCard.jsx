import React from 'react';
import { 
  FaUserFriends, FaCog, FaGasPump, FaArrowRight, 
  FaSnowflake, FaSuitcase, FaClock, FaCalendarAlt, FaRoute 
} from 'react-icons/fa';

const CarCard = ({ car, onSelect, pickupDate, dropoffDate, isTransfer }) => {
  if (!car) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "--/--";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="group flex flex-col bg-white rounded-[24px] md:rounded-[32px] shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 overflow-hidden h-full">
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-50">
        <img 
          src={car.image || `https://placehold.co/600x400?text=${encodeURIComponent(car.vehicle?.name || 'Car')}`} 
          alt={car.vehicle?.name} 
          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
        />
        <div className={`absolute top-3 left-3 md:top-4 md:left-4 text-white text-[9px] md:text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg uppercase ${isTransfer ? 'bg-indigo-600' : 'bg-blue-600'}`}>
          {isTransfer ? 'Đưa đón' : (car.category || 'Tự lái')}
        </div>
      </div>

      <div className="p-4 md:p-6 space-y-3 md:space-y-4 flex-grow flex flex-col">
        {/* 2. Tiêu đề và Vendor */}
        <div>
          <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {isTransfer ? 'Airport Transfer' : 'Self-Drive'}
          </span>
          <h4 className="text-base md:text-lg font-black text-slate-800 mt-0.5 line-clamp-1 group-hover:text-blue-600 transition-colors">
            {car.name}
          </h4>
          <p className="text-[10px] md:text-xs text-slate-500 font-medium truncate">
            {isTransfer ? 'Giá trọn gói, bao phí cầu đường' : `Đơn vị: ${car.vendor || 'Đối tác uy tín'}`}
          </p>
        </div>

        {/* 3. Thông số kỹ thuật - Grid 2 cột */}
        <div className="grid grid-cols-2 gap-2">
          <Badge icon={<FaUserFriends />} label={`${car.vehicle?.seats || 5} Ghế`} />
          
          {isTransfer ? (
            <Badge icon={<FaSuitcase />} label={`${car.vehicle?.fuel || 2} Vali`} />
          ) : (
            <Badge icon={<FaCog />} label={car.vehicle?.transmission || 'Tự động'} />
          )}

          {/* HIỂN THỊ QUÃNG ĐƯỜNG: 
              Nếu là Transfer, hiển thị quãng đường (lấy từ tags hoặc thuộc tính distance)
              Nếu là Rental, hiển thị loại nhiên liệu */}
          {isTransfer ? (
            <Badge 
              icon={<FaRoute className="text-green-500" />} 
              label={car.tags?.find(t => t.includes('Quãng đường')) || 'Nội thành'} 
            />
          ) : (
            <Badge icon={<FaGasPump />} label={car.vehicle?.fuel || 'Xăng'} />
          )}

          <Badge icon={<FaSnowflake className="text-cyan-400" />} label="Máy lạnh" />
        </div>

        {/* 4. Lịch trình */}
        <div className="mt-auto bg-slate-50 rounded-xl md:rounded-2xl p-3 border border-slate-100">
          {isTransfer ? (
            <div className="flex items-center justify-center gap-4">
              <div className="flex items-center gap-1.5">
                <FaCalendarAlt className="text-blue-500 text-[10px]" />
                <span className="text-[11px] md:text-xs font-black text-slate-700">{formatDate(pickupDate)}</span>
              </div>
              <div className="w-[1px] h-3 bg-slate-300"></div>
              <div className="flex items-center gap-1.5">
                <FaClock className="text-blue-500 text-[10px]" />
                <span className="text-[11px] md:text-xs font-black text-slate-700">{car.pickupTime || '24/7'}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between px-1">
              <DateLabel date={formatDate(pickupDate)} sub="Nhận" />
              <FaArrowRight className="text-slate-300 text-[10px] mx-2" />
              <DateLabel date={formatDate(dropoffDate)} sub="Trả" />
            </div>
          )}
        </div>
      </div>

      {/* 5. Footer giá tiền */}
      <div className="bg-slate-50/80 p-4 md:p-5 flex items-center justify-between border-t border-slate-100 mt-auto">
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase leading-none mb-1">
            {isTransfer ? 'Tổng phí (VND)' : 'Giá / ngày'}
          </span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg md:text-xl font-black text-blue-600">
              {(car.pricing?.totalVND || 0).toLocaleString('vi-VN')}
            </span>
            <span className="text-[10px] font-bold text-blue-600 ml-0.5">đ</span>
          </div>
        </div>
        <button 
          onClick={() => onSelect(car)} 
          className="px-4 py-2.5 md:px-6 md:py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-[11px] shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2"
        >
          {isTransfer ? 'ĐẶT XE' : 'CHỌN XE'} <FaArrowRight size={10} />
        </button>
      </div>
    </div>
  );
};

// Sub-components
const Badge = ({ icon, label }) => (
  <div className="flex items-center gap-2 text-slate-600 bg-white/50 p-2 rounded-lg md:rounded-xl border border-slate-100 overflow-hidden">
    <span className="text-blue-500 text-[10px] md:text-xs shrink-0">{icon}</span>
    <span className="text-[9px] md:text-[10px] font-bold truncate italic">{label}</span>
  </div>
);

const DateLabel = ({ date, sub }) => (
  <div className="text-center">
    <div className="text-[11px] md:text-xs font-black text-slate-800">{date}</div>
    <div className="text-[7px] md:text-[8px] font-bold text-blue-500 uppercase">{sub}</div>
  </div>
);

export default CarCard;