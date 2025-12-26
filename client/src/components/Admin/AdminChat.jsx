import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './AdminChat.css'; // Tạo file CSS riêng hoặc dùng style inline

//const socket = io("http://localhost:3001");
//const socket = io("http://10.93.22.210:3001");
const socket = io("http://10.93.17.241:3001");

const AdminChat = () => {
    const [chats, setChats] = useState({}); // Cấu trúc: { "socketId": [messages] }
    const [selectedId, setSelectedId] = useState(null); // Khách hàng đang chọn
    const [reply, setReply] = useState("");
    const scrollRef = useRef();

    useEffect(() => {
        // Khai báo với server mình là Admin
        socket.emit("join", "admin");

        // Lắng nghe tin nhắn từ TẤT CẢ khách hàng
        socket.on("admin_receive_msg", (data) => {
            setChats((prev) => {
                const customerId = data.senderId;
                const oldMsgs = prev[customerId] || [];
                return {
                    ...prev,
                    [customerId]: [...oldMsgs, { ...data, sender: 'customer' }]
                };
            });
        });

        return () => socket.off("admin_receive_msg");
    }, []);

    // Tự động cuộn xuống khi có tin mới
    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats, selectedId]);

    const handleSend = () => {
        if (!reply.trim() || !selectedId) return;

        const msgData = { targetId: selectedId, text: reply };
        socket.emit("admin_reply_msg", msgData);

        // Cập nhật vào giao diện Admin
        setChats((prev) => ({
            ...prev,
            [selectedId]: [
                ...prev[selectedId],
                { text: reply, sender: 'admin', time: new Date().toLocaleTimeString() }
            ]
        }));
        setReply("");
    };

    return (
        <div className="admin-chat-container">
            {/* Cột trái: Danh sách khách hàng đang nhắn tin */}
            <div className="sidebar">
                <h3>Khách hàng đang online</h3>
                {Object.keys(chats).length === 0 && <p style={{padding: '10px'}}>Chưa có khách nào...</p>}
                {Object.keys(chats).map((id) => (
                    <div 
                        key={id} 
                        className={`customer-item ${selectedId === id ? 'active' : ''}`}
                        onClick={() => setSelectedId(id)}
                    >
                        Khách hàng: {id.substring(0, 6)}...
                        <span className="msg-count">{chats[id].length}</span>
                    </div>
                ))}
            </div>

            {/* Cột phải: Nội dung chat chi tiết */}
            <div className="main-chat">
                {selectedId ? (
                    <>
                        <div className="chat-header">Đang chat với: {selectedId}</div>
                        <div className="chat-content">
                            {chats[selectedId].map((m, i) => (
                                <div key={i} className={`admin-msg-row ${m.sender}`}>
                                    <div className="admin-msg-bubble">
                                        {m.text}
                                        <small>{m.time}</small>
                                    </div>
                                </div>
                            ))}
                            <div ref={scrollRef} />
                        </div>
                        <div className="chat-input-area">
                            <input 
                                value={reply} 
                                onChange={(e) => setReply(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Nhập câu trả lời..."
                            />
                            <button onClick={handleSend}>Gửi (Enter)</button>
                        </div>
                    </>
                ) : (
                    <div className="empty-state">Chọn một khách hàng bên trái để bắt đầu hỗ trợ</div>
                )}
            </div>
        </div>
    );
};

export default AdminChat;