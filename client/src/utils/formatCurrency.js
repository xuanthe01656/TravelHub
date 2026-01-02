export default function formatCurrency(n) {
    return Number(n || 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' VND';
  }