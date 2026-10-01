import React, { useState } from 'react';
import BookingProgressBar from './BookingProgressBar';
import { useSearchParams, useNavigate } from 'react-router-dom';
import PaymentSelect from './PaymentSelect';
import BookingDone from './BookingDone';
import './PaymentPage.css';

export default function PaymentPage() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const [method, setMethod] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSelect = (m, s) => {
    setMethod(m);
    // Nếu là ví điện tử thì hoàn tất nhưng chờ thanh toán
    if (m === 'e-wallet') {
      setDone(true);
    } else if (m === 'credit') {
      navigate(`/thanh-toan-the?id=${bookingId}&method=${s}`);
    } else if (m === 'bank' || m === 'cash') {
      setDone(true);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return <BookingDone method={method} />;
  }
  return (
    <div className="payment-page" style={{margin:'32px auto'}}>
      <BookingProgressBar step={4} />
      <h2>Chọn hình thức thanh toán</h2>
      <PaymentSelect onSelect={handleSelect} />
    </div>
  );
}
