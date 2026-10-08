
import React, { useState, useEffect, useMemo } from 'react';
import './ContactPage.css';
import { fetchInfo } from '../utils/infoApi';

function getPathTourId(pathname) {
  if (!pathname) return '';
  const match = pathname.match(/-r-(\d+)\.html$/i);
  return match ? match[1] : '';
}

function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [locationPath, setLocationPath] = useState(window.location.pathname + window.location.search);

  useEffect(() => {
    const handleLocationChange = () => setLocationPath(window.location.pathname + window.location.search);

    window.addEventListener('popstate', handleLocationChange);

    // monkeypatch pushState/replaceState to emit a custom event so single-page navigation is detected
      const origPush = window.history.pushState;
      const origReplace = window.history.replaceState;
      window.history.pushState = function () {
        origPush.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
      };
      window.history.replaceState = function () {
        origReplace.apply(this, arguments);
        window.dispatchEvent(new Event('locationchange'));
      };
    window.addEventListener('locationchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('locationchange', handleLocationChange);
        window.history.pushState = origPush;
        window.history.replaceState = origReplace;
    };
  }, []);

  const _url = new URL(locationPath, window.location.origin);
  const searchParams = new URLSearchParams(_url.search);
  const id = getPathTourId(_url.pathname) || searchParams.get('text_id');
  const [this_text, setText] = useState(null);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetchInfo().then(setInfo);
  }, []);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setText(null);
      return;
    }

    setLoading(true);
    fetch(`/api/tours.php?action=get_text&text_id=${id}`)
      .then(res => res.json())
      .then(textRes => {
        setText(textRes?.data || null);
      })
      .catch(() => {
        setText(null);
      })
      .finally(() => setLoading(false));
  }, [id]);
  
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setSuccess(null);
    setError(null);
    try {
      const res = await fetch('/api/contact.php?action=submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSuccess(data.message);
        setForm({ name: '', email: '', mobile: '', notes: '' });
      } else setError(data.message || 'Có lỗi xảy ra');
    } catch (err) {
      setError('Có lỗi xảy ra');
    }
    setLoading(false);
  };

  const contactMapEmbed = useMemo(() => {
    if (info?.show_map && info?.google_map_embed) {
      return <div className="contact-map-embed" dangerouslySetInnerHTML={{ __html: info.google_map_embed }} />;
    }

    return (
      <iframe
        title="map"
        src="https://www.google.com/maps?q=10.7769,106.7009&z=15&output=embed"
        width="100%"
        height="220"
        style={{ border: 0 }}
        allowFullScreen
        loading="lazy"
      ></iframe>
    );
  }, [info?.show_map, info?.google_map_embed]);

  return (
    <div className="contact-page container py-4">
      <div className="row">
        <div className="col-md-7 mb-4">
          {this_text && (
            <div className="tour-text mb-3">
              <h2>{this_text.richtext_title}</h2>
              <div dangerouslySetInnerHTML={{ __html: this_text.richtext_content }} />
            </div>
          )}
      <h2>Liên hệ</h2>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="mb-3">
              <label className="form-label">Họ tên *</label>
              <input name="name" className="form-control" required value={form.name} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input name="email" className="form-control" type="email" value={form.email} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Số điện thoại</label>
              <input name="mobile" maxLength={10} className="form-control" value={form.mobile} onChange={handleChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Nội dung liên hệ *</label>
              <textarea name="notes" className="form-control" required rows={4} value={form.notes} onChange={handleChange}></textarea>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>Gửi liên hệ</button>
            {success && <div className="text-success mt-2">{success}</div>}
            {error && <div className="text-danger mt-2">{error}</div>}
          </form>
        </div>
        <div className="col-md-5">
          <h5>Thông tin liên hệ</h5>
          <ul className="list-unstyled">
            <li><i className="fas fa-map-marker-alt me-1"></i><b>Địa chỉ:</b> {info?.address || 'Đang cập nhật...'}</li>
            <li><i className="fas fa-phone-alt me-1"></i><b>Điện thoại:</b> {info?.phone_number || 'Đang cập nhật...'}</li>
            <li><i className="fas fa-envelope me-1"></i><b>Email:</b> {info?.e_mail || 'Đang cập nhật...'}</li>
            {info?.facebook_url && (
              <li><i className="fab fa-facebook-f me-1"></i><b>Fanpage:</b> <a href={info.facebook_url} target="_blank" rel="noopener noreferrer">Facebook</a></li>
            )}
            {info?.youtube_url && (
              <li><i className="fab fa-youtube me-1"></i><b>Youtube:</b> <a href={info.youtube_url} target="_blank" rel="noopener noreferrer">Youtube</a></li>
            )}
          </ul>
          <div className="mt-3">
            {contactMapEmbed}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
