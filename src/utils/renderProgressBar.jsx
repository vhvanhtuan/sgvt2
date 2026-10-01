import React from 'react';

export const bookingProgressSteps = [
  'Nhập nhu cầu',
  'Yêu cầu thêm',
  'Thông tin liên hệ',
  'Đã gửi booking',
];

function renderProgressBar_old(steps, activeStep = 1) { // export
  return (
    <div className="booking-progress-bar">
      {steps.map((step, index) => {
        const stepIndex = index + 1;
        const isActive = stepIndex === activeStep;
        const isDone = stepIndex < activeStep;
        return (
          <div key={stepIndex} className={`progress-step${isActive ? ' active' : ''}${isDone ? ' done' : ''}`}>
            <span className="step-index">{stepIndex}</span>
            <span className="step-label">{step}</span>
            {stepIndex < steps.length && <span className="step-arrow">→</span>}
          </div>
        );
      })}
    </div>
  );
}

export function renderProgressBar(steps, activeStep = 1) {
  return (
<div className="bus-rental-2__steps mb-3"><button type="button" className="bus-rental-2__step done"><span className="bus-rental-2__circle">1</span><span>Nhập nhu cầu</span></button><button type="button" className="bus-rental-2__step done"><span className="bus-rental-2__circle">2</span><span>Yêu cầu thêm</span></button><button type="button" className="bus-rental-2__step done"><span className="bus-rental-2__circle">3</span><span>Thông tin liên hệ</span></button><button type="button" className="bus-rental-2__step active"><span className="bus-rental-2__circle">4</span><span>Đã gửi booking</span></button></div>
  );
}
