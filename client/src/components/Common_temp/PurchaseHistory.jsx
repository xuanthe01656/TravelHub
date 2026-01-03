import { FaReceipt, FaArrowLeft } from 'react-icons/fa';
import formatCurrency from '../../utils/formatCurrency';

export default function PurchaseHistory({ isLogged, purchases, title = 'Lịch sử đặt' }) {
  if (!isLogged || purchases.length === 0) return null;

  return (
    <div className="mt-16">
      <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <FaReceipt className="text-blue-500"/> {title}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {purchases.map((p, idx) => (
          <div key={idx} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.from || p.location}</div>
                <FaArrowLeft className="rotate-180 text-slate-300" />
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 font-bold text-lg">{p.to || p.name}</div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.status === 'Đã hủy' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                {p.status || 'Hoàn tất'}
              </span>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex justify-between">
                <span>Ngày {title.toLowerCase().includes('đặt') ? 'đặt' : 'mua'}:</span>
                <span className="font-medium">{new Date(p.date).toLocaleDateString('vi-VN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Tổng tiền:</span>
                <span className="font-bold text-slate-800">{formatCurrency(p.totalPrice || p.price)}</span>
              </div>
              {p.bankName && <div className="text-xs text-slate-400 mt-2 pt-2 border-t">TT qua {p.bankName}: {p.bankNote}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}