import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusRentalPage.css';

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

const getText = (record, keys) => {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value);
    }
  }
  return '';
};

const getTypeId = (record) => {
  return String(
    record?.option_type_id ??
    record?.cms_option_type ??
    record?.optionTypeId ??
    record?.type_id ??
    ''
  );
};
/*
do_bus_seat_calculation();
do_check_datetime();
*/
function BusRentalPage2() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [options, setOptions] = useState([]);
  const [error, setError] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [datetimeValidationMessages, setDatetimeValidationMessages] = useState([]);
  const [seatCalculationResult, setSeatCalculationResult] = useState(null);
  const [showMoreDiemDon, setShowMoreDiemDon] = useState(false);
  const [showMoreDiemTra, setShowMoreDiemTra] = useState(false);
  const [showMoreBuses, setShowMoreBuses] = useState(false);
  const [contactInfo, setContactInfo] = useState(null);
  const [form, setForm] = useState({
    muc_dich_thue_xe: '32',
    customer_addr: 'Saigon',
    // road_trip: 'Da Lat',
    from_day: getTomorrow(),
    from_time: '08:00:00',
    to_day: getTomorrow(),
    to_time: '17:00:00',
    pax_count: '20',
    wish_bus_year: '100',
    wish_tai_xe_tu_tuc: '37',
    nhieu_hanh_ly: false,
    // notes: 'Ghi chú lịch trình',
    // notes_2: 'Ghi chú thêm',
    bus_type_id: '27',
    bus_count: '1',
    form_type: '1',
    wish_vnd: '0',
    bus_seat_calculation_ok: 1,
    datetime_calculation_ok: 1,
    // customer_name: 'Bùi Anh Tuấn',
    // customer_mobile: '0917335743',
    // customer_email: 'hb.anhtuan@gmail.com',
    contact_method: ['42','43'],
    // confirmation: ['102','103'],
    yeu_cau_dac_biet: ['6','10'],
    ngan_sach_du_kien: '105',
    muc_do_uu_tien: '12',
    loai_hinh_chuyen_di: '18',
    // company_address: '123 Hai Bà Trưng, Quận 1, TP.HCM',
    // company_email: 'info@thuexededang.com',
    // company_name: 'ThueXeDeDang',
    // vat_code: '0312345678'  
 });

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const optionsResponse = await fetch(`${API_BASE}/generic.php?action=list&table=cms_options&available=1&limit=999&=&no_auth=true`);
        const optionsJson = await optionsResponse.json();
        const optionList = normalizeRows(optionsJson);
        // lấy thông tin cho HỖ TRỢ 24/7 : api/bus_rental.php?action=get_contact_info&info_id=2
        // info_id = 1 nếu isThueXeDeDangDomain trong Layout.jsx
        const info_id = window.location.hostname.includes('thuexededang.com') ? 1 : 2;
        const contactInfoResponse = await fetch(`${API_BASE}/bus_rental.php?action=get_contact_info&info_id=${info_id}`);
        const contactInfoJson = await contactInfoResponse.json();
        const contactInfo = contactInfoJson?.contact_info || null;

        setOptions(optionList);
        setContactInfo(contactInfo);
        setError('');
      } catch (e) {
        console.error(e);
        setError('Không thể tải dữ liệu tùy chọn từ API.');
      }
    };

    fetchOptions();
  }, []);

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
  const getOptionValue2 = (item) => getText(item, ['option_value', 'value']);
  const getOptionValue3 = (item) => getText(item, ['option_value_3']);
  const getOptionMota = (item) => getText(item, ['option_description']);

  const renderOptionRadio = (typeId, stateKey, required = false, legend = '') => {
    const typeOptions = groupedOptions[String(typeId)] || [];
    if (typeOptions.length === 0) return null;

    return (
      <div className="mb-3">
        {legend && <div className="form-label fw-semibold">{legend}</div>}
        <div className="d-flex flex-wrap gap-2">
          {typeOptions.map((item) => {
            const value = getOptionValue(item);
            const label = getOptionLabel(item);
            const mo_ta = getOptionMota(item);
            const checked = String(form[stateKey]) === String(value);
            const form_type_1 = getOptionValue3(item)!=='2' ? true : false;
            if(form_type_1) return (
              <label key={`${typeId}-${value}`} className={`bus-rental-option-card ${checked ? 'selected' : ''}`}>
                <input
                //   id={`${stateKey}[]`}
                  name={stateKey}
                  type="radio"
                  value={value}
                  checked={checked}
                  required={required}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setForm((prev) => ({ ...prev, [stateKey]: nextValue }));
                  }}
                />
                <div>{label || value}</div> {mo_ta && <div className="option_mo_ta">({mo_ta})</div>}
              </label>
            );
            return null;
          })}
        </div>
      </div>
    );
  };

  const renderOptionSelect = (typeId, stateKey, placeholder = '', is_array_select = false, classname = '') => {
    const typeOptions = groupedOptions[String(typeId)] || [];
    if (typeOptions.length === 0) return null;

    return (
      <div className="mb-3">
        <select
          id={stateKey}
          name={is_array_select ? `${stateKey}[]` : stateKey}
          className={`form-select ${classname}`}
          value={form[stateKey]}
          onChange={(e) => setForm((prev) => ({ ...prev, [stateKey]: e.target.value }))}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {typeOptions.map((item) => {
            let value;
            if(typeId === 14) value = getOptionValue2(item); //	Giờ đi về
            else value = getOptionValue(item);
            const label = getOptionLabel(item);
            const mo_ta = getOptionMota(item);
            return (
              <option key={`${typeId}-${value}`} value={value}>{label || value}{mo_ta ? ` (${mo_ta})` : ''}
              </option>
            );
          })}
        </select>
      </div>
    );
  };

  useEffect(() => {
    const pickupDateTime = new Date(`${form.from_day}T${form.from_time}`);
    const returnDateTime = new Date(`${form.to_day}T${form.to_time}`);
    const currentDateTime = new Date();
    const messages = [];

    if (Number.isNaN(pickupDateTime.getTime()) || Number.isNaN(returnDateTime.getTime())) {
      messages.push('Phải có Ngày/giờ đi về.');
    } else {
      if (pickupDateTime < currentDateTime) {
        messages.push('Ngày/giờ phải lớn hơn hiện tại.');
      }
      if (pickupDateTime > returnDateTime) {
        messages.push('Ngày/giờ trả xe phải lớn hơn hoặc bằng ngày/giờ đón.');
      }
    }

    setDatetimeValidationMessages(messages);
    const nextDatetimeOk = messages.length === 0 ? 1 : 0;
    setForm((prev) => (
      prev.datetime_calculation_ok === nextDatetimeOk
        ? prev
        : { ...prev, datetime_calculation_ok: nextDatetimeOk }
    ));
  }, [form.from_day, form.from_time, form.to_day, form.to_time]);

  const paxCount = form.pax_count;
  const busTypeId = form.bus_type_id;
  const busCount = form.bus_count;
  const busTypeId2 = form.bus_type_id_2;
  const busCount2 = form.bus_count_2;
  const busTypeId3 = form.bus_type_id_3;
  const busCount3 = form.bus_count_3;
  const busTypeId4 = form.bus_type_id_4;
  const busCount4 = form.bus_count_4;
  const busTypeId5 = form.bus_type_id_5;
  const busCount5 = form.bus_count_5;

  useEffect(() => {
    let cancelled = false;

    const doBusSeatCalculation = async () => {
      if (!paxCount || !busTypeId || !busCount) {
        setSeatCalculationResult(null);
        setForm((prev) => (prev.bus_seat_calculation_ok === 0 ? prev : { ...prev, bus_seat_calculation_ok: 0 }));
        return;
      }

      const busGroups = [
        [busTypeId, busCount],
        [busTypeId2, busCount2],
        [busTypeId3, busCount3],
        [busTypeId4, busCount4],
        [busTypeId5, busCount5]
      ];
      const payload = [['pax_count', paxCount]];

      busGroups.forEach(([busTypeId, busCount]) => {
        if (busTypeId && busCount !== undefined && busCount !== null && busCount !== '') {
          payload.push(['bus_type_id', busTypeId, busCount]);
        }
      });

      try {
        const response = await fetch(`${API_BASE}/bus_rental.php?action=do_bus_seat_calculation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const raw = await response.text();
        let data = null;
        try {
          data = JSON.parse(raw);
        } catch (parseErr) {
          if (cancelled) return;
          setSeatCalculationResult({ success: false, message: (raw || '').trim().slice(0, 300) || 'Có lỗi xảy ra khi tính số ghế.' });
          setForm((prev) => (prev.bus_seat_calculation_ok === 0 ? prev : { ...prev, bus_seat_calculation_ok: 0 }));
          return;
        }

        if (cancelled) return;

        if (data?.status !== 'success') {
          setSeatCalculationResult({ success: false, message: data?.message || data?.mail_message || 'Có lỗi xảy ra khi tính số ghế.' });
          setForm((prev) => (prev.bus_seat_calculation_ok === 0 ? prev : { ...prev, bus_seat_calculation_ok: 0 }));
          return;
        }

        setSeatCalculationResult({
          success: Boolean(data?.success),
          totalSeats: data?.total_seats,
          paxCount: data?.pax_count,
          message: data?.message || ''
        });
        setForm((prev) => ({ ...prev, bus_seat_calculation_ok: data?.success ? 1 : 0 }));
      } catch (calcErr) {
        if (cancelled) return;
        console.error(calcErr);
        setSeatCalculationResult({ success: false, message: 'Không thể tính số ghế. Vui lòng thử lại.' });
        setForm((prev) => (prev.bus_seat_calculation_ok === 0 ? prev : { ...prev, bus_seat_calculation_ok: 0 }));
      }
    };

    const timer = window.setTimeout(doBusSeatCalculation, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    paxCount,
    busTypeId,
    busCount,
    busTypeId2,
    busCount2,
    busTypeId3,
    busCount3,
    busTypeId4,
    busCount4,
    busTypeId5,
    busCount5
  ]);

const renderOptionCheckbox = (typeId, stateKey, listKey = stateKey, has_id = false) => {
  const typeOptions = groupedOptions[String(typeId)] || [];
  if (typeOptions.length === 0) return null;

  return (
    <div className="mb-3">
      <div className="d-flex flex-column gap-2">
        {typeOptions.map((item) => {
          const value = getOptionValue(item);
          const label = getOptionLabel(item);
          const mo_ta = getOptionMota(item);
          const checked = (form[listKey] || []).includes(value);

          return (
            <label key={`${typeId}-${value}`} className="bus-rental-option-row">
              <input
                {...has_id ? { id: `${stateKey}_${value}` } : {}}
                name={`${listKey}[]`}
                type="checkbox"
                checked={checked}
                value={value}
                onChange={(e) => {
                  const current = form[listKey] || [];
                  const next = e.target.checked
                    ? [...current, value]
                    : current.filter((entry) => entry !== value);
                  setForm((prev) => ({ ...prev, [listKey]: next }));
                }}
              />
              <div>{label || value}</div> {mo_ta && <div className="option_mo_ta">({mo_ta})</div>}
            </label>
          );
        })}
      </div>
    </div>
  );
};

  const selectedPurpose = groupedOptions['7']?.find((item) => getOptionValue(item) === form.muc_dich_thue_xe);
  const selectedTripType = groupedOptions['4']?.find((item) => getOptionValue(item) === form.loai_hinh_chuyen_di);
  const selectedDriver = groupedOptions['8']?.find((item) => getOptionValue(item) === form.wish_tai_xe_tu_tuc);
  const contactMapEmbed = useMemo(() => {
    if (contactInfo?.google_map_embed) {
      return <div className="contact-map-embed" dangerouslySetInnerHTML={{ __html: contactInfo.google_map_embed }} />;
    }

    return (
      <iframe
        title="map"
        src="https://www.google.com/maps?q=10.7769,106.7009&z=15&output=embed"
        width="100%"
        height="200"
        allowFullScreen
        loading="lazy"
      ></iframe>
    );
  }, [contactInfo?.google_map_embed]);
  const canContinueStep1 = Number(form.datetime_calculation_ok) === 1 && Number(form.bus_seat_calculation_ok) === 1;
  const showInvoiceInfo = (form.yeu_cau_dac_biet || []).includes('121');
  const isConfirmed = (form.confirmation || []).includes('102');
  const show_loai_hinh_chuyen_di = (form.loai_hinh_chuyen_di || []).includes('18') || (form.loai_hinh_chuyen_di || []).includes('104');

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, 3));
  const previousStep = () => setActiveStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!form.customer_name || !form.customer_mobile || !form.customer_addr || !form.road_trip || !form.from_day || !form.from_time || !form.to_day || !form.to_time || !form.bus_type_id || !form.bus_count) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc để gửi yêu cầu : Điểm đến, Thông tin nhận báo giá.');
      return;
    }
/*
*/

    if (!window.confirm('Bạn có chắc chắn muốn gửi yêu cầu thuê xe?')) {
      return;
    }

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => {
        if (typeof value === 'boolean') {
          return [key, value ? 1 : 0];
        }
        return [key, value === '' ? null : value];
      })
    );
    try {
      setSubmitLoading(true);
      const response = await fetch(`${API_BASE}/bus_rental.php?action=book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const raw = await response.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        setError((raw || '').trim().slice(0, 300) || 'Có lỗi xảy ra khi gửi yêu cầu.');
        return;
      }

      if (!response.ok || data?.status !== 'success') {
        setError(data?.message || data?.mail_message || 'Có lỗi xảy ra khi gửi yêu cầu.');
        return;
      }

      setSuccessMessage('Yêu cầu thuê xe đã được gửi thành công.');
      // return;
      if (data?.random_code) {
        navigate(`/bus-rental-done/${data.random_code}`);
      }
    } catch (submitErr) {
      console.error(submitErr);
      setError('Không thể gửi yêu cầu thuê xe. Vui lòng thử lại.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="container py-3">
      <div className="bus-rental-2__header text-center mb-3">
        <h1 className="mb-1">ĐẶT XE NHANH – KHÁCH LẺ</h1>
        <div className="text-muted small">Điền thông tin để nhận báo giá từ nhiều nhà xe</div>
      </div>

      <div className="bus-rental-2__steps mb-3">
        {[1, 2, 3].map((step) => {
          const active = activeStep === step;
          const complete = activeStep > step;
          return (
            <button
              key={step}
              type="button"
              className={`bus-rental-2__step ${active ? 'active' : ''} ${complete ? 'done' : ''}`}
              onClick={() => setActiveStep(step)}
            >
              <span className="bus-rental-2__circle">{step}</span>
              <span>{step === 1 ? 'Nhập nhu cầu' : step === 2 ? 'Yêu cầu thêm' : 'Thông tin liên hệ'}</span>
            </button>
          );
        })}
                    <button
              key='4'
              type="button"
              className={`bus-rental-2__step`}
            >
              <span className="bus-rental-2__circle">4</span>
              <span>{'Đã gửi booking'}</span>
            </button>

      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {        /*loading && <div className="alert alert-info">Đang tải cấu hình option...</div>}
      {
!loading && optionTypes.length > 0 && (
        <div className="alert alert-light border mb-3 py-2">
          Đã tải {optionTypes.length} nhóm option từ CMS để render form động....
        </div>
      )        */
}

      <form id="busRentalQuickForm" name="busRentalQuickForm" onSubmit={handleSubmit}>
        <div className="row g-3 align-items-start">
          <div className="col-lg-8">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-3 p-lg-4">
                <div id="step_1" className="bus-rental-2__step-panel" style={{ display: activeStep === 1 ? 'block' : 'none' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 1: NHẬP NHU CẦU</h4>
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">1.1. Mục đích thuê xe</div>
                    {renderOptionRadio(7, 'muc_dich_thue_xe', true, '')}
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">1.2. Loại hình chuyến đi</div>
                    {renderOptionRadio(4, 'loai_hinh_chuyen_di', true, '')}
                  </div>

                  <div className="mb-3" id='step_1_3' style={{ display: show_loai_hinh_chuyen_di ? 'block' : 'none' }}>
                    <div className="fw-semibold mb-2">1.3. Ăn ngủ tài xế</div>
                    {renderOptionRadio(8, 'wish_tai_xe_tu_tuc', true, '')}
                  </div>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <label htmlFor="customer_addr" className="form-label fw-semibold">1.4. Điểm đón</label>
                      <input
                        id="customer_addr"
                        name="customer_addr"
                        className="form-control"
                        value={form.customer_addr}
                        onChange={(e) => setForm((prev) => ({ ...prev, customer_addr: e.target.value }))}
                        placeholder="Nhập điểm đón"
                      />
                    </div>
                    <div className="col-md-6">
                      <label htmlFor="road_trip" className="form-label fw-semibold">1.5. Điểm đến</label>
                      <input
                        id="road_trip"
                        name="road_trip"
                        className="form-control"
                        value={form.road_trip}
                        onChange={(e) => setForm((prev) => ({ ...prev, road_trip: e.target.value }))}
                        placeholder="Nhập điểm đến"
                      />
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                  <div className="mb-3">
                    <div onClick={() => setShowMoreDiemDon(true)} className="fw-semibold mb-2">1.6. Thêm điểm đón (nếu có) <i className='fas fa-plus'></i></div>
                    <div id='more_diem_don' className="mb-2" style={{ display: showMoreDiemDon ? 'block' : 'none' }}>
                    {[1,2,3,4,5].map((element) => (
                      <div key={`diem-don-${element}`} className="row g-2 align-items-end">
                        <input
                        id={`diem_don_${element}`}
                        name={`diem_don_${element}`}
                        className="form-control mt-3"
                        placeholder={`Nhập địa điểm đón ${element}`}
                        onChange={(e) => setForm((prev) => ({ ...prev, [`diem_don_${element}`]: e.target.value }))}
                      />
                  </div>
                    ))}
                  </div>
                  </div>

                  <div className="mb-3">
                    <div onClick={() => setShowMoreDiemTra(true)} className="fw-semibold mb-2">1.7. Thêm điểm trả (nếu có) <i className='fas fa-plus'></i></div>
                    <div id='more_diem_tra' className="mb-2" style={{ display: showMoreDiemTra ? 'block' : 'none' }}>
                    {[1,2,3,4,5].map((element) => (
                      <div key={`diem-tra-${element}`} className="row g-2 align-items-end">
                        <input
                        id={`diem_tra_${element}`}
                        name={`diem_tra_${element}`}
                        className="form-control mt-3"
                        placeholder={`Nhập địa điểm trả ${element}`}
                        onChange={(e) => setForm((prev) => ({ ...prev, [`diem_tra_${element}`]: e.target.value }))}
                      />
                  </div>
                    ))}
                  </div>
                  </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-md-3">
                      <label htmlFor="from_day" className="form-label fw-semibold">1.8. <i className="fas fa-calendar-alt"></i> Ngày đi</label>
                      <input
                        id="from_day"
                        name="from_day"
                        type="date"
                        className="form-control datetime_relating"
                        value={form.from_day}
                        onChange={(e) => setForm((prev) => ({ ...prev, from_day: e.target.value }))}
                      />
                    </div>

                     <div className="col-md-3">
                      <label htmlFor="from_time" className="form-label fw-semibold"><i className="fas fa-clock"></i>Giờ đi</label>
                        {renderOptionSelect(14, 'from_time', '-- chọn giờ đi --', false, 'datetime_relating')}
                      </div>


                    <div className="col-md-3">
                      <label htmlFor="to_day" className="form-label fw-semibold"><i className="fas fa-calendar-alt"></i> Ngày về</label>
                      <input
                        id="to_day"
                        name="to_day"
                        type="date"
                        className="form-control datetime_relating"
                        value={form.to_day}
                        onChange={(e) => setForm((prev) => ({ ...prev, to_day: e.target.value }))}
                      />
                    </div>
                    <div className="col-md-3">
                      <label htmlFor="to_time" className="form-label fw-semibold"><i className="fas fa-clock"></i> Giờ về</label>
                        {renderOptionSelect(14, 'to_time', '-- chọn giờ về --', false, 'datetime_relating')}
                    </div>
                    <div id="datetime_calculation" className="mb-2">
                      {datetimeValidationMessages.length > 0 && (
                        <div className="bus_seat_calculation">
                          {datetimeValidationMessages.map((message) => (
                            <p key={message}>{message}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="row g-3 mt-1">
                    <div className="col-md-6">
                      <label htmlFor="pax_count" className="form-label fw-semibold">1.9. Số lượng hành khách</label>
                      <input
                        id="pax_count"
                        name="pax_count"
                        type="number"
                        className="form-control bus_relating"
                        min="1"
                        value={form.pax_count}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                [`pax_count`]: e.target.value,
                              }))
                            }
                      />
                    </div>
                    <div className="col-md-6 d-flex align-items-end">
                      <label htmlFor="nhieu_hanh_ly" className="bus-rental-option-row w-100 mb-0">
                        <input
                          id="nhieu_hanh_ly"
                          name="nhieu_hanh_ly"
                          type="checkbox"
                          checked={form.nhieu_hanh_ly}
                          onChange={(e) => setForm((prev) => ({ ...prev, nhieu_hanh_ly: e.target.checked }))}
                        />
                        <span>Có nhiều hành lý</span>
                      </label>
                    </div>
                  </div>

                  <div className="mb-3 mt-3">
                    <label htmlFor="notes" className="form-label fw-semibold">1.10. Tóm tắt lịch trình</label>
                    <textarea
                      id="notes"
                      name="notes"
                      className="form-control"
                      rows="3"
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Nhập ghi chú hoặc lịch trình chi tiết"
                    />
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">1.11. Phương án xe</div>
                    <input type='hidden' id='bus_seat_calculation_ok' name='bus_seat_calculation_ok' value={form.bus_seat_calculation_ok} />
                    <input type='hidden' id='datetime_calculation_ok' name='datetime_calculation_ok' value={form.datetime_calculation_ok} />
                      <div className="row g-2 align-items-end">
                      <div className="col-md-6">
                        {renderOptionSelect(1, `bus_type_id`, '-- chọn loại xe --', false, 'bus_relating')}
                      </div>
                      <div className="col-md-3">
                      <div className="mb-3">
                          <select
                            id={`bus_count`}
                            name={`bus_count`}
                            className="form-select bus_relating"
                            value={form[`bus_count`]}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                [`bus_count`]: e.target.value,
                              }))
                            }
                          >
                            {[...Array(10)].map((_, index) => (
                                  <option key={index} value={index + 1}>
                                    {index + 1}
                                  </option>
                                ))}
                          </select>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <button type="button" onClick={() => setShowMoreBuses(true)} className="btn btn-outline-secondary">Thêm loại xe</button>
                        </div>
                      </div>
                    </div>
                    <div id='more_buses' className="mb-2" style={{ display: showMoreBuses ? 'block' : 'none' }}>
                    {['_2','_3','_4','_5'].map((element) => (
                      <div key={`more-bus-${element}`} className="row g-2 align-items-end">
                      <div className="col-md-6">
                        {renderOptionSelect(1, `bus_type_id${element}`, '-- chọn loại xe --', false, 'bus_relating')}
                      </div>
                      <div className="col-md-3">
                      <div className="mb-3">
                          <select
                            id={`bus_count${element}`}
                            name={`bus_count${element}`}
                            className="form-select bus_relating"
                            value={form[`bus_count${element}`]}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                [`bus_count${element}`]: e.target.value,
                              }))
                            }
                          >
                            {(element === ''
                              ? [...Array(10)].map((_, index) => (
                                  <option key={index} value={index + 1}>
                                    {index + 1}
                                  </option>
                                ))
                              : [...Array(11)].map((_, index) => (
                                  <option key={index} value={index}>
                                    {index}
                                  </option>
                                ))
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                    ))}
                    </div>
                    <div id="bus_seat_calculation" className="mb-2">
                      {seatCalculationResult?.message && (
                        <div className={`bus_seat_calculation ${seatCalculationResult.success ? 'enough' : 'not_enough'}`}>
                          {seatCalculationResult.totalSeats !== undefined && seatCalculationResult.paxCount !== undefined && (
                            <p>Tổng số ghế = [{seatCalculationResult.totalSeats}], tổng số khách = [{seatCalculationResult.paxCount}]</p>
                          )}
                          <p>Kết quả: [{seatCalculationResult.message}]</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="notes_2" className="form-label fw-semibold">1.12. Ghi chú</label>
                    <textarea
                      id="notes_2"
                      name="notes_2"
                      className="form-control"
                      rows="2"
                      value={form.notes_2}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes_2: e.target.value }))}
                      placeholder="Không bắt buộc"
                    />
                  </div>

                  <div className="d-flex justify-content-end">
                    <button id="tiep_tuc_1" name='tiep_tuc_1' type="button" className="btn btn-primary px-4" onClick={nextStep} disabled={!canContinueStep1}>Tiếp tục</button>
                  </div>
                </div>

                <div id="step_2" className="bus-rental-2__step-panel" style={{ display: activeStep === 2 ? 'block' : 'none' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 2: YÊU CẦU THÊM</h4>
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">2.1. Tiện ích mong muốn</div>
                    {renderOptionRadio(15, 'wish_bus_year')}
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">2.2. Tiện ích và tiêu chuẩn xe</div>
                    {renderOptionCheckbox(2, 'yeu_cau_dac_biet', 'yeu_cau_dac_biet', true)}
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">2.3. Ngân sách dự kiến</div>
                    {renderOptionRadio(17, 'ngan_sach_du_kien')}
                    {form.ngan_sach_du_kien === '106' && (
                      <input
                        id="wish_vnd"
                        name="wish_vnd"
                        className="form-control mt-3"
                        placeholder="Nhập ngân sách dự kiến"
                        value={form.wish_vnd || ''}
                        onChange={(e) => setForm((prev) => ({ ...prev, wish_vnd: e.target.value }))}
                      />
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">2.4. Ưu tiên của bạn</div>
                    {renderOptionRadio(3, 'muc_do_uu_tien')}
                  </div>

                  <div className="d-flex justify-content-between">
                    <button type="button" className="btn btn-outline-primary" onClick={previousStep}>Quay lại</button>
                    <button type="button" className="btn btn-primary px-4" onClick={nextStep}>Tiếp tục</button>
                  </div>
                </div>

                <div id="step_3" className="bus-rental-2__step-panel" style={{ display: activeStep === 3 ? 'block' : 'none' }}>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">BƯỚC 3: THÔNG TIN LIÊN HỆ</h4>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="customer_name" className="form-label fw-semibold">3.1. Thông tin nhận báo giá</label>
                    <input 
                      id="customer_name"
                      name="customer_name"
                      className="form-control mb-2"
                      placeholder="Họ và tên"
                      value={form.customer_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, customer_name: e.target.value }))}
                    />
                    <input 
                      id="customer_mobile"
                      name="customer_mobile"
                      className="form-control mb-2"
                      placeholder="Số điện thoại (có Zalo)"
                      value={form.customer_mobile}
                      onChange={(e) => setForm((prev) => ({ ...prev, customer_mobile: e.target.value }))}
                    />
                    <input
                      id="customer_email"
                      name="customer_email"
                      className="form-control"
                      placeholder="Email"
                      value={form.customer_email}
                      onChange={(e) => setForm((prev) => ({ ...prev, customer_email: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">3.2. Bạn muốn nhận báo giá bằng cách nào?</div>
                    {renderOptionCheckbox(13, 'contact_method', 'contact_method')}
                  </div>

                  <div className="mb-3" id="div_yeu_cau_dac_biet_121" style={{ display: showInvoiceInfo ? 'block' : 'none' }}>
                    <label htmlFor="company_name" className="form-label fw-semibold">3.3. Thông tin xuất hóa đơn</label>
                    <div className='row g-3'>
                    <div className='col-md-6'>
                    <input
                      id="company_name"
                      name="company_name"
                      className="form-control mb-2"
                      placeholder="Tên công ty"
                      value={form.company_name}
                      onChange={(e) => setForm((prev) => ({ ...prev, company_name: e.target.value }))}
                    />
                    </div>
                    <div className='col-md-6'>
                    <input
                      id="vat_code"
                      name="vat_code"
                      className="form-control mb-2"
                      placeholder="Mã số thuế"
                      value={form.vat_code}
                      onChange={(e) => setForm((prev) => ({ ...prev, vat_code: e.target.value }))}
                    />
                    </div>
                    </div>
                    <input
                      id="company_email"
                      name="company_email"
                      className="form-control mb-2"
                      placeholder="Email nhận hóa đơn"
                      value={form.company_email}
                      onChange={(e) => setForm((prev) => ({ ...prev, company_email: e.target.value }))}
                    />
                    <input
                      id="company_address"
                      name="company_address"
                      className="form-control mb-2"
                      placeholder="Địa chỉ công ty"
                      value={form.company_address}
                      onChange={(e) => setForm((prev) => ({ ...prev, company_address: e.target.value }))}
                    />
                  </div>

                  <div className="mb-3">
                    <div className="fw-semibold mb-2">3.4. Xác nhận</div>
                    {renderOptionCheckbox(16, 'confirmation', 'confirmation', true)}
                  </div>

                  <div className="d-flex justify-content-between">
                    <input type='hidden' id='form_type' name='form_type' value='1' />
                    <button type="button" className="btn btn-outline-primary" onClick={previousStep}>Quay lại</button>
                    <button type="submit" id='submit_button' className="btn btn-primary px-4" disabled={submitLoading || !isConfirmed}>{submitLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}</button>

                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body p-3">
                <h5 className="mb-3">TÓM TẮT YÊU CẦU</h5>
                <div className="small text-muted mb-2">Hành khách</div>
                <div className="fw-bold">{form.pax_count || '—'} khách</div>
                <div className="small text-muted mt-3 mb-2">Phương án xe</div>
                <div className="fw-bold">{selectedPurpose?.option_label || '—'}</div>
                <div className="text-muted small mt-2">{form.customer_addr || '—'} → {form.road_trip || '—'}</div>
                <div className="text-muted small mt-2">{form.from_day || '—'} {form.from_time || '—'} → {form.to_day || '—'} {form.to_time || '—'}</div>
                <div className="small text-muted mt-3 mb-2">Tài xế</div>
                <div className="fw-bold">{selectedDriver?.option_label || '—'}</div>
                <div className="small text-muted mt-3 mb-2">Loại hình</div>
                <div className="fw-bold">{selectedTripType?.option_label || '—'}</div>
              </div>
            </div>

            <div className="card border-0 shadow-sm mb-3">
              <div className="card-body p-3">
                <h5 className="mb-2">HỖ TRỢ 24/7</h5>
                <div className="text-muted small">Gặp khó khăn? Chúng tôi luôn sẵn sàng hỗ trợ bạn.</div>
                <div className="mt-3"><i className="fas fa-phone-alt me-1"></i><b>Điện thoại/Zalo :</b> <a href={`tel:${contactInfo?.phone_number || ''}`}>{contactInfo?.phone_number || '—'}</a></div>
                <div className="text-muted small">(8:00 – 22:00 mỗi ngày)</div>
                <div className="mt-3"><i className="fas fa-envelope me-1"></i><b>Email :</b> <a href={`mailto:${contactInfo?.e_mail || ''}`}>{contactInfo?.e_mail || '—'}</a></div>
                {/* embedded map tương tự trang ContactPage.jsx */}
          <div className="mt-3">
            {contactMapEmbed}
          </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
export default BusRentalPage2;
