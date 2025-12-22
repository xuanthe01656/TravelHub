// src/pages/Admin/AdminDashboard.jsx
import React, { useState } from 'react';
import AdminChat from '../../components/Admin/AdminChat';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('chat'); // 'overview', 'flights', 'chat'

    return (
        <div className="admin-container">
            {/* Sidebar bên trái */}
            <aside className="admin-sidebar">
                <div className="admin-logo">TravelHub Admin</div>
                <nav>
                    <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>📊 Tổng quan</button>
                    <button className={activeTab === 'flights' ? 'active' : ''} onClick={() => setActiveTab('flights')}>✈️ Quản lý vé</button>
                    <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>💬 Hỗ trợ khách hàng</button>
                </nav>
                <div className="admin-logout">
                    <button onClick={() => window.location.href = '/dashboard'}>Thoát trang Admin</button>
                </div>
            </aside>

            {/* Vùng nội dung bên phải */}
            <main className="admin-content">
                <header className="admin-header">
                    <h2>{activeTab.toUpperCase()}</h2>
                    <div className="admin-profile">Chào Admin, Nguyễn Văn A</div>
                </header>

                <section className="content-body">
                    {activeTab === 'overview' && <div className="stat-grid">Chào mừng bạn trở lại!</div>}
                    {activeTab === 'flights' && <div>Danh sách vé máy bay ở đây...</div>}
                    {activeTab === 'chat' && <AdminChat />}
                </section>
            </main>
        </div>
    );
};

export default AdminDashboard;