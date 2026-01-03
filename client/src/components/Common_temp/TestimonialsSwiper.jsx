import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { FaStar, FaQuoteLeft } from 'react-icons/fa';

export default function TestimonialsSwiper({ testimonials }) {
  return (
    <div className="mt-12">
      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FaQuoteLeft className="text-purple-500"/> Đánh giá từ khách hàng
      </h3>
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={20}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{ delay: 4000 }}
        breakpoints={{
          640: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="pb-10"
      >
        {testimonials.map((testimonial, idx) => (
          <SwiperSlide key={idx}>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 h-full">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} className={`text-yellow-400 ${i < Math.floor(testimonial.rating) ? 'fill-current' : 'opacity-30'}`} />
                ))}
              </div>
              <p className="text-sm text-slate-600 mb-4">"{testimonial.content}"</p>
              <span className="text-sm font-bold text-slate-800">- {testimonial.name}</span>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}