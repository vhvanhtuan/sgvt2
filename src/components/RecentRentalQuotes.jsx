import React, { useEffect, useRef, useState } from 'react';
import { formatNumber } from '../utils/formatNumber';

function formatMoney(value) {
  const raw = String(value ?? '').replace(/[^0-9]/g, '');
  if (!raw) return 'Liên hệ';
  return formatNumber(Number(raw)) + ' VND';
}

function yesNo(value) {
  if (String(value) === '1') {
    return <span className="text-danger fw-bold">Có</span>;
  }
  return 'Không';
}

function formatCount(value) {
  const num = Number(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) && num !== 0 ? formatNumber(num) : '0';
}

export default function RecentRentalQuotes({ apiBase = '/api', title = 'Báo giá các Hợp đồng thuê gần đây' }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetch(`${apiBase}/bus_rental.php?action=bao_gia_gan_day`)
      .then(res => res.json())
      .then(res => {
        if (!mounted) return;
        setItems(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setItems([]);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [apiBase]);

  if (loading) return null;
  if (!items.length) return null;

  const scrollTrack = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector('.recent-rental-quotes__card');
    const cardWidth = firstCard ? firstCard.getBoundingClientRect().width : 320;
    const gap = 14;
    track.scrollBy({ left: direction * (cardWidth + gap) * 1.02, behavior: 'smooth' });
  };

  return (
    <section className="recent-rental-quotes mt-5">
      <div className="recent-rental-quotes__header">
        <h3>{title}</h3>
        <div className="recent-rental-quotes__nav">
          <button type="button" className="recent-rental-quotes__nav-btn" onClick={() => scrollTrack(-1)} aria-label="Xem card trước">‹</button>
          <button type="button" className="recent-rental-quotes__nav-btn" onClick={() => scrollTrack(1)} aria-label="Xem card tiếp">›</button>
        </div>
      </div>
      <div className="recent-rental-quotes__track" ref={trackRef}>
        {items.map((item, index) => (
          <article key={`${item.bus_type_id || 'quote'}-${index}`} className="recent-rental-quotes__card">
            <div className="recent-rental-quotes__card-top">
              <span className="recent-rental-quotes__badge">#{index + 1}</span>
              <strong>{item.bus_type_id || 'Chưa rõ loại xe'}</strong>
            </div>
            <div className="recent-rental-quotes__route">{item.road_trip || 'Chưa có tuyến đường'}</div>
            <dl className="recent-rental-quotes__meta">
              <div><dt>Giá báo</dt><dd>{formatMoney(item.vnd_bao_khach)}</dd></div>
              <div><dt>Tổng km</dt><dd>{item.tong_km ? formatNumber(Number(item.tong_km)) : '0'}</dd></div>
              <div><dt>Phí cầu đường</dt><dd>{formatMoney(item.phi_cau_duong)}</dd></div>
              <div><dt>Số ngày</dt><dd>{formatCount(item.days)}</dd></div>
              <div><dt>SL xe</dt><dd>{formatCount(item.bus_count)}</dd></div>
              <div><dt>VAT</dt><dd>{yesNo(item.is_vat_final)}</dd></div>
              <div><dt>Tài xế tự túc</dt><dd>{yesNo(item.wish_tai_xe_tu_tuc_final)}</dd></div>
            </dl>
            {item.reply_notes ? (
              <div className="recent-rental-quotes__notes">
                <span>Ghi chú</span>
                <p>{item.reply_notes}</p>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}