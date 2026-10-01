import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import './BookingProgressBar.css';
import './BusRentalDone.css';
import LightBox from '../components/LightBox';
import { renderProgressBar, bookingProgressSteps } from '../utils/renderProgressBar';
import RecentRentalQuotes from '../components/RecentRentalQuotes';

function BusRentalDone() {
  const { random_code } = useParams();
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cmsOptions, setCmsOptions] = useState([]);
  const [cmsToken] = useState(() => { try { return localStorage.getItem('cms_token') || ''; } catch { return ''; } });
  const [resendStatus, setResendStatus] = useState(null);
  const [resendMsg, setResendMsg] = useState('');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [chonLoadingIds, setChonLoadingIds] = useState([]);
  const [selectedChonLuaIds, setSelectedChonLuaIds] = useState([]);
  const [uploadedUncCocFile, setUploadedUncCocFile] = useState(null);
  const [uncCocUploadStatus, setUncCocUploadStatus] = useState(null); // 'sending', 'ok', 'error'
  const [uncCocUploadMsg, setUncCocUploadMsg] = useState('');
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const qrSrc = currentUrl ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=https://thuexededang.com/bus-rental-done/${random_code}` : '';

  useEffect(() => {
    if (!random_code) return;
    fetch(`/api/bus_rental.php?action=get&random_code=${random_code}`).then(r => r.json()).then(r => {
      if (r.status === 'success') setOrder({ ...r.data, bank_accounts: r.bank_accounts, xe: r.xe, bus_pax_chon: r.bus_pax_chon.split(',') || [] }); else setError(r.message || 'Không tìm thấy đơn thuê xe!');
      setLoading(false);
    }).catch(() => { setError('Không thể tải thông tin đơn thuê xe!'); setLoading(false); });
  }, [random_code]);
  useEffect(() => {
    fetch(`${API_BASE}/generic.php?action=list&table=cms_options&no_auth=true&limit=9999`).then(r => r.json())
      .then(r => setCmsOptions(r.rows || [])).catch(() => setCmsOptions([]));
  }, [API_BASE]);
  // lặp gọi api để lấy thông tin đơn thuê xe mới nhất mỗi 20s, nếu data_hash thay đổi thì render lại
  useEffect(() => {
    if (!random_code) return;
    let intervalId;
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/bus_rental.php?action=get&random_code=${random_code}&get_hash=1`);
        const result = await response.json();
        if (result.status === 'success') {
          const newHash = result.data_hash;
          if (newHash !== order?.data_hash) {
            // Hash changed, fetch full data
            const fullResponse = await fetch(`/api/bus_rental.php?action=get&random_code=${random_code}`);
            const fullResult = await fullResponse.json();
            if (fullResult.status === 'success') {
              setOrder({ ...fullResult.data, bank_accounts: fullResult.bank_accounts, xe: fullResult.xe, bus_pax_chon: fullResult.bus_pax_chon.split(',') || [], data_hash: newHash });
            }
          }
        }
      } catch (e) {
        console.error('Error fetching order data:', e);
      }
    };
    intervalId = setInterval(fetchData, 20000); // 20s
    return () => clearInterval(intervalId);
  }, [random_code, order?.data_hash]);

  const value = item => item || '';
  const option = item => !item ? '' : String(item).split(',').map(v => v.trim()).filter(Boolean).map(v => {
    const found = cmsOptions.find(i => String(i.option_id) === v); return found ? found.option_label : v;
  }).join(', ');
  const after_booking_statuses = [];
  cmsOptions.forEach(i => {
    if (i.option_type_id === '19') {
      let one=[i.option_value_2, i.option_label, i.option_value_json || i.option_label];
      after_booking_statuses[i.option_value]=one;
    }
  });
  const details = order ? [
    ['Mục đích thuê xe', option(order.muc_dich_thue_xe), '♙'], ['Loại hình chuyến đi', option(order.loai_hinh_chuyen_di), '◉'],
    ['Tài xế theo đoàn', option(order.wish_tai_xe_tu_tuc), '⌕'], ['Hành trình', `${value(order.customer_addr)}${order.road_trip ? ` → ${order.road_trip}` : ''}`, '▣'],
    ['Thời gian', `${value(order.from_day_dmy)}${order.to_day_dmy ? ` → ${order.to_day_dmy}` : ''} (${value(order.days)} ngày)`, '◷'],
    ['Số lượng hành khách', value(order.pax_count), '♙'], ['Phương án xe', `${value(order.mo_ta_xe_can_chon_short)}`, '▣'],
    ['Tiện ích mong muốn', option(order.yeu_cau_dac_biet || order.yeu_cau_dac_biet), '▧'], ['Ngân sách dự kiến', `${option(order.ngan_sach_du_kien)} ${String(order.ngan_sach_du_kien || '').split(',').map(value => value.trim()).includes('106') ? value(order.wish_vnd) : ''}`.trim(), '◉'],
  ] : [];
  // Sort selected buses by pos_rank DESC (higher pos_rank first)
  const selectedBuses = order ? Object.values(order.xe || {}).sort((a, b) => Number(b.pos_rank || 0) - Number(a.pos_rank || 0)) : [];
  const selectedBusCount = selectedBuses.length;
  const formatPrice = value => {
    if (!value && value !== 0) return '';
    const amount = Number(String(value).replace(/\D/g, ''));
    return amount ? new Intl.NumberFormat('us-US').format(amount) + 'đ' : '';
  };
  const busLabel = item => `${item.bus_type_name || ''} - ${item.bus_brand_name || ''}`.trim();
  const getFeatureLabels = (featureIds) => {
    if (!featureIds) return [];
    const ids = Array.isArray(featureIds) ? featureIds : String(featureIds).split(',');
    return ids.map(id => {
      id = String(id).trim();
      const found = cmsOptions.find(i => String(i.option_id) === id);
      return found ? found.option_label : null;
    }).filter(Boolean);
  };
  if (loading) return <div className="container py-5">Đang tải thông tin...</div>;
  if (error) return <div className="container py-5 text-danger">{error}</div>;
  if (!order) return <div className="container py-5">Không tìm thấy thông tin đơn thuê xe!</div>;

  const resendMail = async () => {
    setResendStatus('sending'); setResendMsg('');
    try {
      const response = await fetch(`/api/bus_rental.php?action=resend_mail&random_code=${encodeURIComponent(random_code)}`, { method: 'POST', headers: { Authorization: `Bearer ${cmsToken}` } });
      const result = await response.json(); setResendStatus(result.status === 'success' ? 'ok' : 'error'); setResendMsg(result.message || 'Đã gửi email thành công!');
    } catch { setResendStatus('error'); setResendMsg('Lỗi kết nối'); }
  };
  // Handle 'Chọn phương án này' action: confirm -> call API -> reload
  const handleChonLua = async (bus) => {
    if (!bus) return;
    const confirmMsg = 'Quý khách chắc chắn xác nhận chọn phương án này?';
    if (!window.confirm(confirmMsg)) return;

    try {
      setChonLoadingIds(prev => [...prev, bus.bus_id]);
      // Call API - user will implement server side. We include bus_id as query param.
      const url = `${API_BASE}/bus_rental.php?action=chon_lua_xe&random_code=${encodeURIComponent(random_code)}&chon_lua_id=${encodeURIComponent(bus.id || '')}`;
      await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      // reload page after action
      // window.location.reload();
    } catch (e) {
      console.error('Error chon_lua_xe:', e);
      setChonLoadingIds(prev => prev.filter(id => id !== bus.bus_id));
      alert('Lỗi khi chọn phương án. Vui lòng thử lại.');
    }
  };

  const handleCheckboxChange = (chonLuaId) => {
    setSelectedChonLuaIds(prev => {
      if (prev.includes(chonLuaId)) {
        return prev.filter(id => id !== chonLuaId);
      } else {
        return [...prev, chonLuaId];
      }
    });
  };

  const handleChonLuaMultiple = async () => {
    if (selectedChonLuaIds.length === 0) {
      alert('Vui lòng chọn ít nhất một phương án xe.');
      return;
    }
    const confirmMsg = `Quý khách chắc chắn xác nhận chọn ${selectedChonLuaIds.length} phương án xe này?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setChonLoadingIds(selectedChonLuaIds);
      // Call API with array of chon_lua_id
      const chonLuaIdParam = selectedChonLuaIds.map(id => encodeURIComponent(id)).join(',');
      const url = `${API_BASE}/bus_rental.php?action=chon_lua_xe&random_code=${encodeURIComponent(random_code)}&chon_lua_id=${chonLuaIdParam}`;
      await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      // reload page after action
      window.location.reload();
    } catch (e) {
      console.error('Error chon_lua_xe multiple:', e);
      setChonLoadingIds([]);
      alert('Lỗi khi chọn phương án. Vui lòng thử lại.');
    }
  };

  const handleUploadUncCoc = async () => {
    if (!uploadedUncCocFile) {
      alert('Vui lòng chọn file trước khi tải lên.');
      return;
    }

    try {
      setUncCocUploadStatus('sending');
      setUncCocUploadMsg('');

      const formData = new FormData();
      formData.append('action', 'upload_unc_coc');
      formData.append('random_code', random_code);
      formData.append('file_unc_coc', uploadedUncCocFile);

      const response = await fetch(`${API_BASE}/bus_rental.php`, {
        method: 'POST',
        body: formData,
        headers: cmsToken ? { 'Authorization': `Bearer ${cmsToken}` } : {}
      });

      const result = await response.json();

      if (result.status === 'success') {
        setUncCocUploadStatus('ok');
        setUncCocUploadMsg(result.message || 'Tải lên file Ủy nhiệm chi tiền cọc thành công!');
        setUploadedUncCocFile(null);
        // Reset file input
        const fileInput = document.getElementById('unc_coc');
        if (fileInput) fileInput.value = '';
      } else {
        setUncCocUploadStatus('error');
        setUncCocUploadMsg(result.message || 'Lỗi khi tải lên file');
      }
    } catch (e) {
      console.error('Error uploading unc_coc:', e);
      setUncCocUploadStatus('error');
      setUncCocUploadMsg('Lỗi kết nối. Vui lòng thử lại.');
    }
  };
  const processSteps = [['♧', 'Tiếp nhận yêu cầu', 'Hệ thống đã ghi nhận yêu cầu của bạn.'], ['♙', 'Tìm nhà xe phù hợp', 'Yêu cầu được gửi đến nhiều nhà xe phù hợp với nhu cầu.'], ['▤', 'Nhà xe báo giá', 'Các nhà xe phản hồi và gửi báo giá cho bạn.'], ['✓', 'Bạn chọn & xác nhận', 'Chọn nhà xe phù hợp nhất và xác nhận đặt xe.']];
  const statuses = after_booking_statuses;//[['✓', 'Đã gửi yêu cầu', value(order.submit)], ['⌕', 'Đang tìm nhà xe', 'Chúng tôi đang gửi yêu cầu đến các nhà xe phù hợp'], ['▤', 'Đã có báo giá', 'Bạn sẽ nhận được thông báo khi có báo giá'], ['✓', 'Xác nhận đặt xe', 'Chọn nhà xe phù hợp và xác nhận đặt xe']];
  const openLightboxForBus = (bus, startIndex = 0) => {
    const busImages = bus.bus_images ? bus.bus_images.filter(img => img) : [];
    const mainImage = bus.image_url || (busImages.length > 0 ? busImages[0] : null);
    const allImages = mainImage ? [mainImage, ...busImages.filter(img => img !== mainImage)] : busImages;
    if (allImages && allImages.length > 0) {
      setLightboxImages(allImages);
      setLightboxIndex(startIndex);
      setLightboxOpen(true);
    }
  };

  return <div className="bus-rental-done-page">
    {order.sau_book_status_value == 0 ? renderProgressBar(bookingProgressSteps, order.acti_status) : null}
    <main className="done-layout"><section className="done-main-column">
      <div className="done-success-card"><div className="done-check">✓</div><div><h1>Yêu cầu đã được gửi thành công!</h1><p>Cảm ơn bạn đã gửi yêu cầu. Chúng tôi đang gửi yêu cầu của bạn đến các nhà xe phù hợp để kiểm tra tình trạng xe và báo giá.</p></div></div>
      <div className="done-meta"><div><small>Mã yêu cầu</small><strong>{value(order.random_code)}</strong></div><div><small>Thời gian gửi</small><span>{value(order.submit || order.submit)}</span></div></div>
      <section className="done-card"><h2>THÔNG TIN ĐĂNG KÝ</h2>
      <div className="done-details two-columns">
<div><b>Tên khách</b><span>{value(order.customer_name)}</span></div>
<div><b>SĐT khách</b><span>{value(order.customer_mobile)}</span></div>
<div><b>Email khách</b><span>{value(order.customer_email)}</span></div>
<div><b>Địa chỉ/đi từ</b><span>{value(order.customer_addr)}</span></div>
<div><b>Đi đến</b><span>{value(order.road_trip)}</span></div>
<div><b>Ghi chú</b><span>{value(order.notes)}</span></div>
<div><b>Ghi chú thêm</b><span>{value(order.notes_2)}</span></div>
{order.file_chuong_trinh?(<div><b>File chương trình</b><span><a href={('https://thuexededang.com/' + order.file_chuong_trinh)} target="_blank" rel="noopener noreferrer">download</a></span></div>) : null}
      </div></section>
      <section className="done-card"><h2>TÓM TẮT YÊU CẦU CỦA BẠN</h2><div className="done-details">{details.map(([label, text, icon]) => <div className="done-detail" key={label}><span className="detail-icon">{icon}</span><div><b>{label}</b><span>{text}</span></div></div>)}</div></section>
{String(order.yeu_cau_dac_biet || '').split(',').map(value => value.trim()).includes('121') ? (<section className="done-card"><h2>THÔNG TIN HÓA ĐƠN</h2><div className=""><p>Chúng tôi sẽ gửi hóa đơn VAT theo thông tin bạn cung cấp. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.</p>
<ul>
<li>Tên công ty: {value(order.company_name)}</li>
<li>Mã số thuế: {value(order.vat_code)}</li>
<li>Địa chỉ: {value(order.company_address)}</li>
<li>Email nhận VAT: {value(order.company_email)}</li>
</ul>
</div></section>) : null}

<div className="done-status-description alert alert-danger mt-3">Quý khách vui lòng theo dõi tiến trình đặt xe tại mục bên dưới. Mọi cập nhật về trạng thái yêu cầu, báo giá, xác nhận và đặt xe sẽ được hiển thị tại đây.</div>
<section className="done-card done-status important-section"><h2>TRẠNG THÁI XỬ LÝ CỦA BOOKING</h2>
<div className="status-line">{statuses.map(([icon, title, text], index) => <div className={`status-item ${index < (order.sau_book_status_value) ? 'done' : ''} ${index == (order.sau_book_status_value) ? 'active' : ''}`} key={title}><i className={`fa-classic fa-solid ${icon ? icon : ''}`}></i><b>{title}</b><small>{text}</small></div>)}</div><div className="done-notices"><div><b>♧ Bạn sẽ được thông báo khi:</b><span>● Có nhà xe phù hợp với yêu cầu của bạn<br/>● Có thay đổi về tình trạng yêu cầu<br/>● Nhà xe cần trao đổi thêm thông tin</span></div><div><b>▣ Chúng tôi sẽ thông báo qua:</b><span>✉ Zalo<br/>✉ Email<br/>♧ Cuộc gọi điện thoại</span></div></div><div className="done-response-time">ⓘ <b>Thời gian phản hồi trung bình: 15 – 60 phút</b><span>Trong khoảng giờ 8:00 – 22:00 mỗi ngày</span></div></section>

{selectedBusCount > 0 && order.sau_book_status_value >= 2 ? (
  <section id="selected-buses" className="done-card">
    <div className="selected-buses-header">
      <div>
        <h2>ĐÃ CÓ [{selectedBusCount}] CHỌN LỰA XE</h2>
        <p>Hệ thống đã thu thập các phương án xe phù hợp với yêu cầu của khách. Vui lòng chọn phương án phù hợp nhất để tiếp tục.</p>
      </div>
    </div>
      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f0f7ff', borderRadius: '4px' }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#333' }}
          >Chọn tổng cộng {order.total_bus_count} xe và nhấn xác nhận, bao gồm :</p>
          <div className='mo_ta_xe_can_chon' dangerouslySetInnerHTML={{ __html: order.mo_ta_xe_can_chon || '' }} />
    {order.sau_book_status_value == 2 && Number(order.bus_count) > 0 && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-success"
            onClick={handleChonLuaMultiple}
            disabled={selectedChonLuaIds.length === 0 || chonLoadingIds.length > 0 || selectedChonLuaIds.length !== order.total_bus_count}
          >
            {chonLoadingIds.length > 0 ? `Đang xử lý... (${selectedChonLuaIds.length})` : `Khách đã chọn ${selectedChonLuaIds.length}/${order.total_bus_count} xe`}
          </button>
          {selectedChonLuaIds.length > 0 && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => setSelectedChonLuaIds([])}
              disabled={chonLoadingIds.length > 0}
            >
              Bỏ chọn
            </button>
          )}
        </div>
    )}
      </div>
    <div className="selected-buses-list">
      {selectedBuses.map((bus, index) => (
        <article className={`selected-bus-card ${order.bus_pax_chon.includes(bus.bus_id) ? 'important-section' : ''}`} key={bus.id || index}>
          <div className="selected-bus-visual" style={{ cursor: 'pointer' }} onClick={() => openLightboxForBus(bus, 0)}>
            <img src={bus.image_url || bus.bus_images?.[0] || ''} alt={busLabel(bus) || `Xe ${index + 1}`} />
          </div>
          <div className="selected-bus-info">
            <div className="selected-bus-meta">
              <span className="selected-bus-index">0{index + 1}</span>
              <div>
                <strong>{busLabel(bus) || 'Nhà xe'}</strong>
                <small>{bus.bus_year_name || 'Xe đời mới dưới 5 năm'}</small>
              </div>
            </div>
            {/* <div className="selected-bus-specs">
              {bus.bus_type_name ? <span>{bus.bus_type_name}</span> : null}
              {bus.bus_year_name ? <span>{bus.bus_year_name}</span> : null}
              <span>{bus.pax_count ? `${bus.pax_count} lượt` : '1 xe'}</span>
            </div> */}
            <div className="selected-bus-features">
              {getFeatureLabels(bus.yeu_cau_dac_biet || order.yeu_cau_dac_biet).map(label => (
                <span key={label}>{label}</span>
              ))}
            </div>
            {bus.reply_notes ? <div className="selected-bus-reply_notes"><b>Ghi chú:</b> {bus.reply_notes}</div> : null}
          </div>
          <div className="selected-bus-actions">
            <strong>{formatPrice(bus.vnd_bao_khach)}</strong>
            <span className="selected-bus-total">Tổng giá</span>
              <div>
                  <label className="checkbox-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      checked={selectedChonLuaIds.includes(bus.id)}
                      onChange={() => handleCheckboxChange(bus.id)}
                      disabled={chonLoadingIds.length > 0}
                    />
                    <span>Chọn xe này</span>
                  </label>
              </div>
          </div>
        </article>
      ))}
    </div>
  </section>
) : null}

