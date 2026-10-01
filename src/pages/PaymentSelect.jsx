import React, { useState } from 'react';
import './PaymentSelect.css';

const paymentMethods = [
  {
    type: 'e-wallet',
    label: 'Ví điện tử',
    options: [
      { value: 'momo', label: 'MoMo', logo: '/icons/momo.png' },
      { value: 'vnpay', label: 'VNPAY', logo: '/icons/vnpay.png', promo: 'Nhập mã VNPAYVT350 (Giảm 150K cho đơn từ 19tr900K; Giảm 250K từ 39tr900K; Giảm 350K từ 49tr900K)' },
      { value: 'zalopay', label: 'ZaloPay', logo: '/icons/zalopay.png' },
    ]
  },
  {
    type: 'credit',
    label: 'Thẻ tín dụng/ghi nợ',
    options: [
      { value: 'visa', label: 'Visa', logo: '/icons/visa.png' },
      { value: 'mastercard', label: 'Mastercard', logo: '/icons/mastercard.png' },
      { value: 'jcb', label: 'JCB', logo: '/icons/jcb.png' },
      { value: 'amex', label: 'American Express', logo: '/icons/american-express.png' },
    ]
  },
  {
    type: 'bank',
    label: 'Chuyển khoản ngân hàng',
    options: [
      { value: 'bank', label: 'Chuyển khoản ngân hàng', logo: '/icons/sgvt-logo.png' }
    ]
  },
  {
    type: 'cash',
    label: 'Tiền mặt tại văn phòng',
    options: [
      { value: 'cash', label: 'Thanh toán tiền mặt', logo: '/icons/bo-cong-thuong.png' }
    ]
  },
];

export default function PaymentSelect({ onSelect }) {
  const [selected, setSelected] = useState('');
  const [sub, setSub] = useState('');

  const handleChange = (type, value) => {
    setSelected(type);
    setSub(value);
  };

  const handleSubmit = e => {
    e.preventDefault();
    if (selected && (sub || selected === 'bank' || selected === 'cash')) {
      onSelect(selected, sub || selected);
    }
  };

  return (
    <form className="payment-select-form" onSubmit={handleSubmit}>
      <h3>Các hình thức thanh toán</h3>
      <div className="pay-methods-list">
        {paymentMethods.map(method => (
          <div key={method.type} className="pay-group">
            <div className="pay-group-label">{method.label}</div>
            <div className="pay-options-row">
              {method.options.map(opt => (
                <label key={opt.value} className={`pay-option${selected === method.type && sub === opt.value ? ' selected' : ''}`}>
                  <input
                    type="radio"
                    name={method.type}
                    checked={selected === method.type && sub === opt.value}
                    onChange={() => handleChange(method.type, opt.value)}
                  />
                  {opt.logo && <img src={opt.logo} alt={opt.label} style={{height:36,marginRight:10,verticalAlign:'middle'}} />}
                  <span>{opt.label}</span>
                  {opt.promo && <span className="pay-promo">{opt.promo}</span>}
                  {opt.desc && <div className="pay-desc">{opt.desc}</div>}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button type="submit" className="btn btn-primary mt-3">Xác nhận</button>
    </form>
  );
}
