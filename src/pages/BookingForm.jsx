
import React, { useCallback, useEffect, useState } from 'react';
import BookingProgressBar from './BookingProgressBar';
import { useLocation, useNavigate } from 'react-router-dom';
import './BookingReview.css';
import './TourDetail.css';
import { formatNumber } from '../utils/formatNumber';

// Helper: format tiền
function formatVND(val, showSuffix = true) {
  const num = formatNumber(val);
  if (num === '') return '';
  return showSuffix ? num + ' đ' : num;
}

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const initPassenger = () => ({ name: '', dob: '', gender: '0', phone: '', price: 0, pax_age: 0 });


export default function BookingForm(props) {
  const query = useQuery();
  const navigate = useNavigate();
  // Ưu tiên nhận props, fallback query string
  const tour_id = props.tour_id || query.get('tour_id');
  const [dep_date, setDepDate] = useState(props.dep_date || query.get('dep_date') || '');

  const [tour, setTour] = useState(null);
  // const [customer_name, setCustomerName] = useState('Bùi Anh Tuấn');
  // const [customer_phone, setCustomerPhone] = useState('0917335743');
  // const [customer_email, setCustomerEmail] = useState('hb.anhtuan@gmail.com');
  // const [pickup_address, setPickupAddress] = useState('123 Đường Test, Q1, TP.HCM');
  // const [note, setNote] = useState('Test booking tự động');
  // const [passengers, setPassengers] = useState([
  //   { name: 'Bùi Anh Tuấn', dob: '1976-09-21', gender: '0', phone: '0917335743', price: 0, pax_age: 49 }
  // ]);
  const [customer_name, setCustomerName] = useState('');
  const [customer_phone, setCustomerPhone] = useState('');
  const [customer_email, setCustomerEmail] = useState('');
  const [pickup_address, setPickupAddress] = useState('');
  const [note, setNote] = useState('');
  const [passengers, setPassengers] = useState([initPassenger()]);
  
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [fareTable, setFareTable] = useState([]); // bảng giá vé theo ngày khởi hành
  const [fareLoading, setFareLoading] = useState(false);


  // Lấy thông tin tour
  useEffect(() => {
    if (tour_id) {
      fetch(`/api/tours.php?id=${tour_id}`)
        .then(res => res.json())
        .then(res => {
          setTour(res.data || null);
          setLoading(false);
        });
    }
  }, [tour_id]);

  // Lấy bảng giá vé khi đổi ngày khởi hành
  useEffect(() => {
    if (tour_id && dep_date) {
      setFareLoading(true);
      fetch(`/api/tours.php?action=prices&tour_id=${tour_id}&dep_date=${dep_date}`)
        .then(res => res.json())
        .then(res => {
          setFareTable(Array.isArray(res.data) ? res.data : []);
          setFareLoading(false);
        })
        .catch(() => { setFareTable([]); setFareLoading(false); });
    } else {
      setFareTable([]);
    }
  }, [tour_id, dep_date]);

  // Hàm tính tuổi tại ngày kết thúc tour
  function calcAge(dob, dep_date, days) {
    if (!dob || !dep_date || !days) return 0;
    const dobDate = new Date(dob);
    const depDate = new Date(dep_date);
    const endDate = new Date(depDate.getTime() + (days-1)*24*60*60*1000);
    let age = endDate.getFullYear() - dobDate.getFullYear();
    const m = endDate.getMonth() - dobDate.getMonth();
    if (m < 0 || (m === 0 && endDate.getDate() < dobDate.getDate())) age--;
    return age;
  }

  // Hàm lấy giá vé theo tuổi
  const getFareByAge = useCallback((age) => {
    if (!fareTable || fareTable.length === 0) return 0;
    for (const row of fareTable) {
      if (age >= row.age_gtoe && age <= row.age_ltoe) return row.tour_price;
    }
    return 0;
  }, [fareTable]);

  // Cập nhật giá vé và tuổi cho từng khách khi đổi ngày khởi hành, ngày sinh, hoặc bảng giá
  useEffect(() => {
    if (!tour || !dep_date || !fareTable.length) return;
    setPassengers(ps => ps.map(p => {
      if (!p.dob) return { ...p, price: 0, pax_age: 0 };
      const age = calcAge(p.dob, dep_date, tour.days || 1);
      const price = getFareByAge(age);
      return { ...p, price, pax_age: age };
    }));
  }, [dep_date, fareTable, tour, passengers.length, getFareByAge]);

  // Khi đổi ngày sinh khách, cập nhật lại giá vé cho khách đó
  const handlePassengerChangeWithFare = (idx, field, value) => {
    setPassengers(ps => ps.map((p, i) => {
      if (i !== idx) return p;
      let newP = { ...p, [field]: value };
      if ((field === 'dob') && tour && dep_date && fareTable.length) {
        const age = calcAge(value, dep_date, tour.days || 1);
        newP.price = getFareByAge(age);
        newP.pax_age = age;
      }
      return newP;
    }));
  };

  const addPassenger = () => setPassengers(ps => [...ps, initPassenger()]);
  const removePassenger = () => setPassengers(ps => ps.length > 1 ? ps.slice(0, -1) : ps);


  const handleSubmit = async e => {
    e.preventDefault();
    // Kiểm tra ngày khởi hành >= hôm nay
    const today = new Date();
    today.setHours(0,0,0,0);
    const depDateObj = new Date(dep_date);
    if (!dep_date || isNaN(depDateObj.getTime()) || depDateObj < today) {
      setMessage('Ngày khởi hành phải từ hôm nay trở đi.');
      return;
    }
    if (!window.confirm('Bạn xác nhận muốn gửi yêu cầu đặt tour?')) return;
    setMessage('');
    const payload = {
      tour_id,
      customer_name,
      customer_phone,
      customer_email,
      dep_date,
      pax_count: passengers.length,
      pickup_address,
      note,
      passengers,
    };
    const res = await fetch('/api/booking.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    console.log('Booking API response:', data);
    // Accept both 'success' or 'status' === 'success' for compatibility
    const isSuccess = data.success === true || data.status === 'success';
    if (isSuccess && data.booking_code) {
      setMessage('Đặt tour thành công! Đang chuyển đến trang thanh toán...');
      setTimeout(() => navigate(`/xem-booking?id=${data.booking_code}`), 1200);
    } else if (isSuccess) {
      setMessage('Đặt tour thành công!');
      setTimeout(() => navigate('/'), 2000);
    } else {
      setMessage(data.message || 'Có lỗi xảy ra');
    }
  };

  if (loading) return <div>Đang tải thông tin tour...</div>;
  if (!tour) return <div>Không tìm thấy tour.</div>;

  return (
    <div className="booking-form-page">
      <BookingProgressBar step={2} />
      <h2>Thông tin đặt tour</h2>
      <div className="booking-tour-info">
        <b>Tour:</b> {tour.name} <br />
        <label><b>Ngày khởi hành:</b> 
          <input 
            type="date" 
            className="form-control d-inline-block ms-2" 
            style={{maxWidth:180}} 
            value={dep_date} 
            onChange={e => setDepDate(e.target.value)} 
            required 
          />
        </label>
      </div>
      <form className="booking-form" onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-md-6">
            <label>Họ và tên</label>
            <input className="form-control" value={customer_name} onChange={e => setCustomerName(e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label>Số điện thoại</label>
            <input maxLength="10" className="form-control" value={customer_phone} onChange={e => setCustomerPhone(e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label>Email</label>
            <input className="form-control" value={customer_email} onChange={e => setCustomerEmail(e.target.value)} required />
          </div>
          <div className="col-md-6">
            <label>Địa chỉ đón</label>
            <input className="form-control" value={pickup_address} onChange={e => setPickupAddress(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <label>Ghi chú</label>
          <textarea className="form-control" value={note} onChange={e => setNote(e.target.value)} />
        </div>
        <div className="mt-3">
          <label>Số khách: {passengers.length}</label>
          <button type="button" className="btn btn-outline-primary btn-sm ms-2" onClick={addPassenger}>+ Thêm khách</button>
          <button type="button" className="btn btn-outline-secondary btn-sm ms-2" onClick={removePassenger}>- Bớt khách</button>
        </div>
        <div className="mt-2">
          {passengers.map((p, idx) => (
            <div className="row g-2 mb-2" key={idx} style={{borderBottom:'1px solid #eee',paddingBottom:8}}>
              <div className="col-md-3">
                <input className="form-control" placeholder={`Khách ${idx+1} - Họ tên`} value={p.name} onChange={e => handlePassengerChangeWithFare(idx, 'name', e.target.value)} required />
              </div>
              <div className="col-md-2">
                <input className="form-control" type="date" value={p.dob} onChange={e => handlePassengerChangeWithFare(idx, 'dob', e.target.value)} required />
              </div>
              <div className="col-md-1">
                <input className="form-control" type="number" value={p.pax_age || ''} readOnly placeholder="Tuổi" title="Tuổi" style={{background:'#f8f9fa'}} />
              </div>
              <div className="col-md-1">
                <select className="form-select" value={p.gender} onChange={e => handlePassengerChangeWithFare(idx, 'gender', e.target.value)}>
                  <option value="0">Nam</option>
                  <option value="1">Nữ</option>
                </select>
              </div>
              <div className="col-md-2">
                <input className="form-control" placeholder="SĐT" value={p.phone} onChange={e => handlePassengerChangeWithFare(idx, 'phone', e.target.value)} />
              </div>
              <div className="col-md-2">
                <input className="form-control" type="text" placeholder="Tiền vé" value={formatVND(p.price, false)} readOnly />
              </div>
            </div>
          ))}
        {/* Tổng tiền */}
        <div className="row mt-2">
          <div className="col-md-12 text-end">
            <b>Tổng tiền:&nbsp;</b>
            <input className="form-control d-inline-block" style={{width:180, fontWeight:'bold', background:'#f8f9fa'}} value={formatVND(passengers.reduce((sum, p) => sum + (+p.price || 0), 0), false)} readOnly />
          </div>
        </div>
        </div>
        <div className="mt-3">
          <button type="submit" className="btn btn-primary">Tiếp tục thanh toán</button>
        </div>
        {message && <div className="alert alert-info mt-2">{message}</div>}
        {/* Bảng giá vé theo ngày khởi hành */}
        <div className="mt-4">
          <h5>
            Giá vé theo độ tuổi
            {dep_date && (
              <span style={{fontWeight:'normal',fontSize:14}}>
                {' '}(<b>ngày khởi hành: {dep_date.split('-').reverse().join('-')}</b>)
              </span>
            )}
          </h5>
          {fareLoading ? (
            <div>Đang tải giá vé...</div>
          ) : fareTable.length === 0 ? (
            <div>Không có dữ liệu giá vé cho ngày khởi hành này.</div>
          ) : (
            <table className="table table-bordered table-sm tourdetail-deps" style={{maxWidth:400}}>
              <thead>
                <tr>
                  <th>Tuổi từ</th>
                  <th>Đến</th>
                  <th>Giá vé</th>
                </tr>
              </thead>
              <tbody>
                {fareTable.map((row, idx) => (
                  <tr key={idx}>
                    <td>{row.age_gtoe <= 0 ? 'mới sinh' : row.age_gtoe}</td>
                    <td>{row.age_ltoe > 12 ? 'trở lên' : row.age_ltoe}</td>
                    <td>{formatVND(row.tour_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </form>
    </div>
  );
}
