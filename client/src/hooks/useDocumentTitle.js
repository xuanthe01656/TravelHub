import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    // Cập nhật title và thêm hậu tố thương hiệu để chuyên nghiệp hơn
    document.title = title ? `${title} | TravelHub` : 'TravelHub - Trang Chủ';
  }, [title]);
};

export default useDocumentTitle;