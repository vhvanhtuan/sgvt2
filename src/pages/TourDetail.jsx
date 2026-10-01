import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import './TourDetail.css';
import LightBox from '../components/LightBox';
import '@fortawesome/fontawesome-free/css/all.min.css';
import { formatNumber } from '../utils/formatNumber';
import { buildGroupRoute, buildZoneRoute } from '../utils/routeHelpers';

function TourDetail(props) {
  // Cho phép truyền id qua props (ưu tiên props.id nếu có)
  let params = useParams();
  const id = props.id || params.id;
  const [tour, setTour] = useState(null);
  const [prices, setPrices] = useState([]);
  const [deps, setDeps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('content');
  // Xóa modal booking, chỉ dùng route
  const photoFolder = 'https://dulichreal.com/upload/images/';
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Danh sách ảnh địa danh
  const placeImages = tour?.places?.map(place =>
    place.place_photo_url
      ? (place.place_photo_url.startsWith('http')||place.place_photo_url.startsWith('/public/uploads/') ? place.place_photo_url : photoFolder + place.place_photo_url)
      : '/no-image.jpg'
  ) || [];

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/tours.php?id=${id}`).then(res => res.json()),
      fetch(`/api/tours.php?action=prices&tour_id=${id}`).then(res => res.json()),
      fetch(`/api/departures.php?tour_id=${id}`).then(res => res.json())
    ]).then(([tourRes, pricesRes, depsRes]) => {
      setTour(tourRes.data || null);
      setPrices(pricesRes.data || []);
      setDeps(depsRes.data || []);
      setLoading(false);
    });
  }, [id]);

  // Xác định avatar ưu tiên: avatar_url, nếu không có thì lấy hình của địa danh đầu tiên
  let avatar = null;
  if (tour?.avatar_url) {
    avatar = (tour.avatar_url.startsWith('http')||tour.avatar_url.startsWith('/public/uploads/'))
      ? tour.avatar_url
      : photoFolder + tour.avatar_url;
  } else if (tour?.places && tour.places.length > 0) {
    const firstPlace = tour.places[0];
    if (firstPlace.place_photo_url) {
      avatar = firstPlace.place_photo_url.startsWith('http')
        ? firstPlace.place_photo_url
        : photoFolder + firstPlace.place_photo_url;
    }
  }

  const cleanRepeatedHtml = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';

    const normalized = raw.replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    // Bỏ trường hợp chuỗi HTML hoặc text lặp nguyên khối ở cuối
    const repeated = normalized.match(/^(.*?)(?:\s*\1)+$/s);
    if (repeated && repeated[1]) {
      return repeated[1].trim();
    }

    try {
      const container = document.createElement('div');
      container.innerHTML = raw;
      const nodes = Array.from(container.childNodes).filter(node => {
        if (node.nodeType === 3) return String(node.textContent || '').trim() !== '';
        return node.nodeType === 1;
      });

      const deduped = [];
      const normalizeHtmlSignature = (text) => String(text || '').replace(/\s+/g, ' ').trim().toLowerCase();

      for (const node of nodes) {
        const html = node.outerHTML || node.textContent || '';
        const sig = normalizeHtmlSignature(html);
        if (!sig) continue;

        const prev = deduped[deduped.length - 1];
        const prevSig = prev ? normalizeHtmlSignature(prev.outerHTML || prev.textContent || '') : '';
        if (prevSig && prevSig === sig) continue;

        deduped.push(node);
      }

      if (deduped.length !== nodes.length) {
        return deduped.map(node => node.outerHTML || node.textContent || '').join('');
      }
    } catch (e) {
      // ignore and fallback to raw HTML
    }

    return raw;
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'intro':
        return <div dangerouslySetInnerHTML={{ __html: cleanRepeatedHtml(tour.intro || tour.description || '') }} />;
      case 'content':
        return <div dangerouslySetInnerHTML={{ __html: cleanRepeatedHtml(tour.content || '') }} />;
      case 'outtro':
        return <div dangerouslySetInnerHTML={{ __html: cleanRepeatedHtml(tour.outtro || '') }} />;
      case 'places':
        return (
          <div>
            <h2>Hình ảnh các địa danh tour đi qua</h2>
            <div className="tour-detail__places-photos" style={{display:'flex',flexWrap:'wrap',gap:16}}>
              {tour.places && tour.places.length > 0 ? (
                tour.places.map((place, idx) => {
                  const imgUrl = place.place_photo_url
                    ? ((place.place_photo_url.startsWith('http')||place.place_photo_url.startsWith('/public/uploads/')) ? place.place_photo_url : photoFolder + place.place_photo_url)
                    : '/no-image.jpg';
                  return (
                    <div key={idx} style={{width:220,marginBottom:16,textAlign:'center'}}>
                      <div style={{border:'1px solid #eee',borderRadius:8,overflow:'hidden',background:'#fafafa',cursor:'pointer'}}
                        onClick={() => { setLightboxIndex(idx); setLightboxOpen(true); }}>
                        <img
                          src={imgUrl}
                          alt={place.name}
                          style={{width:'100%',height:140,objectFit:'cover',transition:'transform 0.2s'}}
                        />
                      </div>
                      <div style={{marginTop:8,fontWeight:500}}>{place.name}</div>
                    </div>
                  );
                })
              ) : (
                <div>Chưa có dữ liệu hình ảnh địa danh cho tour này.</div>
              )}
            </div>
            {lightboxOpen && (
              <LightBox
                images={placeImages}
                currentIndex={lightboxIndex}
                onClose={() => setLightboxOpen(false)}
                onPrev={() => setLightboxIndex(idx => (idx - 1 + placeImages.length) % placeImages.length)}
                onNext={idx => {
                  if (typeof idx === 'number') setLightboxIndex(idx);
                  else setLightboxIndex(i => (i + 1) % placeImages.length);
                }}
              />
            )}
          </div>
        );
      case 'deps':
        return (
          <div>
            <div>
              <h2>Giá tour</h2>
              <table className="tourdetail-deps">
                <thead>
                  <tr>
                    <th>Tuổi từ</th>
                    <th>Đến</th>
                    <th>Giá vé</th>
                    <th>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {prices.length === 0 && <tr><td colSpan={4}>Chưa có giá tour</td></tr>}
                  {prices.map(price => (
                    <tr key={price.pax_age_id}>
                      <td>{price.age_gtoe <= 0 ? 'mới sinh' : price.age_gtoe}</td>
                      <td>{price.age_ltoe > 12 ? 'trở lên' : price.age_ltoe}</td>
                      <td>{formatNumber(price.tour_price) || ''} đ</td>
                      <td>{price.notes || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2>Giá tour và lịch khởi hành</h2>
            <table className="tour-detail__deps">
              <thead>
                <tr>
                  <th>Ngày khởi hành</th>
                  <th>Ngày về</th>
                  <th>Giá</th>
                  <th>Ghi chú</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {deps.length === 0 && <tr><td colSpan={4}>Chưa có lịch khởi hành</td></tr>}
                {deps.map(dep => (
                  <tr key={dep.dep_id}>
                    <td>{dep.dep_date_dmy}</td>
                    <td>{dep.dep_end_dmy}</td>
                    <td>{formatNumber(dep.price) || formatNumber(tour.market_price) || ''} đ</td>
                    <td>{dep.dep_note || ''}</td>
                    <td>
                      <Link className="btn btn-primary btn-sm" to={`/booking?tour_id=${id}&dep_date=${dep.dep_date}`}>Đặt tour</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return <div dangerouslySetInnerHTML={{ __html: cleanRepeatedHtml(tour.content || '') }} />;
    }
  };

  if (loading) return <div className="tour-detail--loading">Đang tải chi tiết tour...</div>;
  if (!tour) return <div className="tour-detail--error">Không tìm thấy tour.</div>;

  return (
    <div className="tour-detail">
      {/* Banner lấy từ thư mục public, ví dụ banner.jpg */}
      <div className="tour-detail__banner">
        <img src="/banner.jpg" alt="Banner" style={{ width: '100%', maxHeight: 300, objectFit: 'cover' }} />
      </div>
      <div className="tour-detail__header">
        <h1>{tour.name}</h1>
        <div className="tour-detail__meta">
          <span>{tour.days || 0} ngày {tour.nights || 0} đêm</span>
          <span>Giá: <b className="tour-price">{formatNumber(tour.market_price)} đ</b></span>
        </div>
        <div className="tour-detail__meta--secondary mt-2">
          <span>
            Nhóm tour: <b>
              <Link to={buildGroupRoute({ group_id: tour.group_id, name: tour.group_name })} style={{color:'#1976d2',textDecoration:'underline'}}>{tour.group_name}</Link>
            </b>
          </span>
          <span>
            Khu vực: <b>
              <Link to={buildZoneRoute({ zone_id: tour.zone_id, zone_name: tour.zone_name })} style={{color:'#1976d2',textDecoration:'underline'}}>{tour.zone_name}</Link>
            </b>
          </span>
        </div>
      </div>
      <div className="tour-detail__main">
        <div className="tour-detail__img">
          <img src={avatar || '/no-image.jpg'} alt={tour.name} />
        </div>
        <div className="tour-detail__info">
          <div className="tourdetail-tabs">
            <div className={tab === 'intro' ? 'tour-detail__tab active' : 'tour-detail__tab'} onClick={() => setTab('intro')}>Giới thiệu</div>
            <div className={tab === 'content' ? 'tour-detail__tab active' : 'tour-detail__tab'} onClick={() => setTab('content')}>Chương trình tour</div>
            <div className={tab === 'outtro' ? 'tour-detail__tab active' : 'tour-detail__tab'} onClick={() => setTab('outtro')}>Điều khoản</div>
            <div className={tab === 'places' ? 'tour-detail__tab active' : 'tour-detail__tab'} onClick={() => setTab('places')}>Hình ảnh</div>
            <div className={tab === 'deps' ? 'tour-detail__tab active' : 'tour-detail__tab'} onClick={() => setTab('deps')}>Giá tour và lịch khởi hành</div>
          </div>
          <div className="tour-detail__tabpanel">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TourDetail;
