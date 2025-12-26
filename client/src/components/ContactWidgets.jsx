import React from 'react';
import { FaFacebookMessenger } from 'react-icons/fa';
import { SiZalo } from 'react-icons/si'; // Cần cài: npm install react-icons

const ContactWidgets = () => {
  return (
    <div className="fixed bottom-20 right-6 flex flex-col gap-3 z-[999]">
      {/* Widget Zalo */}
      <a
        href="https://zalo.me/0xxxxxxxxx" // Thay bằng số điện thoại của bạn
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
        title="Chat qua Zalo"
      >
        <span className="font-bold text-xs">Zalo</span>
      </a>

      {/* Widget Messenger */}
      <a
        href="https://m.me/yourprofile" // Thay bằng ID/Username Facebook của bạn
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform"
        title="Chat qua Messenger"
      >
        <FaFacebookMessenger className="text-2xl" />
      </a>
    </div>
  );
};

export default ContactWidgets;