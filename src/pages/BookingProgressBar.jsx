import React from 'react';
import './BookingProgressBar.css';

// steps: array of { label: string, active: boolean, done: boolean }
export default function BookingProgressBar({ step }) {
  // step: 1-based index
  const steps = [
    { label: 'Chọn tour', key: 1 },
    { label: 'Nhập thông tin', key: 2 },
    { label: 'Xác nhận', key: 3 },
    { label: 'Thanh toán', key: 4 },
    { label: 'Hoàn tất', key: 5 },
  ];
  return (
    <div className="booking-progress-bar">
      {steps.map((s, idx) => {
        const current = step === s.key;
        const done = step > s.key;
        return (
          <div key={s.key} className={`progress-step${current ? ' active' : ''}${done ? ' done' : ''}`}>
            <span className="step-index">{idx + 1}</span>
            <span className="step-label">{s.label}</span>
            {idx < steps.length - 1 && <span className="step-arrow">→</span>}
          </div>
        );
      })}
    </div>
  );
}
