import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import './ChatBox.css';
import { io } from "socket.io-client";

const getSocketURL = () => {
  if (window.location.protocol === 'https:') {
    return "/"; 
  }
  return `http://${window.location.hostname}:3001`;
};

const socket = io(getSocketURL(), {
  transports: ["websocket"],
  reconnectionAttempts: 5
});

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
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="w-12 hover:w-45 h-12 fixed bottom-6 right-6 z-[100] flex items-center bg-indigo-600 text-white p-3 rounded-full shadow-2xl shadow-indigo-300 group transition-all duration-300 ease-out"
                >
                    <span className="absolute top-2 left-7 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full animate-pulse z-10"></span>
                    <MessageCircle size={26} className="min-w-[28px]" />
                    <span className="max-w-0 opacity-0 group-hover:max-w-xs group-hover:opacity-100 group-hover:ml-3 transition-all duration-500 ease-in-out font-bold whitespace-nowrap text-sm overflow-hidden">
                    Hỗ trợ trực tuyến
                    </span>
                </motion.button>
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