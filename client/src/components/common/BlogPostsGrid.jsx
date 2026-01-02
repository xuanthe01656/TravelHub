import { useNavigate } from 'react-router-dom';
import { FaBlog } from 'react-icons/fa';

export default function BlogPostsGrid({ blogPosts }) {
  const navigate = useNavigate();

  return (
    <div className="mt-16 max-w-7xl mx-auto px-4">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
          <FaBlog className="text-red-500 animate-pulse"/> Bài viết mới nhất
        </h3>
        <button className="text-blue-600 font-bold text-sm hover:text-blue-700 transition-colors"
          onClick={() => navigate('/blogs')}
        >
          Xem tất cả
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogPosts.map((post, idx) => (
          <article 
            key={idx} 
            className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 flex flex-col h-full cursor-pointer"
            onClick={() => navigate('/blog/' + post.id)}
          >
            <div className="relative h-52 overflow-hidden">
              <img 
                src={post.image} 
                alt={post.title} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              />
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black text-blue-600 uppercase tracking-tighter shadow-sm">
                {post.category || 'Tin tức'}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-widest">
                <span>{post.date || '22/12/2025'}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>5 phút đọc</span>
              </div>
              <h4 className="text-lg font-bold text-slate-800 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 leading-snug">
                {post.title}
              </h4>
              <p className="text-sm text-slate-500 mb-6 line-clamp-3 leading-relaxed">
                {post.excerpt}
              </p>
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
    </div>
  );
}