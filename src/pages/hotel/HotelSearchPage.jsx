import React, { useEffect, useMemo, useState } from 'react';
import { Link, createSearchParams, useLocation, useNavigate } from 'react-router-dom';
import './HotelService.css';
import { fetchHotelBookingByCode, fetchHotelCatalog, fetchHotelDestinations, formatHotelPrice, HOTEL_CATALOG, HOTEL_DESTINATIONS, HOTEL_STAY_STYLES, getHotelPrimaryImage, formatPhoneNumber } from './hotelData';

const DRAFT_DESTINATIONS = [
  { name: 'Đà Lạt', hotels: '1189 khách sạn', image: 'https://images.unsplash.com/photo-1500631178167-5dc60f61d15d?auto=format&fit=crop&w=900&q=80' },
  { name: 'Phan Thiết', hotels: '426 khách sạn', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Nha Trang', hotels: '1026 khách sạn', image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=80' },
  { name: 'Phú Quốc', hotels: '920 khách sạn', image: 'https://images.unsplash.com/photo-1505881502353-a1986add3762?auto=format&fit=crop&w=900&q=80' },
  { name: 'Đà Nẵng', hotels: '1354 khách sạn', image: 'https://images.unsplash.com/photo-1505761671935-60b3a7427bad?auto=format&fit=crop&w=900&q=80' },
  { name: 'Vũng Tàu', hotels: '523 khách sạn', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80' },
  { name: 'Quy Nhơn', hotels: '326 khách sạn', image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=900&q=80' },
  { name: 'Vịnh Hạ Long', hotels: '659 khách sạn', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80' },
  { name: 'Hội An', hotels: '789 khách sạn', image: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=900&q=80' },
  { name: 'Singapore', hotels: '702 khách sạn', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=900&q=80' },
  { name: 'Bangkok', hotels: '4192 khách sạn', image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=900&q=80' },
  { name: 'Tokyo', hotels: '3873 khách sạn', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=900&q=80' },
];

const GUEST_PRESETS = [
  { label: '1 phòng - 2 người', rooms: 1, adults: 2, children: 0 },
  { label: '1 phòng - 3 người', rooms: 1, adults: 3, children: 0 },
  { label: '2 phòng - 4 người', rooms: 2, adults: 4, children: 0 },
  { label: '2 phòng - 4 người + 1 trẻ em', rooms: 2, adults: 4, children: 1 },
];

const DATE_PRESETS = [
  { label: 'Cuối tuần 2 đêm', nights: 2 },
  { label: '3 đêm', nights: 3 },
  { label: '5 đêm', nights: 5 },
  { label: '7 đêm', nights: 7 },
];

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const toDateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const createLocalDate = (value) => {
  if (!value) return null;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
};

const formatDateLabel = (value) => {
  const date = createLocalDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
};

const formatShortDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
};

const formatMonthTitle = (date) => {
  if (!date) return '';
  const month = new Intl.DateTimeFormat('vi-VN', { month: 'long' }).format(date);
  return `${month.charAt(0).toUpperCase()}${month.slice(1)} ${date.getFullYear()}`;
};

const buildMonthDays = (baseDate) => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const firstDay = new Date(year, month, 1, 12, 0, 0, 0);
  const lastDay = new Date(year, month + 1, 0, 12, 0, 0, 0);
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  const days = [];

  for (let index = 0; index < leadingEmptyCells; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day, 12, 0, 0, 0));
  }

  return days;
};

const isSameDate = (left, right) => Boolean(left && right && left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate());

const isInRange = (date, start, end) => Boolean(date && start && end && date >= start && date <= end);

const getOffsetDate = (offsetDays) => {
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

const buildHotelSearchParams = (form) => ({
  checkIn: form.checkIn || '',
  checkOut: form.checkOut || '',
  rooms: String(form.rooms || '1'),
  guests: String(form.guests || String(Number(form.adults || 0) + Number(form.children || 0) || 2)),
  keyword: form.keyword || '',
});

const normalizeSearchForm = (stored = {}) => {
  const adultsFromStoredGuests = stored.guests ? String(Number(stored.guests) || 2) : '2';
  const checkIn = stored.checkIn || getOffsetDate(7);
  const checkOut = stored.checkOut || getOffsetDate(9);

  return {
    keyword: stored.keyword || 'Đà Lạt',
    destination: stored.destination || stored.keyword || 'Đà Lạt',
    checkIn,
    checkOut,
    rooms: stored.rooms || '1',
    guests: stored.guests || '2',
    adults: stored.adults || adultsFromStoredGuests,
    children: stored.children || '0',
    budget: stored.budget || 'all',
    stars: stored.stars || 'all',
    style: stored.style || 'resort',
  };
};

function HotelSearchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hotels, setHotels] = useState([]);
  const [destinationOptions, setDestinationOptions] = useState(HOTEL_DESTINATIONS);
  const [destinationHints, setDestinationHints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hotelBooking, setHotelBooking] = useState(null);
  const [hotelBookingLoading, setHotelBookingLoading] = useState(false);
  const [hotelBookingError, setHotelBookingError] = useState('');
  const [activePicker, setActivePicker] = useState(null);
  const [destinationQuery, setDestinationQuery] = useState('');
  const [guestDraft, setGuestDraft] = useState({ rooms: 1, adults: 2, children: 0 });
  const [dateDraft, setDateDraft] = useState({ checkIn: '', checkOut: '' });
  const [form, setForm] = useState(() => normalizeSearchForm(getStoredHotelSearchParams()));

  useEffect(() => {
    let alive = true;
    Promise.all([fetchHotelCatalog(), fetchHotelDestinations()]).then(([rows, destinationRows]) => {
      if (!alive) return;
      setHotels(rows || []);
      setDestinationOptions((destinationRows || []).map((item) => item.name).filter(Boolean));
      setDestinationHints(destinationRows || []);
      setLoading(false);
    }).catch(() => {
      if (!alive) return;
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const storedHotelSearchParams = getStoredHotelSearchParams();
    setForm((prev) => {
      const nextForm = normalizeSearchForm({ ...prev, ...storedHotelSearchParams });
      if (
        nextForm.keyword === prev.keyword
        && nextForm.destination === prev.destination
        && nextForm.checkIn === prev.checkIn
        && nextForm.checkOut === prev.checkOut
        && nextForm.rooms === prev.rooms
        && nextForm.guests === prev.guests
        && nextForm.adults === prev.adults
        && nextForm.children === prev.children
        && nextForm.budget === prev.budget
        && nextForm.stars === prev.stars
        && nextForm.style === prev.style
      ) {
        return prev;
      }
      return nextForm;
    });
  }, []);

  useEffect(() => {
    const nextHotelSearchParams = buildHotelSearchParams(form);

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('hotelSearchParams', JSON.stringify(nextHotelSearchParams));
      }
    } catch (error) {
      console.error('Không thể lưu hotelSearchParams:', error);
    }
  }, [form.keyword, form.checkIn, form.checkOut, form.rooms, form.guests, form.adults, form.children]);

  useEffect(() => {
    let alive = true;
    const urlParams = new URLSearchParams(location.search || '');
    const randomCode = urlParams.get('random_code');

    if (!randomCode) {
      setHotelBooking(null);
      setHotelBookingError('');
      setHotelBookingLoading(false);
      return () => {
        alive = false;
      };
    }

    const fetchBooking = async () => {
      setHotelBookingLoading(true);
      setHotelBookingError('');
      try {
        const row = await fetchHotelBookingByCode(randomCode);
        if (!alive) return;
        setHotelBooking(row || null);
      } catch (error) {
        if (!alive) return;
        setHotelBooking(null);
        setHotelBookingError(error?.message || 'Không thể tải thông tin booking khách sạn.');
      } finally {
        if (!alive) return;
        setHotelBookingLoading(false);
      }
    };

    fetchBooking();
    return () => {
      alive = false;
    };
  }, [location.search]);

  const featuredHotels = useMemo(() => {
    return [...hotels].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0)).slice(0, 3);
  }, [hotels]);

  const styleCards = HOTEL_STAY_STYLES.map((style, index) => ({
    title: style,
    subtitle: index === 0 ? 'Resort ven biển' : index === 1 ? 'Tiện đi lại, nhiều lựa chọn' : index === 2 ? 'Phù hợp nhóm lớn' : index === 3 ? 'Không gian riêng tư' : '5 sao, dịch vụ cao cấp',
    image: HOTEL_CATALOG[index % HOTEL_CATALOG.length]?.images?.[index % 4] || getHotelPrimaryImage(HOTEL_CATALOG[0]),
  }));

  const availableDestinations = useMemo(() => {
    const query = destinationQuery.trim().toLowerCase();
    const draftMap = new Map(DRAFT_DESTINATIONS.map((item) => [item.name, item]));
    const fallbackImage = DRAFT_DESTINATIONS[0]?.image || '';

    const rows = destinationHints.length > 0
      ? destinationHints
        .filter((item) => item?.name)
        .map((item) => {
          const draft = draftMap.get(item.name);
          return {
            name: item.name,
            hotels: item.hotels || draft?.hotels || '',
            image: item.image || draft?.image || fallbackImage,
          };
        })
      : DRAFT_DESTINATIONS;

    return rows.filter((item) => !query || item.name.toLowerCase().includes(query));
  }, [destinationHints, destinationQuery]);

  const searchDepartureDate = useMemo(() => createLocalDate(form.checkIn), [form.checkIn]);

  const pickerMonths = useMemo(() => {
    const reference = searchDepartureDate || createLocalDate(getOffsetDate(7)) || new Date();
    const firstMonth = new Date(reference.getFullYear(), reference.getMonth(), 1, 12, 0, 0, 0);
    const secondMonth = new Date(reference.getFullYear(), reference.getMonth() + 1, 1, 12, 0, 0, 0);
    return [firstMonth, secondMonth];
  }, [searchDepartureDate]);

  const handleChange = (field, value) => {
    setForm((prev) => {
      const nextForm = { ...prev, [field]: value };

      if (field === 'destination' && !nextForm.keyword) {
        nextForm.keyword = value;
      }

      return nextForm;
    });
  };

  const openDestinationPicker = () => {
    setDestinationQuery('');
    setActivePicker('destination');
  };

  const openDatePicker = () => {
    setDateDraft({ checkIn: form.checkIn, checkOut: form.checkOut });
    setActivePicker('dates');
  };

  const openGuestPicker = () => {
    setGuestDraft({ rooms: Number(form.rooms || 1), adults: Number(form.adults || form.guests || 2), children: Number(form.children || 0) });
    setActivePicker('guests');
  };

  const closePicker = () => {
    setActivePicker(null);
  };

  const applyDateDraft = () => {
    if (!dateDraft.checkIn) return;

    const checkIn = createLocalDate(dateDraft.checkIn);
    const checkOut = createLocalDate(dateDraft.checkOut) || new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 2, 12, 0, 0, 0);
    const normalizedCheckOut = checkOut <= checkIn ? new Date(checkIn.getFullYear(), checkIn.getMonth(), checkIn.getDate() + 1, 12, 0, 0, 0) : checkOut;

    setForm((prev) => ({
      ...prev,
      checkIn: toDateInputValue(checkIn),
      checkOut: toDateInputValue(normalizedCheckOut),
    }));
    closePicker();
  };

  const applyGuestDraft = () => {
    const rooms = Math.max(1, Number(guestDraft.rooms || 1));
    const adults = Math.max(1, Number(guestDraft.adults || 1));
    const children = Math.max(0, Number(guestDraft.children || 0));
    const guests = adults + children;

    setForm((prev) => ({
      ...prev,
      rooms: String(rooms),
      adults: String(adults),
      children: String(children),
      guests: String(guests),
    }));
    closePicker();
  };

  const adjustGuestDraft = (field, delta) => {
    setGuestDraft((prev) => {
      const nextValue = Math.max(field === 'children' ? 0 : 1, Number(prev[field] || 0) + delta);
      return { ...prev, [field]: nextValue };
    });
  };

  const selectPresetStay = (nights) => {
    const start = new Date();
    start.setDate(start.getDate() + 7);
    const end = new Date(start);
    end.setDate(end.getDate() + nights);
    setDateDraft({ checkIn: toDateInputValue(start), checkOut: toDateInputValue(end) });
  };

  const handleDateCellClick = (date) => {
    if (!date) return;
    const clicked = toDateInputValue(date);
    const currentCheckIn = createLocalDate(dateDraft.checkIn);
    const currentCheckOut = createLocalDate(dateDraft.checkOut);

    if (!currentCheckIn || (currentCheckIn && currentCheckOut)) {
      setDateDraft({ checkIn: clicked, checkOut: '' });
      return;
    }

    if (date < currentCheckIn) {
      setDateDraft({ checkIn: clicked, checkOut: '' });
      return;
    }

    setDateDraft({ checkIn: dateDraft.checkIn, checkOut: clicked });
  };

  useEffect(() => {
    if (!activePicker) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closePicker();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePicker]);

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate({
      pathname: '/hotel/ket-qua',
      search: createSearchParams({
        keyword: form.keyword,
        // budget: form.budget,
        // stars: form.stars,
        // style: form.style,
        // destination: form.destination,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        rooms: form.rooms,
        guests: String(Number(form.adults || form.guests || 2) + Number(form.children || 0)),
      }).toString(),
    });
  };

  const formatBookingDate = (value) => {
    const text = String(value || '').trim();
    if (!text) return 'Chưa cập nhật';
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return text;
    return new Intl.DateTimeFormat('vi-VN').format(date);
  };

  return (
    <div className="hotel-service">
      <div className="hotel-shell py-3 py-lg-4">
        {hotelBooking && (
          <div className="alert alert-success mb-3">
            <h2>Thông tin booking khách sạn:</h2>
            <ul className="mb-0">
              <li><strong>Mã booking:</strong> {hotelBooking.booking_code || '-'}</li>
              <li><strong>Thời gian gửi:</strong> {formatBookingDate(hotelBooking.submit)}</li>
              <li><strong>Trạng thái:</strong> {hotelBooking.status || '-'}</li>
              <li><strong>Khách sạn:</strong> {hotelBooking.name || '-'}</li>
              <li><strong>Hạng phòng:</strong> {hotelBooking.room_name || '-'}</li>
              <li><strong>Combo:</strong> {hotelBooking.combo_name || '-'}</li>
              <li><strong>Điểm khởi hành:</strong> {hotelBooking.departure_city || '-'}</li>
            </ul>
            <hr />
            <ul className="mb-0">
              <li><strong>Khách hàng:</strong> {hotelBooking.guest_name || '-'}</li>
              <li><strong>Điện thoại:</strong> {formatPhoneNumber(hotelBooking.guest_phone) || '-'}</li>
              <li><strong>Email:</strong> {hotelBooking.guest_email || '-'}</li>
            </ul>
            <hr />
            <ul className="mb-0">
              <li><strong>Nhận phòng:</strong> {formatBookingDate(hotelBooking.checkin_date)}</li>
              <li><strong>Trả phòng:</strong> {formatBookingDate(hotelBooking.checkout_date)}</li>
              <li><strong>Số đêm:</strong> {hotelBooking.night_count || 0}</li>
              <li><strong>Số phòng:</strong> {hotelBooking.rooms || 0}</li>
              <li><strong>Người lớn:</strong> {hotelBooking.adults || 0}</li>
              {hotelBooking.children != '0' && (
                <li><strong>Trẻ em:</strong> {hotelBooking.children || 0}</li>
              )}
              <li><strong>Ghi chú:</strong> {hotelBooking.notes || '-'}</li>
            </ul>
            <hr />
            <ul className="mb-0">
              <li><strong>Giá báo:</strong> {formatHotelPrice(hotelBooking.quoted_price_vnd)}</li>
              <li><strong>Tình trạng booking:</strong> {hotelBooking.ticket_state_name || '-'}</li>
            </ul>
          </div>
        )}

        <section className="hotel-hero">
          <div className="hotel-hero__content">
            <span className="hotel-kicker">
              <i className="fa-solid fa-hotel" />
              Trải nghiệm kỳ nghỉ tuyệt vời
            </span>
            <h1>Combo khách sạn, vé máy bay và đưa đón sân bay giá tốt nhất</h1>
            <p>
              Giao diện tìm khách sạn theo kiểu booking hiện đại, sẵn sàng thay dữ liệu mock bằng API sau này mà không cần đổi luồng UI.
            </p>
          </div>
        </section>

        {hotelBookingLoading && (
          <div className="alert alert-info mb-3">Đang tải thông tin booking khách sạn...</div>
        )}

        {hotelBookingError && (
          <div className="alert alert-danger mb-3">{hotelBookingError}</div>
        )}

        <section className="hotel-search-card">
          <form onSubmit={handleSubmit} className="hotel-search-grid">
            <div className="hotel-field">
              <label>Tìm điểm đến</label>
              <button type="button" className="hotel-field__button hotel-field__button--search" onClick={openDestinationPicker}>
                <span className="hotel-field__button-label">{form.keyword || 'Bạn muốn đi đâu?'}</span>
                <span className="hotel-field__button-meta">Chọn từ danh sách gợi ý</span>
              </button>
            </div>
            <div className="hotel-field">
              <label>Ngày nhận phòng</label>
              <button type="button" className="hotel-field__button" onClick={openDatePicker}>
                <span className="hotel-field__button-label">{formatDateLabel(form.checkIn) || 'Chọn ngày nhận phòng'}</span>
                <span className="hotel-field__button-meta">{formatDateLabel(form.checkOut) ? `Trả phòng: ${formatDateLabel(form.checkOut)}` : 'Chọn khoảng lưu trú'}</span>
              </button>
            </div>
            <div className="hotel-field">
              <label>Ngày trả phòng</label>
              <button type="button" className="hotel-field__button" onClick={openDatePicker}>
                <span className="hotel-field__button-label">{formatDateLabel(form.checkOut) || 'Chọn ngày trả phòng'}</span>
                <span className="hotel-field__button-meta">{form.checkIn ? `Nhận phòng: ${formatDateLabel(form.checkIn)}` : 'Chọn cùng lúc với ngày nhận phòng'}</span>
              </button>
            </div>
            <div className="hotel-field">
              <label>Khách</label>
              <button type="button" className="hotel-field__button" onClick={openGuestPicker}>
                <span className="hotel-field__button-label">{`${form.rooms} phòng - ${Number(form.adults || form.guests || 2) + Number(form.children || 0)} người`}</span>
                <span className="hotel-field__button-meta">{`${form.adults || form.guests || 2} người lớn, ${form.children || 0} trẻ em`}</span>
              </button>
            </div>
            <button className="hotel-search-button align-self-end" type="submit">Tìm kiếm</button>
          </form>

          <div className="hotel-summary-bar mt-3">
            <div className="hotel-pill"><i className="fa-solid fa-location-dot" /> {form.destination || 'Đà Lạt'}</div>
            <div className="d-flex flex-wrap gap-2">
              {destinationOptions.map((destination) => (
                <button key={destination} type="button" className="hotel-pill" onClick={() => handleChange('destination', destination)}>
                  {destination}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="hotel-section-title">Combo tốt nhất hôm nay</div>
          <div className="hotel-section-subtitle">Nhanh tay đặt ngay. Để mai sẽ lỡ</div>
          <div className="hotel-strip mt-4">
            {loading ? (
              <div className="hotel-surface p-4">Đang tải dữ liệu khách sạn mẫu...</div>
            ) : featuredHotels.map((hotel) => (
              <article className="hotel-card" key={hotel.hotel_id}>
                <div className="hotel-card__image" style={{ backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.36)), url(${getHotelPrimaryImage(hotel)})` }}>
                  <span className="hotel-badge--top">{hotel.sale_badge || hotel.deal_badge}</span>
                </div>
                <div className="hotel-card__body">
                  <div className="hotel-card__title">{hotel.name}</div>
                  <div className="hotel-rating">
                    <span className="hotel-rating__score">{hotel.rating}</span>
                    <span>Tuyệt vời ({hotel.reviews} đánh giá)</span>
                  </div>
                  <div className="hotel-tags">
                    {hotel.tags.slice(0, 3).map((tag) => (
                      <span className="hotel-tag" key={tag}>{tag}</span>
                    ))}
                  </div>
                  <div className="hotel-price-box">
                    <div>
                      <div className="hotel-old-price">{formatHotelPrice(hotel.old_price)}</div>
                      <div className="hotel-price">{formatHotelPrice(hotel.price)}</div>
                    </div>
                    <Link className="hotel-cta" to={`/hotel/chi-tiet/${hotel.slug}`}>Xem phòng</Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {activePicker === 'destination' && (
          <div className="hotel-modal-backdrop" onClick={closePicker} role="presentation">
            <div className="hotel-modal hotel-picker-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Chọn điểm đến">
              <div className="hotel-modal__header">
                <div>
                  <h2 className="hotel-modal__title">Bạn muốn đi đâu?</h2>
                  <div className="hotel-note">Danh sách điểm đến lấy từ API meta.</div>
                </div>
                <button className="hotel-close" type="button" onClick={closePicker} aria-label="Đóng">×</button>
              </div>

              <div className="hotel-picker-search">
                <input
                  value={destinationQuery}
                  onChange={(event) => setDestinationQuery(event.target.value)}
                  placeholder="Gõ để lọc điểm đến"
                />
              </div>

              <div className="hotel-picker-grid hotel-picker-grid--destinations">
                {availableDestinations.map((destination) => (
                  <button
                    key={destination.name}
                    type="button"
                    className={`hotel-destination-card ${form.destination === destination.name ? 'is-active' : ''}`}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, keyword: destination.name, destination: destination.name }));
                      closePicker();
                    }}
                  >
                    <div className="hotel-destination-card__image" style={{ backgroundImage: `linear-gradient(180deg, rgba(11, 27, 43, 0.14), rgba(11, 27, 43, 0.42)), url(${destination.image})` }} />
                    <div className="hotel-destination-card__body">
                      <div className="hotel-destination-card__title">{destination.name}</div>
                      <div className="hotel-note">{destination.hotels}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePicker === 'dates' && (
          <div className="hotel-modal-backdrop" onClick={closePicker} role="presentation">
            <div className="hotel-modal hotel-picker-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Chọn ngày">
              <div className="hotel-modal__header">
                <div>
                  <h2 className="hotel-modal__title">Ngày nhận phòng và trả phòng</h2>
                  <div className="hotel-note">Chọn ngày nhận phòng trước, sau đó chọn ngày trả phòng.</div>
                </div>
                <button className="hotel-close" type="button" onClick={closePicker} aria-label="Đóng">×</button>
              </div>

              <div className="hotel-date-summary">
                <div>
                  <span>Nhận phòng</span>
                  <strong>{formatDateLabel(dateDraft.checkIn) || 'Chưa chọn'}</strong>
                </div>
                <div>
                  <span>Trả phòng</span>
                  <strong>{formatDateLabel(dateDraft.checkOut) || 'Chưa chọn'}</strong>
                </div>
              </div>

              <div className="hotel-picker-shortcuts">
                {DATE_PRESETS.map((preset) => (
                  <button key={preset.label} type="button" className="hotel-cta hotel-cta--ghost" onClick={() => selectPresetStay(preset.nights)}>
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="hotel-calendar-grid">
                {pickerMonths.map((month) => {
                  const monthDays = buildMonthDays(month);
                  const monthStart = monthDays.find(Boolean);
                  const monthEnd = [...monthDays].reverse().find(Boolean);

                  return (
                    <div className="hotel-calendar" key={`${month.getFullYear()}-${month.getMonth()}`}>
                      <div className="hotel-calendar__header">{formatMonthTitle(month)}</div>
                      <div className="hotel-calendar__weekdays">
                        {DAY_LABELS.map((dayLabel) => <span key={dayLabel}>{dayLabel}</span>)}
                      </div>
                      <div className="hotel-calendar__days">
                        {monthDays.map((date, index) => {
                          if (!date) {
                            return <span className="hotel-calendar__empty" key={`empty-${month.getMonth()}-${index}`} />;
                          }

                          const today = new Date();
                          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0, 0, 0);
                          const isStart = isSameDate(date, createLocalDate(dateDraft.checkIn));
                          const isEnd = isSameDate(date, createLocalDate(dateDraft.checkOut));
                          const isSelectedRange = isInRange(date, createLocalDate(dateDraft.checkIn), createLocalDate(dateDraft.checkOut));
                          const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                          return (
                            <button
                              type="button"
                              className={`hotel-calendar__day ${isPast ? 'is-disabled' : ''} ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''} ${isSelectedRange ? 'is-in-range' : ''} ${isWeekend ? 'is-weekend' : ''}`}
                              key={date.toISOString()}
                              disabled={isPast}
                              onClick={() => handleDateCellClick(date)}
                            >
                              <span>{date.getDate()}</span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="hotel-note hotel-calendar__range-note">
                        {monthStart && monthEnd ? `${formatShortDate(monthStart)} - ${formatShortDate(monthEnd)}` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="hotel-modal__footer">
                <button type="button" className="hotel-cta hotel-cta--ghost" onClick={() => setDateDraft({ checkIn: '', checkOut: '' })}>Xóa</button>
                <button type="button" className="hotel-search-button" onClick={applyDateDraft}>Áp dụng</button>
              </div>
            </div>
          </div>
        )}

        {activePicker === 'guests' && (
          <div className="hotel-modal-backdrop" onClick={closePicker} role="presentation">
            <div className="hotel-modal hotel-picker-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Chọn khách">
              <div className="hotel-modal__header">
                <div>
                  <h2 className="hotel-modal__title">Khách</h2>
                  <div className="hotel-note">Chọn số phòng và số khách cho bản nháp tìm kiếm.</div>
                </div>
                <button className="hotel-close" type="button" onClick={closePicker} aria-label="Đóng">×</button>
              </div>

              <div className="hotel-guest-presets">
                {GUEST_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="hotel-guest-preset"
                    onClick={() => setGuestDraft({ rooms: preset.rooms, adults: preset.adults, children: preset.children })}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <div className="hotel-guest-rows">
                <div className="hotel-guest-row">
                  <div>
                    <div className="hotel-guest-row__label">Phòng</div>
                    <div className="hotel-note">Số phòng muốn đặt</div>
                  </div>
                  <div className="hotel-stepper">
                    <button type="button" className="hotel-stepper__button" onClick={() => adjustGuestDraft('rooms', -1)} disabled={guestDraft.rooms <= 1}>−</button>
                    <strong>{guestDraft.rooms}</strong>
                    <button type="button" className="hotel-stepper__button" onClick={() => adjustGuestDraft('rooms', 1)}>+</button>
                  </div>
                </div>

                <div className="hotel-guest-row">
                  <div>
                    <div className="hotel-guest-row__label">Người lớn</div>
                    <div className="hotel-note">Từ 17 tuổi</div>
                  </div>
                  <div className="hotel-stepper">
                    <button type="button" className="hotel-stepper__button" onClick={() => adjustGuestDraft('adults', -1)} disabled={guestDraft.adults <= 1}>−</button>
                    <strong>{guestDraft.adults}</strong>
                    <button type="button" className="hotel-stepper__button" onClick={() => adjustGuestDraft('adults', 1)}>+</button>
                  </div>
                </div>

                <div className="hotel-guest-row">
                  <div>
                    <div className="hotel-guest-row__label">Trẻ em</div>
                    <div className="hotel-note">Từ 0 - 16 tuổi</div>
                  </div>
                  <div className="hotel-stepper">
                    <button type="button" className="hotel-stepper__button" onClick={() => adjustGuestDraft('children', -1)} disabled={guestDraft.children <= 0}>−</button>
                    <strong>{guestDraft.children}</strong>
                    <button type="button" className="hotel-stepper__button" onClick={() => adjustGuestDraft('children', 1)}>+</button>
                  </div>
                </div>
              </div>

              <div className="hotel-modal__footer">
                <div className="hotel-note">Tổng khách: {Number(guestDraft.adults || 0) + Number(guestDraft.children || 0)}</div>
                <button type="button" className="hotel-search-button" onClick={applyGuestDraft}>Áp dụng</button>
              </div>
            </div>
          </div>
        )}

        <section className="mt-5">
          <div className="hotel-section-title">Phong cách du lịch</div>
          <div className="hotel-strip mt-4">
            {styleCards.map((card) => (
              <div className="hotel-card" key={card.title}>
                <div className="hotel-card__image" style={{ minHeight: 180, backgroundImage: `linear-gradient(180deg, rgba(18, 30, 45, 0.14), rgba(18, 30, 45, 0.46)), url(${card.image})` }} />
                <div className="hotel-card__body">
                  <div className="hotel-card__title">{card.title}</div>
                  <div className="hotel-note">{card.subtitle}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default HotelSearchPage;
