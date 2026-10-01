import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { formatNumber } from '../utils/formatNumber';
import { buildTourRoute } from '../utils/routeHelpers';

import './TourList.css';

const PAGE_SIZE = 12;

function normalizeStr(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

function getRouteFilterIds(pathname) {
  const match = (pathname || '').match(/\/nhom-tour\/.*?-(g|z)-(\d+)\.html$/i);
  if (!match) return { zone: '', group: '' };

  const type = (match[1] || '').toLowerCase();
  const id = match[2] || '';

  return type === 'g' ? { zone: '', group: id } : { zone: id, group: '' };
}

function TourList() {
  const [allTours, setAllTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [keyword, setKeyword] = useState('');
  const [inputVal, setInputVal] = useState('');
  const [filterZone, setFilterZone] = useState('');
  const [filterGroup, setFilterGroup] = useState('');

  // Dropdown data
  const [zones, setZones] = useState([]);
  const [groups, setGroups] = useState([]);

  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Load zones & groups once
  useEffect(() => {
    fetch('/api/zones.php').then(r => r.json()).then(r => setZones(r.data || []));
    fetch('/api/groups.php').then(r => r.json()).then(r => setGroups(r.data || []));
  }, []);

  // Load tours (all, no server filter) once
  useEffect(() => {
    setLoading(true);
    fetch('/api/tours.php')
      .then(r => r.json())
      .then(r => {
        setAllTours(r.data || []);
        setLoading(false);
      });
  }, []);

  // Sync filters with URL params whenever the route/search query changes
  useEffect(() => {
    const routeIds = getRouteFilterIds(location.pathname);
    const nextZone = routeIds.zone || searchParams.get('zone') || '';
    const nextGroup = routeIds.group || searchParams.get('group') || '';

    setFilterZone(nextZone);
    setFilterGroup(nextGroup);
    setCurrentPage(1);
  }, [location.pathname, searchParams]);

  // When zone changes, reset group if it no longer belongs to new zone
  const handleZoneChange = (zid) => {
    setFilterZone(zid);
    if (zid) {
      const groupsInZone = groups.filter(g => String(g.zone_id) === String(zid));
      const stillValid = groupsInZone.some(g => String(g.group_id) === String(filterGroup));
      if (!stillValid) setFilterGroup('');
    }
    setCurrentPage(1);
  };

  const handleGroupChange = (gid) => {
    setFilterGroup(gid);
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setKeyword(inputVal.trim());
    setCurrentPage(1);
  };

  const handleClear = () => {
    setKeyword(''); setInputVal('');
    setFilterZone(''); setFilterGroup('');
    setCurrentPage(1);
  };

  // Derive groups dropdown: if zone selected, only show groups in that zone
  const groupsForDropdown = filterZone
    ? groups.filter(g => String(g.zone_id) === String(filterZone))
    : groups;

  // Client-side filter
  const filteredTours = allTours.filter(tour => {
    if (filterZone  && String(tour.zone_id)  !== String(filterZone))  return false;
    if (filterGroup && String(tour.group_id) !== String(filterGroup)) return false;
    if (keyword) {
      const kw = normalizeStr(keyword);
      if (!normalizeStr(tour.name).includes(kw)) return false;
    }
    return true;
  });

  const photoFolder = 'https://dulichreal.com/upload/images/';

  const totalPages = Math.ceil(filteredTours.length / PAGE_SIZE);
  const pageTours  = filteredTours.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildPageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    if (currentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (currentPage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  const hasFilter = keyword || filterZone || filterGroup;

  return (
    <>
      {/* ── Bộ lọc / Tìm tour ── */}
      <div className="tourlist-filter-bar">
        <form className="tourlist-search-form" onSubmit={handleSearch}>
          <div className="input-group tourlist-keyword-group">
            <span className="input-group-text"><i className="fa fa-search"></i></span>
            <input
              type="text"
              className="form-control"
              placeholder="Tìm tên tour…"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">Tìm</button>
          </div>
        </form>

        <div className="tourlist-dropdowns">
          {/* Khu vực */}
          <select
            className="form-select tourlist-select"
            value={filterZone}
            onChange={e => handleZoneChange(e.target.value)}
            aria-label="Khu vực"
          >
            <option value="">-- Tất cả khu vực --</option>
            {zones.map(z => (
              <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
            ))}
          </select>

          {/* Nhóm tour */}
          <select
            className="form-select tourlist-select"
            value={filterGroup}
            onChange={e => handleGroupChange(e.target.value)}
            aria-label="Nhóm tour"
          >
            <option value="">-- Tất cả nhóm tour --</option>
            {groupsForDropdown.map(g => (
              <option key={g.group_id} value={g.group_id}>{g.name}</option>
            ))}
          </select>
        </div>

        {hasFilter && (
          <button className="btn btn-outline-secondary btn-sm tourlist-clear-btn" onClick={handleClear}>
            <i className="fa fa-times me-1"></i>Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Kết quả */}
      {!loading && hasFilter && (
        <p className="tourlist-result-count">
          Tìm thấy <strong>{filteredTours.length}</strong> tour
          {keyword && <> khớp "<em>{keyword}</em>"</>}
        </p>
      )}

      {loading ? (
        <div className="tourlist-loading">Đang tải danh sách tour...</div>
      ) : (
        <div className="tourlist-page row g-4">
          {pageTours.length === 0 ? (
            <div className="col-12 text-center text-muted py-5">
              <i className="fa fa-search fa-2x mb-2 d-block"></i>
              Không tìm thấy tour phù hợp.
            </div>
          ) : pageTours.map(tour => {
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
      )}

      {totalPages > 1 && (
        <nav className="tourlist-pagination" aria-label="Phân trang">
          <ul className="pagination justify-content-center mt-4 flex-wrap">
            <li className={`page-item${currentPage === 1 ? ' disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage - 1)} aria-label="Trang trước">&laquo;</button>
            </li>
            {buildPageNums().map((p, i) =>
              p === '...'
                ? <li key={`ellipsis-${i}`} className="page-item disabled"><span className="page-link">…</span></li>
                : <li key={p} className={`page-item${p === currentPage ? ' active' : ''}`}>
                    <button className="page-link" onClick={() => handlePageChange(p)}>{p}</button>
                  </li>
            )}
            <li className={`page-item${currentPage === totalPages ? ' disabled' : ''}`}>
              <button className="page-link" onClick={() => handlePageChange(currentPage + 1)} aria-label="Trang sau">&raquo;</button>
            </li>
          </ul>
          <p className="text-center text-muted small mt-1">
            Trang {currentPage}/{totalPages} &mdash; {filteredTours.length} tour
          </p>
        </nav>
      )}
    </>
  );
}

export default TourList;
