import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnlineTicket.css';
import { formatNumber } from '../utils/formatNumber';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';
const today = new Date().toISOString().split('T')[0];
const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.payments)) return payload.payments;
  return [];
};

const getText = (record, keys) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
};

const PickupDropoffSection = React.memo(function PickupDropoffSection({
  routeStops,
  selectedPickupId,
  selectedDropoffId,
  onPickupChange,
  onDropoffChange,
}) {
  if (routeStops.length === 0) return null;

  const renderMap = (selectedStopId) => {
    if (!selectedStopId) return null;

    const mapData = routeStops.find((s) => String(s.stop_id) === selectedStopId);
    if (!mapData) return null;

    return (
      <div
        key={`map-${selectedStopId}`}
        className="map-container mt-3"
        style={{ borderRadius: '8px', overflow: 'hidden', minHeight: '300px' }}
      >
        {mapData.gg_map_code ? (
          <div
            dangerouslySetInnerHTML={{
              __html: mapData.gg_map_code,
            }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <div className="text-muted small p-3">Không có bản đồ cho điểm này</div>
        )}
      </div>
    );
  };

  return (
    <div className="pickup-dropoff-section mt-4">
      <div className="pickup-dropoff__title fw-semibold mb-3">Điểm đón và trả khách</div>

      <div className="row g-3">
        <div className="col-lg-6">
          <div className="card border-0 bg-light p-3">
            <h5 className="mb-3">Điểm đón khách (lên xe)</h5>
            <div className="pickup-options">
              {routeStops.map((stop) => (
                <div key={`from-${stop.stop_id}`} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`branch_from_${stop.stop_id}`}
                    name="branch_id_from"
                    value={stop.stop_id}
                    checked={selectedPickupId === String(stop.stop_id)}
                    onChange={(e) => onPickupChange(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor={`branch_from_${stop.stop_id}`}>
                    {stop.stop_name}
                  </label>
                </div>
              ))}
            </div>
            {renderMap(selectedPickupId)}
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 bg-light p-3">
            <h5 className="mb-3">Điểm trả khách (xuống xe)</h5>
            <div className="dropoff-options">
              {routeStops.map((stop) => (
                <div key={`to-${stop.stop_id}`} className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="radio"
                    id={`branch_to_${stop.stop_id}`}
                    name="branch_id_to"
                    value={stop.stop_id}
                    checked={selectedDropoffId === String(stop.stop_id)}
                    onChange={(e) => onDropoffChange(e.target.value)}
                  />
                  <label className="form-check-label" htmlFor={`branch_to_${stop.stop_id}`}>
                    {stop.stop_name}
                  </label>
                </div>
              ))}
            </div>
            {renderMap(selectedDropoffId)}
          </div>
        </div>
      </div>
    </div>
  );
});

// NOTE: fetching by `random_code` is implemented inside the component below

  const getTypeId = (record) => {
  return String(
    record?.option_type_id ??
    record?.cms_option_type ??
    record?.optionTypeId ??
    record?.type_id ??
    ''
  );
};
  const formatPrice = value => {
    if (!value && value !== 0) return '';
    const amount = Number(String(value).replace(/\D/g, ''));
    return amount ? new Intl.NumberFormat('us-US').format(amount) + 'đ' : '';
  };


function OnlineTicket() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [routes, setRoutes] = useState([]);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Nếu có query param random_code thì gọi API lấy thông tin vé đã được submit
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const randomCode = urlParams.get('random_code');
    if (!randomCode) return;

    const fetchTicketInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/cargo.php?action=get_vexe_ticket_by_random_code&no_auth=true&random_code=${encodeURIComponent(randomCode)}`);
        const data = await response.json();
        // cargo.php returns { success: true, ticket: { ... } }
        if (!data || data.success !== true) {
          throw new Error(data?.message || 'Không thể lấy thông tin vé.');
        }
        const ticketRow = data.ticket;
        if (ticketRow) {
          setTicket(ticketRow);
          setError('');
        } else {
          setError('Không tìm thấy vé với mã đã cung cấp.');
        }
      } catch (fetchErr) {
        console.error(fetchErr);
        setError('Không thể lấy thông tin vé. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketInfo();
  }, []);

  const [form, setForm] = useState({
    route_id: '1',
    departure_date: today,
    departure_time: '',
    seat_count: '2',
    passenger_name: 'Tùng',
    passenger_phone: '0917335743',
    passenger_email: 'hb.anhtuan@gmail.com',
    pickup_point: '',
    dropoff_point: '',
    branch_id_from: '4',
    branch_id_to: '5',
    notes: 'Ghi chú thêm',
    payment_method: '226', // Thanh toán tại công ty
  });

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const [bus_info, setBusInfo] = useState(null);
  const [route_stops, setRouteStops] = useState([]);
  const [payment_methods, setPaymentMethods] = useState([]);
  const [ticketVnd, setTicketVnd] = useState(0);

  // Mock dữ liệu tuyến (sẽ thay bằng API)
  useEffect(() => {
    // lấy route thật = api api/cargo.php?action=get_routes&no_auth=true
    const fetchRoutes = async () => {
      try {
        const routesResponse = await fetch(`${API_BASE}/cargo.php?action=get_routes&no_auth=true`);
        const routesJson = await routesResponse.json();
        const routeList = normalizeRows(routesJson);
        setRoutes(routeList);
        setError('');
      } catch (e) {
        console.error(e);
        setError('Không thể tải dữ liệu tuyến từ API.');
      }
    };

    fetchRoutes();
  }, []);

  // lấy danh sách Giờ xuất phát (phơi) khi Tuyến đi hoặc Ngày đi thay đổi
  useEffect(() => {
    if (form.route_id && form.departure_date) {
      // Gọi API để lấy danh sách giờ xuất phát : api/cargo.php?action=get_departures&route_id=1&dept_date=2026-09-03&no_auth=true
      const fetchDepartures = async () => {
        try {
          const departuresResponse = await fetch(`${API_BASE}/cargo.php?action=get_departures&route_id=${form.route_id}&dept_date=${form.departure_date}&no_auth=true`);
          const departuresJson = await departuresResponse.json();
          // Xử lý dữ liệu giờ xuất phát
          const departureTimes = normalizeRows(departuresJson);
          // render lại nội dung của select departure_time từ nội dung của departureTimes
          setOptions((prevOptions) => {
            // Lọc các option có type_id = departure_time
            const filteredOptions = prevOptions.filter((item) => getTypeId(item) !== 'departure_time');
            const newOptions = departureTimes.map((item) => ({
              option_type_id: 'departure_time',
              option_value: item.dept_id,
              option_label: `${item.route_abbr} - ${item.dept_date_time} (còn ${item.seat_left} ghế : ${formatNumber(item.ticket_vnd)} vnd/ghế)`,
            }));
            return [...filteredOptions, ...newOptions];
          });
          setError('');

        } catch (e) {
          console.error(e);
          setError('Không thể tải dữ liệu giờ xuất phát từ API.');
        }
      };

      fetchDepartures();
    }
  }, [form.route_id, form.departure_date, routes]);

  // Lấy danh sách điểm dừng khi route_id thay đổi
  useEffect(() => {
    if (form.route_id) {
      const fetchRouteStops = async () => {
        try {
          const stopsResponse = await fetch(`${API_BASE}/cargo.php?action=get_route_stops&route_id=${form.route_id}&no_auth=true`);
          const stopsJson = await stopsResponse.json();
          // data và payments là 2 mảng trong stopsJson
          const stopsList = normalizeRows(stopsJson);
          const paymentsList = normalizeRows(stopsJson?.payments);
          setRouteStops(stopsList);
          setPaymentMethods(paymentsList);
          // Reset branch selections
          setForm((prev) => ({
            ...prev,
            branch_id_from: '',
            branch_id_to: '',
          }));
        } catch (e) {
          console.error(e);
          setError('Không thể tải dữ liệu điểm dừng từ API.');
        }
      };

      fetchRouteStops();
    }
  }, [form.route_id]);

  // Dữ liệu xe mẫu (sau sẽ từ API)
  let mockBusLayout = {
    bus_type: 'Limousine 16 chỗ',
    total_seats: 16,
    rows: 4,
    cols: 4,
    layout: [
      [1, 2, null, 3, 4],
      [5, 6, null, 7, 8],
      [9, 10, null, 11, 12],
      [13, 14, null, 15, 16],
    ]
  };

  // Mock dữ liệu ghế có sẵn (sẽ thay bằng API)
  useEffect(() => {
    if (form.route_id && form.departure_date && form.departure_time) {
      // gọi api get_departures_details
      const fetchDepartureDetails = async () => {
        try {
          const detailsResponse = await fetch(`${API_BASE}/cargo.php?action=get_departures_details&dept_id=${form.departure_time}&no_auth=true`);
          const detailsJson = await detailsResponse.json();
          const row = detailsJson?.row || detailsJson || {};
          const seatCount = Number(row.seat_count || 0);
          const takenSeatNumbers = row.taken_seat_numbers ? row.taken_seat_numbers.split(',').map(Number) : [];
          const price = Number(row.ticket_vnd ?? row.ticketVnd ?? row.price_vnd ?? 0);

          setTicketVnd(price);
          setAvailableSeats(
            Array.from({ length: seatCount }, (_, i) => i + 1).filter((seat) => !takenSeatNumbers.includes(seat))
          );

          setBusInfo({
            ...mockBusLayout,
            total_seats: seatCount,
            rows: Math.ceil(seatCount / 4),
            cols: 4,
            layout: Array.from({ length: Math.ceil(seatCount / 4) }, (_, rowIndex) => {
              const rowSeats = [];
              for (let colIndex = 0; colIndex < 4; colIndex++) {
                const seatNumber = rowIndex * 4 + colIndex + 1;
                rowSeats.push(seatNumber <= seatCount ? seatNumber : null);
              }
              return rowSeats;
            }),
          });
        } catch (e) {
          console.error(e);
          setError('Không thể tải dữ liệu chi tiết chuyến từ API.');
        }
      };

      fetchDepartureDetails();
    }
  }, [form.route_id, form.departure_date, form.departure_time]);

  const groupedOptions = useMemo(() => {
    const map = {};
    options.forEach((item) => {
      const id = getTypeId(item);
      if (!id) return;
      if (!map[id]) map[id] = [];
      map[id].push(item);
    });

    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => {
        const rankA = Number(a?.pos_rank ?? a?.order_rank ?? a?.sort_order ?? 0);
        const rankB = Number(b?.pos_rank ?? b?.order_rank ?? b?.sort_order ?? 0);
        return rankA - rankB;
      });
    });

    return map;
  }, [options]);

  const getOptionLabel = (item) => getText(item, ['option_label', 'label', 'text', 'name']);
  const getOptionValue = (item) => getText(item, ['option_id', 'option_value', 'id', 'value']);
  const getOptionMota = (item) => getText(item, ['option_description']);

  const renderOptionSelect = (typeId, stateKey, placeholder = '', classname = '') => {
    const typeOptions = groupedOptions[String(typeId)] || [];
    if (typeOptions.length === 0) return null;

    return (
      <select
        id={stateKey}
        name={stateKey}
        className={`form-select ${classname}`}
        value={form[stateKey] || ''}
        onChange={(e) => setForm((prev) => ({ ...prev, [stateKey]: e.target.value }))}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {typeOptions.map((item) => {
          const value = getOptionValue(item);
          const label = getOptionLabel(item);
          const mo_ta = getOptionMota(item);
          return (
            <option key={`${typeId}-${value}`} value={value}>
              {label || value}{mo_ta ? ` (${mo_ta})` : ''}
            </option>
          );
        })}
      </select>
    );
  };

  const handleSeatClick = (seatNumber) => {
    if (!availableSeats.includes(seatNumber)) return; // Ghế không có sẵn

    const seatCount = parseInt(form.seat_count) || 1;
    const isSelected = selectedSeats.includes(seatNumber);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNumber));
    } else {
      if (selectedSeats.length < seatCount) {
        setSelectedSeats([...selectedSeats, seatNumber]);
      } else {
        alert(`Bạn chỉ có thể chọn tối đa ${seatCount} ghế`);
      }
    }
  };

  const handlePickupPointChange = useCallback((nextValue) => {
    setForm((prev) => (
      prev.branch_id_from === nextValue ? prev : { ...prev, branch_id_from: nextValue }
    ));
  }, []);

  const handleDropoffPointChange = useCallback((nextValue) => {
    setForm((prev) => (
      prev.branch_id_to === nextValue ? prev : { ...prev, branch_id_to: nextValue }
    ));
  }, []);

  const renderSeatMap = () => {
    if (!bus_info) return null;

    return (
      <div className="seat-map">
        <div className="seat-map__title fw-semibold mb-3">Chọn ghế ngồi</div>
        <div className="seat-map__info mb-3">
          <span className="seat-badge available">
            <i className="fas fa-square-full"></i> Còn trống ({availableSeats.length})
          </span>
          <span className="seat-badge booked">
            <i className="fas fa-square-full"></i> Đã đặt ({mockBusLayout.total_seats - availableSeats.length})
          </span>
          <span className="seat-badge selected">
            <i className="fas fa-square-full"></i> Đã chọn ({selectedSeats.length}/{form.seat_count})
          </span>
        </div>

        <div className="seat-map__grid">
          {bus_info.layout.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`} className="seat-map__row">
              {row.map((seatNumber, colIndex) => {
                if (seatNumber === null) {
                  return <div key={`col-${colIndex}`} className="seat-map__aisle"></div>;
                }

                const isAvailable = availableSeats.includes(seatNumber);
                const isSelected = selectedSeats.includes(seatNumber);

                return (
                  <button
                    key={`seat-${seatNumber}`}
                    type="button"
                    className={`seat-map__seat ${!isAvailable ? 'booked' : ''} ${
                      isSelected ? 'selected' : ''
                    }`}
                    disabled={!isAvailable}
                    onClick={() => handleSeatClick(seatNumber)}
                    title={`Ghế ${seatNumber}`}
                  >
                    {seatNumber}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="seat-map__note mt-3 small text-muted">
          Các ghế được tô sang này là các ghế đã được đặt. Bạn không thể chọn các ghế này.
        </div>
      </div>
    );
  };

  const nextStep = () => {
    if (activeStep === 1) {
      if (!form.route_id || !form.departure_date || !form.departure_time) {
        setError('Vui lòng chọn tuyến, ngày và giờ xuất phát.');
        return;
      }
      if (!form.passenger_name || !form.passenger_phone) {
        setError('Vui lòng nhập tên và số điện thoại hành khách.');
        return;
      }
      setError('');
    }

    if (activeStep === 2) {
      if (selectedSeats.length === 0) {
        setError('Vui lòng chọn ít nhất một ghế.');
        return;
      }
      if (selectedSeats.length !== parseInt(form.seat_count)) {
        setError(`Vui lòng chọn đúng ${form.seat_count} ghế.`);
        return;
      }
      if (!form.branch_id_from || !form.branch_id_to) {
        setError('Vui lòng chọn điểm đón và điểm trả khách.');
        return;
      }
      setError('');
    }

    setActiveStep((prev) => Math.min(prev + 1, 4));
  };

  const previousStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (
      !form.route_id ||
      !form.departure_date ||
      !form.departure_time ||
      !form.passenger_name ||
      !form.passenger_phone ||
      selectedSeats.length === 0
    ) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }

    if (!window.confirm('Bạn có chắc chắn muốn đặt vé?')) {
      return;
    }

    const payload = {
      route_id: form.route_id,
      departure_date: form.departure_date,
      departure_time: form.departure_time,
      selected_seats: selectedSeats,
      seat_count: form.seat_count,
      passenger_name: form.passenger_name,
      passenger_phone: form.passenger_phone,
      passenger_email: form.passenger_email || null,
      pickup_point: form.branch_id_from || null,
      dropoff_point: form.branch_id_to || null,
      notes: form.notes || null,
      payment_method: form.payment_method || 0,
    };

    try {
      setSubmitLoading(true);
      const response = await fetch(`${API_BASE}/cargo.php?action=book_ticket&no_auth=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const raw = await response.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        setError((raw || '').trim().slice(0, 300) || 'Có lỗi xảy ra khi đặt vé.');
        return;
      }

      if (!response.ok || data?.status !== 'success') {
        setError(data?.message || data?.mail_message || 'Có lỗi xảy ra khi đặt vé.');
        // nếu = seats_taken thì gọi lại api get_departures_details để cập nhật lại danh sách ghế còn trống
        if (data?.status === 'seats_taken') {
          window.alert('Một số ghế bạn chọn đã được đặt trước. Vui lòng chọn lại ghế khác.');
          // Gọi lại api để cập nhật danh sách ghế còn trống
          try {
            const detailsResponse = await fetch(`${API_BASE}/cargo.php?action=get_departures_details&dept_id=${form.departure_time}&no_auth=true`);
            const detailsJson = await detailsResponse.json();
            const row = detailsJson?.row || detailsJson || {};
            const seatCount = Number(row.seat_count || 0);
            const takenSeatNumbers = row.taken_seat_numbers ? row.taken_seat_numbers.split(',').map(Number) : [];
            // render lại nội dung của select departure_time từ nội dung của departureTimes
            setBusInfo({
              ...mockBusLayout,
              total_seats: seatCount,
              rows: Math.ceil(seatCount / 4),
              cols: 4,
              layout: Array.from({ length: Math.ceil(seatCount / 4) }, (_, rowIndex) => {
                const rowSeats = [];
                for (let colIndex = 0; colIndex < 4; colIndex++) {
                  const seatNumber = rowIndex * 4 + colIndex + 1;
                  rowSeats.push(seatNumber <= seatCount ? seatNumber : null);
                }
                return rowSeats;
              }),
            });
            // Cập nhật lại danh sách ghế còn trống
            setAvailableSeats(
              Array.from({ length: seatCount }, (_, i) => i + 1).filter((seat) => !takenSeatNumbers.includes(seat))
            );
            // quay lại bước 2 để chọn lại ghế và hủy các ghế đã chọn
            setSelectedSeats([]);
            setActiveStep(2);
          } catch (e) {
            console.error(e);
            setError('Không thể cập nhật dữ liệu chi tiết chuyến từ API.');
          }
          return;
        }
      }

      setSuccessMessage('Vé của bạn đã được đặt thành công.');
      if (data?.random_codes && Array.isArray(data.random_codes) && data.random_codes.length > 0) {
        // chuyển trang hoàn toàn đến trang mua-ve với query param random_code
        window.location.href = `/mua-ve?random_code=${data.random_codes[0]}`;
      }
    } catch (submitErr) {
      console.error(submitErr);
      setError('Không thể đặt vé. Vui lòng thử lại.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const selectedRoute = routes.find((r) => r.id === form.route_id);

  return (
    <div className="container py-3">
      <div className="small text-secondary mb-2">
        <a href="/" className="text-decoration-none">Trang chủ</a>
        <span> / </span>
        <span>Đặt vé xe trực tuyến</span>
      </div>
        {/* // nếu có query param random_code thì hiển thị thông tin của vé từ vexe_tickets bên trên */}
        {ticket && ticket.random_code && (
        <div className="alert alert-success mb-3">
            <h2>Thông tin vé xe đã đặt:</h2>
            <ul className="mb-0">
                <li><strong>Mã vé:</strong> {ticket.random_code}</li>
                <li><strong>Tạo lúc:</strong> {ticket.register_submit}</li>
                <li><strong>Trạng thái:</strong> {ticket.status_title}</li>
                <li><strong>Giá vé:</strong> {formatPrice(ticket.ticket_vnd)}</li>
                <li><strong>Thanh toán:</strong> {ticket.option_label}</li>
                </ul>
                <hr />
                <ul>
                <li><strong>Tên khách:</strong> {ticket.pass_name}</li>
                <li><strong>Điện thoại:</strong> {ticket.pass_mobile}</li>
                <li><strong>Tuyến:</strong> {ticket.ap_name} ({ticket.route_name})</li>
                <li><strong>Ngày:</strong> {ticket.dept_date}</li>
                <li><strong>Giờ:</strong> {ticket.dept_time}</li>
                <li><strong>Số ghế:</strong> {ticket.seat_number}</li>
                <li><strong>Lên xe tại:</strong> {ticket.stop_name}</li>
                <li><strong>Xuống xe tại:</strong> {ticket.off_stop_name}</li>
                <li><strong>Ghi chú:</strong> {ticket.notes}</li>
            </ul>
                {ticket.related_tickets && (
                  <div>
                    <hr/>
                <ul>
                    <li><strong>Mua chung với ghế khác:</strong> {ticket.related_tickets.map((t) => t.seat_number).join(', ')}</li>
                    <li><strong>Mua chung với mã vé khác:</strong> {ticket.related_tickets.map((t) => t.random_code_2).join(', ')}</li>
                </ul>
                </div>
                )}
        </div>
      )}
      <div className="online-ticket__header text-center mb-3">
        <h1 className="mb-1">ĐẶT VÉ XE TRỰC TUYẾN</h1>
        <div className="text-muted small">Chọn tuyến, ghế và hoàn tất thanh toán trong vài bước</div>
      </div>

      <div className="online-ticket__steps mb-3">
        {[1, 2, 3, 4].map((step) => {
          const active = activeStep === step;
          const complete = activeStep > step;
          const stepTitles = [
            'Chọn tuyến & giờ',
            'Chọn ghế & điểm đón/trả',
            'Xác nhận',
            'Hoàn tất',
          ];
          return (
            <button
              key={step}
              type="button"
              className={`bus-rental-2__step ${active ? 'active' : ''} ${complete ? 'done' : ''}`}
              onClick={() => setActiveStep(step)}
            >
              <span className="bus-rental-2__circle">{step}</span>
              <span>{stepTitles[step - 1]}</span>
            </button>
          );
        })}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <form id="onlineTicketForm" name="onlineTicketForm" onSubmit={handleSubmit}>
        <div className="row g-3 align-items-start">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3 p-lg-4">
                {/* STEP 1: Chọn tuyến và giờ */}
                <div
                  id="step_1"
                  className="bus-rental-2__step-panel"
                  style={{ display: activeStep === 1 ? 'block' : 'none' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 1: CHỌN TUYẾN VÀ GIỜ XUẤT PHÁT</h4>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="route_id" className="form-label fw-semibold">
                      Tuyến đi
                    </label>
                    <select
                      id="route_id"
                      name="route_id"
                      className="form-select"
                      value={form.route_id}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          route_id: e.target.value,
                        }))
                      }
                      required
                    >
                      <option value="">-- Chọn tuyến --</option>
                      {routes.map((route) => (
                        <option key={route.route_id} value={route.route_id}>
                          {route.route_name} ({route.abbr})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="departure_date" className="form-label fw-semibold">
                        <i className="fas fa-calendar-alt"></i> Ngày đi
                      </label>
                      <input
                        id="departure_date"
                        name="departure_date"
                        type="date"
                        className="form-control"
                        value={form.departure_date}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            departure_date: e.target.value,
                          }))
                        }
                        required min={today}
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="departure_time" className="form-label fw-semibold">
                        <i className="fas fa-clock"></i> Giờ xuất phát (phơi)
                      </label>
                      <select
                        id="departure_time"
                        name="departure_time"
                        className="form-select"
                        value={form.departure_time}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            departure_time: e.target.value,
                          }))
                        }
                        required
                      >
                        <option value="">-- Chọn giờ --</option>
                        {(groupedOptions['departure_time'] || []).map((item) => (
                          <option key={`dept-${getOptionValue(item)}`} value={getOptionValue(item)}>
                            {getOptionLabel(item)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label htmlFor="seat_count" className="form-label fw-semibold">
                        <i className="fas fa-chair"></i> Số ghế cần đặt
                      </label>
                      <input
                        id="seat_count"
                        name="seat_count"
                        type="number"
                        className="form-control"
                        min="1"
                        max="8"
                        value={form.seat_count}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            seat_count: e.target.value,
                          }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <hr className="my-3" />

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">Thông tin hành khách chính</div>
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="passenger_name" className="form-label fw-semibold">
                        Tên hành khách *
                      </label>
                      <input
                        id="passenger_name"
                        name="passenger_name"
                        type="text"
                        className="form-control"
                        value={form.passenger_name}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            passenger_name: e.target.value,
                          }))
                        }
                        placeholder="Nhập tên đầy đủ"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="passenger_phone" className="form-label fw-semibold">
                        Số điện thoại *
                      </label>
                      <input
                        id="passenger_phone" maxLength={10}
                        name="passenger_phone"
                        type="tel"
                        className="form-control"
                        value={form.passenger_phone}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            passenger_phone: e.target.value,
                          }))
                        }
                        placeholder="0xxx xxx xxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label htmlFor="passenger_email" className="form-label fw-semibold">
                        Email
                      </label>
                      <input
                        id="passenger_email"
                        name="passenger_email"
                        type="email"
                        className="form-control"
                        value={form.passenger_email}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            passenger_email: e.target.value,
                          }))
                        }
                        placeholder="example@email.com"
                      />
                    </div>
                  </div>
                  <div className="row g-3 mt-1">
                    <div className="col-md-12">
                      <label htmlFor="notes" className="form-label fw-semibold">
                        Ghi chú thêm
                      </label>
                      <textarea
                        id="notes"
                        name="notes"
                        className="form-control"
                        value={form.notes}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Nhập ghi chú nếu có"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                      disabled={!form.route_id || !form.departure_date || !form.departure_time}
                    >
                      Tiếp tục <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>

                {/* STEP 2: Chọn ghế */}
                <div
                  id="step_2"
                  className="bus-rental-2__step-panel"
                  style={{ display: activeStep === 2 ? 'block' : 'none' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 2: CHỌN GHẾ NGỒI</h4>
                  </div>

                  <div className="alert alert-info mb-3">
                    <strong>{selectedRoute?.name}</strong> - Ngày{' '}
                    <strong>{form.departure_date}</strong>, Giờ <strong>{form.departure_time}</strong>
                  </div>

                  {renderSeatMap()}

                  <PickupDropoffSection
                    routeStops={route_stops}
                    selectedPickupId={form.branch_id_from}
                    selectedDropoffId={form.branch_id_to}
                    onPickupChange={handlePickupPointChange}
                    onDropoffChange={handleDropoffPointChange}
                  />

                  <div className="mt-4 d-flex gap-2">
                    <button
                      type="button"
                      onClick={previousStep}
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-arrow-left me-2"></i> Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                      disabled={selectedSeats.length === 0}
                    >
                      Tiếp tục <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>

                {/* STEP 3: Xác nhận thông tin */}
                <div
                  id="step_3"
                  className="bus-rental-2__step-panel"
                  style={{ display: activeStep === 3 ? 'block' : 'none' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 3: XÁC NHẬN THÔNG TIN</h4>
                  </div>

                  <div className="ticket-summary">
                    <div className="ticket-summary__section">
                      <h5 className="ticket-summary__title">Thông tin chuyến đi</h5>
                      <div className="ticket-summary__item">
                        <span className="label">Tuyến:</span>
                        <strong>{selectedRoute?.name}</strong>
                      </div>
                      <div className="ticket-summary__item">
                        <span className="label">Ngày đi:</span>
                        <strong>{form.departure_date}</strong>
                      </div>
                      <div className="ticket-summary__item">
                        <span className="label">Giờ xuất phát:</span>
                        <strong>{form.departure_time}</strong>
                      </div>
                    </div>

                    <div className="ticket-summary__section">
                      <h5 className="ticket-summary__title">Thông tin hành khách</h5>
                      <div className="ticket-summary__item">
                        <span className="label">Tên:</span>
                        <strong>{form.passenger_name}</strong>
                      </div>
                      <div className="ticket-summary__item">
                        <span className="label">Số điện thoại:</span>
                        <strong>{form.passenger_phone}</strong>
                      </div>
                      {form.passenger_email && (
                        <div className="ticket-summary__item">
                          <span className="label">Email:</span>
                          <strong>{form.passenger_email}</strong>
                        </div>
                      )}
                    </div>

                    <div className="ticket-summary__section">
                      <h5 className="ticket-summary__title">Ghế ngồi</h5>
                      <div className="ticket-summary__item">
                        <span className="label">Số ghế:</span>
                        <strong>{selectedSeats.sort((a, b) => a - b).join(', ')}</strong>
                      </div>
                      <div className="ticket-summary__item">
                        <span className="label">Tổng ghế:</span>
                        <strong>{selectedSeats.length}</strong>
                      </div>
                    </div>

                    {(form.pickup_point || form.dropoff_point) && (
                      <div className="ticket-summary__section">
                        <h5 className="ticket-summary__title">Điểm đón/trả</h5>
                        {form.pickup_point && (
                          <div className="ticket-summary__item">
                            <span className="label">Điểm đón:</span>
                            <strong>{form.pickup_point}</strong>
                          </div>
                        )}
                        {form.dropoff_point && (
                          <div className="ticket-summary__item">
                            <span className="label">Điểm trả:</span>
                            <strong>{form.dropoff_point}</strong>
                          </div>
                        )}
                      </div>
                    )}

                  </div>

                  <div className="mt-4 d-flex gap-2">
                    <button
                      type="button"
                      onClick={previousStep}
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-arrow-left me-2"></i> Quay lại
                    </button>
                    <button
                      type="button"
                      onClick={nextStep}
                      className="btn btn-primary"
                    >
                      Xác nhận <i className="fas fa-arrow-right ms-2"></i>
                    </button>
                  </div>
                </div>

                {/* STEP 4: Hoàn tất */}
                <div
                  id="step_4"
                  className="bus-rental-2__step-panel"
                  style={{ display: activeStep === 4 ? 'block' : 'none' }}
                >
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 4: HOÀN TẤT THANH TOÁN</h4>
                  </div>

                  <div className="payment-section">
                    <div className="payment-methods">
                      <h5 className="mb-3">Phương thức thanh toán</h5>
                      {/* // render payment_methods */}
                      {payment_methods.map((method) => (
                        <div key={`payment-${method.payment_id}`} className="form-check mb-2">
                          <input
                            className="form-check-input"
                            type="radio"
                            id={`payment_${method.payment_id}`}
                            name="payment_method"
                            value={method.payment_id}
                            checked={form.payment_method === method.payment_id}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                payment_method: e.target.value,
                              }))
                            }
                          />
                          <label className="form-check-label" htmlFor={`payment_${method.payment_id}`}>
                            {method.payment_label}
                          </label>
                        </div>
                      ))}
                    </div>

                    <hr className="my-3" />

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="terms_check"
                        required
                      />
                      <label className="form-check-label" htmlFor="terms_check">
                        Tôi đồng ý với{' '}
                        <a href="#" className="text-primary">
                          điều khoản và điều kiện
                        </a>
                        , và{' '}
                        <a href="#" className="text-primary">
                          chính sách bảo mật
                        </a>
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 d-flex gap-2">
                    <button
                      type="button"
                      onClick={previousStep}
                      className="btn btn-outline-secondary"
                    >
                      <i className="fas fa-arrow-left me-2"></i> Quay lại
                    </button>
                    <button
                      type="submit"
                      className="btn btn-success"
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check me-2"></i> Hoàn tất đặt vé
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SIDEBAR */}
          <div className="col-lg-4">
            <div className="card border-0 shadow-sm sticky-top" style={{ top: '20px' }}>
              <div className="card-body p-3 p-lg-4">
                <h5 className="card-title mb-3">Tóm tắt đơn hàng</h5>

                <div className="ticket-sidebar">
                  <div className="ticket-sidebar__item">
                    <span>Tuyến đi:</span>
                    <strong>{selectedRoute?.name || 'Chưa chọn'}</strong>
                  </div>
                  <div className="ticket-sidebar__item">
                    <span>Ngày/Giờ:</span>
                    <strong>
                      {form.departure_date} {form.departure_time || ''}
                    </strong>
                  </div>
                  <div className="ticket-sidebar__item">
                    <span>Ghế:</span>
                    <strong>
                      {selectedSeats.length > 0
                        ? selectedSeats.sort((a, b) => a - b).join(', ')
                        : 'Chưa chọn'}
                    </strong>
                  </div>
                  <div className="ticket-sidebar__item">
                    <span>Số lượng:</span>
                    <strong>{form.seat_count}</strong>
                  </div>

                  <hr className="my-2" />

                  <div className="ticket-sidebar__total">
                    <span>Tổng cộng:</span>
                    <strong className="text-primary" style={{ fontSize: '18px' }}>
                      {formatNumber(parseInt(form.seat_count) * ticketVnd)} ₫
                    </strong>
                  </div>

                  <small className="text-muted d-block mt-2">
                    <i className="fas fa-info-circle me-1"></i> Giá chưa bao gồm phí dịch vụ
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default OnlineTicket;
