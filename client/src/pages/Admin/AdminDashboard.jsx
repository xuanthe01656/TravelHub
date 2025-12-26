// client/src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Plane, Car, Hotel, MessageSquare, LogOut, 
  Search, Bell, Menu, X, Plus, Edit2, Trash2, ChevronRight, 
  TrendingUp, Users, DollarSign, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react'; 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminChat from '../../components/Admin/AdminChat';

const AdminDashboard = () => {
    // --- States ---
    const [activeTab, setActiveTab] = useState('overview');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    
    const [data, setData] = useState({ flights: [], cars: [], hotels: [] });
    const [overviewData, setOverviewData] = useState({ 
        totalTickets: 1250, 
        revenue: 450000000, 
        activeUsers: 850, 
        chartData: [
            { date: 'T2', revenue: 4000000 }, { date: 'T3', revenue: 3000000 },
            { date: 'T4', revenue: 7000000 }, { date: 'T5', revenue: 5000000 },
            { date: 'T6', revenue: 9000000 }, { date: 'T7', revenue: 12000000 }, { date: 'CN', revenue: 8000000 }
        ] 
    });

    // --- Effects ---
    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('adminToken');
        try {
            if (activeTab === 'overview') {
                const res = await axios.get('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } });
                if(res.data) setOverviewData(res.data);
            } else {
                const res = await axios.get(`/api/${activeTab}`, { headers: { Authorization: `Bearer ${token}` } });
                setData(prev => ({ ...prev, [activeTab]: res.data }));
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            // Để demo không bị trắng trang nếu API lỗi, bạn có thể giữ dữ liệu giả ở đây
        }
        setLoading(false);
    };

    // --- Actions ---
    const handleDelete = async (id) => {
        if (window.confirm("Xác nhận xóa mục này khỏi hệ thống?")) {
            try {
                // await axios.delete(`/api/${activeTab}/${id}`, { headers: { Authorization: `Bearer ${token}` } });
                setData(prev => ({
                    ...prev,
                    [activeTab]: prev[activeTab].filter(item => item.id !== id)
                }));
            } catch (err) { alert("Lỗi khi xóa!"); }
        }
    };

    const handleOpenModal = (item = null) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    // --- Sub-Components ---
    const StatCard = ({ title, value, icon: Icon, trend, color }) => (
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className={`absolute -right-2 -top-2 w-24 h-24 rounded-full opacity-5 ${color} flex items-center justify-center`}>
                <Icon size={48} />
            </div>
            <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-4 text-white`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-end gap-2">
                <h3 className="text-2xl font-black text-slate-800">{value}</h3>
                <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center tracking-tighter">
                    <TrendingUp size={12} className="mr-0.5" /> +{trend}%
                </span>
            </div>
        </motion.div>
    );

    const Modal = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xl font-black text-slate-800 uppercase italic">
                        {editingItem ? 'Cập nhật thông tin' : `Thêm ${activeTab} mới`}
                    </h3>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition shadow-sm"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-xs font-bold text-slate-400 uppercase ml-1">Tên / Tuyến đường</label>
                        <input type="text" className="w-full mt-1 bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition" defaultValue={editingItem?.name || ''} /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Giá tiền</label>
                        <input type="number" className="w-full mt-1 bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition" defaultValue={editingItem?.price || ''} /></div>
                        <div><label className="text-xs font-bold text-slate-400 uppercase ml-1">Ngày tháng</label>
                        <input type="date" className="w-full mt-1 bg-slate-50 border-none rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 transition" /></div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all mt-4">Lưu dữ liệu</button>
                </div>
            </motion.div>
        </motion.div>
    );

    const renderTable = (items) => {
        const filtered = items.filter(i => JSON.stringify(i).toLowerCase().includes(searchTerm.toLowerCase()));
        return (
            <div className="mt-2">
                {/* Mobile View */}
                <div className="md:hidden space-y-4">
                    {filtered.map(item => (
                        <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-[10px] font-black bg-slate-100 px-2 py-1 rounded text-slate-500 italic">ID #{item.id}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => handleOpenModal(item)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Edit2 size={14}/></button>
                                    <button onClick={() => handleDelete(item.id)} className="p-2 bg-rose-50 text-rose-600 rounded-xl"><Trash2 size={14}/></button>
                                </div>
                            </div>
                            <div className="font-bold text-slate-800 text-lg leading-tight mb-1">{item.name || `${item.originAirportCode} ➝ ${item.destinationAirportCode}`}</div>
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm font-bold text-indigo-600">{(item.price || item.priceVND || 0).toLocaleString()}₫</div>
                                <div className="text-xs font-bold text-slate-400 italic">{item.departureDate || item.checkInDate}</div>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Desktop View */}
                <div className="hidden md:block bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thông tin chi tiết</th>
                                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Giá niêm yết</th>
                                <th className="p-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map(item => (
                                <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                    <td className="p-5">
                                        <div className="font-bold text-slate-700 group-hover:text-indigo-600 transition">{item.name || `${item.originAirportCode} ➝ ${item.destinationAirportCode}`}</div>
                                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mã định danh: #{item.id}</div>
                                    </td>
                                    <td className="p-5 text-sm font-bold text-slate-500 italic">{item.departureDate || item.checkInDate}</td>
                                    <td className="p-5 text-sm font-black text-slate-800">{(item.price || item.priceVND || 0).toLocaleString()}₫</td>
                                    <td className="p-5 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleOpenModal(item)} className="p-2.5 hover:bg-indigo-600 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm bg-white border border-slate-100"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDelete(item.id)} className="p-2.5 hover:bg-rose-600 hover:text-white text-slate-400 rounded-xl transition-all shadow-sm bg-white border border-slate-100"><Trash2 size={16}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-slate-900">
            <AnimatePresence>{isModalOpen && <Modal />}</AnimatePresence>

            {/* Sidebar Mobile Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden" />
                )}
            </AnimatePresence>

            {/* Navigation Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 flex items-center justify-center text-white font-black italic text-xl">TH</div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic text-slate-800">TravelHub<span className="text-indigo-600">.</span></span>
                </div>
                <nav className="flex-1 px-4 space-y-1.5 mt-4">
                    {[
                        { id: 'overview', icon: LayoutDashboard, label: 'Bảng tổng quan' },
                        { id: 'flights', icon: Plane, label: 'Chuyến bay' },
                        { id: 'cars', icon: Car, label: 'Dịch vụ Thuê xe' },
                        { id: 'hotels', icon: Hotel, label: 'Khách sạn' },
                        { id: 'chat', icon: MessageSquare, label: 'Hỗ trợ khách' },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-black transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-[1.02]' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
                            <tab.icon size={20} strokeWidth={2.5} /> {tab.label}
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t border-slate-50">
                    <button onClick={() => window.location.href = '/dashboard'} className="w-full flex items-center justify-center gap-3 py-4 text-rose-500 font-black text-sm uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition">
                        <LogOut size={18} /> Thoát hệ thống
                    </button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Modern Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 md:px-10 sticky top-0 z-30">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl"><Menu size={20}/></button>
                        <div className="hidden lg:flex relative w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                            <input type="text" placeholder="Tìm kiếm nhanh dữ liệu..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl pl-11 pr-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none" />
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-sm font-black text-slate-800 tracking-tight">Nguyễn Văn A</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={10}/> Trực tuyến</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:rotate-3 transition">
                            <img src={`https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff&bold=true`} alt="Admin" />
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-sm uppercase tracking-widest">
                                    <div className="w-6 h-[2px] bg-indigo-600"></div> Quản trị hệ thống
                                </div>
                                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                                    {activeTab === 'overview' ? 'Dashboard Tổng quan' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                </h1>
                            </div>
                            {activeTab !== 'overview' && (
                                <button onClick={() => handleOpenModal()} className="flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-indigo-600 transition-all active:scale-95">
                                    <Plus size={18}/> Thêm bản ghi mới
                                </button>
                            )}
                        </div>

                        {loading ? (
                            <div className="h-96 flex flex-col items-center justify-center gap-4">
                                <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <span className="font-black text-slate-400 uppercase tracking-widest text-xs">Đang đồng bộ dữ liệu...</span>
                            </div>
                        ) : (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                {activeTab === 'overview' ? (
                                    <div className="space-y-10">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <StatCard title="Doanh thu (VND)" value={overviewData.revenue.toLocaleString()} icon={DollarSign} trend={12.4} color="bg-indigo-600" />
                                            <StatCard title="Vé đã bán" value={overviewData.totalTickets} icon={Plane} trend={8.1} color="bg-blue-500" />
                                            <StatCard title="Người dùng mới" value={overviewData.activeUsers} icon={Users} trend={15.3} color="bg-emerald-500" />
                                            <StatCard title="Booking chờ" value="42" icon={Calendar} trend={2.4} color="bg-orange-500" />
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
                                                <div className="flex justify-between items-center mb-8">
                                                    <h3 className="text-xl font-black text-slate-800 italic uppercase">Thống kê doanh thu tuần</h3>
                                                    <select className="bg-slate-50 border-none rounded-xl text-xs font-bold px-4 py-2 outline-none">
                                                        <option>7 ngày qua</option>
                                                        <option>30 ngày qua</option>
                                                    </select>
                                                </div>
                                                <div className="h-80 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={overviewData.chartData}>
                                                            <defs>
                                                                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 700, fill: '#cbd5e1'}} />
                                                            <YAxis hide />
                                                            <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                                                            <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#grad)" />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>
                                            <div className="bg-indigo-600 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-indigo-200 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                                                <div>
                                                    <AlertCircle size={32} className="mb-6 opacity-50" />
                                                    <h3 className="text-2xl font-black mb-2 leading-tight uppercase">Thông báo hệ thống</h3>
                                                    <p className="text-indigo-100 text-sm font-medium leading-relaxed">Server đang hoạt động với hiệu suất 99.9%. Có 2 yêu cầu rút tiền đang chờ xử lý từ đối tác khách sạn.</p>
                                                </div>
                                                <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition mt-8">Kiểm tra ngay</button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    activeTab === 'chat' ? <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 h-[600px] overflow-hidden"><AdminChat /></div> : renderTable(data[activeTab] || [])
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;