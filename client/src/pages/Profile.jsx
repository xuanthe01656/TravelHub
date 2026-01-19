import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as Yup from 'yup'; 
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  FaUser, FaEnvelope, FaPhone, FaMapMarkerAlt, FaHistory, 
  FaKey, FaEdit, FaPlane, FaChevronRight, FaSpinner, FaTimes
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

const passwordSchema = Yup.object().shape({
  oldPassword: Yup.string().required('Vui lòng nhập mật khẩu cũ'),
  newPassword: Yup.string().min(6, 'Mật khẩu mới ít nhất 6 ký tự').required('Vui lòng nhập mật khẩu mới'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu mới'),
});

const Profile = () => {
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isLogged, setIsLogged] = useState(false);

  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', gender: '' });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle('Trang cá nhân');
  const fetchData = useCallback(async () => {
    setLoading(true);
    
    // Bước 1: Lấy Profile (Cực kỳ quan trọng, hỏng là nghỉ)
    try {
      const userRes = await axios.get('/api/user/profile');
      setUser(userRes.data);
      setEditForm({
        name: userRes.data.name || '',
        phone: userRes.data.phone || '',
        address: userRes.data.address || '',
        gender: userRes.data.gender || 'Nam'
      });
      setIsLogged(true);
    } catch (err) {
      console.error("Profile Error:", err);
      toast.error("Phiên đăng nhập hết hạn!");
      navigate('/login');
      return;
    }
  
    try {
      const purchaseRes = await axios.get('/api/purchases');
      setPurchases(purchaseRes.data || []);
    } catch (err) {
      console.error("Purchases API 500 Error:", err);
      setPurchases([]); 
      toast.warning("Không thể tải lịch sử chuyến bay lúc này.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get('/api/session');
        if (res.data.loggedIn) {
          fetchData();
        } else {
          navigate('/login');
        }
      } catch (err) {
        navigate('/login');
      }
    };
    checkAuth();
  }, [fetchData, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      // Bỏ token vì dùng session cookie
      const res = await axios.put('/api/user/profile', editForm);
      setUser(res.data.user || { ...user, ...editForm });
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi cập nhật");
    } finally { 
      setBtnLoading(false); 
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setBtnLoading(true);
    try {
      await passwordSchema.validate(passwordForm, { abortEarly: false });
      setPasswordErrors({});
      
      await axios.post('/api/user/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      toast.success("Đổi mật khẩu thành công!");
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      if (err.name === 'ValidationError') {
        const errors = {};
        err.inner.forEach(e => errors[e.path] = e.message);
        setPasswordErrors(errors);
      } else {
        toast.error(err.response?.data?.message || "Mật khẩu cũ không chính xác");
      }
    } finally { 
      setBtnLoading(false); 
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/logout', {}, { withCredentials: true });
      localStorage.removeItem('token');
      setUser(null); 
      setIsLogged(false); 
  
      toast.info('Đã đăng xuất thành công!');
      window.location.replace('/login');
      
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
      window.location.replace('/login');
    }
  };
  const handleUpdateAvatar = async (avatarUrl) => {
    setBtnLoading(true);
    try {
      // Gọi API cập nhật riêng hoặc dùng chung API profile
      const res = await axios.put('/api/user/profile', { 
        ...editForm, 
        avatar_url: avatarUrl 
      });
      
      setUser({ ...user, avatar: avatarUrl });
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      toast.error("Không thể cập nhật ảnh");
    } finally {
      setBtnLoading(false);
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh quá lớn, vui lòng chọn file dưới 2MB");
      return;
    }
  
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'travelhub_app'); 
  
    setUploading(true);
    try {
      const res = await axios.post(
        'https://api.cloudinary.com/v1_1/dchk5caai/image/upload', 
        formData
      );
      
      const imageUrl = res.data.secure_url;
      await axios.put('/api/user/profile', { 
        ...editForm, 
        avatar_url: imageUrl 
      });
      setUser(prev => ({ ...prev, avatar: imageUrl }));
      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Lỗi khi tải ảnh lên Cloudinary");
    } finally {
      setUploading(false);
    }
  };
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
        <p className="text-slate-500 font-bold">Đang tải hồ sơ...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header 
        isLogged={isLogged} 
        welcomeMessage={user?.name} 
        handleLogout={handleLogout} 
      />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-blue-100/50 text-center border border-white">
              <div className="relative inline-block mb-4 group">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-700 rounded-3xl flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden border-4 border-white relative">
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                      <FaSpinner className="animate-spin text-white text-xl" />
                    </div>
                  )}
                  
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt="Avatar" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{user?.name?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {user?.loginProvider === 'local' && (
                  <label className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-2 rounded-xl shadow-lg hover:bg-blue-600 transition-all cursor-pointer scale-100 lg:scale-0 lg:group-hover:scale-100 shadow-blue-200 z-20">
                    <FaEdit size={12} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <h2 className="text-xl font-black text-slate-800 break-words">{user?.name}</h2>
              <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-1">
                {user?.loginProvider !== 'local' ? `Login via ${user.loginProvider}` : 'Khách hàng thân thiết'}
              </p>
            </div>

            <nav className="bg-white rounded-[2rem] p-4 shadow-xl shadow-blue-100/50 border border-white space-y-2">
              <TabButton active={activeTab === 'info'} onClick={() => setActiveTab('info')} icon={<FaUser />} label="Thông tin cá nhân" />
              <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<FaHistory />} label="Lịch sử giao dịch" />
              <TabButton active={activeTab === 'password'} onClick={() => setActiveTab('password')} icon={<FaKey />} label="Đổi mật khẩu" />
            </nav>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl shadow-blue-100/50 border border-white min-h-[550px]">
              
              {activeTab === 'info' && (
                <div className="animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black text-slate-800">Hồ sơ cá nhân</h3>
                    {!isEditing ? (
                      <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-lg">
                        <FaEdit /> Sửa
                      </button>
                    ) : (
                      <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition">
                        <FaTimes /> Hủy
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Họ và tên</label>
                        <input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Số điện thoại</label>
                        <input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Địa chỉ</label>
                        <input value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase ml-1">Giới tính</label>
                        <select value={editForm.gender} onChange={(e) => setEditForm({...editForm, gender: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold">
                          <option value="Nam">Nam</option>
                          <option value="Nữ">Nữ</option>
                          <option value="Khác">Khác</option>
                        </select>
                      </div>
                      <div className="md:col-span-2 pt-4">
                        <button disabled={btnLoading} className="w-full md:w-auto px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition shadow-xl disabled:opacity-50">
                          {btnLoading ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <InfoItem icon={<FaEnvelope />} label="Email liên hệ" value={user?.email} />
                      <InfoItem icon={<FaPhone />} label="Số điện thoại" value={user?.phone || 'Chưa cập nhật'} />
                      <InfoItem icon={<FaMapMarkerAlt />} label="Địa chỉ" value={user?.address || 'Chưa cập nhật'} />
                      <InfoItem icon={<FaUser />} label="Giới tính" value={user?.gender || 'Chưa cập nhật'} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'history' && (
                <div className="animate-in fade-in duration-500">
                  <h3 className="text-2xl font-black text-slate-800 mb-8">Lịch sử giao dịch</h3>
                  {purchases.length > 0 ? (
                    <div className="space-y-4">
                      {purchases.map((p, idx) => (
                        <div key={idx} className="group flex flex-col md:flex-row items-center gap-6 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all duration-300">
                          <div className="flex items-center gap-4 flex-1 w-full">
                            <div className="bg-white p-4 rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                              <FaPlane className="text-xl" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-black text-lg text-slate-800 uppercase truncate">
                                <span>{p.from}</span>
                                <FaChevronRight className="text-[10px] text-slate-300 shrink-0" />
                                <span>{p.to}</span>
                              </div>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mt-1">Mã: <span className="text-blue-600">#BK{idx+100}</span></p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-6 shrink-0">
                            <div className="text-right">
                              <div className="text-lg font-black text-blue-600">{Number(p.totalPrice || p.price).toLocaleString()}đ</div>
                              <p className="text-xs font-medium text-slate-500">{new Date(p.date).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <span className="px-4 py-1.5 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-600">Thành công</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <div className="text-5xl mb-4">☁️</div>
                      <p className="text-slate-500 font-bold">Bạn chưa có giao dịch nào!</p>
                      <button onClick={() => navigate('/flights')} className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-xl font-black shadow-lg">KHÁM PHÁ NGAY</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'password' && (
                <div className="animate-in fade-in duration-500 max-w-md">
                  <h3 className="text-2xl font-black text-slate-800 mb-2">Bảo mật</h3>
                  <p className="text-slate-500 text-sm mb-8 font-medium">Sử dụng mật khẩu mạnh để bảo vệ tài khoản.</p>
                  <form onSubmit={handleChangePassword} className="space-y-5">
                    <PasswordInput label="Mật khẩu hiện tại" value={passwordForm.oldPassword} onChange={(val) => setPasswordForm({...passwordForm, oldPassword: val})} error={passwordErrors.oldPassword} />
                    <PasswordInput label="Mật khẩu mới" value={passwordForm.newPassword} onChange={(val) => setPasswordForm({...passwordForm, newPassword: val})} error={passwordErrors.newPassword} />
                    <PasswordInput label="Xác nhận mật khẩu mới" value={passwordForm.confirmPassword} onChange={(val) => setPasswordForm({...passwordForm, confirmPassword: val})} error={passwordErrors.confirmPassword} />
                    <button type="submit" disabled={btnLoading} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50">
                      {btnLoading ? 'ĐANG XỬ LÝ...' : 'CẬP NHẬT MẬT KHẨU'}
                    </button>
                  </form>
                </div>
              )}

            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}>
    <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
    <span className="truncate">{label}</span>
  </button>
);

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-colors overflow-hidden">
    <div className="bg-white p-3 rounded-xl text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <p className="text-sm font-black text-slate-800 mt-0.5 truncate">{value}</p>
    </div>
  </div>
);

const PasswordInput = ({ label, value, onChange, error }) => (
  <div className="space-y-1">
    <label className="text-xs font-black text-slate-500 uppercase ml-1">{label}</label>
    <input type="password" value={value} onChange={(e) => onChange(e.target.value)} placeholder="••••••••" className={`w-full p-4 bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-100'} rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition`} />
    {error && <p className="text-[10px] text-red-500 font-bold ml-1 italic">{error}</p>}
  </div>
);

export default Profile;