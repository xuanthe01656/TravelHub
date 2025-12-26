import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Plane, Car, Hotel, MessageSquare, LogOut, 
  Search, Menu, X, Plus, Edit2, Trash2, CheckCircle2, AlertCircle, 
  TrendingUp, Users, DollarSign, Calendar 
} from 'lucide-react'; 
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminChat from '../../components/Admin/AdminChat';

const AdminDashboard = () => {
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

    useEffect(() => {
        if (activeTab !== 'chat') fetchData();
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
        } catch (err) { console.error("API Error:", err); }
        setLoading(false);
    };

    const handleDelete = (id) => {
        if (window.confirm("Xác nhận xóa?")) {
            setData(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(item => item.id !== id) }));
        }
    };

    const StatCard = ({ title, value, icon: Icon, trend, color }) => (
        <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden">
            <div className={`w-12 h-12 rounded-2xl ${color} bg-opacity-10 flex items-center justify-center mb-4`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-end gap-2">
                <h3 className="text-xl font-black text-slate-800">{value}</h3>
                <span className="text-emerald-500 text-[10px] font-bold mb-1 flex items-center">
                    <TrendingUp size={10} /> +{trend}%
                </span>
            </div>
        </motion.div>
    );

    return (
        <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden text-slate-900">
            {/* Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" />
                )}
            </AnimatePresence>

            {/* Navigation Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-8 flex items-center gap-3 shrink-0">
                    <div className="w-10 h-10 bg-indigo-600 rounded-2xl shadow-xl flex items-center justify-center text-white font-black italic text-xl">TH</div>
                    <span className="text-2xl font-black tracking-tighter uppercase italic text-slate-800">TravelHub<span className="text-indigo-600">.</span></span>
                </div>
                <nav className="flex-1 px-4 space-y-1.5 mt-4 overflow-y-auto">
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
                    <button className="w-full flex items-center justify-center gap-3 py-4 text-rose-500 font-black text-sm uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition"><LogOut size={18} /> Thoát</button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2.5 bg-slate-50 text-slate-600 rounded-xl"><Menu size={20}/></button>
                        <h2 className="hidden md:block text-xs font-black text-slate-400 uppercase tracking-widest">Hệ thống quản trị v2.0</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <span className="text-sm font-black text-slate-800">Admin Manager</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"><CheckCircle2 size={10}/> Online</span>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-indigo-100 border-2 border-white shadow-sm overflow-hidden"><img src={`https://ui-avatars.com/api/?name=Admin&background=6366f1&color=fff&bold=true`} alt="Avatar" /></div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 scroll-smooth">
                    <div className="max-w-7xl mx-auto h-full flex flex-col">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 shrink-0">
                            <div>
                                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-xs uppercase tracking-[0.2em]"><div className="w-8 h-[2px] bg-indigo-600"></div> Management</div>
                                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter capitalize">{activeTab}</h1>
                            </div>
                            {activeTab !== 'overview' && activeTab !== 'chat' && (
                                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"><Plus size={18}/> Thêm mới</button>
                            )}
                        </div>

                        <div className="flex-1 min-h-0">
                            {activeTab === 'overview' ? (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                        <StatCard title="Doanh thu" value={(Number(overviewData?.revenue) || 0).toLocaleString() + '₫'} icon={DollarSign} trend={12.4} color="bg-indigo-600" />
                                        <StatCard title="Vé đã bán" value={overviewData.totalTickets} icon={Plane} trend={8.1} color="bg-blue-500" />
                                        <StatCard title="Người dùng" value={overviewData.activeUsers} icon={Users} trend={15.3} color="bg-emerald-500" />
                                        <StatCard title="Booking chờ" value="42" icon={Calendar} trend={2.4} color="bg-orange-500" />
                                    </div>
                                    <div className="bg-white p-6 lg:p-8 rounded-[32px] border border-slate-100 shadow-sm h-[400px]">
                                        <h3 className="text-lg font-black text-slate-800 uppercase italic mb-6">Tăng trưởng doanh thu</h3>
                                        <ResponsiveContainer width="100%" height="85%">
                                            <AreaChart data={overviewData.chartData}>
                                                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                                <YAxis hide />
                                                <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                                                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fill="url(#g)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            ) : activeTab === 'chat' ? (
                                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 h-full min-h-[500px] overflow-hidden">
                                    <AdminChat />
                                </div>
                            ) : (
                                <div className="bg-white rounded-3xl border border-slate-100 overflow-x-auto shadow-sm">
                                    <table className="w-full text-left min-w-[700px]">
                                        <thead className="bg-slate-50/50 border-b border-slate-100">
                                            <tr><th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin</th><th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th><th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá</th><th className="p-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {(data[activeTab] || []).map(item => (
                                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-5 font-bold text-slate-700">{item.name || 'Dữ liệu TravelHub'}</td>
                                                    <td className="p-5 text-sm text-slate-500 italic">{item.departureDate || '2024-12-30'}</td>
                                                    <td className="p-5 font-black text-slate-800">{(Number(item?.price) || 0).toLocaleString()}₫</td>
                                                    <td className="p-5 text-right"><button onClick={() => handleDelete(item.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={16}/></button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;