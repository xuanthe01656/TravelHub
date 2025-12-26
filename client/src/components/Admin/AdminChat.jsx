import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Circle, MessageCircle, ArrowLeft, MoreVertical } from 'lucide-react';

// Khởi tạo socket ngoài component
const socket = io("http://10.93.17.241:3001", {
  transports: ["websocket"],
  reconnectionAttempts: 5
});

const AdminChat = () => {
  const [chats, setChats] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [reply, setReply] = useState('');
  const scrollRef = useRef();

  useEffect(() => {
    socket.emit('join', 'admin');

    const handleIncomingMsg = (data) => {
      console.log("📩 Tin nhắn mới:", data);
      const customerId = data.senderId;
      if (!customerId) return;

      setChats((prev) => {
        const oldMsgs = prev[customerId] || [];
        return {
          ...prev,
          [customerId]: [
            ...oldMsgs,
            { 
              ...data, 
              sender: 'customer', 
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
            }
          ]
        };
      });
    };

    socket.on('admin_receive_msg', handleIncomingMsg);
    return () => socket.off('admin_receive_msg', handleIncomingMsg);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, selectedId]);

  const handleSend = () => {
    if (!reply.trim() || !selectedId) return;
    const msgData = { targetId: selectedId, text: reply };
    socket.emit('admin_reply_msg', msgData);

    setChats((prev) => ({
      ...prev,
      [selectedId]: [
        ...(prev[selectedId] || []),
        { 
          text: reply, 
          sender: 'admin', 
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
        }
      ]
    }));
    setReply('');
  };

  return (
    /* h-full ở đây sẽ lấp đầy thẻ div bọc nó trong AdminDashboard */
    <div className="flex h-[600px] lg:h-[calc(100vh-280px)] w-full bg-white overflow-hidden text-slate-900 font-sans">
      
      {/* Sidebar danh sách khách hàng */}
      <aside className={`${selectedId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-slate-100 bg-slate-50/50`}>
        <div className="p-6 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-slate-800 uppercase tracking-tighter">Hội thoại</h3>
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full">
              LIVE
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {Object.keys(chats).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <MessageCircle size={40} className="mb-2" />
              <p className="text-xs font-bold italic">Đang chờ tin nhắn...</p>
            </div>
          ) : (
            Object.keys(chats).map((id) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                key={id}
                onClick={() => setSelectedId(id)}
                className={`flex items-center gap-4 p-4 rounded-[20px] cursor-pointer transition-all ${
                  selectedId === id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'hover:bg-white hover:shadow-sm'
                }`}
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shrink-0 ${
                  selectedId === id ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {id.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-black truncate ${selectedId === id ? 'text-white' : 'text-slate-700'}`}>
                    User_{id.substring(0, 5)}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${selectedId === id ? 'text-indigo-100 opacity-80' : 'text-slate-400 font-medium'}`}>
                    {chats[id][chats[id].length - 1]?.text}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </aside>

      {/* Nội dung chat chính */}
      <main className={`${selectedId ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-white relative`}>
        {selectedId ? (
          <>
            <header className="h-20 flex items-center justify-between px-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedId(null)} className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                  {selectedId.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">Khách hàng: {selectedId.substring(0, 8)}</h4>
                  <div className="flex items-center gap-1.5">
                    <Circle size={6} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-emerald-500 font-black uppercase">Đang trực tuyến</span>
                  </div>
                </div>
              </div>
              <MoreVertical size={20} className="text-slate-300 cursor-pointer" />
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]">
              <AnimatePresence initial={false}>
                {chats[selectedId]?.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] p-4 rounded-[24px] text-sm shadow-sm font-medium ${
                      m.sender === 'admin' 
                        ? 'bg-indigo-600 text-white rounded-br-none shadow-indigo-100' 
                        : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                    }`}>
                      {m.text}
                      <div className={`text-[9px] mt-2 font-bold opacity-50 text-right ${m.sender === 'admin' ? 'text-white' : 'text-slate-400'}`}>
                        {m.time}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={scrollRef} />
            </div>

            <div className="p-6 bg-white border-t border-slate-100">
              <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[22px] border border-slate-100 focus-within:border-indigo-200 transition-all">
                <input
                  type="text"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Viết phản hồi cho khách hàng..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm font-medium outline-none"
                />
                <button
                  onClick={handleSend}
                  className="bg-indigo-600 text-white p-3 rounded-[18px] hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-90"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-[#F8FAFC]">
            <div className="w-24 h-24 bg-white rounded-[32px] shadow-sm flex items-center justify-center text-indigo-200 mb-6">
               <MessageCircle size={48} />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tighter">Hỗ trợ trực tuyến</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 max-w-[240px] leading-loose">
              Chọn một phiên chat để bắt đầu hỗ trợ khách hàng
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminChat;