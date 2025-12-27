import React from 'react';

const FlightRowLeg = ({ label, data, icon }) => {
  if (!data) return null;

  // Hàm xử lý ngày tháng an toàn để tránh "Invalid Date"
  const formatTime = (dateInput) => {
    if (!dateInput) return "--:--";
    const date = new Date(dateInput);
    return isNaN(date.getTime()) 
      ? "--:--" 
      : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Ưu tiên lấy dữ liệu từ API mới (departureTime), nếu không có thì lấy API cũ (departureDateTime)
  const depTime = data.departureTime || data.departureDateTime;
  const arrTime = data.arrivalTime || data.arrivalDateTime;
  const origin = data.origin || data.originAirportCode || "N/A";
  const destination = data.destination || data.destinationAirportCode || "N/A";
  const airlineName = typeof data.airline === 'object' ? data.airline.name : data.airline;

  return (
    <div className="flex items-start gap-4 w-full">
      <div className="bg-slate-100 p-3 rounded-2xl mt-1 text-slate-600 shadow-sm">
        {icon}
      </div>
      
      <div className="flex-1">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
          <div className="flex items-center gap-2">
             <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${data.stops > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
              {data.stops > 0 ? `${data.stops} điểm dừng` : 'Bay thẳng'}
            </span>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
              {data.duration || data.flightDuration}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {formatTime(depTime)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase">{origin}</div>
          </div>

          <div className="flex-[2] flex flex-col items-center">
            <div className="relative w-full flex items-center justify-center">
              <div className="w-full h-[1.5px] bg-slate-200"></div>
              <div className="absolute w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div className="flex items-center gap-1 mt-1">
              {data.logo && <img src={data.logo} alt="logo" className="w-3 h-3 object-contain opacity-80" />}
              <span className="text-[10px] font-black text-blue-700 italic truncate max-w-[120px]">
                {airlineName || "Hãng hàng không"}
              </span>
            </div>
          </div>

          <div className="flex-1 text-right">
            <div className="text-xl font-black text-slate-800 tracking-tight">
              {formatTime(arrTime)}
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase">{destination}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightRowLeg;