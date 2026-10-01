import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './BusRentalPage.css';
import './BookingProgressBar.css';
import { renderProgressBar, bookingProgressSteps } from '../utils/renderProgressBar';
import RecentRentalQuotes from '../components/RecentRentalQuotes';

function BusRentalPage() {
  const API_BASE = process.env.REACT_APP_API_BASE_URL || '/api';
  const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || 'AIzaSyCWNAMemqdbldYLbZFJd8XdXY1uwyTPwsA'; 
  const getTodayLocal = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const getNowTimeLocal = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };
  const [carFields, setCarFields] = useState([]);
  const [wishYears, setWishYears] = useState([]);
  const [timeOptions, setTimeOptions] = useState([]);
  const [googleReady, setGoogleReady] = useState(false);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [distanceError, setDistanceError] = useState(null);
  const [yeuCauDacBietList, setYeuCauDacBietList] = useState([]);
  const [mucDoUuTienList, setMucDoUuTienList] = useState([]);
  const [loaiHinhChuyenDiList, setLoaiHinhChuyenDiList] = useState([]);
  const originInputRef = useRef(null);
  const destinationInputRef = useRef(null);
  const autocompleteRefs = useRef({ origin: null, destination: null });
  // Giá trị khởi tạo test nhanh
//   const [form, setForm] = useState({
//     customer_name: 'Bùi Anh Tuấn',
//     customer_phone: '0917335743',
//     customer_email: 'hb.anhtuan@gmail.com',
//     customer_addr: '123 Lê Lợi, Q.1, TP.HCM',
//     from_day: getTodayLocal(),
//     wish_bus_year: '',
//     wish_bus_year_khac: '',
//     loai_xe_khac: '',
//     wish_tai_xe_tu_tuc: 0,
//     wish_vnd: '',
//     is_vat: 0,
//     to_day: getTodayLocal(),
//     from_time: '',
//     to_time: '',
//     bus_type_id: '29 chỗ',
//     bus_count: 1,
//     pax_count: 1,
//     note: 'Test đặt xe',
// //    road_trip: 'Đà Lạt (3 ngày 2 đêm)',
//     s_kms: '600'
//   });
  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    customer_addr: '',
    google_origin: '',
    google_destination: '',
    google_distance_km: '',
    google_distance_text: '',
    google_duration_text: '',
    google_travel_mode: 'DRIVING',
    from_day: getTodayLocal(),
    to_day: getTodayLocal(),
    bus_type_id: '45 chỗ',
    bus_count: 1,
    pax_count: 1,
    note: '',
    tong_km: '',
    wish_tai_xe_tu_tuc: 0,
    is_vat: 0,
    so_diem_don: 0,
    diem_don_khac: '[]',
    diem_tra_giong_diem_don: 0,
    so_diem_tra: 0,
    diem_tra_khac: '[]',
    yeu_cau_dac_biet: '',
    muc_do_uu_tien: '',
    loai_hinh_chuyen_di: '',
    wish_tong_km: ''
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guideData, setGuideData] = useState(null);
  const [guideLoading, setGuideLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/bus_rental.php?action=fields`)
      .then(res => res.json())
      .then(res => {
        setCarFields(res.car_fields || []);
      });
    fetch(`${API_BASE}/bus_rental.php?action=wish_bus_year`)
      .then(res => res.json())
      .then(res => setWishYears(res.data || []))
      .catch(() => setWishYears([]));
    fetch(`${API_BASE}/bus_rental.php?action=get_times`)
      .then(res => res.json())
      .then(res => {
        const normalizedTimes = (res.data || [])
          .map(item => ({
            vvalue: String(item?.vvalue || '').trim(),
            label: String(item?.label || item?.vvalue || '').trim()
          }))
          .filter(item => item.vvalue !== '');
        setTimeOptions(normalizedTimes);
      })
      .catch(() => setTimeOptions([]));
    fetch(`${API_BASE}/bus_rental.php?action=get_yeu_cau_dac_biet`)
      .then(res => res.json())
      .then(res => setYeuCauDacBietList(res.data || []))
      .catch(() => setYeuCauDacBietList([]));
    fetch(`${API_BASE}/bus_rental.php?action=get_muc_do_uu_tien`)
      .then(res => res.json())
      .then(res => setMucDoUuTienList(res.data || []))
      .catch(() => setMucDoUuTienList([]));
    fetch(`${API_BASE}/bus_rental.php?action=get_loai_hinh_chuyen_di`)
      .then(res => res.json())
      .then(res => setLoaiHinhChuyenDiList(res.data || []))
      .catch(() => setLoaiHinhChuyenDiList([]));
    // fetch('/api/bus_rental.php?action=prices')
    //   .then(res => res.json())
    //   .then(res => {
    //     setPrices(res.data || []);
    //     setAllPrices(res.data || []);
    //   });
  }, [API_BASE]);

  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.warn('REACT_APP_GOOGLE_MAPS_API_KEY not set. Google Maps features disabled.');
      return;
    }
    
    // Check if already loaded
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log('Google Maps already loaded.');
      setGoogleReady(true);
      return;
    }
    
    // Check if script already exists
    if (document.getElementById('google-maps-api-script')) {
      console.log('Google Maps script tag exists, waiting for load...');
      const checkReady = setInterval(() => {
        if (window.google && window.google.maps && window.google.maps.places) {
          console.log('Google Maps loaded successfully.')
          setGoogleReady(true);
          clearInterval(checkReady);
        }
      }, 100);
      return () => clearInterval(checkReady);
    }
    
    console.log('Loading Google Maps API...');
    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&v=3.56&language=vi`;
    script.type = 'text/javascript';
    script.async = false;
    script.defer = false;
    
    script.onload = () => {
      console.log('Google Maps API script loaded.');
      if (window.google && window.google.maps) {
        console.log('window.google.maps available');
        setGoogleReady(true);
      } else {
        console.error('Script loaded but window.google.maps not available');
        setDistanceError('Google Maps loaded nhưng không khả dụng. Vui lòng tải lại trang.');
      }
    };
    
    script.onerror = (e) => {
      console.error('Google Maps API script error:', e);
      setDistanceError('Không tải được Google Maps API. Kiểm tra API key có hợp lệ cho localhost không, hoặc kiểm tra console.');
    };
    
    document.head.appendChild(script);
    
    return () => {
      console.log('Cleaning up Google Maps effect');
    };
  }, [GOOGLE_MAPS_API_KEY]);

  useEffect(() => {
    if (!googleReady || !window.google || !window.google.maps || !originInputRef.current || !destinationInputRef.current) {
      console.log('Autocomplete init blocked:', { googleReady, windowGoogleAvailable: !!window.google });
      return;
    }
    if (autocompleteRefs.current.origin) {
      console.log('Autocomplete already initialized');
      return;
    }

    try {
      console.log('Initializing autocomplete...');
      const originAuto = new window.google.maps.places.Autocomplete(originInputRef.current, { types: ['geocode'] });
      const destinationAuto = new window.google.maps.places.Autocomplete(destinationInputRef.current, { types: ['geocode'] });
      originAuto.setFields(['formatted_address']);
      destinationAuto.setFields(['formatted_address']);

      originAuto.addListener('place_changed', () => {
        const place = originAuto.getPlace();
        console.log('Origin place selected:', place.formatted_address);
        setForm(prev => ({
          ...prev,
          google_origin: place.formatted_address || originInputRef.current.value
        }));
      });

      destinationAuto.addListener('place_changed', () => {
        const place = destinationAuto.getPlace();
        console.log('Destination place selected:', place.formatted_address);
        setForm(prev => ({
          ...prev,
          google_destination: place.formatted_address || destinationInputRef.current.value
        }));
      });

      autocompleteRefs.current.origin = originAuto;
      autocompleteRefs.current.destination = destinationAuto;
      console.log('Autocomplete initialized successfully');
    } catch (error) {
      console.error('Error initializing autocomplete:', error);
      setDistanceError('Lỗi khởi tạo Google Places Autocomplete: ' + error.message);
    }
  }, [googleReady]);

  const getGoogleDistance = () => new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      console.error('window.google.maps not available');
      reject(new Error('Google Maps chưa sẵn sàng.'));
      return;
    }
    if (!window.google.maps.DistanceMatrixService) {
      console.error('DistanceMatrixService not available');
      reject(new Error('Google Maps DistanceMatrixService không khả dụng.'));
      return;
    }
    
    console.log('Calling DistanceMatrix API with:');
    console.log('  Origins:', form.google_origin);
    console.log('  Destinations:', form.google_destination);
    
    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix({
      origins: [form.google_origin],
      destinations: [form.google_destination],
      travelMode: window.google.maps.TravelMode.DRIVING,
      unitSystem: window.google.maps.UnitSystem.METRIC,
      avoidHighways: false,
      avoidTolls: false,
    }, (response, status) => {
      console.log('DistanceMatrix response status:', status);
      console.log('Response:', response);
      
      if (status !== 'OK') {
        console.error('DistanceMatrix API returned status:', status);
        reject(new Error(`Google Maps API error: ${status}`));
        return;
      }
      
      if (!response?.rows?.[0]?.elements?.[0]) {
        console.error('Invalid response structure:', response);
        reject(new Error('Không nhận được kết quả Google Maps (lỗi cấu trúc dữ liệu).'));
        return;
      }
      
      const element = response.rows[0].elements[0];
      console.log('Element status:', element.status);
      
      if (element.status !== 'OK') {
        console.error('Element status not OK:', element.status);
        reject(new Error(`Lỗi tính toán: ${element.status}`));
        return;
      }
      
      console.log('Distance result:', element.distance, 'Duration:', element.duration);
      resolve({ distance: element.distance, duration: element.duration });
    });
  });

  const handleComputeDistance = async () => {
    console.log('handleComputeDistance called');
    console.log('googleReady:', googleReady);
    console.log('GOOGLE_MAPS_API_KEY:', GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET');
    
    if (!GOOGLE_MAPS_API_KEY) {
      setDistanceError('Chưa cấu hình GOOGLE_MAPS_API_KEY.');
      return;
    }
    
    if (!googleReady) {
      setDistanceError('Google Maps chưa sẵn sàng. Đợi một chút rồi thử lại.');
      return;
    }
    
    if (!form.google_origin || !form.google_destination) {
      setDistanceError('Vui lòng nhập điểm đi và điểm đến.');
      return;
    }
    
    setDistanceError(null);
    setDistanceLoading(true);
    
    try {
      console.log('Fetching distance...');
      const result = await getGoogleDistance();
      const distanceKm = parseFloat((result.distance.value / 1000).toFixed(1));
      
      console.log('Distance calculated:', distanceKm, 'km');
      
      setForm(prev => ({
        ...prev,
        google_distance_km: distanceKm,
        google_distance_text: result.distance.text,
        google_duration_text: result.duration.text,
        google_travel_mode: 'DRIVING',
        tong_km: distanceKm,
        road_trip: `${prev.google_origin || form.google_origin} → ${prev.google_destination || form.google_destination}`
      }));
    } catch (err) {
      console.error('Distance calculation error:', err);
      setDistanceError(err.message || 'Tính khoảng cách thất bại. Kiểm tra console để xem chi tiết.');
    } finally {
      setDistanceLoading(false);
    }
  };

  const handleChange = e => {
    const { name, type, value, checked } = e.target;
    let v = type === 'checkbox' ? (checked ? 1 : 0) : value;
    const nextForm = { ...form, [name]: v };
    
    // Reset distance data if origin/destination changes
    if (name === 'google_origin' || name === 'google_destination') {
      nextForm.google_distance_km = '';
      nextForm.google_distance_text = '';
      nextForm.google_duration_text = '';
    }
    
    // Handle so_diem_don change - initialize JSON array
    if (name === 'so_diem_don') {
      const numPoints = parseInt(v, 10) || 1;
      try {
        const currentArray = JSON.parse(form.diem_don_khac || '[]');
        const newArray = [];
        for (let i = 0; i < numPoints; i++) {
          newArray.push(currentArray[i] || '');
        }
        nextForm.diem_don_khac = JSON.stringify(newArray);
      } catch (err) {
        const newArray = Array(numPoints).fill('');
        nextForm.diem_don_khac = JSON.stringify(newArray);
      }
    }
    
    // Handle diem_tra_giong_diem_don change
    if (name === 'diem_tra_giong_diem_don') {
      if (v === 1) {
        // When checkbox is checked, initialize so_diem_tra = so_diem_don
        nextForm.so_diem_tra = form.so_diem_don;
        try {
          const currentDonArray = JSON.parse(form.diem_don_khac || '[]');
          nextForm.diem_tra_khac = JSON.stringify(currentDonArray);
        } catch (err) {
          nextForm.diem_tra_khac = '[]';
        }
      }
    }
    
    // Handle so_diem_tra change - initialize JSON array
    if (name === 'so_diem_tra') {
      const numPoints = parseInt(v, 10) || 1;
      try {
        const currentArray = JSON.parse(form.diem_tra_khac || '[]');
        const newArray = [];
        for (let i = 0; i < numPoints; i++) {
          newArray.push(currentArray[i] || '');
        }
        nextForm.diem_tra_khac = JSON.stringify(newArray);
      } catch (err) {
        const newArray = Array(numPoints).fill('');
        nextForm.diem_tra_khac = JSON.stringify(newArray);
      }
    }
    
    setForm(nextForm);
  };

  const handleDiemDonChange = (index, value) => {
    try {
      const currentArray = JSON.parse(form.diem_don_khac || '[]');
      currentArray[index] = value;
      setForm(prev => ({ ...prev, diem_don_khac: JSON.stringify(currentArray) }));
    } catch (err) {
      console.error('Error updating diem_don_khac:', err);
    }
  };

  const handleDiemTraChange = (index, value) => {
    try {
      const currentArray = JSON.parse(form.diem_tra_khac || '[]');
      currentArray[index] = value;
      setForm(prev => ({ ...prev, diem_tra_khac: JSON.stringify(currentArray) }));
    } catch (err) {
      console.error('Error updating diem_tra_khac:', err);
    }
  };

  const handleYeuCauDacBietChange = (value) => {
    const currentValues = form.yeu_cau_dac_biet.split(',').map(v => v.trim()).filter(v => v);
    const index = currentValues.indexOf(value);
    if (index > -1) {
      currentValues.splice(index, 1);
    } else {
      currentValues.push(value);
    }
    setForm(prev => ({ ...prev, yeu_cau_dac_biet: currentValues.join(',') }));
  };

  const isYeuCauDacBietSelected = (value) => {
    const currentValues = form.yeu_cau_dac_biet.split(',').map(v => v.trim()).filter(v => v);
    return currentValues.includes(value);
  };

  const navigate = useNavigate();

  const loadGuideData = async () => {
    if (guideData) {
      setShowGuideModal(true);
      return;
    }
    setGuideLoading(true);
    try {
      const res = await fetch(`${API_BASE}/bus_rental.php?action=get_hd_thue_xe`);
      const result = await res.json();
      if (result.status === 'success' && result.data && result.data.length > 0) {
        setGuideData(result.data[0]);
        setShowGuideModal(true);
      } else {
        setError('Không tải được hướng dẫn');
      }
    } catch (err) {
      setError('Lỗi tải hướng dẫn: ' + err.message);
    } finally {
      setGuideLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    // Kiểm tra ngày đón và ngày trả xe >= hôm nay
    const today = new Date();
    today.setHours(0,0,0,0);
    const pickupDateObj = new Date(form.from_day);
    const toDayObj = new Date(form.to_day);
    if (!form.from_day || isNaN(pickupDateObj.getTime()) || pickupDateObj < today) {
      setError('Ngày đón phải từ hôm nay trở đi.');
      return;
    }
    if (!form.to_day || isNaN(toDayObj.getTime()) || toDayObj < today) {
      setError('Ngày trả xe phải từ hôm nay trở đi.');
      return;
    }
    if (!form.bus_type_id || form.bus_type_id === '__none__') {
      if (!form.loai_xe_khac) {
        setError('Vui lòng chọn loại xe hoặc nhập loại xe khác.');
        return;
      }
    }
    if ((form.google_origin || form.google_destination) && !form.google_distance_km) {
      setError('Vui lòng nhấn nút Tính khoảng cách Google Maps trước khi gửi nếu sử dụng điểm đi/điểm đến.');
      return;
    }
    // // Ensure time fields present
    // if (!form.from_time || !/^\d{2}:\d{2}$/.test(form.from_time)) {
    //   setError('Vui lòng chọn giờ đón hợp lệ.');
    //   return;
    // }
    // if (!form.to_time || !/^\d{2}:\d{2}$/.test(form.to_time)) {
    //   setError('Vui lòng chọn giờ trả hợp lệ.');
    //   return;
    // }
    // Validate that pickup datetime <= return datetime
    const pickupDateTime = new Date(form.from_day + 'T' + form.from_time);
    const toDateTime = new Date(form.to_day + 'T' + form.to_time);
    if (pickupDateTime > toDateTime) {
      setError('Ngày/giờ trả xe phải lớn hơn hoặc bằng ngày/giờ đón.');
      return;
    }
    if (!window.confirm('Bạn xác nhận muốn gửi yêu cầu thuê xe?')) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value === '' ? null : value])
      );
      const res = await fetch(`${API_BASE}/bus_rental.php?action=book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        const shortRaw = (raw || '').trim().slice(0, 300);
        setError(shortRaw || 'Có lỗi xảy ra');
        return;
      }
      if (!res.ok) {
        setError(data?.message || 'Có lỗi xảy ra');
        return;
      }
      if (data.status === 'success') {
        navigate(`/bus-rental-done/${data.random_code}`);
      } else {
        setError(data.message || data.mail_message || 'Có lỗi xảy ra');
      }
    } catch (err) {
      setError('Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bus-rental-page">
      {renderProgressBar(bookingProgressSteps, 1)}
      <h2 style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }} onClick={loadGuideData}>
        Thuê xe du lịch - hướng dẫn thực hiện
      </h2>
      <div className="mb-4">
      <form onSubmit={handleSubmit} className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Họ tên</label>
          <input name="customer_name" className="form-control" required onChange={handleChange} value={form.customer_name || ''} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Số điện thoại</label>
          <input name="customer_phone" className="form-control" required onChange={handleChange} value={form.customer_phone || ''} maxLength={10} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input name="customer_email" className="form-control" type="email" onChange={handleChange} value={form.customer_email || ''} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Đón tại</label>
          <input name="customer_addr" className="form-control" required onChange={handleChange} value={form.customer_addr || ''} />
        </div>
        {/* <div className="col-md-6">
          <label className="form-label">Điểm đi (Google Maps)</label>
          <input
            name="google_origin"
            ref={originInputRef}
            className="form-control"
            placeholder="Nhập điểm đi"
            onChange={handleChange}
            value={form.google_origin || ''}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Điểm đến (Google Maps)</label>
          <input
            name="google_destination"
            ref={destinationInputRef}
            className="form-control"
            placeholder="Nhập điểm đến"
            onChange={handleChange}
            value={form.google_destination || ''}
          />
        </div>
        <div className="col-12 d-flex gap-2 align-items-center">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={handleComputeDistance}
            disabled={!GOOGLE_MAPS_API_KEY || distanceLoading}
          >
            {distanceLoading ? 'Đang tính...' : 'Tính khoảng cách Google Maps'}
          </button>
          <div className="form-text">
            Phương tiện: DRIVING. {GOOGLE_MAPS_API_KEY ? '' : 'Chưa cấu hình GOOGLE_MAPS_API_KEY.'}
          </div>
        </div>
        {distanceError && (
          <div className="col-12">
            <div className="alert alert-warning py-2" role="alert">{distanceError}</div>
          </div>
        )}
        {form.google_distance_text && (
          <div className="col-12">
            <div className="alert alert-info py-2">
              <strong>Khoảng cách:</strong> {form.google_distance_text} &nbsp; • &nbsp;
              <strong>Thời gian:</strong> {form.google_duration_text || 'Chưa có'} &nbsp; • &nbsp;
              <strong>KM lưu:</strong> {form.tong_km || 'Chưa tính'}
            </div>
          </div>
        )} */}
        <div className="col-md-4">
          <label className="form-label">Ngày đón</label>
          <div className="d-flex gap-2 align-items-center">
            <input name="from_day" className="form-control" type="date" required onChange={handleChange} value={form.from_day || ''} />
            <select name="from_time" className="form-select" required onChange={handleChange} value={form.from_time || ''} style={{ maxWidth: 140 }}>
              <option value="">-- giờ đón --</option>
              {timeOptions.map((timeOption, index) => (
                <option key={`${timeOption.vvalue}-${index}`} value={timeOption.vvalue}>{timeOption.label || timeOption.vvalue}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label">Ngày trả xe</label>
          <div className="d-flex gap-2 align-items-center">
            <input name="to_day" className="form-control" type="date" required onChange={handleChange} value={form.to_day || ''} />
            <select name="to_time" className="form-select" required onChange={handleChange} value={form.to_time || ''} style={{ maxWidth: 140 }}>
              <option value="">-- giờ trả --</option>
              {timeOptions.map((timeOption, index) => (
                <option key={`${timeOption.vvalue}-${index}`} value={timeOption.vvalue}>{timeOption.label || timeOption.vvalue}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label">Số lượng xe</label>
          <input name="bus_count" className="form-control" type="number" min="1" required onChange={handleChange} value={form.bus_count || ''} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Số lượng khách</label>
          <input name="pax_count" className="form-control" type="number" min="1" required onChange={handleChange} value={form.pax_count || ''} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Tuyến đường</label>
          <input name="road_trip" className="form-control" required onChange={handleChange} value={form.road_trip || ''} placeholder="VD: Sài Gòn - Đà Lạt (3 ngày 2 đêm)" />
        </div>
        <div className="col-md-2">
          <label className="form-label">KM ước lượng <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">GG maps</a></label>
          <input name="wish_tong_km" className="form-control" type="number" min="0" onChange={handleChange} value={form.wish_tong_km || ''} placeholder="Ví dụ: 600" />
        </div>
        <div className="col-md-6">
          <label className="form-label">Loại xe</label>
          <select name="bus_type_id" className="form-select" onChange={handleChange} value={form.bus_type_id || ''}>
            <option value="__none__" disabled>-- chọn loại xe --</option>
            {carFields.map(f => (
              <option key={f.field_name} value={f.field_title}>{f.field_title}</option>
            ))}
            <option value="">Khác</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Khác</label>
          <input name="loai_xe_khac" className="form-control" onChange={handleChange} value={form.loai_xe_khac || ''} placeholder="Nhập loại xe mong muốn khác" />
        </div>
        <div className="col-md-4">
          <label className="form-label">Ghi chú</label>
          <input name="note" className="form-control" onChange={handleChange} value={form.note || ''} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Đời xe yêu cầu</label>
          <select name="wish_bus_year" className="form-select" onChange={handleChange} value={form.wish_bus_year || ''}>
            <option value="">-- chọn đời xe --</option>
            {wishYears.map(y => (
              <option key={y.id} value={y.id}>{y.wish_bus_year}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label">Khác</label>
          <input name="wish_bus_year_khac" className="form-control" onChange={handleChange} value={form.wish_bus_year_khac || ''} placeholder="Ghi đời xe mong muốn khác" />
        </div>
        <div className="col-md-4">
          <label className="form-label d-block mb-2">Tài xế ăn ngủ</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="wish_tai_xe_tu_tuc_0"
              name="wish_tai_xe_tu_tuc"
              value="0"
              onChange={handleChange}
              checked={String(form.wish_tai_xe_tu_tuc) === '0'}
            />
            <label className="form-check-label" htmlFor="wish_tai_xe_tu_tuc_0">Tài xế ăn ngủ theo đoàn</label>
          </div>
          <div className="form-check mt-1">
            <input
              className="form-check-input"
              type="radio"
              id="wish_tai_xe_tu_tuc_1"
              name="wish_tai_xe_tu_tuc"
              value="1"
              onChange={handleChange}
              checked={String(form.wish_tai_xe_tu_tuc) === '1'}
            />
            <label className="form-check-label" htmlFor="wish_tai_xe_tu_tuc_1">Tài xế ăn ngủ tự túc</label>
          </div>
        </div>
        <div className="col-md-4">
          <label className="form-label">Giá mong muốn (VND)</label>
          <input name="wish_vnd" className="form-control" type="number" min="0" onChange={handleChange} value={form.wish_vnd || ''} />
        </div>
        <div className="col-md-4">
          <label className="form-label d-block mb-2">VAT</label>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              id="is_vat_0"
              name="is_vat"
              value="0"
              onChange={handleChange}
              checked={String(form.is_vat) === '0'}
            />
            <label className="form-check-label" htmlFor="is_vat_0">Không VAT</label>
          </div>
          <div className="form-check mt-1">
            <input
              className="form-check-input"
              type="radio"
              id="is_vat_1"
              name="is_vat"
              value="1"
              onChange={handleChange}
              checked={String(form.is_vat) === '1'}
            />
            <label className="form-check-label" htmlFor="is_vat_1">Có VAT</label>
          </div>
        </div>

        {/* Địa điểm đón/trả khách */}
        <div className="col-12 border p-3 rounded my-3" style={{ backgroundColor: '#f8f9fa' }}>
          <h5 className="mb-3"><strong>Địa điểm đón/trả khách</strong></h5>
          
          {/* Pickup Points */}
          <div className="mb-3">
            <label className="form-label">Số điểm đón</label>
            <select 
              name="so_diem_don" 
              className="form-select" 
              onChange={handleChange} 
              value={form.so_diem_don || 0}
            >
              {[0, 1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Các địa điểm đón khách</label>
            {(() => {
              try {
                const diemDon = JSON.parse(form.diem_don_khac || '[]');
                return (
                  <div className="d-grid gap-2">
                    {diemDon.map((diem, index) => (
                      <input
                        key={index}
                        type="text"
                        className="form-control"
                        placeholder={`Địa điểm đón ${index + 1}`}
                        value={diem || ''}
                        onChange={(e) => handleDiemDonChange(index, e.target.value)}
                      />
                    ))}
                  </div>
                );
              } catch (err) {
                return <div className="alert alert-danger">Lỗi JSON địa điểm đón</div>;
              }
            })()}
          </div>

          {/* Dropoff Checkbox */}
          <div className="mb-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="diem_tra_giong_diem_don"
                name="diem_tra_giong_diem_don"
                onChange={handleChange}
                checked={form.diem_tra_giong_diem_don === 1 || form.diem_tra_giong_diem_don === '1'}
              />
              <label className="form-check-label" htmlFor="diem_tra_giong_diem_don">
                Điểm trả khác với điểm đón
              </label>
            </div>
          </div>

          {/* Dropoff Points - Only show if not checked or if checked */}
          {form.diem_tra_giong_diem_don === 1 || form.diem_tra_giong_diem_don === '1' ? (
            <>
              <div className="mb-3">
                <label className="form-label">Số điểm trả</label>
                <select 
                  name="so_diem_tra" 
                  className="form-select" 
                  onChange={handleChange} 
                  value={form.so_diem_tra || 0}
                >
                  {[0, 1, 2, 3, 4, 5].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Các địa điểm trả khách</label>
                {(() => {
                  try {
                    const diemTra = JSON.parse(form.diem_tra_khac || '[]');
                    return (
                      <div className="d-grid gap-2">
                        {diemTra.map((diem, index) => (
                          <input
                            key={index}
                            type="text"
                            className="form-control"
                            placeholder={`Địa điểm trả ${index + 1}`}
                            value={diem || ''}
                            onChange={(e) => handleDiemTraChange(index, e.target.value)}
                          />
                        ))}
                      </div>
                    );
                  } catch (err) {
                    return <div className="alert alert-danger">Lỗi JSON địa điểm trả</div>;
                  }
                })()}
              </div>
            </>
          ) : null}
        </div>

        {/* Yêu cầu đặc biệt */}
        <div className="col-12 border p-3 rounded my-3" style={{ backgroundColor: '#f8f9fa' }}>
          <h5 className="mb-3"><strong>Yêu cầu đặc biệt</strong></h5>
          <div className="d-grid gap-2">
            {yeuCauDacBietList.map((item) => (
              <div key={item.option_value} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`yeu_cau_${item.option_value}`}
                  checked={isYeuCauDacBietSelected(item.option_value)}
                  onChange={() => handleYeuCauDacBietChange(item.option_value)}
                />
                <label className="form-check-label" htmlFor={`yeu_cau_${item.option_value}`}>
                  {item.option_label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Mức độ ưu tiên */}
        <div className="col-12 border p-3 rounded my-3" style={{ backgroundColor: '#f8f9fa' }}>
          <h5 className="mb-3"><strong>Mức độ ưu tiên</strong></h5>
          <div className="d-grid gap-2">
            {mucDoUuTienList.map((item) => (
              <div key={item.option_value} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`muc_do_${item.option_value}`}
                  checked={isYeuCauDacBietSelected(item.option_value) || form.muc_do_uu_tien.split(',').map(v => v.trim()).includes(item.option_value)}
                  onChange={() => {
                    const currentValues = form.muc_do_uu_tien.split(',').map(v => v.trim()).filter(v => v);
                    const index = currentValues.indexOf(item.option_value);
                    if (index > -1) {
                      currentValues.splice(index, 1);
                    } else {
                      currentValues.push(item.option_value);
                    }
                    setForm(prev => ({ ...prev, muc_do_uu_tien: currentValues.join(',') }));
                  }}
                />
                <label className="form-check-label" htmlFor={`muc_do_${item.option_value}`}>
                  {item.option_label}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Loại hình chuyến đi */}
        <div className="col-12 border p-3 rounded my-3" style={{ backgroundColor: '#f8f9fa' }}>
          <h5 className="mb-3"><strong>Loại hình chuyến đi</strong></h5>
          <div className="d-grid gap-2">
            {loaiHinhChuyenDiList.map((item) => (
              <div key={item.option_value} className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`loai_hinh_${item.option_value}`}
                  checked={form.loai_hinh_chuyen_di.split(',').map(v => v.trim()).includes(item.option_value)}
                  onChange={() => {
                    const currentValues = form.loai_hinh_chuyen_di.split(',').map(v => v.trim()).filter(v => v);
                    const index = currentValues.indexOf(item.option_value);
                    if (index > -1) {
                      currentValues.splice(index, 1);
                    } else {
                      currentValues.push(item.option_value);
                    }
                    setForm(prev => ({ ...prev, loai_hinh_chuyen_di: currentValues.join(',') }));
                  }}
                />
                <label className="form-check-label" htmlFor={`loai_hinh_${item.option_value}`}>
                  {item.option_label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="col-12">
          <button className="btn btn-primary" type="submit" disabled={loading}>Đặt xe</button>
          {success && <span className="text-success ms-3">{success}</span>}
          {error && <span className="text-danger ms-3">{error}</span>}
        </div>
      </form>
      </div>
      <hr />
      <RecentRentalQuotes apiBase={API_BASE} />
      {/* <h4>Các tuyến phổ biến - giá tham khảo</h4>
      <div className="mb-2 d-flex align-items-center gap-2">
        <input
          type="text"
          className="form-control"
          style={{ maxWidth: 300 }}
          placeholder="Tìm nhanh tuyến (nhập từ 3 ký tự)"
          value={searchText}
          onChange={handleSearchChange}
        />
        <button className="btn btn-secondary" type="button" onClick={handleResetSearch} disabled={!searchText}>
          Reset
        </button>
      </div>
      <div className="table-responsive bus-price-list mb-4">
        <table className="table table-bordered table-striped bus-price-table">
          <thead>
            <tr>
              <th className="sticky-header">#</th>
              {fields.map(f => (
                <th
                  key={f.field_name}
                  className="sticky-header"
                >
                  {f.field_title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {prices.map((row, idx) => (
              <tr key={row.id}
                onClick={() => setForm(f => ({
                  ...f,
                  road_trip: row.tour_name + ' (' + row.s_duration + ')',
                  to_province: row.to_province
                }))}
              >
                <td>{idx + 1}</td>
                {fields.map(f => <td key={f.field_name}>{row[f.field_name]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div> */}

      {/* Guide Modal */}
      {showGuideModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1050,
            padding: '20px'
          }}
          onClick={() => setShowGuideModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative',
              backgroundImage: guideData?.bkgd_url ? `url(${guideData.bkgd_url})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Semi-transparent overlay for readability */}
            {guideData?.bkgd_url && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '8px',
                  zIndex: -1
                }}
              />
            )}

            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10
              }}
            >
              ✕
            </button>

            {/* Modal content */}
            <div style={{ padding: '40px 30px 30px 30px', position: 'relative', zIndex: 1 }}>
              {guideData?.richtext_title && (
                <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>
                  {guideData.richtext_title}
                </h2>
              )}

              {guideData?.richtext_content && (
                <div
                  style={{
                    fontSize: '16px',
                    lineHeight: '1.6',
                    color: '#555',
                    marginBottom: '20px'
                  }}
                  dangerouslySetInnerHTML={{ __html: guideData.richtext_content }}
                />
              )}

              {guideData?.download && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ddd' }}>
                  <a
                    href={guideData.download}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    📥 Tải xuống tài liệu
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BusRentalPage;
