import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';
import { fetchInfo } from '../utils/infoApi';

function normalizeMenuPath(path = '', label = '') {
  const rawPath = String(path || '').trim();

  if (!rawPath) return '/';
  if (/^(https?:)?\/\//i.test(rawPath)) return rawPath;

  const normalizedPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const lowerPath = normalizedPath.toLowerCase();

  // if (lowerPath === '/lich-khoi-hanh.html') return '/lich-khoi-hanh';
  // if (lowerPath === '/lien-he.html' || lowerPath === '/lien-he') return '/lien-he';
  // if (lowerPath === '/so-do-website.html') return '/so-do-website';
  // if (/^\/nhom-bai-.*visa.*\.html$/i.test(normalizedPath) || /visa/i.test(label)) return '/visa';

  return normalizedPath;
}

function buildMenuItemKey(item, fallback = '') {
  return [item?.tab_id, item?.subtab_title, item?.name, item?.php, fallback].filter(Boolean).join('-');
}

function MenuAnchor({ className, item, children }) {
  const href = normalizeMenuPath(item?.php, item?.subtab_title || item?.name || '');
  const isExternal = /^(https?:)?\/\//i.test(href);

  if (isExternal) {
    return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
  }

  return <a className={className} href={href}>{children}</a>;
}

function DropdownToggleButton({ dropdownKey, dropdown, setDropdown }) {
  return (
    <button
      type="button"
      id={`${dropdownKey}Dropdown`}
      className="nav-link dropdown-toggle border-0 bg-transparent"
      aria-expanded={dropdown === dropdownKey}
      aria-label="Toggle submenu"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDropdown(dropdown === dropdownKey ? '' : dropdownKey);
      }}
      onMouseEnter={() => window.innerWidth >= 992 && setDropdown(dropdownKey)}
    ></button>
  );
}



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
  const [tabs, setTabs] = useState([]);
  const [subTabs, setSubTabs] = useState([]);
  const [navOpen, setNavOpen] = useState(false);
  const [dropdown, setDropdown] = useState("");
  const [info, setInfo] = useState(null);
  const navRef = useRef();
  const location = useLocation();
  const isThueXeDeDangDomain = typeof window !== 'undefined' && /(^|\.)thuexededang\.com$/i.test(window.location.hostname || '');
  const subTabsByTabId = subTabs.reduce((acc, item) => {
    const tabId = String(item?.tab_id || '');
    if (!tabId) return acc;
    if (!acc[tabId]) acc[tabId] = [];
    acc[tabId].push(item);
    return acc;
  }, {});

  useEffect(() => {
    if (!isThueXeDeDangDomain) {
      fetch('/api/bussiness.php?action=get_tabs')
        .then(res => res.json())
        .then(res => {
          const payload = res?.data || {};
          setTabs(payload.tabs || []);
          setSubTabs(payload.sub_tabs || []);
        })
        .catch(() => {
          setTabs([]);
          setSubTabs([]);
        });
    }

    fetchInfo().then(setInfo);
  }, [isThueXeDeDangDomain]);

  useEffect(() => {
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
    info?.web_title ? <span className="company-name">{info.web_title}</span> : <span className="company-name">Du Lịch Real</span>
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
                {tabs.map((tab) => {
                  const tabId = String(tab?.tab_id || '');
                  const currentSubTabs = subTabsByTabId[tabId] || [];
                  const dropdownKey = `tab_${tabId}`;

                  if (currentSubTabs.length > 0) {
                    return (
                      <div
                        key={buildMenuItemKey(tab, dropdownKey)}
                        className={`nav-item dropdown${dropdown===dropdownKey ? ' show' : ''}`}
                        onMouseEnter={() => window.innerWidth >= 992 && setDropdown(dropdownKey)}
                        onMouseLeave={() => window.innerWidth >= 992 && setDropdown('')}
                      >
                        <div className="d-flex align-items-center">
                          <MenuAnchor className="nav-link" item={tab}>{tab.name}</MenuAnchor>
                          <DropdownToggleButton dropdownKey={dropdownKey} dropdown={dropdown} setDropdown={setDropdown} />
                        </div>
                        <ul className={`dropdown-menu${dropdown===dropdownKey ? ' show' : ''}`} aria-labelledby={`${dropdownKey}Dropdown`}>
                          {currentSubTabs.map((subTab, index) => (
                            <li key={buildMenuItemKey(subTab, index)}>
                              <MenuAnchor className="dropdown-item" item={subTab}>{subTab.subtab_title}</MenuAnchor>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  }

                  return (
                    <MenuAnchor key={buildMenuItemKey(tab)} className="nav-link" item={tab}>
                      {tab.name}
                    </MenuAnchor>
                  );
                })}
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
