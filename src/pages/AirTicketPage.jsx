import React, { useEffect, useMemo, useState } from 'react';
import './OnlineTicket.css';
import { formatHotelPrice, formatPhoneNumber, formatDateDMY } from './hotel/hotelData';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

const getTomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1); // cộng thêm 1 ngày
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

const getAirportValue = (airport) => String(airport?.ap_id ?? airport?.id ?? airport?.value ?? '');
const getAirportLabel = (airport) => airport?.ap_name || airport?.name || airport?.label || '';

function AirportSelector({
  id,
  label,
  required = true,
  value,
  onChange,
  groups,
}) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.country_group || '');

  useEffect(() => {
    if (!activeGroup && groups.length > 0) {
      setActiveGroup(groups[0].country_group);
      return;
    }

    if (activeGroup && !groups.some((group) => group.country_group === activeGroup)) {
      setActiveGroup(groups[0]?.country_group || '');
    }
  }, [activeGroup, groups]);

  const selectedAirport = useMemo(() => {
    for (const group of groups) {
      for (const country of group.countries || []) {
        const match = (country.airports || []).find(
          (airport) => String(airport.ap_id ?? airport.id ?? airport.value) === String(value)
        );
        if (match) return match;
      }
    }
    return null;
  }, [groups, value]);

  return (
    <div className="airport-selector-block">
      <label className="form-label airport-label" htmlFor={id}>
        {label} {required && <span className="text-danger">*</span>}
      </label>

      <select
        id={id}
        name={id}
        className="form-select airport-select-hidden"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
      >
        <option value="">Chọn sân bay</option>
        {groups.flatMap((group) =>
          (group.countries || []).flatMap((country) =>
            (country.airports || []).map((airport) => (
              <option key={`${id}-${airport.ap_id}`} value={getAirportValue(airport)}>
                {getAirportLabel(airport)}
              </option>
            ))
          )
        )}
      </select>

      <div className="airport-picker" data-target-select={id}>
        <div className="airport-picker-tabs" role="tablist" aria-label={label}>
          {groups.map((group) => (
            <button
              key={`${id}-${group.country_group}`}
              type="button"
              className={`airport-picker-tab ${activeGroup === group.country_group ? 'is-active' : ''}`}
              onClick={() => setActiveGroup(group.country_group)}
              role="tab"
              aria-selected={activeGroup === group.country_group}
            >
              {group.country_group}
            </button>
          ))}
        </div>

        <div className="airport-picker-panels">
          {groups.map((group) => {
            const isActive = activeGroup === group.country_group;
            return (
              <div
                key={`${id}-${group.country_group}-panel`}
                className={`airport-picker-panel ${isActive ? 'is-active' : ''}`}
                hidden={!isActive}
              >
                {(group.countries || []).map((country) => (
                  <div key={`${id}-${group.country_group}-${country.country}`} className="airport-country-block">
                    <div className="airport-country-title">{country.country}</div>
                    <div className="airport-city-grid">
                      {(country.airports || []).map((airport) => {
                        const airportValue = getAirportValue(airport);
                        const airportLabel = getAirportLabel(airport);
                        return (
                          <button
                            key={`${id}-${airportValue}`}
                            type="button"
                            className={`airport-city-item ${String(value) === String(airportValue) ? 'active' : ''}`}
                            title={airportLabel}
                            onClick={() => onChange(airportValue)}
                          >
                            {airportLabel}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      <div className="airport-selected-text">
        {selectedAirport ? `Đã chọn: ${selectedAirport.ap_name}` : 'Chưa chọn sân bay'}
      </div>
    </div>
  );
}

function AirTicketPage() {
  const [countryGroups, setCountryGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [ticket, setTicket] = useState(null);

  const [form, setForm] = useState({
    from_airport_id: '1',
    to_airport_id: '14',
    customer_name: 'Bùi Anh Tuấn',
    customer_phone: '0917335743',
    customer_email: 'hb.anhtuan@gmail.com',
    departure_date: getTomorrow(),
    return_date: '',
    passenger_count: '1',
    notes: 'gọi khách tư vấn',
  });

  useEffect(() => {
    const fetchAirports = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE}/bus_rental.php?action=get_airports`);
        const data = await response.json();
        const airportList = normalizeRows(data?.airports || []);
        const groupList = normalizeRows(data?.airport_countries || []);

        const groupMap = new Map();
        groupList.forEach((group) => {
          const key = group.country_group || group.name || 'Khác';
          if (!groupMap.has(key)) {
            groupMap.set(key, {
              country_group: key,
              countries: new Map(),
            });
          }

          const countryKey = group.country || 'Khác';
          if (!groupMap.get(key).countries.has(countryKey)) {
            groupMap.get(key).countries.set(countryKey, { country: countryKey, airports: [] });
          }
        });

        airportList.forEach((airport) => {
          const groupId = airport.apc_group_id ?? airport.group_id ?? airport.country_group_id;
          const parentGroup = groupList.find((group) => String(group.apc_group_id ?? group.id) === String(groupId));
          const groupName = parentGroup?.country_group || 'Khác';
          const countryName = parentGroup?.country || 'Khác';

          if (!groupMap.has(groupName)) {
            groupMap.set(groupName, { country_group: groupName, countries: new Map() });
          }

          if (!groupMap.get(groupName).countries.has(countryName)) {
            groupMap.get(groupName).countries.set(countryName, { country: countryName, airports: [] });
          }

          groupMap.get(groupName).countries.get(countryName).airports.push({
            ap_id: airport.ap_id ?? airport.id,
            ap_name: airport.ap_name ?? airport.name,
            country: countryName,
            country_group: groupName,
          });
        });

        const finalGroups = Array.from(groupMap.values()).map((group) => ({
          country_group: group.country_group,
          countries: Array.from(group.countries.values()).map((country) => ({
            country: country.country,
            airports: [...(country.airports || [])].sort((a, b) =>
              String(a.ap_name || '').localeCompare(String(b.ap_name || ''))
            ),
          })),
        }));

        setCountryGroups(finalGroups);
        setError('');
      } catch (e) {
        console.error(e);
        setError('Không thể tải danh sách sân bay từ API.');
      } finally {
        setLoading(false);
      }
    };

    fetchAirports();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.from_airport_id || !form.to_airport_id || !form.customer_name || !form.customer_phone || !form.customer_email || !form.departure_date) {
      setError('Vui lòng chọn đầy đủ thông tin cần thiết.');
      setSubmitMessage('');
      return;
    }

    setError('');
    setSubmitLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      // submit lên api bus_rental.php?action=book_airticket
      const response = await fetch(`${API_BASE}/bus_rental.php?action=book_airticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
        const data = await response.json();
        if (data.status !== 'success') {
          throw new Error(data.message || 'Lỗi khi gửi yêu cầu mua vé máy bay.');
        }
      setSubmitMessage('Đã nhận yêu cầu mua vé máy bay. Chúng tôi sẽ liên hệ với bạn trong thời gian sớm nhất.');
      if (data?.random_code) {
        // chuyên hướng sang trang xem booking vé máy bay
        window.location.href = `/mua-ve-may-bay?random_code=${data.random_code}`;
      }
    } catch (submitErr) {
      console.error(submitErr);
      setError('Không thể gửi yêu cầu mua vé máy bay. Vui lòng thử lại.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const renderAirportSelector = (key, label) => (
    <AirportSelector
      id={key}
      label={label}
      value={form[key]}
      onChange={(value) => updateField(key, value)}
      groups={countryGroups}
    />
  );

//nếu có query param random_code thì gọi api bus_rental.php?action=get_airticket_by_code&random_code=xxx để lấy thông tin của vé đã submitted
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const randomCode = urlParams.get('random_code');
    if (randomCode) {
      const fetchTicketInfo = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_BASE}/bus_rental.php?action=get_airticket_by_code&random_code=${encodeURIComponent(randomCode)}`);
            const data = await response.json();
            if (data.status !== 'success') {
              throw new Error(data.message || 'Không thể lấy thông tin vé máy bay.');
            }
            setTicket(data.ticket);
            setTicket(data.passengers ? { ...data.ticket, passengers: data.passengers } : data.ticket);
        } catch (fetchErr) {
          console.error(fetchErr);
          setError('Không thể lấy thông tin vé máy bay. Vui lòng thử lại.');
        } finally {
          setLoading(false);
        }
        };
        fetchTicketInfo();
    }
  }, []);

  return (
    <div className="container py-3 airport-booking-page">
      <div className="small text-secondary mb-2">
        <a href="/" className="text-decoration-none">Trang chủ</a>
        <span> / </span>
        <span>Mua vé máy bay</span>
      </div>
        {/* // nếu có query param random_code thì hiển thị thông tin của vé từ ticket bên trên */}
        {ticket && ticket.random_code && (
        <div className="alert alert-success mb-3">
            <h2>Thông tin vé máy bay đã gửi:</h2>
            <ul className="mb-0">
                <li><strong>Mã vé:</strong> {ticket.random_code}</li>
                <li><strong>Tạo lúc:</strong> {formatDateDMY(ticket.submit)}</li>
                <li><strong>Trạng thái:</strong> {ticket.ticket_state_name}</li>
                </ul>
                <hr />
                <ul>
                <li><strong>Tên khách:</strong> {ticket.reg_name}</li>
                <li><strong>Điện thoại:</strong> {formatPhoneNumber(ticket.reg_phone)}</li>
                <li><strong>Email:</strong> {ticket.reg_email}</li>
                <li><strong>Bay từ:</strong> {ticket.ap_name} ({ticket.code_3})</li>
                <li><strong>Bay đến:</strong> {ticket.to_ap_name} ({ticket.to_code_3})</li>
                <li><strong>Ngày đi:</strong> {formatDateDMY(ticket.reg_dep_date)}</li>
                {ticket.reg_return_date && (
                    <li><strong>Ngày về:</strong> {formatDateDMY(ticket.reg_return_date)}</li>
                )}
                <li><strong>Số vé:</strong> {ticket.pax_count}</li>
                <li><strong>Ghi chú:</strong> {ticket.reg_request}</li>
            </ul>
            <hr />
            <h3>Danh sách hành khách:</h3>
            <table className="table table-bordered pax-list-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Tên hành khách</th>
                        <th>Ngày sinh</th>
                        <th>Tuổi</th>
                        <th>Giới tính</th>
                        <th>Quốc tịch</th>  
                      <th>Số hộ chiếu</th>
                        <th>Ngày hết hạn hộ chiếu</th>
                        <th>Giá vé (VND)</th>
                        <th>Ghi chú</th>
                    </tr>
                </thead>
                <tbody>
                    {ticket.passengers && ticket.passengers.length > 0 ? (
                        ticket.passengers.map((pax, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{pax.pax_name}</td>
                                <td>{formatDateDMY(pax.pax_dob)}</td>
                                <td>{pax.pax_age}</td>
                                <td>{pax.pax_female === '1' ? 'Nữ' : 'Nam'}</td>
                                <td>{pax.country_name}</td>
                                <td>{pax.pax_pp_id}</td>
                                <td>{formatDateDMY(pax.pax_pp_expiration)}</td>
                                <td>{formatHotelPrice(pax.vnd)}</td>
                                <td>{pax.pax_notes}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="10" className="text-center">Không có hành khách</td>
                        </tr>
                    )}
                </tbody>
            </table>

        </div>
      )}
      <h1 className="airport-page-title mb-3">Mua vé máy bay</h1>

      {error && <div className="alert alert-danger mb-3">{error}</div>}

      <form onSubmit={handleSubmit}>
        {loading ? (
          <div className="alert alert-light border mb-3">Đang tải danh sách sân bay...</div>
        ) : (
          <div className="airport-booking-grid">
            <div className="airport-booking-panel">
              {renderAirportSelector('from_airport_id', 'Điểm đi')}
            </div>

            <div className="airport-booking-panel">
              {renderAirportSelector('to_airport_id', 'Điểm đến')}
            </div>
          </div>
        )}

        <div className="airport-form-grid mt-3">
          <div>
            <label htmlFor="customer_name" className="form-label">Tên khách</label>
            <input
              id="customer_name"
              name="customer_name"
              type="text"
              className="form-control"
              value={form.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
              placeholder="Nhập tên khách"
            />
          </div>

          <div>
            <label htmlFor="customer_phone" className="form-label">Số điện thoại</label>
            <input
              id="customer_phone"
              name="customer_phone"
              type="tel"
              className="form-control"
              value={form.customer_phone}
              onChange={(e) => updateField('customer_phone', e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>

          <div>
            <label htmlFor="customer_email" className="form-label">E-mail</label>
            <input
              id="customer_email"
              name="customer_email"
              type="email"
              className="form-control"
              value={form.customer_email}
              onChange={(e) => updateField('customer_email', e.target.value)}
              placeholder="Nhập email"
            />
          </div>

          <div>
            <label htmlFor="passenger_count" className="form-label">Số vé cần mua</label>
            <input
              id="passenger_count"
              name="passenger_count"
              type="number"
              min="1"
              className="form-control"
              value={form.passenger_count}
              onChange={(e) => updateField('passenger_count', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="departure_date" className="form-label">Ngày đi</label>
            <input
              id="departure_date"
              name="departure_date"
              type="date"
              className="form-control"
              value={form.departure_date}
              onChange={(e) => updateField('departure_date', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="return_date" className="form-label">Ngày về (nếu có)</label>
            <input
              id="return_date"
              name="return_date"
              type="date"
              className="form-control"
              value={form.return_date}
              onChange={(e) => updateField('return_date', e.target.value)}
            />
          </div>

          <div className="w-100">
            <label htmlFor="notes" className="form-label">Ghi chú</label>
            <textarea
              id="notes"
              name="notes"
              rows="3"
              className="form-control"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Ghi chú thêm"
            />
          </div>
        </div>

        {submitMessage && (
          <div className="alert alert-info mt-3 mb-0">{submitMessage}</div>
        )}

        <div className="d-flex justify-content-end mt-4">
          <button type="submit" className="btn btn-primary px-4" disabled={submitLoading}>
            {submitLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AirTicketPage;
