import React, { useEffect, useState } from 'react';
import BookingProgressBar from './BookingProgressBar';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatNumber } from '../utils/formatNumber';
import './BookingReview.css';
import './OnlineTicket.css';

export default function BookingReview() {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('id');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    fetch(`/api/booking.php?id=${bookingId}`)
      .then(res => res.json())
      .then(res => {
        setBooking(res.data || null);
        setLoading(false);
      });
  }, [bookingId]);

  if (loading) return <div>Đang tải thông tin booking...</div>;
  if (!booking) return <div>Không tìm thấy booking.</div>;

  return (
    <div className="booking-review-page" style={{margin:'32px auto'}}>
      <BookingProgressBar step={3} />
      <h2>Phiếu xác nhận booking</h2>
      <div className="booking-review-info">
        <div className="alert alert-success"><b>Mã đặt chỗ:</b> {booking.code}</div>
        <div><b>Họ tên:</b> {booking.customer_name}</div>
        <div><b>Email:</b> {booking.customer_email}</div>
        <div><b>Điện thoại:</b> {booking.customer_phone}</div>
        <div><b>Tour:</b> {booking.tour_name}</div>
        <div><b>Ngày khởi hành:</b> {booking.reg_dep_date}</div>
        <div><b>Giá trị booking:</b> {formatNumber(booking.total_money)} đ</div>
        <div><b>Trạng thái:</b> {booking.status_text}</div>
      {Array.isArray(booking.guests) && booking.guests.length > 0 && (
        <div className="booking-guests-list">
          <h4>Danh sách khách:</h4>
          <table className="table table-bordered pax-list-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Họ tên</th>
                <th>Giới tính</th>
                <th>Ngày sinh</th>
                <th>Tuổi</th>
                <th>Giá vé</th>
              </tr>
            </thead>
            <tbody>
              {booking.guests.map((guest, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{guest.name}</td>
                  <td>{guest.gender}</td>
                  <td>{guest.birth_year}</td>
                  <td>{guest.age}</td>
                  <td>{formatNumber(guest.pax_money)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
       <div className="alert alert-info mt-4">Chúng tôi đã gửi thông tin booking về email của bạn.</div>
     </div>
      <div className="booking-review-actions">
        <button className="btn btn-danger" onClick={()=>navigate(`/thanh-toan?id=${booking.code}`)}>Thanh toán ngay</button>
      </div>
    </div>
  );
}
