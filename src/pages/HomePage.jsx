import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import { formatNumber } from '../utils/formatNumber';
import { buildGroupRoute, buildTourRoute } from '../utils/routeHelpers';

function HomePage() {
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || `${process.env.PUBLIC_URL || ''}/api`).replace(/\/+$/, '');
  const [tours, setTours] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    const parseJsonSafe = async (res, fallbackMessage) => {
      const text = await res.text();
      if (!text || !text.trim()) {
        throw new Error(fallbackMessage);
      }
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error(fallbackMessage);
      }
    };

    Promise.all([
      fetch(`${API_BASE}/tours.php`).then(async res => {
        const json = await parseJsonSafe(res, 'API tours trả về dữ liệu không hợp lệ');
        if (!res.ok) throw new Error(json?.message || 'Không tải được danh sách tour');
        return json;
      }),
      fetch(`${API_BASE}/groups.php`).then(async res => {
        const json = await parseJsonSafe(res, 'API groups trả về dữ liệu không hợp lệ');
        if (!res.ok) throw new Error(json?.message || 'Không tải được danh sách nhóm tour');
        return json;
      })
    ])
      .then(([toursRes, groupsRes]) => {
        if (!mounted) return;
        setTours(toursRes.data || []);
        setGroups(groupsRes.data || []);
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        setTours([]);
        setGroups([]);
        setError(err?.message || 'Không thể tải dữ liệu trang chủ');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  if (loading) return <div className="homepage-loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="homepage-loading">{error}</div>;

  // Tour hot: pinned=1
  const hotTours = tours.filter(t => t.pinned === 1 || t.pinned === '1');
  // Nhóm tour hot: pinned=1
  const hotGroups = groups.filter(g => g.pinned === 1 || g.pinned === '1');
  const photoFolder = 'https://dulichreal.com/upload/images/';

  return (
    <div className="homepage">
      <section className="banner text-center py-4 mb-4 bg-light rounded">
        <h1 className="display-5 fw-bold mb-2">Khám phá hành trình tuyệt vời cùng Du Lịch Real</h1>
        <p className="lead">Tour đa dạng, giá tốt, dịch vụ chuyên nghiệp</p>
      </section>

      <section className="hot-tours-section mb-5">
        <h2 className="mb-4">Tour Hot</h2>
        <div className="row g-4">
          {hotTours.length === 0 && <div>Không có tour hot.</div>}
          {hotTours.map(tour => {
            let imgUrl = '/no-image.jpg';
            if (tour.place_photo_url) {
              imgUrl = (tour.place_photo_url.startsWith('http')||tour.place_photo_url.startsWith('/public/uploads/')) ? tour.place_photo_url : photoFolder + tour.place_photo_url;
            }
            return (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={tour.tour_id}>
                <div className="card h-100 shadow-sm">
                  <Link to={buildTourRoute(tour)}><img src={imgUrl} alt={tour.name} className="card-img-top" style={{height:180,objectFit:'cover'}} /></Link>
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title">{tour.name}</h5>
                    <p className="card-text mb-1">{tour.days || 0} ngày {tour.nights || 0} đêm</p>
                    <p className="card-text text-danger fw-bold mb-2">Giá: {formatNumber(tour.market_price)} đ</p>
                    {tour.min_dep_date_dmy && (
                      <p className="card-text mb-2">Khởi hành: <span className="text-success">{tour.min_dep_date_dmy}</span></p>
                    )}
                    <Link to={buildTourRoute(tour)} className="btn btn-outline-primary mt-auto"><i className="fa fa-search me-2"></i>Xem chi tiết</Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="hot-groups-section mb-5">
        <h2 className="mb-4">Nhóm tour Hot</h2>
        <div className="row g-4">
          {hotGroups.length === 0 && <div>Không có nhóm tour hot.</div>}
          {hotGroups.map(group => (
            <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={group.group_id}>
              <Link to={buildGroupRoute(group)} className="card group-card h-100 shadow-sm p-3 text-decoration-none text-dark">
                <h5 className="mb-2">{group.name}</h5>
                <p>{group.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
