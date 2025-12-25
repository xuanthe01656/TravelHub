// src/pages/Admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion'; // For smooth animations
import {FaSpinner, FaChartBar, FaPlane, FaCar, FaHotel, FaComments, FaSignOutAlt, FaUserCircle } from 'react-icons/fa'; // React Icons
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'; // Recharts for charts
import AdminChat from '../../components/Admin/AdminChat';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('chat'); // 'overview', 'flights', 'cars', 'hotels', 'chat'
    const [overviewData, setOverviewData] = useState({ totalTickets: 0, revenue: 0, activeUsers: 0, chartData: [] }); // Added chartData
    const [flights, setFlights] = useState([]);
    const [cars, setCars] = useState([]);
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'overview') {
            fetchOverview();
        } else if (activeTab === 'flights') {
            fetchFlights();
        } else if (activeTab === 'cars') {
            fetchCars();
        } else if (activeTab === 'hotels') {
            fetchHotels();
        }
    }, [activeTab]);

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/overview', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            // Assuming response includes chartData for revenue over time
            setOverviewData({ ...response.data, chartData: response.data.chartData || [] });
        } catch (err) {
            console.error('Error fetching overview:', err);
        }
        setLoading(false);
    };

    const fetchFlights = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/flights', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setFlights(response.data);
        } catch (err) {
            console.error('Error fetching flights:', err);
        }
        setLoading(false);
    };

    const fetchCars = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/cars', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setCars(response.data);
        } catch (err) {
            console.error('Error fetching cars:', err);
        }
        setLoading(false);
    };

    const fetchHotels = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/api/hotels', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` }
            });
            setHotels(response.data);
        } catch (err) {
            console.error('Error fetching hotels:', err);
        }
        setLoading(false);
    };

    const renderTable = (data, type) => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg shadow">
                <thead className="bg-blue-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">{type === 'flights' ? 'Từ' : type === 'cars' ? 'Nhận' : 'Vị trí'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">{type === 'flights' ? 'Đến' : type === 'cars' ? 'Trả' : 'Check-in'}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Ngày</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Giá</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">Hành động</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {data.map(item => (
                        <tr key={item.id} className="hover:bg-blue-50 transition duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type === 'flights' ? item.originAirportCode : type === 'cars' ? item.pickup : item.location}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{type === 'flights' ? item.destinationAirportCode : type === 'cars' ? item.dropoff : item.checkInDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.departureDate || item.pickupDate || item.checkInDate}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{(item.priceVND || item.price || 0).toLocaleString()} VND</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 mr-4 transition">Sửa</button>
                                <button className="text-red-600 hover:text-red-900 transition">Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </motion.div>
    );

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
            {/* Sidebar - Hiện đại, animation hover */}
            <motion.aside 
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.5 }}
                className="w-64 bg-white shadow-2xl p-6 flex flex-col rounded-r-xl"
            >
                <div className="text-2xl font-bold mb-8 text-blue-600 flex items-center gap-2"><FaChartBar /> TravelHub Admin</div>
                <nav className="flex-1 space-y-3">
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-3 text-lg ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`} 
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaChartBar className="text-xl" /> Tổng quan
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-3 text-lg ${activeTab === 'flights' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`} 
                        onClick={() => setActiveTab('flights')}
                    >
                        <FaPlane className="text-xl" /> Vé máy bay
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-3 text-lg ${activeTab === 'cars' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`} 
                        onClick={() => setActiveTab('cars')}
                    >
                        <FaCar className="text-xl" /> Xe
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-3 text-lg ${activeTab === 'hotels' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`} 
                        onClick={() => setActiveTab('hotels')}
                    >
                        <FaHotel className="text-xl" /> Khách sạn
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        className={`w-full py-3 px-4 rounded-lg text-left flex items-center gap-3 text-lg ${activeTab === 'chat' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-100'}`} 
                        onClick={() => setActiveTab('chat')}
                    >
                        <FaComments className="text-xl" /> Hỗ trợ
                    </motion.button>
                </nav>
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    className="mt-auto py-3 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 justify-center"
                    onClick={() => window.location.href = '/dashboard'}
                >
                    <FaSignOutAlt /> Thoát
                </motion.button>
            </motion.aside>

            {/* Nội dung chính - Animation fade-in */}
            <motion.main 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="flex-1 p-8"
            >
                <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow">
                    <h2 className="text-3xl font-bold text-blue-600 flex items-center gap-2">
                        {activeTab === 'overview' && <FaChartBar />}
                        {activeTab === 'flights' && <FaPlane />}
                        {activeTab === 'cars' && <FaCar />}
                        {activeTab === 'hotels' && <FaHotel />}
                        {activeTab === 'chat' && <FaComments />}
                        {activeTab.toUpperCase()}
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-gray-700">Chào Admin, Nguyễn Văn A</span>
                        <FaUserCircle className="text-4xl text-blue-600" />
                    </div>
                </header>

                <motion.section 
                    key={activeTab}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-xl shadow-xl p-6"
                >
                    {loading ? (
                        <div className="text-center text-blue-600 flex items-center justify-center gap-2">
                            <FaSpinner className="animate-spin text-2xl" /> Đang tải...
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl shadow">
                                            <h3 className="text-lg font-semibold text-blue-700 mb-2 flex items-center gap-2"><FaChartBar /> Tổng vé bán</h3>
                                            <p className="text-4xl font-bold text-gray-800">{overviewData.totalTickets}</p>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow">
                                            <h3 className="text-lg font-semibold text-green-700 mb-2 flex items-center gap-2"><FaChartBar /> Doanh thu</h3>
                                            <p className="text-4xl font-bold text-gray-800">{overviewData.revenue.toLocaleString()} VND</p>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.05 }} className="p-6 bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl shadow">
                                            <h3 className="text-lg font-semibold text-yellow-700 mb-2 flex items-center gap-2"><FaChartBar /> Người dùng hoạt động</h3>
                                            <p className="text-4xl font-bold text-gray-800">{overviewData.activeUsers}</p>
                                        </motion.div>
                                    </div>
                                    {/* Biểu đồ doanh thu */}
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={overviewData.chartData}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" stroke="#888" />
                                                <YAxis stroke="#888" />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'flights' && renderTable(flights, 'flights')}
                            {activeTab === 'cars' && renderTable(cars, 'cars')}
                            {activeTab === 'hotels' && renderTable(hotels, 'hotels')}
                            {activeTab === 'chat' && <AdminChat />}
                        </>
                    )}
                </motion.section>
            </motion.main>
        </div>
    );
};

export default AdminDashboard;