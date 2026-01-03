import { FaTimes, FaUniversity } from 'react-icons/fa';
import { useNavigate, useLocation } from 'react-router-dom';
import formatCurrency from '../../utils/formatCurrency';

export default function BankGuideModal({ bankGuide }) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!bankGuide) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4 animate-fade-in">
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl max-w-md w-full relative">
        <button onClick={() => navigate(location.pathname, { replace: true, state: {} })} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <FaTimes className="text-xl" />
        </button>
        <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
          <FaUniversity /> Chuyển khoản ngay
        </h3>
        <p className="text-sm text-slate-600 mb-4">Quét mã QR hoặc chuyển khoản thủ công trong <strong>{bankGuide.expireMinutes} phút</strong>.</p>
        
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 mb-6">
          {bankGuide.vietQR ? (
            <div className="flex justify-center mb-4">
              <img src={bankGuide.vietQR} alt="VietQR" className="w-48 h-48 rounded-xl shadow-md border-4 border-white" />
            </div>
          ) : null}
          <div className="flex justify-between text-sm"><span className="text-slate-500">Ngân hàng:</span> <span className="font-bold">{bankGuide.bank}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Số TK:</span> <span className="font-bold font-mono text-lg">{bankGuide.accountNumber}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Chủ TK:</span> <span className="font-bold">{bankGuide.accountName}</span></div>
          <div className="flex justify-between text-sm"><span className="text-slate-500">Nội dung:</span> <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{bankGuide.content}</span></div>
          <div className="flex justify-between text-sm items-center pt-2 border-t"><span className="text-slate-500">Số tiền:</span> <span className="font-black text-xl text-red-500">{formatCurrency(bankGuide.amount)}</span></div>
        </div>
        
        <button onClick={() => navigate(location.pathname, { replace: true, state: {} })} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition">
          Đã Chuyển Khoản Xong
        </button>
      </div>
    </div>
  );
}