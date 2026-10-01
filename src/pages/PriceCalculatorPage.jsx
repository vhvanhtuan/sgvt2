import React, { useEffect, useState } from 'react';
import { formatNumber } from '../utils/formatNumber';
import './BusRentalPage.css';

function PriceCalculatorPage() {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';
  const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY || '';

  const [busTypes, setBusTypes] = useState([]);
  const [form, setForm] = useState({
    loai_xe: '45 chỗ',
    tong_km: '',
    so_ngay: 1,
    bus_count: 1,
    phi_cau_duong: 0
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load bus types on mount
  useEffect(() => {
    fetch(`${API_BASE}/bus_rental.php?action=fields`)
      .then(res => res.json())
      .then(data => {
        const types = (data.car_fields || []).map(f => f.field_title || f);
        setBusTypes(types);
      })
      .catch(err => console.error('Error loading bus types:', err));
  }, [API_BASE]);

  // Load reCAPTCHA script
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY) return;
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [RECAPTCHA_SITE_KEY]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!form.loai_xe || form.loai_xe === '__none__') {
      setError('Vui lòng chọn loại xe.');
      return;
    }
    if (!form.tong_km || parseFloat(form.tong_km) <= 0) {
      setError('Vui lòng nhập tổng KM > 0.');
      return;
    }
    if (!form.so_ngay || parseInt(form.so_ngay) <= 0) {
      setError('Vui lòng nhập số ngày > 0.');
      return;
    }
    if (!form.bus_count || parseInt(form.bus_count) <= 0) {
      setError('Vui lòng nhập số xe > 0.');
      return;
    }

    let captchaToken = null;
    if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
      captchaToken = window.grecaptcha.getResponse();
      if (!captchaToken) {
        setError('Vui lòng xác minh reCAPTCHA.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = {
        loai_xe: form.loai_xe,
        tong_km: parseFloat(form.tong_km),
        so_ngay: parseInt(form.so_ngay),
        bus_count: parseInt(form.bus_count),
        phi_cau_duong: parseFloat(form.phi_cau_duong || 0),
        recaptcha_token: captchaToken
      };

      const res = await fetch(`${API_BASE}/bus_rental.php?action=calculate_price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        setError(data.message || 'Có lỗi xảy ra.');
        if (RECAPTCHA_SITE_KEY && window.grecaptcha) {
          window.grecaptcha.reset();
        }
        return;
      }

      setResult(data.data);
    } catch (err) {
      setError('Có lỗi xảy ra: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-rental-page">
      <h2>Tính giá thuê xe</h2>
      <h4>Công cụ tự tính toán giá rent xe du lịch</h4>
      <div className="mb-4">
        <form onSubmit={handleSubmit} className="row g-3" style={{ maxWidth: '600px' }}>
          <div className="col-md-12">
            <label className="form-label">Loại xe <span style={{ color: 'red' }}>*</span></label>
            <select
              name="loai_xe"
              className="form-select"
              value={form.loai_xe}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn loại xe --</option>
              {busTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-6">
            <label className="form-label">Tổng KM (tính từ điểm xuất phát và quay về điểm ban đầu, <a href='https://www.google.com/maps' target='_blank' rel='noopener noreferrer'>khách dùng GG map tự tra cho dễ</a>) <span style={{ color: 'red' }}>*</span></label>
            <input
              type="number"
              name="tong_km"
              className="form-control"
              value={form.tong_km}
              onChange={handleChange}
              min="1"
              step="0.1"
              placeholder="Nhập tổng km"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Số ngày <span style={{ color: 'red' }}>*</span></label>
            <input
              type="number"
              name="so_ngay"
              className="form-control"
              value={form.so_ngay}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="Nhập số ngày"
              required
            />
          </div>

          <div className="col-md-6">
            <label className="form-label">Số xe <span style={{ color: 'red' }}>*</span></label>
            <input
              type="number"
              name="bus_count"
              className="form-control"
              value={form.bus_count}
              onChange={handleChange}
              min="1"
              step="1"
              placeholder="Nhập số xe"
              required
            />
          </div>

          {/* <div className="col-md-6">
            <label className="form-label">Phí cầu đường (VND)</label>
            <input
              type="number"
              name="phi_cau_duong"
              className="form-control"
              value={form.phi_cau_duong}
              onChange={handleChange}
              step="1000"
              placeholder="Nhập phí cầu đường (tùy chọn)"
            />
          </div> */}

          {RECAPTCHA_SITE_KEY && (
            <div className="col-md-12">
              <div
                className="g-recaptcha"
                data-sitekey={RECAPTCHA_SITE_KEY}
              ></div>
            </div>
          )}

          <div className="col-md-12">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Đang tính toán...' : 'Tính giá'}
            </button>
          </div>
        </form>

        {error && (
          <div className="alert alert-danger mt-3" role="alert">
            {error}
          </div>
        )}

        {result && (
          <div style={{
            marginTop: '30px',
            padding: '20px',
            border: '2px solid #28a745',
            borderRadius: '6px',
            backgroundColor: '#f0fff4'
          }}>
            <h4 style={{ color: '#28a745', marginBottom: '15px' }}>Kết quả tính giá</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Loại xe:</td>
                  <td style={{ padding: '8px' }}>{result.loai_xe}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Tổng KM:</td>
                  <td style={{ padding: '8px' }}>{result.tong_km}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Số ngày:</td>
                  <td style={{ padding: '8px' }}>{result.so_ngay}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Số xe:</td>
                  <td style={{ padding: '8px' }}>{result.bus_count}</td>
                </tr>
                {/* <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Định mức xe (km/lít):</td>
                  <td style={{ padding: '8px' }}>{result.dinh_muc_xe}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Giá dầu (VND/lít):</td>
                  <td style={{ padding: '8px' }}>{formatNumber(parseInt(result.gia_dau))}</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Lợi nhuận xe (VND/ngày):</td>
                  <td style={{ padding: '8px' }}>{formatNumber(parseInt(result.loi_nhuan_xe))}</td>
                </tr> */}
                {/* <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>Phí cầu đường:</td>
                  <td style={{ padding: '8px' }}>{formatNumber(parseInt(result.phi_cau_duong))}</td>
                </tr> */}
                <tr style={{ backgroundColor: '#fff3cd' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '16px' }}>Tổng giá (VND):</td>
                  <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '18px', color: '#d9534f' }}>
                    {formatNumber(parseInt(result.tong_vnd))}
                  </td>
                </tr>
              </tbody>
            </table>
            {/* <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
              Công thức: vnd = bus_count × ((tong_km × dinh_muc_xe × gia_dau) + phi_cau_duong + loi_nhuan_xe × days)
            </p> */}
            <p style={{ marginTop: '15px', color: '#666' }}>
              Lưu ý: Giá <strong>chưa bao gồm</strong> VAT, phí ăn ở của tài xế, phí cầu đường, bến bãi và các chi phí phát sinh khác. Kết quả tính toán chỉ mang tính chất tham khảo. Giá thuê xe thực tế có thể thay đổi tùy theo thời điểm (cao/thấp điểm), đời xe, và các yếu tố khác. Vui lòng liên hệ trực tiếp với chúng tôi để nhận báo giá chính xác.
            </p>
            <p style={{ marginTop: '15px', color: '#666' }}>
              Ngày được tính từ ....
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PriceCalculatorPage;
