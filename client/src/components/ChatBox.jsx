import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './ChatBox.css';

// Lưu ý: Thay localhost bằng IP của bạn nếu chạy trên thiết bị khác
const socket = io("http://localhost:3001");

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const scrollRef = useRef();

    useEffect(() => {
        // Lắng nghe phản hồi RIÊNG từ Admin gửi cho mình
        socket.on("admin_reply", (data) => {
            setMessages((prev) => [...prev, { ...data, sender: 'admin' }]);
        });

        return () => socket.off("admin_reply");
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const sendMessage = () => {
        if (message.trim()) {
            const msgData = { 
                text: message, 
                senderId: socket.id, // Gửi ID của mình để admin biết là ai
                time: new Date().toLocaleTimeString() 
            };
            
            // Gửi cho Server để chuyển tới Admin
            socket.emit("client_msg", msgData);

            // Cập nhật giao diện của khách ngay lập tức
            setMessages((prev) => [...prev, { ...msgData, sender: 'customer' }]);
            setMessage("");
        }
    };

    return (
        <div className={`chat-wrapper ${isOpen ? 'open' : ''}`}>
            {!isOpen && (
                <button className="chat-launcher" onClick={() => setIsOpen(true)}>
                    💬 Hỗ trợ trực tuyến
                </button>
            )}
            
            {isOpen && (
                <div className="chat-window">
                    <div className="chat-header">
                        <span>Hỗ trợ TravelHub</span>
                        <button onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    <div className="chat-body">
                        {messages.map((m, i) => (
                            <div key={i} className={`msg ${m.sender}`}>
                                <div className="text">{m.text}</div>
                                <div className="time">{m.time}</div>
                            </div>
                        ))}
                        <div ref={scrollRef} />
                    </div>
                    <div className="chat-footer">
                        <input 
                            value={message} 
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Nhập câu hỏi..."
                        />
                        <button onClick={sendMessage}>Gửi</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatBox;