import React from 'react';
import { Link } from 'react-router-dom';

export default function SiteMap() {
  return (
    <div className="container py-4">
      <h1>Sơ đồ website</h1>
      <ul style={{fontSize:'1.1rem',lineHeight:'2'}}>
        <li><Link to="/">Trang chủ</Link></li>
        <li><Link to="/thue-xe">Thuê xe du lịch</Link></li>
        <li><Link to="/danh-sach-tour">Danh sách tour</Link></li>
        <li><Link to="/lich-khoi-hanh">Lịch khởi hành</Link></li>
        <li><Link to="/mua-ve">Mua vé xe tuyến</Link></li>
        <li><Link to="/lien-he">Liên hệ</Link></li>
        <li><Link to="/so-do-website">Sơ đồ website</Link></li>
      </ul>
      <h3>Hỗ trợ khách hàng</h3>
      <ul>
        <li>Hotline: <a href="tel:0941205485">0941 205 485</a></li>
        <li>Email: <a href="mailto:admin.thuexededang@gmail.com">admin.thuexededang@gmail.com</a></li>
      </ul>
    </div>
  );
}
