import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';
import { fetchInfo } from '../utils/infoApi';
import { buildGroupRoute, buildZoneRoute } from '../utils/routeHelpers';



// Widget Social/Chat/Scroll
const WidgetBar = ({ info }) => {
  // Scroll lên đầu trang
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  useEffect(() => {
    // Giữ lại Tawk.to, tắt Facebook Messenger và Zalo chat widget
    if (!window.Tawk_API) {
      window.Tawk_API = window.Tawk_API || {};
      var s1 = document.createElement('script');
      s1.async = true;
      s1.src = 'https://embed.tawk.to/5b89352fafc2c34e96e81774/1f8u13sih';
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.body.appendChild(s1);
    }
  }, []);
  return (
    <div className="widget-bar">
      {info?.phone_number && (
        <a 
  href={`tel:${info.phone_number}`} 
  title={`Call us : ${info.phone_number}`} 
  className="widget-btn fb"
>
  <i className="fas fa-phone-alt me-1"></i>
</a>
      )}
      {info?.phone_number && (
        <a 
  href={`https://zalo.me/${info.phone_number}`} 
  title={`Zalo us : ${info.phone_number}`} 
  className="widget-btn fb zalo-facebook-icons"
    ><img src='/public/uploads/zalo.png' alt="Zalo" />
</a>
      )}
      {info?.facebook_url && (
        <a href={info.facebook_url} target="_blank" rel="noopener noreferrer" title="Facebook" className="widget-btn fb"><i className="fab fa-facebook-f"></i></a>
      )}
      {info?.youtube_url && (
        <a href={info.youtube_url} target="_blank" rel="noopener noreferrer" title="Youtube" className="widget-btn yt"><i className="fab fa-youtube"></i></a>
      )}
      <button type="button" onClick={scrollToTop} title="Lên đầu trang" className="widget-btn up" style={{background:'none',border:'none',padding:0}}><i className="fas fa-arrow-up"></i></button>
    </div>
  );
};


function Layout({ children }) {
  const [groups, setGroups] = useState([]);
  const [sub_menus, setSubMenus] = useState([]);
  const [zones, setZones] = useState([]);
  const [navOpen, setNavOpen] = useState(false);
  const [dropdown, setDropdown] = useState("");
  const [info, setInfo] = useState(null);
  const navRef = useRef();
  const location = useLocation();
  const isThueXeDeDangDomain = typeof window !== 'undefined' && /(^|\.)thuexededang\.com$/i.test(window.location.hostname || '');

  useEffect(() => {
    fetch('/api/groups.php').then(res => res.json()).then(res => {
      setGroups(res.data || []);
      setSubMenus(res.sub_menus || []);
    });
    fetch('/api/zones.php').then(res => res.json()).then(res => setZones(res.data || []));
    fetchInfo().then(setInfo);
    setNavOpen(false);
    setDropdown("");
  }, [location]);

  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setNavOpen(false);
        setDropdown("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="layout container-fluid p-0">
      <header className="homepage-header navbar navbar-expand-lg navbar-dark bg-primary px-3" ref={navRef}>
        <Link to="/" className="logo navbar-brand">
  {isThueXeDeDangDomain ? (
    <img 
      className="company-logo" 
      src="/public/txdd-logo-1.jpg" 
      alt="Thuê Xe Dễ Dàng Logo" 
    />
  ) : (
    "Du Lịch Real"
  )}
</Link>

        <button className="navbar-toggler" type="button" aria-label="Toggle navigation" onClick={() => setNavOpen(o => !o)}>
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className={`collapse navbar-collapse${navOpen ? ' show' : ''}`} id="mainNav">
          <nav className="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-lg-center w-100">
            {isThueXeDeDangDomain ? (
              <>
                <Link to="/thue-xe" className="nav-link">Thuê xe</Link>
                <Link to="/thue-xe-nang-cao" className="nav-link">Thuê xe nâng cao</Link>
                {/* <Link to="/tinh-gia-thue-xe" className="nav-link">Tính giá thuê xe</Link> */}
                <Link to="/lien-he" className="nav-link">Liên hệ</Link>
              </>
            ) : (
              <>
                {/* <Link to="/" className="nav-link">Trang chủ</Link> */}
                <div className={`nav-item dropdown${dropdown==='trang_chu' ? ' show' : ''}`}
                  onClick={() => setDropdown(dropdown==='trang_chu' ? '' : 'trang_chu')}
                  onMouseEnter={() => window.innerWidth >= 992 && setDropdown('trang_chu')}
                  onMouseLeave={() => window.innerWidth >= 992 && setDropdown('')}
                >
                  <span className="nav-link dropdown-toggle" id="trang_chuDropdown" role="button" aria-expanded={dropdown==='trang_chu'}>Trang chủ</span>
                  <ul className={`dropdown-menu${dropdown==='trang_chu' ? ' show' : ''}`} aria-labelledby="trang_chuDropdown">
                    {sub_menus.map(sub_menu => sub_menu.tab_id === '14' && (
                      <li key={sub_menu.subtab_id}><Link className="dropdown-item" to={sub_menu.php}>{sub_menu.subtab_title}</Link></li>
                    ))}
                  </ul>
                </div>
                {/* <Link to="/danh-sach-tour" className="nav-link">Danh sách tour</Link> */}
                {/* <Link to="/tinh-gia-thue-xe" className="nav-link">Tính giá thuê xe</Link> */}
                <div className={`nav-item dropdown${dropdown==='group' ? ' show' : ''}`}
                  onClick={() => setDropdown(dropdown==='group' ? '' : 'group')}
                  onMouseEnter={() => window.innerWidth >= 992 && setDropdown('group')}
                  onMouseLeave={() => window.innerWidth >= 992 && setDropdown('')}
                >
                  <span className="nav-link dropdown-toggle" id="groupDropdown" role="button" aria-expanded={dropdown==='group'}>Nhóm tour</span>
                  <ul className={`dropdown-menu${dropdown==='group' ? ' show' : ''}`} aria-labelledby="groupDropdown">
                    {groups.map(group => (
                      <li key={group.group_id}><Link className="dropdown-item" to={buildGroupRoute(group)}>{group.name}</Link></li>
                    ))}
                  </ul>
                </div>
                <div className={`nav-item dropdown${dropdown==='zone' ? ' show' : ''}`}
                  onClick={() => setDropdown(dropdown==='zone' ? '' : 'zone')}
                  onMouseEnter={() => window.innerWidth >= 992 && setDropdown('zone')}
                  onMouseLeave={() => window.innerWidth >= 992 && setDropdown('')}
                >
                  <span className="nav-link dropdown-toggle" id="zoneDropdown" role="button" aria-expanded={dropdown==='zone'}>Khu vực</span>
                  <ul className={`dropdown-menu${dropdown==='zone' ? ' show' : ''}`} aria-labelledby="zoneDropdown">
                    {zones.map(zone => (
                      <li key={zone.zone_id}><Link className="dropdown-item" to={buildZoneRoute(zone)}>{zone.zone_name}</Link></li>
                    ))}
                  </ul>
                </div>
                <Link to="/lich-khoi-hanh" className="nav-link">Lịch khởi hành</Link>
                <div className={`nav-item dropdown${dropdown==='bus_rental' ? ' show' : ''}`}
                  onClick={() => setDropdown(dropdown==='bus_rental' ? '' : 'bus_rental')}
                  onMouseEnter={() => window.innerWidth >= 992 && setDropdown('bus_rental')}
                  onMouseLeave={() => window.innerWidth >= 992 && setDropdown('')}
                >
                  <span className="nav-link dropdown-toggle" id="bus_rentalDropdown" role="button" aria-expanded={dropdown==='bus_rental'}>Thuê xe</span>
                  <ul className={`dropdown-menu${dropdown==='bus_rental' ? ' show' : ''}`} aria-labelledby="bus_rentalDropdown">
                      <li key="thue-xe"><Link className="dropdown-item" to="/thue-xe">Thuê xe</Link></li>
                      <li key="thue-xe-nang-cao"><Link className="dropdown-item" to="/thue-xe-nang-cao">Thuê xe nâng cao</Link></li>
                  </ul>
                </div>
                <Link to="/mua-ve" className="nav-link">Mua vé xe tuyến</Link>
                <Link to="/mua-ve-may-bay" className="nav-link">Mua vé máy bay</Link>
                <div className={`nav-item dropdown${dropdown==='others' ? ' show' : ''}`}
                  onClick={() => setDropdown(dropdown==='others' ? '' : 'others')}
                  onMouseEnter={() => window.innerWidth >= 992 && setDropdown('others')}
                  onMouseLeave={() => window.innerWidth >= 992 && setDropdown('')}
                >
                  <span className="nav-link dropdown-toggle" id="othersDropdown" role="button" aria-expanded={dropdown==='others'}>Dịch vụ khác</span>
                  <ul className={`dropdown-menu${dropdown==='others' ? ' show' : ''}`} aria-labelledby="othersDropdown">
                      <li key="visa"><Link className="dropdown-item" to="/visa">Visa</Link></li>
                      <li key="hotel"><Link className="dropdown-item" to="/hotel">Khách sạn</Link></li>
                  </ul>
                </div>
                {/* <Link to="/lien-he" className="nav-link">Liên hệ</Link> */}
                {/* <Link to="/so-do-website" className="nav-link">Sơ đồ website</Link> */}
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="container py-3">{children}</main>

      <footer className="homepage-footer mt-5" id="contact">
        {info?.footer ? (
          <div dangerouslySetInnerHTML={{ __html: info.footer }} />
        ) : (
          <>
            <div>© {new Date().getFullYear()} Du Lịch Real. All rights reserved.</div>
          </>
        )}
        <div className="footer-contact mt-2">
          {info?.address && (
            <div><i className="fas fa-map-marker-alt me-1"></i><b>Địa chỉ:</b> {info.address}</div>
          )}
          {info?.phone_number && (
            <div><i className="fas fa-phone-alt me-1"></i><b>Điện thoại:</b> <a href={`tel:${info.phone_number.replace(/[^+\d]/g, '')}`}>{info.phone_number}</a></div>
          )}
          {info?.e_mail && (
            <div><i className="fas fa-envelope me-1"></i><b>Email:</b> <a href={`mailto:${info.e_mail}`}>{info.e_mail}</a></div>
          )}
          {info?.facebook_url && (
            <div><i className="fab fa-facebook-f me-1"></i><b>Fanpage:</b> <a href={info.facebook_url} target="_blank" rel="noopener noreferrer">Facebook</a></div>
          )}
          {info?.youtube_url && (
            <div><i className="fab fa-youtube me-1"></i><b>Youtube:</b> <a href={info.youtube_url} target="_blank" rel="noopener noreferrer">Youtube</a></div>
          )}
        </div>
      </footer>
      <WidgetBar info={info} />
    </div>
  );
}

export default Layout;
