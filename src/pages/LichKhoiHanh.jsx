import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../utils/formatNumber';
import { buildTourRoute } from '../utils/routeHelpers';
import './LichKhoiHanh.css';



function LichKhoiHanh() {
  const [deps, setDeps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zones, setZones] = useState([]);
  const [groups, setGroups] = useState([]);
  const [filters, setFilters] = useState({ zone: '', group: '', date: '' });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 30;

  useEffect(() => {
    fetch('/api/zones.php').then(res => res.json()).then(res => setZones(res.data || []));
  }, []);

  // Load group theo zone
  useEffect(() => {
    let url = '/api/groups.php';
    if (filters.zone) url += `?zone_id=${filters.zone}`;
    fetch(url).then(res => res.json()).then(res => setGroups(res.data || []));
    setFilters(f => ({ ...f, group: '' }));
    // eslint-disable-next-line
  }, [filters.zone]);

  useEffect(() => {
    setLoading(true);
    let url = '/api/departures.php';
    const params = [];
    if (filters.zone) params.push(`zone_id=${filters.zone}`);
    if (filters.group) params.push(`group_id=${filters.group}`);
    if (filters.date) params.push(`date=${filters.date}`);
    params.push(`page=${page}`);
    params.push(`limit=${limit}`);
    if (params.length) url += '?' + params.join('&');
    fetch(url)
      .then(res => res.json())
      .then(res => {
        setDeps(res.data || []);
        setTotal(res.total || 0);
        setLoading(false);
      });
  }, [filters, page]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setFilters(f => ({ ...f })); // Đã cập nhật qua onChange
  };

  const totalPages = Math.ceil(total / limit);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) setPage(newPage);
  };

  return (
    <div className="lichkhoihanh-page">
      <h1>Lịch khởi hành</h1>
      <div className="lichkhoihanh-desc">
        Quý khách có thể xem và tải lịch khởi hành mới nhất hoặc liên hệ để được hỗ trợ.
      </div>
      <div className="lichkhoihanh-downloads">
        <a href="/upload/docs/lkh-quoc-te-2501.xlsx" target="_blank" rel="noopener noreferrer">Download LKH Quốc tế</a> |
        <a href="/upload/docs/lkh-trong-nuoc-2501.xlsx" target="_blank" rel="noopener noreferrer">Download LKH Nội địa</a>
      </div>
      {/* Bộ lọc */}
      <form className="lichkhoihanh-filter d-flex flex-wrap gap-2 mb-3" onSubmit={handleSubmit} style={{alignItems:'center'}}>
        <select name="zone" value={filters.zone} onChange={handleFilterChange} className="form-select" style={{maxWidth:180}}>
          <option value="">-- Khu vực --</option>
          {zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
        </select>
        <select name="group" value={filters.group} onChange={handleFilterChange} className="form-select" style={{maxWidth:180}}>
          <option value="">-- Nhóm tour --</option>
          {groups.map(g => <option key={g.group_id} value={g.group_id}>{g.name}</option>)}
        </select>
        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="form-control" style={{maxWidth:180}} />
        <button type="submit" className="btn btn-primary">Tìm</button>
      </form>
      <div className="lichkhoihanh-table-wrap">
        {loading ? (
          <div>Đang tải dữ liệu...</div>
        ) : (
          <>
          <table className="lichkhoihanh-table">
            <thead>
              <tr>
                <th>Ngày khởi hành</th>
                <th>Ngày về</th>
                <th>Tour</th>
                <th>Giá</th>
                <th>Đặt tour</th>
              </tr>
            </thead>
            <tbody>
              {deps.length === 0 && (
                <tr><td colSpan={5}>Chưa có lịch khởi hành</td></tr>
              )}
              {deps.map(dep => (
                <tr key={dep.dep_id}>
                  <td>{dep.dep_date_dmy}</td>
                  <td>{dep.dep_end_dmy}</td>
                  <td>
                    <Link to={buildTourRoute({ tour_id: dep.tour_id, name: dep.tour_name })}>
                      {dep.tour_name}
                    </Link>
                  </td>
                  <td>{formatNumber(dep.tour_price || dep.price) || ''} đ</td>
                  <td>
                      <Link
                        to={`/booking?tour_id=${dep.tour_id}&dep_date=${dep.dep_date}`}
                        className="btn btn-success btn-sm"
                      >
                        Đặt tour
                      </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="pagination mt-3 d-flex gap-2 align-items-center">
              <button className="btn btn-outline-secondary btn-sm" disabled={page === 1} onClick={()=>handlePageChange(page-1)}>Trước</button>
              <span>Trang {page} / {totalPages}</span>
              <button className="btn btn-outline-secondary btn-sm" disabled={page === totalPages} onClick={()=>handlePageChange(page+1)}>Sau</button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
}

export default LichKhoiHanh;
