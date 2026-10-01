import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './PaymentQR.css';
import { formatNumber } from '../utils/formatNumber';

export default function PaymentQR() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  // Giả lập dữ liệu booking
  const amount = 19900000;
  const code = bookingId || '260526FS01D6';
  return (
    <div className="payment-qr-page">
      <h2>Thanh toán VNPAY QR</h2>
      <div className="payment-qr-info">
        <div>
          <b>Thông tin đơn hàng</b><br/>
          <div>Mã đơn hàng: <b>{code}</b></div>
          <div>Số tiền thanh toán: <b>{formatNumber(amount)} đ</b></div>
        </div>
        <div>
          <img src="/vnpay-qr-demo.png" alt="QR VNPAY" style={{width:220}} />
        </div>
      </div>
      <div style={{marginTop:16, color:'#888'}}>Quét mã qua ứng dụng Ngân hàng/ Ví điện tử để thanh toán.</div>
    </div>
  );
}
