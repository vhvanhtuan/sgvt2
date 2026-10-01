import React from 'react';
import BookingProgressBar from './BookingProgressBar';
import './BookingReview.css';

export default function BookingDone({ method }) {
  // method: 'e-wallet', 'credit', 'bank', 'cash', ...
  let isEwallet = method === 'e-wallet';
  return (
    <div className="booking-done-page" style={{margin:'40px auto',textAlign:'center'}}>
      <BookingProgressBar step={5} />
      <h2>Hoàn tất đặt tour</h2>
      <div style={{fontSize:20,margin:'24px 0'}}>
        {isEwallet ? (
          <>
            <div>Đơn hàng đã được ghi nhận.</div>
            <div><b>Vui lòng hoàn tất thanh toán qua ví điện tử.</b></div>
            <div style={{color:'#1976d2',marginTop:12}}>Thông tin chi tiết đã được gửi vào email của bạn.</div>
          </>
        ) : (
          <>
            <div>Đã hoàn tất thanh toán!</div>
            <div style={{color:'#1976d2',marginTop:12}}>Thông tin chi tiết đã được gửi vào email của bạn.</div>
          </>
        )}
      </div>
    </div>
  );
}
