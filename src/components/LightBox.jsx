import React from 'react';
import './LightBox.css';

const LightBox = ({ images, currentIndex, onClose, onPrev, onNext }) => {
  if (!images || images.length === 0) return null;

  return (
    <div className="lightbox-overlay">
      <div className="lightbox-content">
        <button className="lightbox-arrow left" onClick={onPrev}>
          <i className="fa fa-chevron-left"></i>
        </button>
        <img src={images[currentIndex]} alt="Tour" className="lightbox-img" />
        <button className="lightbox-arrow right" onClick={onNext}>
          <i className="fa fa-chevron-right"></i>
        </button>
        <button className="lightbox-close" onClick={onClose}>×</button>
        <div className="lightbox-thumbnails">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt="thumb"
              className={`lightbox-thumb ${idx === currentIndex ? 'active' : ''}`}
              onClick={() => onNext(idx)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LightBox;
