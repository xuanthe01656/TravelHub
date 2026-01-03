import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';
import formatCurrency from '../../utils/formatCurrency';

export default function PopularDestinationsSwiper({ popularDestinations, title, subtitle, onCardClick }) {
  return (
    <div className="mt-16 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h3 className="text-2xl md:text-3xl font-black text-slate-800 flex items-center gap-3">
            <FaMapMarkerAlt className="text-blue-500 animate-bounce" /> 
            {title || 'Điểm đến phổ biến'}
          </h3>
          <p className="text-slate-500 mt-2 text-sm md:text-base">{subtitle || 'Gợi ý những điểm đến tốt nhất dành cho bạn'}</p>
        </div>
      </div>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 4 },
        }}
        className="pb-14 destination-swiper"
      >
        {popularDestinations.map((dest, idx) => (
          <SwiperSlide key={idx}>
            <div 
              className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 h-full flex flex-col"
              onClick={onCardClick ? () => onCardClick(dest) : null}
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
                <div className="absolute bottom-4 left-5">
                  <h4 className="text-xl font-black text-white tracking-tight drop-shadow-lg">
                    {dest.name}
                  </h4>
                  <div className="flex items-center gap-1 text-white/80 text-xs mt-1">
                    <FaMapMarkerAlt className="text-blue-400" /> {dest.location}
                  </div>
                </div>
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-xl">
                  <p className="text-[9px] text-slate-500 font-bold uppercase leading-none">{dest.priceLabel}</p>
                  <p className="text-blue-600 font-black text-sm">{formatCurrency(dest.price)}</p>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-5">
                  {dest.description}
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Khám phá</span>
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                    <FaArrowRight className="-rotate-45 group-hover:rotate-0 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}