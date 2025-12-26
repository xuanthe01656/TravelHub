import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft, FaCalendarAlt, FaQuoteLeft, FaUserCircle, FaPaperPlane, FaReply } from 'react-icons/fa';
import Header from '../components/Header';
import Footer from '../components/Footer';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useState } from 'react';

const blogPosts = [
  { 
    id: 1,
    title: 'Top 10 địa điểm du lịch hè 2025 không thể bỏ qua', 
    excerpt: 'Từ những bãi biển xanh ngắt tại Phú Quốc đến không gian se lạnh của Sapa, đây là những tọa độ đang làm mưa làm gió...', 
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
    date: '20/12/2024',
    category: 'Cẩm nang',
    content: `Nội dung chi tiết của bài viết về Top 10 địa điểm du lịch hè 2025.

Phú Quốc: Thiên đường biển đảo với bãi biển cát trắng mịn và nước trong xanh. Đừng bỏ lỡ cơ hội lặn ngắm san hô và thưởng thức hải sản tươi ngon.

Sapa: Thị trấn sương mù với ruộng bậc thang đẹp như tranh vẽ. Trải nghiệm trekking qua các bản làng dân tộc và chinh phục đỉnh Fansipan.

Đà Nẵng: Thành phố cầu vàng với bãi biển Mỹ Khê và cầu Rồng phun lửa. Khám phá Bà Nà Hills với khu vui chơi giải trí đẳng cấp thế giới.

Hội An: Phố cổ đèn lồng lung linh bên sông Hoài. Thưởng thức cao lầu, mì Quảng và thả đèn hoa đăng vào ban đêm.

Hạ Long: Vịnh di sản thế giới với hàng ngàn đảo đá vôi kỳ vĩ. Du thuyền qua vịnh và khám phá hang động thiên nhiên.

Nha Trang: Thiên đường nghỉ dưỡng với Vinpearl Land và các hoạt động lặn biển. Thưởng thức bún chả cá và nem nướng đặc sản.

Đà Lạt: Thành phố ngàn hoa với khí hậu se lạnh quanh năm. Check-in tại hồ Xuân Hương, thung lũng Tình Yêu và các vườn hoa rực rỡ.

Huế: Cố đô với quần thể di tích cung đình. Thưởng thức ẩm thực cung đình và nghe nhã nhạc Huế.

Hà Nội: Thủ đô nghìn năm văn hiến với hồ Hoàn Kiếm và phố cổ. Khám phá ẩm thực đường phố như phở, bún chả.

Quy Nhơn: Bãi biển hoang sơ với Eo Gió và Ghềnh Ráng. Thiên đường cho những ai yêu thích sự yên bình và thiên nhiên.`,
    comments: [] // Khởi tạo mảng comments rỗng cho mỗi bài viết
  },
  { 
    id: 2,
    title: 'Mẹo đặt vé máy bay và phòng khách sạn giá rẻ', 
    excerpt: 'Làm thế nào để săn được vé 0 đồng? Thời điểm nào đặt phòng là tốt nhất? Hãy cùng TravelHub khám phá bí kíp tiết kiệm...', 
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109c055?auto=format&fit=crop&w=600&q=80',
    date: '18/12/2024',
    category: 'Kinh nghiệm',
    content: `Nội dung chi tiết của bài viết về mẹo đặt vé máy bay và phòng khách sạn giá rẻ.

1. Săn vé máy bay giá rẻ:
- Theo dõi các chương trình khuyến mãi của hãng hàng không như Vietjet, Bamboo Airways.
- Đặt vé vào giữa tuần (thứ 3, thứ 4) để có giá tốt hơn.
- Sử dụng công cụ so sánh giá như Google Flights hoặc Skyscanner.
- Đặt vé sớm 2-3 tháng cho chuyến nội địa, 4-6 tháng cho quốc tế.
- Chọn bay giờ khuya hoặc sáng sớm để tiết kiệm.

2. Bí quyết đặt phòng khách sạn:
- Sử dụng các nền tảng như Booking.com, Agoda với bộ lọc giá rẻ.
- Đặt phòng vào phút chót để nhận deal last minute.
- Chọn khách sạn ngoại ô hoặc homestay để giảm chi phí.
- Đăng ký thành viên để nhận mã giảm giá và điểm tích lũy.
- Đọc review kỹ lưỡng để tránh "tiền mất tật mang".

3. Mẹo kết hợp:
- Sử dụng gói combo vé máy bay + khách sạn để tiết kiệm lên đến 30%.
- Theo dõi fanpage và newsletter của các hãng để nhận thông tin khuyến mãi sớm.
- Sử dụng thẻ tín dụng du lịch để nhận hoàn tiền hoặc điểm thưởng.

Với những mẹo trên, bạn có thể tiết kiệm đáng kể cho chuyến đi của mình!`,
    comments: []
  },
  { 
    id: 3,
    title: 'Hành trình khám phá ẩm thực đường phố Hà Nội', 
    excerpt: 'Phở, bún chả, chả cá Lã Vọng... nét tinh hoa ẩm thực nghìn năm văn hiến khiến bất kỳ thực khách nào cũng phải say đắm...', 
    image: 'https://images.unsplash.com/photo-1567129937968-cdad8f0d5a3a?auto=format&fit=crop&w=600&q=80',
    date: '15/12/2024',
    category: 'Ẩm thực',
    content: `Nội dung chi tiết của bài viết về hành trình khám phá ẩm thực đường phố Hà Nội.

Hà Nội nổi tiếng với nền ẩm thực đường phố phong phú, nơi mỗi món ăn là một câu chuyện văn hóa.

1. Phở: Món ăn quốc hồn quốc túy. Thử phở bò tái chín tại Phở Thìn hoặc Phở Lý Quốc Sư. Nước dùng ninh từ xương bò, thơm lừng gừng nướng và hồi quế.

2. Bún chả: Món ăn yêu thích của cựu Tổng thống Obama. Chả nướng thơm phức ăn kèm bún, rau sống và nước chấm chua ngọt. Địa chỉ nổi tiếng: Bún chả Hàng Mã.

3. Chả cá Lã Vọng: Cá lăng tươi ướp nghệ, thì là nướng trên chảo gang. Ăn kèm bún, mắm tôm và rau thơm. Quán gốc tại 14 Chả Cá.

4. Bún đậu mắm tôm: Sự kết hợp táo bạo giữa đậu rán, mắm tôm, bún và rau sống. Thử tại ngõ Trung Yên hoặc Hàng Bạc.

5. Cafe trứng: Thức uống độc đáo với cafe đen đánh bông với lòng đỏ trứng gà. Quán Giảng hoặc Đinh là lựa chọn hàng đầu.

6. Kem Tràng Tiền: Kết thúc hành trình bằng que kem mát lạnh với hương vị truyền thống như cốm, đậu xanh.

Lưu ý: Ăn uống vệ sinh, thử dần để tránh ngộ độc. Chúc bạn có hành trình ẩm thực thú vị tại Hà Nội!`,
    comments: []
  },
  // Bạn có thể thêm nhiều bài viết hơn ở đây nếu cần
];

function BlogDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const postIndex = blogPosts.findIndex(p => p.id === parseInt(id));
  const post = blogPosts[postIndex];

  const isLogged = !!localStorage.getItem('token');
  const welcomeMessage = isLogged ? 'Chào bạn!' : 'Chào bạn!';

  const [comments, setComments] = useState(post ? post.comments : []);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); // Để lưu comment đang reply
  const [newReply, setNewReply] = useState('');
  const [userName, setUserName] = useState(isLogged ? 'User' : ''); // Giả sử tên user từ profile

  useDocumentTitle(post ? `${post.title} - Blog TravelHub` : 'Blog Chi Tiết');

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isLogged) {
      alert('Vui lòng đăng nhập để bình luận.');
      navigate('/login');
      return;
    }
    const comment = {
      id: Date.now(),
      user: userName || 'Khách',
      content: newComment,
      date: new Date().toLocaleString('vi-VN'),
      replies: [] // Mảng replies cho mỗi comment
    };
    const updatedComments = [...comments, comment];
    setComments(updatedComments);
    // Cập nhật vào blogPosts (vì là dữ liệu tĩnh, trong thực tế dùng API)
    blogPosts[postIndex].comments = updatedComments;
    setNewComment('');
  };

  const handleAddReply = (e, commentId) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    if (!isLogged) {
      alert('Vui lòng đăng nhập để trả lời.');
      navigate('/login');
      return;
    }
    const reply = {
      id: Date.now(),
      user: userName || 'Khách',
      content: newReply,
      date: new Date().toLocaleString('vi-VN')
    };
    const updatedComments = comments.map(c => {
      if (c.id === commentId) {
        return { ...c, replies: [...c.replies, reply] };
      }
      return c;
    });
    setComments(updatedComments);
    blogPosts[postIndex].comments = updatedComments;
    setNewReply('');
    setReplyTo(null);
  };

  if (!post) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 font-sans relative">
        <Header 
          isLogged={isLogged} 
          welcomeMessage={welcomeMessage} 
          handleLogout={() => { localStorage.removeItem('token'); navigate('/dashboard'); }}
        />
        <main className="flex-1 max-w-7xl mx-auto w-full p-4 md:p-8 relative z-10">
          <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-slate-100 text-center py-20">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-700 mb-4">Không tìm thấy bài viết</h2>
            <p className="text-slate-500 mb-6">Bài viết bạn tìm có thể đã bị xóa hoặc không tồn tại.</p>
            <button 
              onClick={() => navigate('/blogs')} 
              className="bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 mx-auto"
            >
              <FaArrowLeft /> Quay về Blog
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 md:p-8 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border border-slate-100">
          <button 
            onClick={() => navigate('/blogs')} 
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-bold text-sm transition-colors mb-6"
          >
            <FaArrowLeft /> Quay về danh sách bài viết
          </button>
          
          <img 
            src={post.image} 
            alt={post.title} 
            className="w-full h-48 sm:h-64 md:h-96 object-cover rounded-2xl mb-8 shadow-md"
          />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
            <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
              {post.category}
            </span>
            <span className="text-slate-500 text-sm flex items-center gap-1 mt-2 sm:mt-0">
              <FaCalendarAlt className="text-blue-400" /> {post.date}
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 mb-6">
            {post.title}
          </h1>
          
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed whitespace-pre-wrap mb-12 text-sm sm:text-base">
            {post.content}
          </div>
          
          {/* Phần bình luận */}
          <div className="mt-12 pt-8 border-t border-slate-200">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <FaQuoteLeft className="text-blue-500" /> Bình luận ({comments.length})
            </h2>
            
            {/* Hiển thị danh sách bình luận */}
            <div className="space-y-6 mb-8">
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3 mb-2">
                      <FaUserCircle className="text-3xl text-blue-500" />
                      <div className="flex-1">
                        <span className="font-bold text-slate-800">{comment.user}</span>
                        <span className="text-xs text-slate-500 ml-2">{comment.date}</span>
                      </div>
                      <button 
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                      >
                        <FaReply /> Trả lời
                      </button>
                    </div>
                    <p className="text-slate-600 mb-4">{comment.content}</p>
                    
                    {/* Hiển thị replies */}
                    {comment.replies.length > 0 && (
                      <div className="ml-4 sm:ml-8 space-y-4 border-l-2 border-blue-200 pl-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                              <FaUserCircle className="text-2xl text-purple-500" />
                              <div>
                                <span className="font-bold text-slate-800">{reply.user}</span>
                                <span className="text-xs text-slate-500 ml-2">{reply.date}</span>
                              </div>
                            </div>
                            <p className="text-slate-600 text-sm">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Form reply nếu đang reply comment này */}
                    {replyTo === comment.id && (
                      <form onSubmit={(e) => handleAddReply(e, comment.id)} className="mt-4 flex flex-col gap-2">
                        <textarea
                          value={newReply}
                          onChange={(e) => setNewReply(e.target.value)}
                          placeholder={`Trả lời ${comment.user}...`}
                          className="w-full h-24 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                          required
                        />
                        <div className="flex justify-end gap-2">
                          <button 
                            type="button" 
                            onClick={() => setReplyTo(null)}
                            className="px-4 py-2 text-slate-600 hover:text-slate-800"
                          >
                            Hủy
                          </button>
                          <button 
                            type="submit" 
                            className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 text-sm"
                          >
                            Gửi <FaPaperPlane />
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-center py-4">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
              )}
            </div>
            
            {/* Form thêm bình luận chính */}
            <form onSubmit={handleAddComment} className="flex flex-col gap-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Viết bình luận của bạn..."
                className="w-full h-32 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
                required
              />
              <button 
                type="submit" 
                className="self-end bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2 text-sm"
              >
                Gửi <FaPaperPlane />
              </button>
            </form>
          </div>
          
          <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <span className="text-sm text-slate-500">Chia sẻ bài viết này:</span>
            <div className="flex gap-4">
              {/* Có thể thêm icon chia sẻ nếu cần */}
              <button className="text-blue-600 hover:text-blue-800"><FaQuoteLeft /></button>
              {/* Thêm các mạng xã hội khác */}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default BlogDetail;