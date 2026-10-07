import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './WebHomePage.css';
import { slugify } from '../utils/routeHelpers';

function WebHomePage() {
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || `${process.env.PUBLIC_URL || ''}/api`).replace(/\/+$/, '');
  const [banners, setBanners] = useState([]);
  const [services, setServices] = useState([]);
  const [activeSlide, setActiveSlide] = useState(0);
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

    fetch(`${API_BASE}/bussiness.php?action=get_banners`)
      .then(async res => {
        const json = await parseJsonSafe(res, 'API banners tra ve du lieu khong hop le');
        if (!res.ok || json?.success === false) {
          throw new Error(json?.message || 'Khong tai duoc du lieu trang chu');
        }
        return json;
      })
      .then((res) => {
        if (!mounted) return;
        setBanners(Array.isArray(res?.data?.banners) ? res.data.banners : []);
        setServices(Array.isArray(res?.data?.richtexts) ? res.data.richtexts : []);
        setError('');
      })
      .catch((err) => {
        if (!mounted) return;
        setBanners([]);
        setServices([]);
        setError(err?.message || 'Khong the tai du lieu trang chu');
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [banners]);

  useEffect(() => {
    if (activeSlide >= banners.length) {
      setActiveSlide(0);
    }
  }, [activeSlide, banners.length]);

  const normalizeImageUrl = (value) => {
    const src = String(value || '').trim();
    if (!src) return '';
    if (/^(https?:)?\/\//i.test(src)) return src;
    if (src.startsWith('/')) return src;
    return `/upload/images/${src}`;
  };

  const extractText = (html) => {
    if (!html) return '';
    return String(html)
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const serviceCards = useMemo(() => {
    return services.slice(0, 4).map((item) => {
      const title = String(item?.richtext_title || 'Dich vu').trim();
      const content = extractText(item?.richtext_content);
      const description = content.length > 170 ? `${content.slice(0, 170).trim()}...` : content;
      const href = `/bai/bai-${slugify(title)}-r-${item.richtext_id}.html`;
      return {
        id: item.richtext_id || title,
        title,
        href,
        image: normalizeImageUrl(item?.thumb_url),
        description
      };
    });
  }, [services]);

  if (loading) return <div className="homepage-loading">Dang tai du lieu...</div>;
  if (error) return <div className="homepage-loading">{error}</div>;

  return (
    <div className="homepage legacy-homepage">
      <section className="legacy-slider">
        <div className="legacy-slider-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
          {(banners.length ? banners : [{ name: 'Banner', image_url: '/public/uploads/no-image.jpg', link: '#' }]).map((banner, index) => {
            const img = normalizeImageUrl(banner?.image_url) || '/public/uploads/no-image.jpg';
            const title = banner?.name || 'Banner';
            const link = String(banner?.link || '').trim();

            return (
              <div className="legacy-slide" key={`${title}-${index}`}>
                {link ? (
                  <a href={link} target={/^https?:\/\//i.test(link) ? '_blank' : undefined} rel={/^https?:\/\//i.test(link) ? 'noopener noreferrer' : undefined}>
                    <img src={img} alt={title} />
                  </a>
                ) : (
                  <img src={img} alt={title} />
                )}
                <div className="legacy-slide-caption">{title}</div>
              </div>
            );
          })}
        </div>

        <div className="legacy-slider-dots">
          {(banners.length ? banners : [1]).map((_, idx) => (
            <button
              key={`dot-${idx}`}
              type="button"
              aria-label={`Slide ${idx + 1}`}
              className={idx === activeSlide ? 'active' : ''}
              onClick={() => setActiveSlide(idx)}
            ></button>
          ))}
        </div>
      </section>

      <section className="service-section">
        <div className="section-heading">DICH VU</div>
        <div className="service-grid">
          {serviceCards.map((service) => (
            <article className="service-card" key={service.id}>
              <div className="service-thumb-wrap">
                <Link to={service.href}>
                  <img src={service.image || '/public/uploads/no-image.jpg'} alt={service.title} className="service-thumb" />
                </Link>
              </div>
              <div className="service-body">
                <h3>
                  <Link to={service.href}>{service.title}</Link>
                </h3>
                <p>{service.description}</p>
              </div>
            </article>
          ))}
          {serviceCards.length === 0 && (
            <div className="homepage-loading">Khong co du lieu Dich vu.</div>
          )}
        </div>
      </section>

      <section className="legacy-links">
        <div className="legacy-links-inner">
          <Link to="/bai/bai-thiet-ke-website-r-14.html">Thiet ke website</Link>
          <Link to="/bai/bai-cho-thue-website-r-17.html">Cho thue website</Link>
          <Link to="/bai/bai-cham-soc-website-khach-hang-r-16.html">Cham soc website</Link>
          <a href="https://www.facebook.com/website.thien.di/" target="_blank" rel="noopener noreferrer">Facebook</a>
        </div>
      </section>
    </div>
  );
}

export default WebHomePage;
