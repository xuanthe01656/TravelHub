import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaFolderOpen, FaQuoteLeft } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';

const blogPosts = [
  { 
    id:1,
    title: 'Top 10 địa điểm du lịch hè 2025 không thể bỏ qua', 
    excerpt: 'Từ những bãi biển xanh ngắt tại Phú Quốc đến không gian se lạnh của Sapa, đây là những tọa độ đang làm mưa làm gió...', 
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    date: '20/12/2024',
    category: 'Cẩm nang',
    content: 'Nội dung chi tiết của bài viết... (Bạn có thể thêm nội dung đầy đủ ở đây nếu cần hiển thị bài viết chi tiết).'
  },
  { 
    id:2,
    title: 'Mẹo đặt vé máy bay và phòng khách sạn giá rẻ', 
    excerpt: 'Làm thế nào để săn được vé 0 đồng? Thời điểm nào đặt phòng là tốt nhất? Hãy cùng TravelHub khám phá bí kíp tiết kiệm...', 
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&w=600&q=80',
    date: '18/12/2024',
    category: 'Kinh nghiệm',
    content: 'Nội dung chi tiết của bài viết... (Bạn có thể thêm nội dung đầy đủ ở đây nếu cần hiển thị bài viết chi tiết).'
  },
  { 
    id:3,
    title: 'Hành trình khám phá ẩm thực đường phố Hà Nội', 
    excerpt: 'Phở, bún chả, chả cá Lã Vọng... nét tinh hoa ẩm thực nghìn năm văn hiến khiến bất kỳ thực khách nào cũng phải say đắm...', 
    image: 'https://images.unsplash.com/photo-1567129937968-cdad8f0d5a3a?auto=format&fit=crop&w=600&q=80',
    date: '15/12/2024',
    category: 'Ẩm thực',
    content: 'Nội dung chi tiết của bài viết... (Bạn có thể thêm nội dung đầy đủ ở đây nếu cần hiển thị bài viết chi tiết).'
  },
  // Bạn có thể thêm nhiều bài viết hơn ở đây nếu cần
];

function BlogPage() {
  const navigate = useNavigate();
  const isLogged = !!localStorage.getItem('token');
  const welcomeMessage = isLogged ? 'Chào bạn!' : 'Chào bạn!'; // Có thể lấy từ profile nếu cần

  useDocumentTitle('Blog - TravelHub');

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 font-sans relative">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-purple-200/10 rounded-full blur-2xl animate-float"></div>
      </div>
      <Header 
        isLogged={isLogged} 
        welcomeMessage={welcomeMessage} 
        handleLogout={() => { localStorage.removeItem('token'); navigate('/dashboard'); }}
      />
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
              <FaQuoteLeft className="text-blue-500" />
              Blog Du Lịch
            </h1>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors"
            >
              <FaArrowLeft /> Quay về Trang chủ
            </button>
          </div>
          <p className="text-slate-500 mb-12 text-lg">Khám phá các bài viết hữu ích về du lịch, kinh nghiệm và mẹo hay từ TravelHub.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, idx) => (
              <article 
                key={idx} 
                className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer"
                onClick={() => {
                    navigate('/blog/' + post.id)
                }}
              >
                {/* Hình ảnh bài viết */}
                <div className="relative h-52 overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  {/* Nhãn danh mục */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-tighter shadow-sm">
                    {post.category || 'Tin tức'}
                  </div>
                </div>

                {/* Nội dung bài viết */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Ngày đăng */}
                  <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                    <FaCalendarAlt className="text-blue-400" />
                    <span>{post.date || '22/12/2025'}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>5 phút đọc</span>
                  </div>

                  {/* Tiêu đề */}
                  <h4 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                    {post.title}
                  </h4>

                  {/* Mô tả ngắn */}
                  <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>

                  {/* Nút đọc thêm ở cuối */}
                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-sm font-black text-slate-700">Đọc thêm</span>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <span className="text-lg">→</span>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {blogPosts.length === 0 && (
            <div className="text-center py-20">
              <h3 className="text-xl font-bold text-slate-700">Chưa có bài viết nào</h3>
              <p className="text-slate-500 mt-2">Hãy quay lại sau để xem các bài viết mới!</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BlogPage;