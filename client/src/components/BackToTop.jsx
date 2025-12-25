import React, { useState, useEffect } from 'react';
import { FaArrowUp } from 'react-icons/fa';

const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Kiểm tra độ cuộn của trang
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-24 right-6 z-[999]">
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="p-4 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-all duration-300 animate-bounce"
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
};

export default BackToTop;