import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import LightBox from '../../components/LightBox';
import './HotelService.css';
import { fetchHotelBySlug, findHotelBySlug, formatHotelPrice, HOTEL_CATALOG, getHotelPrimaryImage, getHotelSecondaryImages, submitHotelBooking } from './hotelData';

const getDefaultDate = (offsetDays) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
};

const getStoredHotelSearchParams = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    const raw = window.localStorage.getItem('hotelSearchParams');
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    return {};
  }
};

function HotelDetailPage() {
  const { hotelSlug } = useParams();
  const [hotel, setHotel] = useState(findHotelBySlug(hotelSlug) || HOTEL_CATALOG[0]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [bookingForm, setBookingForm] = useState(() => {
    const storedHotelSearchParams = getStoredHotelSearchParams();

    return {
      departureCity: 'Hồ Chí Minh',
      name: 'Bùi Anh Tuấn',
      phone: '0917335743',
      email: 'hb.anhtuan@gmail.com',
      arrivalDate: storedHotelSearchParams.checkIn || getDefaultDate(7),
      departureDate: storedHotelSearchParams.checkOut || getDefaultDate(9),
      guests: storedHotelSearchParams.guests || '2',
      rooms: storedHotelSearchParams.rooms || '1',
      notes: 'Vui lòng báo giá combo ưu đãi tốt nhất.',
    };
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchHotelBySlug(hotelSlug)
      .then((record) => {
        if (!alive || !record) return;
        setHotel(record);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [hotelSlug]);

  useEffect(() => {
    const firstCity = hotel?.departure_points?.[0]?.city;
    if (!firstCity) return;
    setBookingForm((prev) => ({ ...prev, departureCity: prev.departureCity || firstCity }));
  }, [hotel]);

  useEffect(() => {
    const storedHotelSearchParams = getStoredHotelSearchParams();
    const nextHotelSearchParams = {
      ...storedHotelSearchParams,
      checkIn: bookingForm.arrivalDate,
      checkOut: bookingForm.departureDate,
      rooms: bookingForm.rooms,
      guests: bookingForm.guests,
      keyword: storedHotelSearchParams.keyword || hotel?.name || '',
    };

    try {
      localStorage.setItem('hotelSearchParams', JSON.stringify(nextHotelSearchParams));
    } catch (error) {
      console.error('Không thể cập nhật hotelSearchParams:', error);
    }
  }, [bookingForm.arrivalDate, bookingForm.departureDate, bookingForm.rooms, bookingForm.guests, hotel?.name]);

  const packageOptions = useMemo(() => {
    return (hotel.departure_points || []).flatMap((departure) =>
      (departure.dates || []).map((date, index) => ({
        city: departure.city,
        date,
        price: departure.prices?.[index] || '',
      }))
    );
  }, [hotel]);

  const galleryImages = useMemo(() => {
    const primaryImage = getHotelPrimaryImage(hotel);
    const allImages = [primaryImage, ...getHotelSecondaryImages(hotel)].filter(Boolean);
    return Array.from(new Set(allImages));
  }, [hotel]);

  const previewImages = galleryImages.slice(1, 3);

  const sanitizedDescription = useMemo(() => DOMPurify.sanitize(hotel.description || ''), [hotel.description]);
  const hasMapCoordinates = Number.isFinite(Number(hotel.lat)) && Number.isFinite(Number(hotel.lng));
  const mapEmbedUrl = useMemo(() => {
    if (!hasMapCoordinates) return '';
    return `https://www.google.com/maps?q=${Number(hotel.lat)},${Number(hotel.lng)}&z=15&output=embed`;
  }, [hasMapCoordinates, hotel.lat, hotel.lng]);

  const updateForm = (field, value) => {
    setBookingForm((prev) => ({ ...prev, [field]: value }));
  };

  const openLightboxAt = (index) => {
    if (!galleryImages.length) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleSubmitBooking = async () => {
    if (submitLoading) return;
    setSubmitMessage('');
    setSubmitLoading(true);

    try {
      const selectedDeparture = (hotel.departure_points || []).find((point) => point.city === bookingForm.departureCity);

      const payload = {
        hotel_id: hotel.hotel_id,
        room_type_id: hotel.room_type_id || 0,
        departure_point_id: selectedDeparture?.departure_point_id || 0,
        checkin_date: bookingForm.arrivalDate,
        checkout_date: bookingForm.departureDate,
        rooms: Number(bookingForm.rooms || 1),
        adults: Number(bookingForm.guests || 2),
        children: 0,
        guest_name: bookingForm.name,
        guest_phone: bookingForm.phone,
        guest_email: bookingForm.email,
        notes: bookingForm.notes,
        quoted_price_vnd: Number(hotel.price || 0),
      };

      const response = await submitHotelBooking(payload);
      setSubmitMessage(`Đã gửi yêu cầu thành công. Mã booking: ${response.booking_code || response.booking_id || ''}`);
      setModalOpen(false);
      if (response?.booking_code) {
        window.location.href = `/hotel?random_code=${encodeURIComponent(response.booking_code)}`;
      }
    } catch (error) {
      setSubmitMessage(error?.message || 'Không gửi được yêu cầu đặt phòng.');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && !hotel) {
    return (
      <div className="hotel-service">
        <div className="hotel-shell py-3 py-lg-4">
          <div className="hotel-surface p-4">Đang tải thông tin khách sạn...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="hotel-service">
      <div className="hotel-shell py-3 py-lg-4">
        <div className="hotel-summary-bar mb-3">
          <div>
            <div className="hotel-note mb-1">
              <Link to="/">Trang chủ</Link> / <Link to="/hotel">Khách sạn</Link> / {hotel.name}
            </div>
            <h1 className="hotel-detail__title">{hotel.name} <span className="text-warning">{'★'.repeat(hotel.stars)}</span></h1>
            <div className="hotel-detail__address"><i className="fa-solid fa-location-dot me-1" /> {hotel.address}</div>
          </div>
          <button className="hotel-cta" type="button" onClick={() => setModalOpen(true)}>Đặt ngay</button>
        </div>

        {submitMessage && (
          <div className="hotel-surface p-3 mb-3 hotel-note">{submitMessage}</div>
        )}

        <div className="hotel-detail-grid">
          <article className="hotel-detail-panel">
            <div className="hotel-detail-hero">
              <button
                className="hotel-detail__main-image hotel-detail__gallery-button"
                type="button"
                onClick={() => openLightboxAt(0)}
                style={{ backgroundImage: `linear-gradient(180deg, rgba(13, 22, 33, 0.08), rgba(13, 22, 33, 0.38)), url(${galleryImages[0]})` }}
              >
                <span className="hotel-badge--top">{hotel.deal_badge}</span>
              </button>
              <div className="hotel-detail__stack">
                {previewImages.map((image, index) => (
                  <button
                    className="hotel-detail__thumb hotel-detail__gallery-button"
                    type="button"
                    key={image}
                    onClick={() => openLightboxAt(index + 1)}
                    style={{ backgroundImage: `url(${image})` }}
                  />
                ))}
                <div className="hotel-detail__thumb hotel-detail__thumb--map">
                  {hasMapCoordinates ? (
                    <iframe
                      title={`Bản đồ ${hotel.name}`}
                      src={mapEmbedUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  ) : (
                    <div>
                      <i className="fa-solid fa-map-location-dot me-2" /> Bản đồ vị trí
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="hotel-detail__gallery-row">
              {galleryImages.map((image, index) => (
                <button
                  className="hotel-detail__gallery-thumb hotel-detail__gallery-button"
                  type="button"
                  key={`${hotel.slug}-${image}`}
                  onClick={() => openLightboxAt(index)}
                  style={{ backgroundImage: `url(${image})` }}
                />
              ))}
            </div>

            <div className="mt-4 hotel-surface p-4">
              <div className="hotel-rating-box">
                <div>
                  <div className="hotel-rating-box__score">{hotel.rating}</div>
                </div>
                <div className="flex-grow-1">
                  <div className="fw-bold">Tuyệt vời {hotel.reviews} đánh giá</div>
                  <div className="hotel-note">{hotel.highlights?.[0] || 'Khách sạn có hồ bơi, phù hợp với gia đình và cặp đôi.'}</div>
                </div>
                <button className="hotel-cta hotel-cta--ghost" type="button" onClick={() => setModalOpen(true)}>Yêu cầu tư vấn</button>
              </div>
            </div>

            <div className="mt-4 hotel-surface p-4">
              <div className="hotel-section-title mt-0 mb-3">Mô tả</div>
              <div className="hotel-note mb-3" dangerouslySetInnerHTML={{ __html: sanitizedDescription }} />
            </div>

            <div className="mt-4 hotel-surface p-4">
              <div className="hotel-section-title mt-0 mb-3">Combo {hotel.package_name} + {hotel.meal}</div>
              <div className="hotel-note mb-3">{hotel.sale_badge}. Phần này đang dùng data mẫu, sau này chỉ cần map sang API là có thể đổi toàn bộ danh sách phòng và giá.</div>
              <ul className="list-unstyled m-0 hotel-note" style={{ display: 'grid', gap: '8px' }}>
                <li>• Nhận phòng linh hoạt theo ngày khởi hành.</li>
                <li>• Bữa sáng mỗi ngày tại nhà hàng khách sạn.</li>
                <li>• Hỗ trợ đặt thêm dịch vụ đưa đón và vé máy bay.</li>
                <li>• Có thể đổi sang nguồn dữ liệu API mà không cần sửa UI.</li>
              </ul>
            </div>
          </article>

          <aside className="hotel-booking-panel">
            <div className="hotel-note">Khởi hành từ nhiều điểm</div>
            <div className="hotel-booking-panel__price">{formatHotelPrice(hotel.price)}</div>
            <div className="hotel-note">{hotel.price_text}</div>

            <div className="mt-3 hotel-form-grid">
              {/* <div className="hotel-field">
                <label>Khởi hành từ</label>
                <select value={bookingForm.departureCity} onChange={(event) => updateForm('departureCity', event.target.value)}>
                  {(hotel.departure_points || []).map((point) => <option key={point.city} value={point.city}>{point.city}</option>)}
                </select>
              </div> */}
              <div className="hotel-field">
                <label>Ngày nhận phòng</label>
                <input type="date" value={bookingForm.arrivalDate} onChange={(event) => updateForm('arrivalDate', event.target.value)} />
              </div>
              <div className="hotel-field">
                <label>Ngày trả phòng</label>
                <input type="date" value={bookingForm.departureDate} onChange={(event) => updateForm('departureDate', event.target.value)} />
              </div>
              <div className="hotel-field">
                <label>Số phòng</label>
                <input value={bookingForm.rooms} onChange={(event) => updateForm('rooms', event.target.value)} />
              </div>
              <div className="hotel-field">
                <label>Số khách</label>
                <input value={bookingForm.guests} onChange={(event) => updateForm('guests', event.target.value)} />
              </div>
            </div>

            <button className="hotel-cta w-100 mt-3" type="button" onClick={() => setModalOpen(true)}>Yêu cầu đặt combo</button>

            <div className="mt-4 hotel-sidebar-title">Khởi hành từ</div>
            <div className="hotel-filter-list">
              {packageOptions.map((option) => (
                <div className="hotel-filter-chip" key={`${option.city}-${option.date}`}>
                  <div>
                    <div className="fw-bold">{option.city}</div>
                    <div className="hotel-note">{option.date}</div>
                  </div>
                  <div className="text-end">
                    <div className="hotel-note">{option.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>

      {modalOpen && (
        <div className="hotel-modal-backdrop" onClick={() => setModalOpen(false)} role="presentation">
          <div className="hotel-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <div className="hotel-modal__header">
              <div>
                <h2 className="hotel-modal__title">Yêu cầu đặt combo</h2>
                <div className="hotel-note">Vui lòng điền thông tin dưới đây. Chúng tôi sẽ liên hệ tư vấn ngay sau khi nhận được yêu cầu.</div>
              </div>
              <button className="hotel-close" type="button" onClick={() => setModalOpen(false)} aria-label="Đóng">
                <i className="fa-solid fa-xmark" />
              </button>
            </div>

            <div className="hotel-form-grid mt-3">
              <div className="hotel-field">
                <label>Khởi hành từ</label>
                <select value={bookingForm.departureCity} onChange={(event) => updateForm('departureCity', event.target.value)}>
                  {(hotel.departure_points || []).map((point) => <option key={point.city} value={point.city}>{point.city}</option>)}
                </select>
              </div>
              <div className="hotel-field">
                <label>Họ và tên</label>
                <input value={bookingForm.name} onChange={(event) => updateForm('name', event.target.value)} />
              </div>
              <div className="hotel-field">
                <label>Số điện thoại</label>
                <input value={bookingForm.phone} onChange={(event) => updateForm('phone', event.target.value)} />
              </div>
              <div className="hotel-field">
                <label>Email (tùy chọn)</label>
                <input value={bookingForm.email} onChange={(event) => updateForm('email', event.target.value)} />
              </div>
              <div className="hotel-field">
                <label>Lời nhắn</label>
                <textarea rows="4" value={bookingForm.notes} onChange={(event) => updateForm('notes', event.target.value)} />
              </div>
            </div>

            <button className="hotel-cta w-100 mt-3" type="button" onClick={handleSubmitBooking} disabled={submitLoading}>
              {submitLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      )}

      {lightboxOpen && (
        <LightBox
          images={galleryImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex((index) => (index - 1 + galleryImages.length) % galleryImages.length)}
          onNext={(index) => {
            if (typeof index === 'number') {
              setLightboxIndex(index);
              return;
            }

            setLightboxIndex((currentIndex) => (currentIndex + 1) % galleryImages.length);
          }}
        />
      )}
    </div>
  );
}

export default HotelDetailPage;
