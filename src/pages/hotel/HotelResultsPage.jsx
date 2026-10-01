import React, { useEffect, useMemo, useState } from 'react';
import { Link, createSearchParams, useNavigate, useSearchParams } from 'react-router-dom';
import './HotelService.css';
import { fetchHotelCatalog, formatHotelPrice, HOTEL_BUDGETS, HOTEL_STAY_STYLES, HOTEL_STAR_OPTIONS, getHotelPrimaryImage } from './hotelData';

function HotelResultsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    keyword: searchParams.get('keyword') || searchParams.get('destination') || '',
    destination: searchParams.get('destination') || '',
    budget: searchParams.get('budget') || 'all',
    stars: searchParams.get('stars') || 'all',
    style: searchParams.get('style') || '',
  });

  useEffect(() => {
    setFilters({
      keyword: searchParams.get('keyword') || searchParams.get('destination') || '',
      destination: searchParams.get('destination') || '',
      budget: searchParams.get('budget') || 'all',
      stars: searchParams.get('stars') || 'all',
      style: searchParams.get('style') || '',
    });
  }, [searchParams]);

  useEffect(() => {
    const checkIn = searchParams.get('checkIn') || '';
    const checkOut = searchParams.get('checkOut') || '';
    const rooms = searchParams.get('rooms') || '1';
    const guests = searchParams.get('guests') || '2';
    const keyword = searchParams.get('keyword') || '';
    const hotelSearchParams = { checkIn, checkOut, rooms, guests, keyword };

    try {
      localStorage.setItem('hotelSearchParams', JSON.stringify(hotelSearchParams));
    } catch (error) {
      console.error('Không thể lưu hotelSearchParams:', error);
    }
  }, [searchParams]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchHotelCatalog(filters)
      .then((rows) => {
        if (!alive) return;
        setHotels(rows || []);
      })
      .finally(() => {
        if (!alive) return;
        setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [filters]);

  const filteredHotels = useMemo(() => hotels, [hotels]);

  const updateQuery = (nextFilters) => {
    navigate({
      pathname: '/hotel/ket-qua',
      search: createSearchParams({
        keyword: nextFilters.keyword || '',
        destination: nextFilters.destination || '',
        budget: nextFilters.budget || 'all',
        stars: nextFilters.stars || 'all',
        style: nextFilters.style || '',
      }).toString(),
    }, { replace: true });
  };

  const handleChange = (field, value) => {
    const nextFilters = { ...filters, [field]: value };
    setFilters(nextFilters);
    updateQuery(nextFilters);
  };

  const handleReset = () => {
    const nextFilters = { keyword: '', destination: '', budget: 'all', stars: 'all', style: '' };
    setFilters(nextFilters);
    updateQuery(nextFilters);
  };

  return (
    <div className="hotel-service">
      <div className="hotel-shell py-3 py-lg-4">
        <div className="hotel-summary-bar">
          <div>
            <div className="hotel-note mb-1">
              <Link to="/">Trang chủ</Link> / Khách sạn
            </div>
            <div className="hotel-section-title mb-1">Khách sạn {filters.destination || 'Đà Lạt'}</div>
            <div className="hotel-section-subtitle">{filteredHotels.length} khách sạn phù hợp</div>
          </div>
          <Link to="/hotel" className="hotel-cta hotel-cta--ghost">Quay lại tìm kiếm</Link>
        </div>

        <div className="hotel-search-card mb-4" style={{ marginTop: 0 }}>
          <form className="hotel-search-grid" onSubmit={(event) => { event.preventDefault(); updateQuery(filters); }}>
            <div className="hotel-field">
              <label>Từ khóa</label>
              <input value={filters.keyword} onChange={(event) => handleChange('keyword', event.target.value)} placeholder="Tên khách sạn, điểm đến" />
            </div>
            <div className="hotel-field">
              <label>Điểm đến</label>
              <input value={filters.destination} onChange={(event) => handleChange('destination', event.target.value)} placeholder="Đà Lạt, Phú Quốc..." />
            </div>
            <div className="hotel-field">
              <label>Mức giá</label>
              <select value={filters.budget} onChange={(event) => handleChange('budget', event.target.value)}>
                {HOTEL_BUDGETS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <div className="hotel-field">
              <label>Hạng sao</label>
              <select value={filters.stars} onChange={(event) => handleChange('stars', event.target.value)}>
                {HOTEL_STAR_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>
            <button className="hotel-search-button align-self-end" type="submit">Tìm kiếm</button>
          </form>
        </div>

        <div className="hotel-results-layout">
          <aside className="hotel-sidebar-panel">
            <div className="hotel-sidebar-title">Bộ lọc</div>
            <div className="hotel-filter-list">
              <div className="hotel-filter-chip">Khu vực <strong>{filters.destination || 'Tất cả'}</strong></div>
              <div className="hotel-filter-chip">Hạng sao <strong>{filters.stars === 'all' ? 'Tất cả' : `${filters.stars} sao`}</strong></div>
              <div className="hotel-filter-chip">Ngân sách <strong>{HOTEL_BUDGETS.find((item) => item.value === filters.budget)?.label || 'Mọi mức giá'}</strong></div>
              <div className="hotel-filter-chip">Phong cách <strong>{filters.style || 'Bất kỳ'}</strong></div>
            </div>

            <div className="mt-4 hotel-sidebar-title">Phong cách du lịch</div>
            <div className="hotel-filter-list">
              {HOTEL_STAY_STYLES.map((style) => (
                <button key={style} type="button" className="hotel-filter-chip text-start" onClick={() => handleChange('style', style)}>
                  {style}
                  <span>+</span>
                </button>
              ))}
            </div>

            <button type="button" className="hotel-cta hotel-cta--ghost w-100 mt-4" onClick={handleReset}>Xóa tất cả</button>
          </aside>

          <section className="hotel-results-list">
            {loading ? (
              <div className="hotel-surface p-4">Đang tải kết quả tìm khách sạn...</div>
            ) : filteredHotels.length === 0 ? (
              <div className="hotel-surface p-5 text-center text-muted">Không tìm thấy khách sạn phù hợp. Hãy thử mở rộng bộ lọc.</div>
            ) : filteredHotels.map((hotel) => (
              <article className="hotel-card hotel-result-card" key={hotel.hotel_id}>
                <div className="hotel-result-card__image" style={{ backgroundImage: `linear-gradient(180deg, rgba(16, 27, 41, 0.14), rgba(16, 27, 41, 0.38)), url(${getHotelPrimaryImage(hotel)})` }}>
                  <span className="hotel-badge--top">{hotel.deal_badge}</span>
                </div>
                <div className="hotel-result-card__content">
                  <div className="hotel-result-card__title">{hotel.name}</div>
                  <div className="hotel-rating mb-2">
                    <span className="hotel-rating__score">{hotel.rating}</span>
                    <span>Tuyệt vời ({hotel.reviews})</span>
                    <span>•</span>
                    <span>{hotel.address}</span>
                  </div>
                  <div className="hotel-tags">
                    {hotel.tags.slice(0, 4).map((tag) => <span className="hotel-tag" key={tag}>{tag}</span>)}
                  </div>
                  <div className="hotel-note mt-3">{hotel.highlights?.[0] || 'Có nhiều hạng phòng sẵn sàng đặt ngay.'}</div>
                </div>
                <div className="hotel-result-card__side">
                  <div>
                    <div className="hotel-result-card__price-label">{hotel.package_name}</div>
                    <div className="hotel-result-card__price">{formatHotelPrice(hotel.price)}</div>
                    <div className="hotel-old-price">{formatHotelPrice(hotel.old_price)}</div>
                    <div className="hotel-result-card__discount">{hotel.sale_badge}</div>
                    <div className="hotel-note mt-3">{hotel.meal}</div>
                  </div>
                  <Link className="hotel-cta" to={`/hotel/chi-tiet/${hotel.slug}`}>Xem phòng</Link>
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}

export default HotelResultsPage;
