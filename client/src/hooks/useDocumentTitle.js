import { useEffect } from 'react';

const useDocumentTitle = (title) => {
  useEffect(() => {
    document.title = title ? `${title} | TravelHub` : 'TravelHub - Trang Chủ';
  }, [title]);
};

export default useDocumentTitle;