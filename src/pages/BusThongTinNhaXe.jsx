import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BusThongTinNhaXe.css';
import LightBox from '../components/LightBox';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';

function BusThongTinNhaXe() {
  const { randomCode } = useParams();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [options, setOptions] = useState([]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [expandedAccordion, setExpandedAccordion] = useState('congNoGet'); // Accordion state
  const [, setCalendarRefresh] = useState(0); // Trigger re-render Step 2
  const dataHashRef = useRef(null);
  const [calendarFromDate, setCalendarFromDate] = useState(() => {
    try {
      return localStorage.getItem('calendar_from_date') || '';
    } catch (e) {
      return '';
    }
  });

  useEffect(() => {
    if (!randomCode) return;

    let intervalId;

    const pollLatestData = async () => {
      try {
        const hashResponse = await fetch(
          `${API_BASE}/bus_rental.php?action=get_one_bus_source&random_code=${randomCode}&get_hash=1`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const hashResult = await hashResponse.json();

        if (hashResult.status === 'success') {
          const newHash = hashResult.data_hash;
          if (newHash && newHash !== dataHashRef.current) {
            const fullResponse = await fetch(
              `${API_BASE}/bus_rental.php?action=get_one_bus_source&random_code=${randomCode}`,
              { headers: { 'Content-Type': 'application/json' } }
            );
            const fullResult = await fullResponse.json();

            if (fullResult.status === 'success') {
              setData(fullResult);
              dataHashRef.current = newHash;
              setError('');
            }
          }
        }
      } catch (e) {
        console.error('Lỗi polling dữ liệu đơn thuê xe:', e);
      }
    };

    intervalId = setInterval(pollLatestData, 15000);
    return () => clearInterval(intervalId);
  }, [randomCode]);

  const handleCalendarFromDateChange = (event) => {
    const newDate = event.target.value;
    setCalendarFromDate(newDate);
    if (newDate) {
      localStorage.setItem('calendar_from_date', newDate);
      setCalendarRefresh(prev => prev + 1);
      setActiveStep(2);
    } else {
      localStorage.removeItem('calendar_from_date');
    }
  };

  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE}/bus_rental.php?action=get_one_bus_source&random_code=${randomCode}`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const result = await response.json();
        
        if (result.status === 'success') {
          setData(result);
          dataHashRef.current = result.data_hash || null;
          setError('');
        } else {
          setError(result.message || 'Không tìm thấy thông tin');
        }
      } catch (e) {
        setError('Lỗi kết nối API: ' + e.message);
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    if (randomCode) {
      fetchData();
    }
  }, [randomCode]);

  // Nếu đã có ngày trong localStorage thì mở luôn Step 2
  useEffect(() => {
    const storedFromDate = localStorage.getItem('calendar_from_date');
    if (storedFromDate) {
      setCalendarFromDate(storedFromDate);
      setActiveStep(2);
    }
  }, []);

  // Fetch cms_options từ generic.php
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/generic.php?action=list&table=cms_options&limit=999&no_auth=true`,
          { headers: { 'Content-Type': 'application/json' } }
        );
        const result = await response.json();
        if (result.rows && Array.isArray(result.rows)) {
          setOptions(result.rows || []);
        }
      } catch (e) {
        console.error('Lỗi fetch cms_options:', e);
      }
    };

    fetchOptions();
  }, []);

  // Handle calendar cell clicks - toggle chosen date
  const handleNoContractDateClick = async (event, busId, noContractDate) => {
    const cell = event.currentTarget;
    if (!busId || !noContractDate || !cell) return;

    const nextChosen = !cell.classList.contains('chosen');
    cell.classList.toggle('chosen', nextChosen);

    try {
      const apiUrl = `${API_BASE}/bus_rental.php?action=set_one_chosen_date&date=${noContractDate}&on=${nextChosen ? 1 : 0}&bus_id=${busId}&random_code=${randomCode}`;
      const response = await fetch(apiUrl, { headers: { 'Content-Type': 'application/json' } });
      const result = await response.json();
    } catch (error) {
      console.error('Error calling calendar cell click API:', error);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Đang tải...</span>
          </div>
          <p className="mt-3">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Lỗi</h4>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Quay lại</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mt-5">
        <div className="alert alert-warning">Không có dữ liệu</div>
      </div>
    );
  }

  const { nha_xe = {}, bank_accounts = {}, xe = {}, hop_dong = [], ngay_da_chon = {}, cong_no = [] } = data;

  // // Sắp xếp xe theo pos_rank DESC
  // const sortedXeEntries = Object.entries(xe).sort((a, b) => {
  //   const rankA = Number(a[1].pos_rank || 0);
  //   const rankB = Number(b[1].pos_rank || 0);
  //   return rankB - rankA;
  // });
  // Sort selected buses by pos_rank DESC (higher pos_rank first)
  const selectedBuses = xe ? Object.values(xe || {}).sort((a, b) => Number(b.pos_rank || 0) - Number(a.pos_rank || 0)) : [];

  // Format ngày tháng
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (date, time) => {
    if (!date) return '';
    const timeStr = time ? ` ${time}` : '';
    return formatDate(date) + timeStr;
  };

  const formatMoney = (value) => {
    if (!value) return '0 đ';
    return Number(value).toLocaleString('vi-VN') + ' đ';
  };

  // Helper function: Lấy option_label từ option_id
  const getOptionLabel = (optionId) => {
    if (!optionId) return 'N/A';
    const option = options.find(opt => opt.option_id == optionId);
    return option ? option.option_label : optionId;
  };
  // Helper function: Lấy option_label từ comma-separated option values
  const getOptionLabelsFromCommaString = (commaSeparatedValues) => {
    if (!commaSeparatedValues) return [];
    return commaSeparatedValues.split(',').map(val => {
      const trimmedVal = val.trim();
      return getOptionLabel(trimmedVal);
    }).filter(label => label !== 'N/A');
  };

  // Helper function: Mở lightbox với danh sách ảnh
  const openLightbox = (images, startIndex = 0) => {
    if (images && images.length > 0) {
      setLightboxImages(images.filter(img => img)); // Bỏ undefined/null
      setLightboxIndex(startIndex);
      setLightboxOpen(true);
    }
  };

  // ============ STEP 1: Thông tin nhà xe ============
  const renderStep1 = () => {
    return (
      <div className="step-content">
        <h3 className="mb-4">Thông tin nhà xe</h3>

        {/* Thông tin nhà xe chính */}
        <div className="card mb-4">
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Nhà xe: {nha_xe.source_name || 'N/A'}</h5>
          </div>
          <div className="card-body">
              {nha_xe.is_read_only || (
            <div className="row">
              <div className="col-md-4 mb-3">
                <strong>Mã nhà xe:</strong>
                <span>{nha_xe.random_code || 'N/A'}</span>
              </div>
              <div className="col-md-4 mb-3">
                <strong>Điện thoại liên hệ:</strong>
                <span>{nha_xe.manager_mobile || 'N/A'}</span>
              </div>
              <div className="col-md-4 mb-3">
                <strong>Loại hình:</strong>
                <span>{getOptionLabel(nha_xe.source_type_id) || 'N/A'}</span>
              </div>
              <div className="col-md-4 mb-3">
                <strong>Trạng thái:</strong>
                  <span className={`badge ${nha_xe.available === '1' ? 'bg-success' : 'bg-danger'}`}>
                    {nha_xe.available === '1' ? 'Hoạt động' : 'Không hoạt động'}
                  </span>
              </div>
              <div className="col-md-4 mb-3">
                <strong>Có công nợ:</strong>
                  <span className={`badge ${nha_xe.has_debt === '1' ? 'bg-warning' : 'bg-info'}`}>
                    {nha_xe.has_debt === '1' ? 'Có' : 'Không'}
                  </span>
              </div>
              <div className="col-md-4 mb-3">
                <strong>Ngày tạo:</strong>
                <span>{formatDateTime(nha_xe.submit)}</span>
              </div>
            </div>
              )}
            {/* liệt kê các tài khoản ngân hàng của nhà xe này : bank_accounts */}
{bank_accounts.length > 0 && (
<div className="row bank_accounts">Tài khoản ngân hàng của Nhà xe</div>)}
{bank_accounts.length > 0 && bank_accounts.map((element, index) => (
<div className="row" key={index}>
<div className="col-md-4 mb-3">
<strong>Tài khoản tại Ngân hàng:</strong>
<span>{element.bank_name} ({element.bank_abbr})</span>
</div>
<div className="col-md-4 mb-3">
<strong>Tên tài khoản thụ hưởng:</strong>
<span>{element.acc_name || 'N/A'}</span>
</div>
<div className="col-md-4 mb-3">
<strong>Số tài khoản:</strong>
<span>{element.acc_number || 'N/A'}</span>
</div>
{/* <div className="col-md-4 mb-3">
<strong>Ghi chú:</strong>
<span>{element.bank_notes || 'N/A'}</span>
</div> */}
</div>
))}

          </div>
        </div>

        {/* Danh sách xe */}
        <h4 className="mb-3">Danh sách xe : ({Object.keys(xe).length} xe)</h4>
        {Object.keys(xe).length === 0 ? (
          <div className="row">
            <div className="col-12">
              <p>Chưa có xe nào</p>
            </div>
          </div>
        ) : (
          <div className="row">
            {Object.entries(selectedBuses).map(([busId, bus]) => {
              // Lọc danh sách ảnh hợp lệ
              const busImages = bus.bus_images ? bus.bus_images.filter(img => img) : [];
              const mainImage = bus.image_url || (busImages.length > 0 ? busImages[0] : null);
            const allImages = mainImage ? [mainImage, ...busImages.filter(img => img !== mainImage)] : busImages;
            
            return (
              <div key={busId} className="col-md-6 mb-4">
                <div className="card h-100">
                  {mainImage && (
                    <div style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden', background: '#f0f0f0' }}
                      onClick={() => openLightbox(allImages, 0)}>
                      <img 
                        src={mainImage} 
                        alt={`Xe ${parseInt(busId) + 1}`} 
                        className="card-img-top" 
                        style={{ height: '200px', objectFit: 'cover', transition: 'transform 0.2s' }} 
                      />
                      {busImages.length > 1 && (
                        <div style={{
                          position: 'absolute',
                          bottom: '8px',
                          right: '8px',
                          backgroundColor: 'rgba(0,0,0,0.7)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          +{busImages.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="card-body">
                    <h5 className="card-title">Xe #{parseInt(busId) + 1} - {bus.bus_plate_number || 'N/A'}</h5>
                    <dl className="row mb-0">
                      <dt className="col-sm-6">Loại xe:</dt>
                      <dd className="col-sm-6">{getOptionLabel(bus.bus_type) || 'N/A'}</dd>

                      <dt className="col-sm-6">Hãng xe:</dt>
                      <dd className="col-sm-6">{getOptionLabel(bus.bus_brand_name) || 'N/A'}</dd>

                      <dt className="col-sm-6">Năm sản xuất:</dt>
                      <dd className="col-sm-6">{getOptionLabel(bus.bus_year) || 'N/A'}</dd>

                      <dt className="col-sm-6">Tiện ích và tiêu chuẩn xe:</dt>
                      <dd className="col-sm-6">
                        {bus.yeu_cau_dac_biet 
                          ? getOptionLabelsFromCommaString(bus.yeu_cau_dac_biet).join(', ') || 'Chưa thiết lập'
                          : 'Chưa thiết lập'}
                      </dd>

                      <dt className="col-sm-6">Trạng thái:</dt>
                      <dd className="col-sm-6">
                        <span className={`badge ${bus.available === '1' ? 'bg-success' : 'bg-danger'}`}>
                          {bus.available === '1' ? 'Hoạt động' : 'Không hoạt động'}
                        </span>
                      </dd>
                    </dl>

                    {/* Hình ảnh phụ - Lightbox */}
                    {busImages.length > 0 && (
                      <div className="mt-3">
                        <small className="text-muted">Hình ảnh phụ:</small>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                          {busImages.map((img, idx) => (
                            <img 
                              key={idx} 
                              src={img} 
                              alt={`Ảnh ${idx + 1}`} 
                              style={{
                                height: '60px',
                                width: '80px',
                                objectFit: 'cover',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                border: '1px solid #ddd',
                                transition: 'transform 0.2s'
                              }}
                              onClick={() => openLightbox(allImages, idx)}
                              onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        )}
      </div>
    );
  };

  // ============ STEP 2: Lịch xe chạy ============ 
  const renderStep2 = () => {
    // Tạo map từ bus_id -> danh sách hợp đồng
    const busSchedules = {};
    hop_dong.forEach((contract) => {
      const busId = contract.bus_id;
      if (!busSchedules[busId]) {
        busSchedules[busId] = [];
      }
      busSchedules[busId].push(contract);
    });

    // Xây dựng khung ngày (45 ngày) để hiển thị tổng quan
    // Use GMT+7 for all date parsing/formatting to ensure consistent calendar display
    const MS_DAY = 24 * 60 * 60 * 1000;
    const TZ7_MS = 7 * 60 * 60 * 1000;

    const ymdFromDateGmt7 = (date) => {
      const shifted = new Date(date.getTime() + TZ7_MS);
      return shifted.getUTCFullYear() + '-' + String(shifted.getUTCMonth() + 1).padStart(2, '0') + '-' + String(shifted.getUTCDate()).padStart(2, '0');
    };

    const parseDateGmt7 = (s) => {
      if (!s) return null;
      const str = String(s).trim();
      // YYYY-MM-DD
      const m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m) {
        const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
        // Represent midnight at GMT+7 as UTC = local date at 00:00 - 7h
        const utcMs = Date.UTC(y, mo, d) - TZ7_MS;
        return new Date(utcMs);
      }
      // Try parsing full datetime then normalize to YMD in GMT+7
      const dt = new Date(str);
      if (isNaN(dt)) return null;
      const ymd = ymdFromDateGmt7(dt);
      return parseDateGmt7(ymd);
    };

    // nếu đã có ngày calendar_from_date trong localStorage thì dùng nó làm ngày bắt đầu hiển thị
    const storedFromDate = localStorage.getItem('calendar_from_date');
    const calendarStartDate = calendarFromDate || storedFromDate || '';
    // Ngày đầu tiên trong bảng = localStorage đã chọn, nếu không có thì dùng ngày hiện tại
    let minDate = calendarStartDate ? parseDateGmt7(calendarStartDate) : parseDateGmt7(ymdFromDateGmt7(new Date()));
    // Không override ngày bắt đầu theo hợp đồng nữa; giữ nguyên theo người dùng chọn hoặc ngày hiện tại.

    // Days array (45 days window)
    const days = [];
    for (let i = 0; i < 45; i++) {
      days.push(new Date(minDate.getTime() + i * MS_DAY));
    }

    const headerLabel = (d) => {
      const shifted = new Date(d.getTime() + TZ7_MS);
      return `${shifted.getUTCDate()}/${shifted.getUTCMonth() + 1}`;
    };

    const isInContract = (busId, date) => {
      const contracts = busSchedules[busId] || [];
      for (const c of contracts) {
        const fd = parseDateGmt7(c.from_day);
        const td = parseDateGmt7(c.to_day) || fd;
        if (!fd) continue;
        if (date.getTime() >= fd.getTime() && date.getTime() <= td.getTime()) return c;
      }
      return null;
    };

    const isInNgayDaChon = (busId, date) => {
      const arr = (ngay_da_chon && ngay_da_chon[busId]) || [];

      for (const c of arr) {
        const fd = parseDateGmt7(c[0]) || null;
        const td = parseDateGmt7(c[1]) || fd;
        if (!fd) continue;
        if (date.getTime() >= fd.getTime() && date.getTime() <= td.getTime()) return c;
      }
      return null;
    };

    // click on no_contract_date cell to show alert
    // chỉ render khi có hop_dong
    return nha_xe.is_read_only || (
      <div className="step-content">
        {/* Calendar overview grid placed above the header */}
        <h3 className="mb-4">Lịch xe chạy : hiện từ ngày <input value={calendarFromDate} id="calendar_from_date" type="date" className="form-control d-inline-block ms-3" style={{ width: 'auto' }} onChange={handleCalendarFromDateChange} /></h3>

        <div className="calendar-overview mb-4">
          <div className="calendar-legend mb-2">
            <span className="legend-box contract" /> Chạy dự kiến &nbsp;&nbsp;
            <span className="legend-box pax_chon" /> Chạy (khách đã chọn) &nbsp;&nbsp;
            <span className="legend-box chosen" /> Chạy theo lịch riêng của nhà xe [nhấn vào ô tương ứng để tắt mở]
          </div>
          <div className="table-responsive">
            <table className="table calendar-table table-sm">
              <thead>
                <tr>
                  <th style={{ minWidth: 120 }}>Xe</th>
                  {days.map((d) => (
                    <th key={d.toISOString()} className="text-center small">{headerLabel(d)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(xe).map(([busId, bus]) => (
                  <tr key={busId}>
                    <td style={{ whiteSpace: 'nowrap' }}>{bus.bus_plate_number ? `${bus.bus_plate_number}` : ''} {bus.bus_type ? ` (${getOptionLabel(bus.bus_type)})` : ''}</td>
                    {days.map((d) => {
                      const contract = isInContract(busId, d);
                      const chosen = isInNgayDaChon(busId, d);
                      let cls = contract && chosen ? 'cell both' : contract ? 'cell contract' : chosen ? 'cell chosen' : 'cell';
                      const title = contract ? `HĐ #${contract.id} ${contract.road_trip} ${contract.pax_chon === '1' ? '(Khách đã chọn)' : ''}` : chosen ? 'Ngày đã chọn' : '';
                      const no_contract_date = contract ? '' : ymdFromDateGmt7(d);
                      cls = cls + (contract ? '' : ' no_contract_date');
                      cls = cls + (contract && contract.pax_chon === '1' ? ' pax_chon' : '');
                      return (
                        <td 
                          data-bus_id={busId} 
                          data-no_contract_date={no_contract_date} 
                          key={d.toISOString()} 
                          className={cls} 
                          title={title} 
                          onClick={(event) => {
                            if (contract) return;
                            if (!no_contract_date) return;
                            handleNoContractDateClick(event, busId, no_contract_date);
                          }}
                        ></td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <h3 className="mb-4">Các HĐ của xe</h3>

        {hop_dong.length === 0 ? (
          <div className="alert alert-info">Chưa có lịch xe chạy</div>
        ) : (
          <>
            {Object.entries(busSchedules).map(([busId, contracts]) => (
              <div key={busId} className="mb-5">
                <h5 className="mb-3">{xe[busId]?.bus_plate_number}</h5>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Hợp đồng</th>
                        <th>Ngày khởi hành</th>
                        <th>Giờ</th>
                        <th>Ngày trả xe</th>
                        <th>Giờ</th>
                        <th>Tuyến đường</th>
                        {/* <th>Giá bao khách</th> */}
                        <th>Giá trả nhà xe</th>
                        <th>Trạng thái</th>
                        <th>Khách chọn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contracts.map((contract, idx) => (
                        <tr key={idx} className={contract.pax_chon === '1' ? 'table-warning' : ''}>
                          <td><strong>#{contract.id}</strong></td>
                          <td>{formatDate(contract.from_day)}</td>
                          <td>{contract.from_time || 'N/A'}</td>
                          <td>{formatDate(contract.to_day)}</td>
                          <td>{contract.to_time || 'N/A'}</td>
                          <td>{contract.road_trip || 'N/A'}</td>
                          {/* <td className="text-end">{formatMoney(contract.vnd_bao_khach)}</td> */}
                          <td className="text-end">{formatMoney(contract.vnd_tra_nha_xe)}</td>
                          <td>{contract.option_label}</td>
                          <td>
                            <span className={`badge ${contract.pax_chon === '1' ? 'bg-warning' : 'bg-secondary'}`}>
                              {contract.pax_chon === '1' ? 'Khách đã chọn' : 'Khách chưa chọn'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Ngày chạy của xe này */}
                {/* {ngay_da_chon[busId] && ngay_da_chon[busId].length > 0 && (
                  <div className="alert alert-info mt-3">
                    <strong>Lịch riêng của nhà xe:</strong>
                    <div className="mt-2">
                      {ngay_da_chon[busId].map((day, idx) => (
                        <span key={idx} className="badge bg-info me-2 mb-2">
                          {formatDate(day[0])}{day[1] && day[1] !== day[0] ? ` - ${formatDate(day[1])}` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            ))}
          </>
        )}
      </div>
    );
  };

  // ============ STEP 3: Hợp đồng, thanh toán, công nợ ============
  const renderStep3 = () => {
    // Tính tổng các loại công nợ
    const congNoThu = cong_no.filter(c => c.is_get === '1').reduce((sum, c) => sum + (Number(c.vnd) || 0), 0);
    const congNoChi = cong_no.filter(c => c.is_get === '0').reduce((sum, c) => sum + (Number(c.vnd) || 0), 0);

    return nha_xe.is_read_only || (
      <div className="step-content">
        <h3 className="mb-4">Hợp đồng, Thanh toán & Công nợ</h3>

        {/* Thông tin hợp đồng */}
        <div className="card mb-4">
          <div className="card-header bg-success text-white">
            <h5 className="mb-0">Thông tin hợp đồng</h5>
          </div>
          <div className="card-body">
            {hop_dong.length === 0 ? (
              <p className="text-muted">Chưa có hợp đồng</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-striped">
                  <thead className="table-light">
                    <tr>
                      <th>Mã hợp đồng</th>
                      <th>Tuyến đường</th>
                      <th>Thời gian</th>
                      {/* <th>Giá bao khách</th> */}
                      <th>Giá trả Nhà xe</th>
                      <th>Trạng thái</th>
                      <th>Khách chọn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hop_dong.map((contract, idx) => (
                      <tr key={idx}>
                        <td><strong>#{contract.id}</strong></td>
                        <td>{contract.road_trip || 'N/A'}</td>
                        <td>
                          {formatDate(contract.from_day)} - {formatDate(contract.to_day)}
                        </td>
                        {/* <td className="text-end">{formatMoney(contract.vnd_bao_khach)}</td> */}
                        <td className="text-end">{formatMoney(contract.vnd_tra_nha_xe)}</td>
                        <td>{contract.option_label}</td>
                        <td><span className={`badge ${contract.pax_chon === '1' ? 'bg-warning' : 'bg-secondary'}`}>
                              {contract.pax_chon === '1' ? 'Khách đã chọn' : 'Khách chưa chọn'}
                            </span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Công nợ */}
        <div className="card mb-4">
          <div className="card-header bg-warning text-dark">
            <h5 className="mb-0">Công nợ & Thanh toán</h5>
          </div>
          <div className="card-body">
            {cong_no.length === 0 ? (
              <p className="text-muted">Chưa có công nợ</p>
            ) : (
              <>
                {/* Tóm tắt */}
                <div className="row mb-4">
                  <div className="col-md-4 mb-3">
                    <div className="p-3 bg-light border border-success rounded">
                      <div className="text-muted small">Sàn thu</div>
                      <div className="h5 text-success mb-0">{formatMoney(congNoThu)}</div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="p-3 bg-light border border-danger rounded">
                      <div className="text-muted small">Sàn chi</div>
                      <div className="h5 text-danger mb-0">{formatMoney(congNoChi)}</div>
                    </div>
                  </div>
                </div>

                {/* Chi tiết */}
                <div className="accordion" id="congNoAccordion">
                  {/* Sàn thu */}
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button ${expandedAccordion === 'congNoGet' ? '' : 'collapsed'}`}
                        type="button"
                        onClick={() => setExpandedAccordion(expandedAccordion === 'congNoGet' ? null : 'congNoGet')}
                        aria-expanded={expandedAccordion === 'congNoGet'}
                        aria-controls="collapseGetMoney"
                      >
                        Sàn thu (Tiền vào) - {formatMoney(congNoThu)}
                      </button>
                    </h2>
                    <div id="collapseGetMoney" className={`accordion-collapse collapse ${expandedAccordion === 'congNoGet' ? 'show' : ''}`}>
                      <div className="accordion-body p-0">
                        <table className="table table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Mô tả</th>
                              <th>Ngày</th>
                              <th className="text-end">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cong_no
                              .filter(c => c.is_get === '1')
                              .map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.term_name || 'N/A'}</td>
                                  <td>{formatDate(item.submit)}</td>
                                  <td className="text-end">{formatMoney(item.vnd)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Sàn chi */}
                  <div className="accordion-item">
                    <h2 className="accordion-header">
                      <button
                        className={`accordion-button ${expandedAccordion === 'congNoChi' ? '' : 'collapsed'}`}
                        type="button"
                        onClick={() => setExpandedAccordion(expandedAccordion === 'congNoChi' ? null : 'congNoChi')}
                        aria-expanded={expandedAccordion === 'congNoChi'}
                        aria-controls="collapseSendMoney"
                      >
                        Sàn chi (Tiền ra) - {formatMoney(congNoChi)}
                      </button>
                    </h2>
                    <div id="collapseSendMoney" className={`accordion-collapse collapse ${expandedAccordion === 'congNoChi' ? 'show' : ''}`}>
                      <div className="accordion-body p-0">
                        <table className="table table-sm mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Mô tả</th>
                              <th>Ngày</th>
                              <th className="text-end">Số tiền</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cong_no
                              .filter(c => c.is_get === '0')
                              .map((item, idx) => (
                                <tr key={idx}>
                                  <td>{item.term_name || 'N/A'}</td>
                                  <td>{formatDate(item.submit)}</td>
                                  <td className="text-end">{formatMoney(item.vnd)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4 mb-5 bus-thong-tin-nha-xe">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2>Thông tin nhà xe</h2>
          {/* <p className="text-muted mb-0">Mã: <strong>{randomCode}</strong></p> */}
        </div>
        {/* <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          ← Quay lại
        </button> */}
      </div>

      {/* Steps Navigation */}
      <ul className="nav nav-tabs mb-4" role="tablist">
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeStep === 1 ? 'active' : ''}`}
            id="step1-tab"
            type="button"
            role="tab"
            aria-controls="step1"
            aria-selected={activeStep === 1}
            onClick={() => setActiveStep(1)}
          >
            <span className="badge bg-primary me-2">1</span>
            Thông tin nhà xe
          </button>
        </li>
        {nha_xe.is_read_only || (
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeStep === 2 ? 'active' : ''}`}
            id="step2-tab"
            type="button"
            role="tab"
            aria-controls="step2"
            aria-selected={activeStep === 2}
            onClick={() => setActiveStep(2)}
          >
            <span className="badge bg-primary me-2">2</span>
            Lịch xe chạy
          </button>
        </li>
        )}
        {nha_xe.is_read_only || (
        <li className="nav-item" role="presentation">
          <button
            className={`nav-link ${activeStep === 3 ? 'active' : ''}`}
            id="step3-tab"
            type="button"
            role="tab"
            aria-controls="step3"
            aria-selected={activeStep === 3}
            onClick={() => setActiveStep(3)}
          >
            <span className="badge bg-primary me-2">3</span>
            Hợp đồng & Thanh toán
          </button>
        </li>
        )}
      </ul>

      {/* Steps Content */}
      <div className="tab-content">
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
        {activeStep === 3 && renderStep3()}
      </div>

      {/* Navigation Buttons */}
      {nha_xe.is_read_only || (
        <div className="d-flex justify-content-between mt-5">
        <button
          className="btn btn-secondary"
          disabled={activeStep === 1}
          onClick={() => setActiveStep(activeStep - 1)}
        >
          ← Quay lại
        </button>
        <button
          className="btn btn-primary"
          disabled={activeStep === 3}
          onClick={() => setActiveStep(activeStep + 1)}
        >
          Tiếp tục →
        </button>
      </div>
    )}

      {/* Lightbox */}
      {lightboxOpen && (
        <LightBox
          images={lightboxImages}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setLightboxIndex(idx => (idx - 1 + lightboxImages.length) % lightboxImages.length)}
          onNext={(idx) => {
            if (typeof idx === 'number') setLightboxIndex(idx);
            else setLightboxIndex(i => (i + 1) % lightboxImages.length);
          }}
        />
      )}
    </div>
  );
}

export default BusThongTinNhaXe;
