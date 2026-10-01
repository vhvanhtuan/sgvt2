import React from 'react';
import { useSearchParams } from 'react-router-dom';
import './PaymentPage.css';

export default function PaymentThe() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const method = searchParams.get('method');

  return (
    <div className="payment-the-page" style={{textAlign:'center',padding:'40px 0'}}>
      <h2>Thanh toán thẻ ({method ? method.toUpperCase() : 'Card'})</h2>
      <img src="/under-construction.webp" alt="Đang xây dựng" style={{maxWidth:360,margin:'32px auto',display:'block'}} />
      <div style={{fontSize:20,marginTop:16}}>Trang đang được phát triển.<br/>Vui lòng chọn phương thức khác hoặc quay lại sau.</div>
      <div style={{marginTop:32}}>
        <a href={bookingId ? `/xem-booking?id=${bookingId}` : '/'} className="btn btn-secondary">Quay lại</a>
      </div>
    </div>
  );
}
