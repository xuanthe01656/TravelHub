import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
  FaPlaneDeparture, FaPlane, FaReceipt, FaArrowLeft, FaCalendarAlt,
  FaCreditCard, FaSpinner, FaWallet, FaUniversity, FaLock, FaCheckCircle,
  FaFacebook, FaInstagram
} from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';
// Validation schema cho thẻ tín dụng
const paymentSchema = Yup.object({
  paymentMethod: Yup.string().required(),
  cardNumber: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (s) => s.matches(/^\d{4} \d{4} \d{4} \d{4}$/, 'Số thẻ phải gồm 16 chữ số').required('Bắt buộc nhập số thẻ'),
  }),
  expiry: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (s) => s.matches(/^\d{2}\/\d{2}$/, 'MM/YY không hợp lệ').required('Bắt buộc'),
  }),
  cvv: Yup.string().when('paymentMethod', {
    is: 'card',
    then: (s) => s.matches(/^\d{3,4}$/, 'CVV không hợp lệ').required('Bắt buộc'),
  }),
});

function Confirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { flightData, tripType } = location.state || {};
  useDocumentTitle('Thanh toán');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [walletProvider, setWalletProvider] = useState('momo');
  const [bankName, setBankName] = useState('VCB');
  const [bankNote, setBankNote] = useState('');

  useEffect(() => {
    if (!flightData) {
      toast.error("Không tìm thấy thông tin đặt chỗ!");
      navigate('/dashboard');
    }
  }, [flightData, navigate]);

  const formatCurrency = (n) => Number(n || 0).toLocaleString('vi-VN') + ' VND';

  const totalPrice = useMemo(() => {
    if (!flightData) return 0;
    if (tripType === 'roundtrip') return flightData.totalPrice ?? 0;
    const price = flightData.flight?.priceVND || 0;
    const pax = flightData.passengers || 1;
    return price * pax;
  }, [tripType, flightData]);

  const pnrCode = useMemo(() => {
    const id = tripType === 'roundtrip' ? flightData?.outboundFlight?.id : flightData?.flight?.id;
    return `FB-${String(id || '0000').slice(-5).toUpperCase()}`;
  }, [tripType, flightData]);

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(' ') || '';
    setCardNumber(formatted);
  };

  const handlePayment = async () => {
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.warn('Bạn cần đăng nhập để thanh toán.');
        navigate('/login');
        return;
      }

      const paymentData = {
        paymentMethod,
        cardNumber,
        expiry,
        cvv,
        walletProvider,
        bankName,
        bankNote: bankNote || pnrCode,
      };

      await paymentSchema.validate(paymentData, { abortEarly: false });
      console.log(flightData);
      const common = {
        passengers: flightData.passengers,
        class: flightData.class,
        method: paymentMethod,
        amount: totalPrice,
        meta: {
          pnrHint: pnrCode,
          walletProvider: paymentMethod === 'wallet' ? walletProvider : undefined,
          bankName: paymentMethod === 'bank' ? bankName : undefined,
          bankNote: paymentMethod === 'bank' ? (bankNote || pnrCode) : undefined,
        },
      };
      const flightDetails = tripType === 'roundtrip' ? {
        outbound: flightData.outboundFlight,
        inbound: flightData.returnFlight,
        totalPrice: totalPrice // Giá đã tính ở frontend
      } : {
        flight: flightData.flight,
        totalPrice: totalPrice
      };
      const payload = {
        passengers: flightData.passengers,
        class: flightData.class,
        method: paymentMethod,
        tripType: tripType,
        flightDetails: flightDetails, // Gửi chi tiết để backend không cần getFlights()
        meta: {
          bankName,
          bankNote: bankNote || pnrCode,
        }
      };
     
      // TRƯỜNG HỢP: THẺ TÍN DỤNG
      if (paymentMethod === 'card') {
        await axios.post('/api/buy-ticket', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success('Thanh toán thẻ thành công!');
        navigate('/flights');
        return;
      }

      // TRƯỜNG HỢP: VÍ ĐIỆN TỬ (MoMo, ZaloPay)
      if (paymentMethod === 'wallet') {
        const { data } = await axios.post('/api/buy-ticket/wallet', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const redirectUrl = data?.redirectUrl;
        if (!redirectUrl) {
          throw new Error('Không nhận được URL thanh toán ví điện tử.');
        }
        toast.info('Đang chuyển tới cổng ví điện tử...');
        window.location.href = redirectUrl; // Chuyển hướng trang
        return;
      }

      // TRƯỜNG HỢP: CHUYỂN KHOẢN NGÂN HÀNG
      if (paymentMethod === 'bank') {
        const { data } = await axios.post('/api/buy-ticket/bank', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Chuyển hướng về Dashboard và mở Modal QR
        navigate('/flights', { 
          state: { bankGuide: data.guide }, 
          replace: true 
        });
        toast.success('Vui lòng thanh toán theo hướng dẫn QR');
      }

    } catch (err) {
      if (err.name === 'ValidationError') {
        err.inner.forEach((e) => toast.warn(e.message));
      } else {
        toast.error('Thanh toán thất bại: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setPaymentLoading(false);
    }
  };

  if (!flightData) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER */}
      <nav className="bg-white shadow-sm border-b p-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <FaPlaneDeparture /> <span>FlightBooking</span>
          </div>
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-blue-600 font-medium">
            <FaArrowLeft /> Quay lại
          </button>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto mt-8 px-4 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* CỘT TRÁI: THANH TOÁN */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <FaCreditCard className="text-blue-500" /> Chọn phương thức thanh toán
            </h2>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { id: 'card', icon: <FaCreditCard />, label: 'Thẻ Quốc Tế' },
                { id: 'wallet', icon: <FaWallet />, label: 'Ví Điện Tử' },
                { id: 'bank', icon: <FaUniversity />, label: 'Chuyển Khoản' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-100 hover:border-blue-200'}`}
                >
                  <span className="text-2xl mb-2">{m.icon}</span>
                  <span className="text-sm font-semibold">{m.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {paymentMethod === 'card' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Số thẻ</label>
                    <input type="text" value={cardNumber} onChange={handleCardNumberChange} placeholder="0000 0000 0000 0000" className="w-full p-3 border rounded-xl focus:ring-2 ring-blue-100 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Hạn sử dụng</label>
                    <input type="text" value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="MM/YY" className="w-full p-3 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">CVV</label>
                    <input type="password" value={cvv} onChange={e => setCvv(e.target.value)} placeholder="***" className="w-full p-3 border rounded-xl" />
                  </div>
                </div>
              )}
              {paymentMethod === 'wallet' && (
                <select value={walletProvider} onChange={e => setWalletProvider(e.target.value)} className="w-full p-4 border rounded-xl bg-gray-50 font-medium">
                  <option value="momo">Ví MoMo</option>
                  <option value="zalopay">ZaloPay</option>
                </select>
              )}
              {paymentMethod === 'bank' && (
                <div className="space-y-4">
                  <select value={bankName} onChange={e => setBankName(e.target.value)} className="w-full p-4 border rounded-xl">
                    <option value="VCB">Vietcombank</option>
                    <option value="ACB">ACB Bank</option>
                    <option value="TCB">Techcombank</option>
                  </select>
                  <input type="text" value={bankNote} onChange={e => setBankNote(e.target.value)} placeholder={`Nội dung: ${pnrCode}`} className="w-full p-4 border rounded-xl" />
                </div>
              )}
            </div>

            <button
              onClick={handlePayment}
              disabled={paymentLoading}
              className={`w-full mt-10 py-4 rounded-2xl font-bold text-lg text-white transition-all flex justify-center items-center gap-3 ${paymentLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200'}`}
            >
              {paymentLoading ? <FaSpinner className="animate-spin" /> : <FaLock />}
              {paymentLoading ? 'ĐANG XỬ LÝ...' : `THANH TOÁN ${formatCurrency(totalPrice)}`}
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-3xl shadow-sm border p-6 sticky top-24">
            <h3 className="text-xl font-bold mb-6 pb-2 border-b">Tóm tắt chuyến đi</h3>
            <div className="space-y-6">
              {tripType === 'roundtrip' ? (
                <>
                  <FlightSegment label="CHIỀU ĐI" flight={flightData.outboundFlight} />
                  <FlightSegment label="CHIỀU VỀ" flight={flightData.returnFlight} />
                </>
              ) : (
                <FlightSegment label="CHUYẾN BAY" flight={flightData.flight} />
              )}

              <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Hành khách:</span>
                  <span className="font-bold text-blue-900">{flightData.passengers || 1} người</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 font-medium">Hạng vé:</span>
                  <span className="font-bold text-blue-900 uppercase">{flightData.class}</span>
                </div>
                <div className="border-t border-blue-200 pt-3 flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-700">TỔNG CỘNG:</span>
                  <span className="text-xl font-black text-orange-600">{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER - BẮT BUỘC ĐỂ THÔNG BÁO BỘ CÔNG THƯƠNG */}
      <footer className="bg-[#0f172a] text-gray-400 py-12 px-6 mt-16 rounded-t-[3rem] shadow-2xl border-t border-white/10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
          {/* Cột 1: Thông tin doanh nghiệp */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">FlightBooking - Công Ty</h3>
            <div className="text-sm space-y-2 leading-relaxed">
              <p>Mã số doanh nghiệp: 0123456789 do Sở KH&ĐT cấp ngày 01/01/2025</p>
              <p>Địa chỉ: Số 123, Đường ABC, Quận XYZ, TP. Hồ Chí Minh</p>
              <p>Điện thoại: 028.1234.5678</p>
              <p>Email: contact@flightbooking.vn</p>
            </div>
          </div>

          {/* Cột 2: Chính sách */}
          <div className="space-y-4">
            <h3 className="text-white font-bold text-lg">Chính sách & Quy định</h3>
            <ul className="text-sm space-y-3">
              <li><a href="/chinh-sach-bao-mat" className="hover:text-blue-400 transition">Chính sách bảo mật</a></li>
              <li><a href="/dieu-khoan-su-dung" className="hover:text-blue-400 transition">Điều khoản sử dụng</a></li>
              <li><a href="/huong-dan-thanh-toan" className="hover:text-blue-400 transition">Hướng dẫn thanh toán</a></li>
              <li><a href="/chinh-sach-hoan-huy" className="hover:text-blue-400 transition">Chính sách hoàn hủy vé</a></li>
            </ul>
          </div>

          {/* Cột 3: Kết nối và Logo BCT */}
          <div className="space-y-4 text-center md:text-right">
            <h3 className="text-white font-bold text-lg">Kết nối với chúng tôi</h3>
            <div className="flex justify-center md:justify-end gap-6 mb-8 text-2xl">
              <a href="#" className="hover:text-blue-400 transition"><FaFacebook /></a>
              <a href="#" className="hover:text-blue-400 transition"><FaInstagram /></a>
            </div>
            
            <div className="flex justify-center md:justify-end">
              <a href="http://online.gov.vn/" target="_blank" rel="noreferrer">
                <img 
                  src="https://chinhphu.vn/images/da-thong-bao-bo-cong-thuong.png" 
                  alt="Đã thông báo Bộ Công Thương" 
                  className="w-40 h-auto grayscale hover:grayscale-0 transition duration-300"
                />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs tracking-widest uppercase">
          <p>© 2025 FlightBooking. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

// Helper Component cho chặng bay
function FlightSegment({ label, flight }) {
  if (!flight) return null;
  const airlineName = typeof flight.airline === 'object' ? flight.airline.name : (flight.airline || 'N/A');
  const aircraftName = typeof flight.aircraft === 'object' ? flight.aircraft.name : (flight.aircraft || 'N/A');

  return (
    <div className="relative pl-4 border-l-2 border-blue-100">
      <p className="text-[10px] font-black text-blue-400 tracking-widest mb-2 uppercase">{label}</p>
      <div className="flex justify-between items-center mb-1">
        <span className="text-lg font-bold">{flight.originAirportCode}</span>
        <FaPlane className="text-gray-300 text-xs" />
        <span className="text-lg font-bold">{flight.destinationAirportCode}</span>
      </div>
      <div className="text-xs text-gray-500 flex flex-col gap-1">
        <div className="flex items-center gap-1"><FaCalendarAlt className="text-[10px]" /> {new Date(flight.departureDate).toLocaleDateString('vi-VN')}</div>
        <div className="font-semibold text-gray-700">{airlineName} • {aircraftName}</div>
      </div>
    </div>
  );
}

export default Confirmation;