{order.sau_book_status_value>=3&&order.bus_pax_chon.length > 0 ? (<section id="confirm-booking" className="done-card"><h2>XÁC NHẬN ĐẶT XE</h2><div className=""><p>Khách đã chọn các xe dưới đây. Vui lòng kiểm tra thông tin. Nếu có bất kỳ thay đổi nào, vui lòng thông báo ngay lập tức.</p>
</div>
    <div className="selected-buses-list">
      {selectedBuses.map((bus, index) => (
        order.bus_pax_chon.includes(bus.bus_id) && ( //String(order.bus_pax_chon).split(',').includes(bus.bus_id)
          <article className="selected-bus-card khach_chon important-section" key={bus.id || index}>
            <div className="selected-bus-visual" style={{ cursor: 'pointer' }} onClick={() => openLightboxForBus(bus, 0)}>
              <img src={bus.image_url || bus.bus_images?.[0] || ''} alt={busLabel(bus) || `Xe ${index + 1}`} />
            </div>
          <div className="selected-bus-info">
            <div className="selected-bus-meta">
              <span className="selected-bus-index">0{index + 1}</span>
              <div>
                <strong>{busLabel(bus) || 'Nhà xe'}</strong>
                <small>{bus.bus_year_name || 'Xe đời mới dưới 5 năm'}</small>
              </div>
            </div>
            {/* <div className="selected-bus-specs">
              {bus.bus_type_name ? <span>{bus.bus_type_name}</span> : null}
              {bus.bus_year_name ? <span>{bus.bus_year_name}</span> : null}
              <span>{bus.pax_count ? `${bus.pax_count} lượt` : '1 xe'}</span>
            </div> */}
            <div className="selected-bus-features">
              {getFeatureLabels(bus.yeu_cau_dac_biet || order.yeu_cau_dac_biet).map(label => (
                <span key={label}>{label}</span>
              ))}
            </div>
            {bus.reply_notes ? <div className="selected-bus-reply_notes"><b>Ghi chú:</b> {bus.reply_notes}</div> : null}
          </div>
          <div className="selected-bus-actions">
            <strong>{formatPrice(bus.vnd_bao_khach)}</strong>
            {/* <span className="selected-bus-total">Tổng giá</span>
            <button className="btn btn-primary">Chọn phương án này</button>
            <button className="btn btn-outline-secondary">Xem chi tiết</button> */}
          </div>
        </article>
      )
      )
      )}
    </div>
    <div className="done-status-description alert alert-danger mt-3">
      <p>Tổng tiền xe của booking là : <strong>{formatPrice(order.vnd_tong_tien_xe)}</strong></p>
      <p>Số tiền cần đặt cọc là : <strong>{formatPrice(order.vnd_coc_1)}</strong></p>
      </div>
</section>) : null}
{order.sau_book_status_value>=4 ? (<section className="done-card"><h2>ĐẶT CỌC ĐỂ GIỮ XE</h2><div className=""><p>Để nhà xe giữ xe cho chuyến đi của khách. Sau khi nhận được cọc, hệ thống sẽ xác nhận đặt xe.</p>
{order.bank_accounts.length > 0 && (
<div className="row bank_accounts">Tài khoản ngân hàng nhận cọc</div>)}
{order.bank_accounts.length > 0 && order.bank_accounts.map((element, index) => (
<div className="row" key={index}>
<ul>
<li>Ngân hàng:  {element.bank_name} ({element.bank_abbr})</li>
<li>Tên tài khoản nhận: <strong>{element.acc_name}</strong></li>
<li>Số tài khoản nhận: <strong>{element.acc_number}</strong></li>
</ul>
</div>
))}

<div className="row bank_accounts">Thông tin chuyển khoản của booking</div>
<div className="row">
<ul>
<li>Nội dung chuyển khoản: Dat coc cho don hang thue xe <strong>{order.random_code}</strong></li>
<li>Số tiền: [<strong>{formatPrice(order.vnd_coc_1)}</strong>] VND</li>
</ul>
</div>
</div>
{order.sau_book_status_value==4 ? (<div>
<div className="mb-3 mt-3">
<p>Sau khi thực hiện chuyển khoản tiền cọc, Quý khách vui lòng tải lên file ủy nhiệm chi</p>
<label htmlFor="unc_coc" className="form-label fw-semibold">Ủy nhiệm chi tiền cọc</label>
<input
type="file"
id="unc_coc"
name="unc_coc"
className="form-control"
accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.zip"
onChange={(e) => {
  setUploadedUncCocFile(e.target.files?.[0] || null);
  setUncCocUploadStatus(null);
}}
/>
<div className="form-text">Hỗ trợ PDF, DOC, DOCX, JPG, PNG, ZIP. File sẽ được gửi kèm trong yêu cầu thuê xe.</div>
<div className="mt-2 d-flex gap-2 align-items-center">
  <button
    type="button"
    className="btn btn-sm btn-success"
    onClick={handleUploadUncCoc}
    disabled={!uploadedUncCocFile || uncCocUploadStatus === 'sending'}
  >
    {uncCocUploadStatus === 'sending' ? 'Đang tải lên...' : '📤 Tải lên file'}
  </button>
  {uncCocUploadStatus === 'ok' && (
    <span className="text-success small fw-semibold">✓ {uncCocUploadMsg}</span>
  )}
  {uncCocUploadStatus === 'error' && (
    <span className="text-danger small fw-semibold">✕ {uncCocUploadMsg}</span>
  )}
</div>
</div>
</div>):null}
</section>) : null}
{order.sau_book_status_value>=5 ? (<section className="done-card"><h2>ĐẶT XE THÀNH CÔNG</h2>
    <div className="done-status-description alert alert-danger mt-3">
      <p>Tổng tiền xe của booking là : <strong>{formatPrice(order.vnd_tong_tien_xe)}</strong></p>
      <p>Số tiền đã nhận cọc là : <strong>{formatPrice(order.vnd_coc_thuc_nhan)}</strong> - <a href={('https://thuexededang.com/' + order.unc_coc_file)} target="_blank" rel="noopener noreferrer">File UNC cọc</a></p>
      <p>Số tiền còn lại là : <strong>{formatPrice(order.vnd_tong_tien_xe-order.vnd_coc_thuc_nhan)}</strong></p>
      </div>
<div className=""><p>Cảm ơn khách đã tin tưởng và lựa chọn dịch vụ của chúng tôi! Chuyến đi đã được xác nhận. Chúng tôi sẽ đồng hành cùng bạn trong suốt hành trình.</p>
<p>Số tiền còn lại, quý khách vui lòng thanh toán trong ngày...</p>
{String(order.yeu_cau_dac_biet || '').split(',').map(value => value.trim()).includes('121') ? (<p>Hóa đơn của quý khách sẽ được xuất trong ngày kết thúc chuyến đi ( sẽ có nhân viên phục trách hỗ  trợ quý khách về hợp đồng và hóa đơn ) </p>) : null}
{/* <ul>
<li>Tên công ty: {value(order.company_name)}</li>
<li>Mã số thuế: {value(order.vat_code)}</li>
<li>Địa chỉ: {value(order.company_address)}</li>
<li>Email nhận VAT: {value(order.company_email)}</li>
</ul> */}
</div></section>) : null}

    </section><aside className="done-sidebar"><section className="side-card"><h2>QUY TRÌNH XỬ LÝ</h2>{processSteps.map(([icon, title, text]) => <div className="side-process" key={title}><i>{icon}</i><div><b>{title}</b><span>{text}</span></div></div>)}</section><section className="side-card promise"><h2>♢ CAM KẾT CỦA CHÚNG TÔI</h2><span>● Kết nối đến nhiều nhà xe uy tín</span><span>● Báo giá nhanh trong 15 – 30 phút</span><span>● Thông tin của bạn được bảo mật tuyệt đối</span><span>● Hỗ trợ 24/7 trong suốt hành trình</span></section><section className="side-card note"><h2>♧ LƯU Ý</h2><p>Nhà xe sẽ chủ động liên hệ qua các kênh bạn đã chọn. Vui lòng kiểm tra tin nhắn từ người lạ (đặc biệt là Zalo) để nhận báo giá nhanh chóng.</p></section><section className="side-card support"><h2>♧ HỖ TRỢ 24/7</h2><p>Gặp khó khăn? Chúng tôi luôn sẵn sàng hỗ trợ bạn.</p><strong>☎ &nbsp; 0941.205.485</strong><small>(8:00 – 22:00 mỗi ngày)</small></section></aside></main>
    {qrSrc && <div className="done-qr"><img src={qrSrc} alt="QR code link đơn thuê xe"/><span>Quét mã QR để lưu / truy cập nhanh<br/><small>https://thuexededang.com/bus-rental-done/{random_code}</small></span></div>}
          {cmsToken && (
        <div className="alert alert-warning mt-4" style={{borderLeft:'4px solid #f59e0b'}}>
          <b>Dành cho nhân viên</b>
          <div className="mt-2">
            <button
              className="btn btn-sm btn-primary me-2"
              disabled={resendStatus === 'sending'}
              onClick={async () => {
                setResendStatus('sending');
                setResendMsg('');
                try {
                  const res = await fetch(`/api/bus_rental.php?action=resend_mail&random_code=${encodeURIComponent(random_code)}`, {
                    method: 'POST',
                    headers: { 'Authorization': 'Bearer ' + cmsToken }
                  });
                  const j = await res.json();
                  if (j.status === 'success') { setResendStatus('ok'); setResendMsg('Đã gửi email thành công!'); }
                  else { setResendStatus('error'); setResendMsg(j.message || 'Gửi thất bại'); }
                } catch (e) {
                  setResendStatus('error'); setResendMsg('Lỗi kết nối');
                }
              }}
            >
              {resendStatus === 'sending' ? 'Đang gửi...' : '📧 Gửi lại email cho khách'}
            </button>
            {resendStatus === 'ok'    && <span className="text-success ms-2">{resendMsg}</span>}
            {resendStatus === 'error' && <span className="text-danger ms-2">{resendMsg}</span>}
          </div>
          <div className="mt-3">
            <b>Mẫu Zalo:</b>
            <div className="d-flex align-items-start gap-2 mt-1">
              <textarea
                readOnly
                rows={2}
                style={{flex:1, resize:'none', fontFamily:'inherit', fontSize:'14px'}}
                value={`Đơn hàng của quý khách được cập nhật tại link: https://thuexededang.com/bus-rental-done/${random_code}`}
              />
              {/* <button className="btn btn-sm btn-outline-secondary" onClick={() => navigator.clipboard.writeText(`Đơn hàng của quý khách được cập nhật tại link: https://thuexededang.com/bus-rental-done/${random_code}`)}>
                Copy
              </button> */}
            </div>
          </div>
          <div className="mt-3">
            <b>Mẫu SMS:</b>
            <div className="d-flex align-items-start gap-2 mt-1">
              <textarea
                readOnly
                rows={2}
                style={{flex:1, resize:'none', fontFamily:'inherit', fontSize:'14px'}}
                value={`Don hang cua quy khach duoc cap nhat tai link: https://thuexededang.com/bus-rental-done/${random_code}`}
              />
              {/* <button className="btn btn-sm btn-outline-secondary" onClick={() => navigator.clipboard.writeText(`Don hang cua quy khach duoc cap nhat tai link: ${window.location.href}`)}>
                Copy
              </button> */}
            </div>
          </div>
        </div>
      )}
    {/* <RecentRentalQuotes /> */}
    {lightboxOpen && (
      <LightBox
        images={lightboxImages}
        currentIndex={lightboxIndex}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex(i => (i - 1 + lightboxImages.length) % lightboxImages.length)}
        onNext={(idx) => {
          if (typeof idx === 'number') setLightboxIndex(idx);
          else setLightboxIndex(i => (i + 1) % lightboxImages.length);
        }}
      />
    )}
  </div>;
}
export default BusRentalDone;
