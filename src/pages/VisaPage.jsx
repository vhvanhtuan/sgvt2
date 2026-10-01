import React, { useEffect, useMemo, useState } from 'react';
import './VisaPage.css';

const API_BASE = (process.env.REACT_APP_API_BASE_URL || `${process.env.PUBLIC_URL || ''}/api`).replace(/\/+$/, '');

const SECTION_META = {
  1: { title: 'Chọn điểm đến', caption: 'Bước 1 / 4 - Chọn Quốc gia', accent: '#e53935' },
  2: { title: 'Chọn hình thức đi', caption: 'Bước 2 / 4 - Hình thức & nhóm đi', accent: '#e53935' },
  3: { title: 'Chọn lựa phù hợp', caption: 'Bước 3 / 4 - Chọn lựa', accent: '#e53935' },
  4: { title: 'Thông tin người thực hiện', caption: 'Bước 4 / 4 - Thông tin cá nhân', accent: '#e53935' },
};

const COUNTRY_FLAGS = {
  'Đài Loan': '🇹🇼',
  'Trung Quốc': '🇨🇳',
  'Hàn Quốc': '🇰🇷',
  'Nhật Bản': '🇯🇵',
  'Úc': '🇦🇺',
  'Châu Âu': '🇪🇺',
  'Anh': '🇬🇧',
  'Mỹ': '🇺🇸',
  Canada: '🇨🇦',
};

const TYPE_ICONS = {
  'Tour trọn gói': '🚌',
  'Tự túc': '🚗',
  'Thăm thân': '👨‍👩‍👧‍👦',
};

const GROUP_ICONS = {
  'Một mình': '🙂',
  'Gia đình': '👨‍👩‍👧‍👦',
  'Bạn bè': '👥',
};

const normalizeRows = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
};

const buildPhotoUrl = (photo) => {
  if (!photo) return '';
  if (photo.startsWith('http') || photo.startsWith('/')) return photo;
  return `${API_BASE.replace(/\/api$/, '')}${photo}`;
};

function VisaPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [countries, setCountries] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  const [visaTypePrices, setVisaTypePrices] = useState([]);
  const [visaCountryDetails, setVisaCountryDetails] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionsError, setQuestionsError] = useState('');
  const [answerMap, setAnswerMap] = useState({});
  const [customerInfo, setCustomerInfo] = useState({
    ho_ten: 'Tùng',
    so_dien_thoai: '0982137123',
    email: 'tungtranvan@gmail.com',
    notes: 'Ghi chú thêm',
    agree: false,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [ticket, setTicket] = useState(null);
  

  useEffect(() => {
    let mounted = true;

    const fetchVisaData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/visa.php?action=get_visa`);
        const text = await res.text();
        if (!text || !text.trim()) {
          throw new Error('API visa trả về dữ liệu rỗng');
        }

        const data = JSON.parse(text);
        if (!res.ok || data?.status !== 'success') {
          throw new Error(data?.message || 'Không thể tải dữ liệu visa');
        }

        if (!mounted) return;
        setCountries(normalizeRows(data?.visa_countries));
        setVisaTypes(normalizeRows(data?.visa_types));
        setVisaTypePrices(normalizeRows(data?.visa_type_prices));
        setVisaCountryDetails(normalizeRows(data?.visa_country_details));
        setGroups(normalizeRows(data?.visa_nhom_khach));
        setError('');
      } catch (err) {
        if (!mounted) return;
        setError(err?.message || 'Không thể tải dữ liệu visa');
        setCountries([]);
        setVisaTypes([]);
        setVisaTypePrices([]);
        setVisaCountryDetails([]);
        setGroups([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchVisaData();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((country) => Number(country.visa_country_id) === Number(selectedCountryId)) || null,
    [countries, selectedCountryId]
  );

  const pricingRows = useMemo(() => {
    if (!selectedCountryId) return [];

    return visaTypePrices.map((typePrice) => {
      const matchedDetail = visaCountryDetails.find(
        (detail) =>
          Number(detail.visa_country_id) === Number(selectedCountryId) &&
          Number(detail.visa_type_id) === Number(typePrice.visa_type_id)
      );

      return {
        visa_type_id: typePrice.visa_type_id,
        visa_type: typePrice.visa_type,
        days_xu_ly: matchedDetail?.days_xu_ly || '',
        vnd_phi_dich_vu: matchedDetail?.vnd_phi_dich_vu,
        vnd_phi_lanh_su: matchedDetail?.vnd_phi_lanh_su,
        pham_vi_ap_dung: matchedDetail?.pham_vi_ap_dung || '',
      };
    });
  }, [selectedCountryId, visaTypePrices, visaCountryDetails]);

  const handleCountrySelect = (countryId) => {
    setSelectedCountryId(countryId);
  };

  const formatVnd = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return '';
    return `${new Intl.NumberFormat('us-US').format(number)} ₫`;
  };

  const formatConsularFee = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return '—';
    return `${number} USD`;
  };

  const handleTypeSelect = (typeId) => {
    setSelectedTypeId(typeId);
  };

  const handleGroupSelect = (groupId) => {
    setSelectedGroupId(groupId);
  };

  const handleStepBack = () => {
    if (currentStep === 1) return;
    if (currentStep === 2) {
      setSelectedTypeId('');
      setSelectedGroupId('');
      setCurrentStep(1);
      return;
    }

    if (currentStep === 3) {
      setCurrentStep(2);
      setQuestions([]);
      setAnswerMap({});
      return;
    }

    if (currentStep === 4) {
      setCurrentStep(3);
    }
  };

  const canProceedFromStep2 = Boolean(selectedTypeId && selectedGroupId);

  const areAllQuestionsAnswered = useMemo(() => {
    if (questions.length === 0) return false;

    const singleAnswerQuestions = questions.filter((q) => !q.is_multiple);
    if (singleAnswerQuestions.length === 0) return true;

    return singleAnswerQuestions.every((question) => {
      const value = answerMap[question.visa_cau_hoi_id];
      return value !== undefined && value !== null && value !== '';
    });
  }, [questions, answerMap]);

  const handleLoadQuestions = async () => {
    if (!selectedCountryId || !selectedTypeId || !selectedGroupId) return;

    try {
      setQuestionsLoading(true);
      setQuestionsError('');
      setSubmitError('');

      const params = new URLSearchParams({
        action: 'get_visa_cau_hoi',
        visa_country_id: String(selectedCountryId),
        visa_type_id: String(selectedTypeId),
        visa_nhom_khach_id: String(selectedGroupId),
      });

      const res = await fetch(API_BASE + '/visa.php?' + params.toString());
      const responseText = await res.text();

      if (!responseText || !responseText.trim()) {
        throw new Error('API trả về dữ liệu rỗng');
      }

      const data = JSON.parse(responseText);
      if (!res.ok || data?.status !== 'success') {
        throw new Error(data?.message || 'Không thể tải câu hỏi visa');
      }

      const visaCauHoi = normalizeRows(data?.visa_cau_hoi);
      const visaTraLoi = normalizeRows(data?.visa_tra_loi);

      const mappedQuestions = visaCauHoi.map((question) => ({
        ...question,
        is_multiple: Number(question.is_multiple) === 1,
        options: visaTraLoi.filter(
          (option) => Number(option.visa_cau_hoi_id) === Number(question.visa_cau_hoi_id)
        ),
      }));

      setQuestions(mappedQuestions);
      setAnswerMap({});
      setCurrentStep(3);
    } catch (err) {
      console.error('Visa: load questions failed', err);
      setQuestionsError(err?.message || 'Không thể tải câu hỏi');
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleStepNext = () => {
    if (currentStep === 1) {
      if (!selectedCountryId) return;
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      if (!canProceedFromStep2) return;
      handleLoadQuestions();
      return;
    }

    if (currentStep === 3) {
      const allAnswered = questions.every((question) => {
        const value = answerMap[question.visa_cau_hoi_id];
        if (question.is_multiple) {
          return Array.isArray(value) && value.length > 0;
        }
        return value !== undefined && value !== null && value !== '';
      });

      if (!allAnswered) {
        setQuestionsError('Vui lòng trả lời tất cả câu hỏi bắt buộc trước khi tiếp tục.');
        return;
      }

      setQuestionsError('');
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      const valid = customerInfo.ho_ten.trim() && customerInfo.so_dien_thoai.trim() && customerInfo.email.trim();
      if (!valid || !customerInfo.agree) {
        setSubmitError('Vui lòng điền đầy đủ thông tin và đồng ý lưu dữ liệu.');
        return;
      }

      const confirmed = window.confirm('Bạn xác nhận đã kiểm tra thông tin và muốn gửi form đánh giá visa?');
      if (confirmed) {
        handleSubmitVisaTest();
      }
    }
  };

  const toggleQuestionAnswer = (questionId, optionId, isMultiple) => {
    setQuestionsError('');
    setAnswerMap((prev) => {
      const currentValue = prev[questionId];

      if (isMultiple) {
        const currentSelections = Array.isArray(currentValue) ? currentValue : [];
        const hasSelected = currentSelections.includes(optionId);
        const nextSelections = hasSelected
          ? currentSelections.filter((item) => item !== optionId)
          : [...currentSelections, optionId];

        return { ...prev, [questionId]: nextSelections };
      }

      return { ...prev, [questionId]: optionId };
    });
  };

  const getSelectedOptions = (questionId) => {
    const value = answerMap[questionId];
    if (Array.isArray(value)) return value;
    if (value === undefined || value === null || value === '') return [];
    return [String(value)];
  };

  const buildQuestionPayload = () =>
    questions.flatMap((question) =>
      getSelectedOptions(question.visa_cau_hoi_id).map((selectedId) => ({
        visa_cau_hoi_id: Number(question.visa_cau_hoi_id),
        id_chon_lua: Number(selectedId),
      }))
    );

  const handleSubmitVisaTest = async () => {
    try {
      setSubmitLoading(true);
      setSubmitError('');
      setSubmitSuccess('');

      const payload = {
        visa_country_id: Number(selectedCountryId),
        visa_type_id: Number(selectedTypeId),
        visa_nhom_khach_id: Number(selectedGroupId),
        ho_ten: customerInfo.ho_ten.trim(),
        so_dien_thoai: customerInfo.so_dien_thoai.trim(),
        email: customerInfo.email.trim(),
        notes: customerInfo.notes.trim(),
        chon_lua: buildQuestionPayload(),
      };

      const res = await fetch(`${API_BASE}/visa.php?action=submit_visa_test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok || data?.status !== 'success') {
        throw new Error(data?.message || 'Không thể gửi dữ liệu đánh giá visa');
      }

      setSubmitSuccess('Đã ghi nhận thông tin thành công. Chúng tôi sẽ liên hệ với bạn sớm.');
      if (data?.random_code) {
        // chuyên hướng sang trang xem visa
        window.location.href = `/visa?random_code=${data.random_code}`;
      }
    } catch (err) {
      setSubmitError(err?.message || 'Không thể gửi dữ liệu');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderCountryStep = () => (
    <div className="visa-page__step visa-page__step--country">
      <h2 className="visa-page__title">Bạn muốn đi đâu?</h2>
      <p className="visa-page__subtitle">Chọn quốc gia hoặc khu vực bạn muốn xin visa du lịch</p>

      <div className="visa-page__country-grid">
        {countries.map((country) => {
          const isSelected = Number(country.visa_country_id) === Number(selectedCountryId);
          return (
            <button
              key={country.visa_country_id}
              type="button"
              className={`visa-page__country-card ${isSelected ? 'selected' : ''}`}
              onClick={() => handleCountrySelect(country.visa_country_id)}
            >
              <div className="visa-page__country-flag-wrap">
                {country.photo ? (
                  <img src={buildPhotoUrl(country.photo)} alt={country.country} className="visa-page__country-flag" />
                ) : (
                  <span className="visa-page__country-emoji">{COUNTRY_FLAGS[country.country] || '🌍'}</span>
                )}
                {isSelected && <span className="visa-page__country-check">✓</span>}
              </div>
              <div className="visa-page__country-name">{country.country}</div>
              {isSelected && <div className="visa-page__country-hint">Yêu cầu lãnh sự</div>}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderCountryPricing = () => {
    if (currentStep !== 1 || !selectedCountryId) return null;

    return (
      <div className="visa-page__pricing-wrap">
        <table className="visa-page__pricing-table">
          <thead>
            <tr>
              <th>Loại Visa</th>
              <th>Thời gian xử lý</th>
              <th>Phí dịch vụ</th>
              <th>Phí lãnh sự</th>
              <th>Phạm vi áp dụng</th>
            </tr>
          </thead>
          <tbody>
            {pricingRows.map((row) => {
              const serviceFee = Number(row.vnd_phi_dich_vu)||0;
              const isFree = Number.isFinite(serviceFee) && serviceFee === 0;
              const hasData = row.days_xu_ly || row.pham_vi_ap_dung || isFree || serviceFee > 0;

              if (!hasData) {
                return null;
              }

              return (
                <tr key={row.visa_type_id}>
                  <td><strong>{row.visa_type}</strong></td>
                  <td>
                    {row.days_xu_ly ? <span className="visa-page__pricing-days">⏱ {row.days_xu_ly}</span> : '—'}
                  </td>
                  <td>
                    {isFree ? (
                      <span className="visa-page__pricing-free">✓ Miễn phí</span>
                    ) : (
                      <span className="visa-page__pricing-price">{formatVnd(row.vnd_phi_dich_vu) || '—'}</span>
                    )}
                  </td>
                  <td>{(row.vnd_phi_lanh_su)}</td>
                  <td className="visa-page__pricing-scope">{row.pham_vi_ap_dung || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTypeAndGroupStep = () => (
    <div className="visa-page__step visa-page__step--travel">
      <h2 className="visa-page__title">Hình thức đi {selectedCountry?.country || 'đi nước bạn'}</h2>
      <p className="visa-page__subtitle">Thống tin này ảnh hưởng đến bộ câu hỏi phù hợp cho bạn</p>

      <div className="visa-page__option-section">
        <div className="visa-page__option-label">HÌNH THỨC ĐI</div>
        <div className="visa-page__type-grid">
          {visaTypes.map((type) => {
            const isSelected = Number(type.visa_type_id) === Number(selectedTypeId);
            return (
              <button
                key={type.visa_type_id}
                type="button"
                className={`visa-page__card-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleTypeSelect(type.visa_type_id)}
              >
                <div className="visa-page__card-icon">{TYPE_ICONS[type.visa_type] || '✈️'}</div>
                <span>{type.visa_type}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="visa-page__option-section">
        <div className="visa-page__option-label">NHÓM HÀNH KHÁCH</div>
        <div className="visa-page__group-grid">
          {groups.map((group) => {
            const isSelected = Number(group.visa_nhom_khach_id) === Number(selectedGroupId);
            return (
              <button
                key={group.visa_nhom_khach_id}
                type="button"
                className={`visa-page__card-option ${isSelected ? 'selected' : ''}`}
                onClick={() => handleGroupSelect(group.visa_nhom_khach_id)}
              >
                <div className="visa-page__card-icon">{GROUP_ICONS[group.visa_nhom_khach] || '👤'}</div>
                <span>{group.visa_nhom_khach}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderQuestionStep = () => (
    <div className="visa-page__step visa-page__step--question">
      {questionsLoading ? (
        <div className="visa-page__empty">Đang tải câu hỏi phù hợp...</div>
      ) : questionsError ? (
        <div className="visa-page__empty visa-page__empty--error">{questionsError}</div>
      ) : questions.length === 0 ? (
        <div className="visa-page__empty">Chưa có câu hỏi cho lựa chọn này.</div>
      ) : (
        <>
          {!areAllQuestionsAnswered && (
            <div className="visa-page__validation-alert">
              ⚠️ Vui lòng trả lời tất cả câu hỏi để tiếp tục
            </div>
          )}
          <div className="visa-page__question-list">
          {questions.map((question, index) => {
            const selectedValues = getSelectedOptions(question.visa_cau_hoi_id);
            return (
              <div key={question.visa_cau_hoi_id} className="visa-page__question-item">
                <div className="visa-page__question-header">
                  <span className="visa-page__question-bullet">•</span>
                  <h2>
                    {index + 1}. {question.cau_hoi || question.tieu_de || 'Câu hỏi'}
                  </h2>
                </div>

                {question.tieu_de && (
                  <div className="visa-page__question-subtitle">{question.tieu_de}</div>
                )}

                <div className="visa-page__answer-row visa-page__answer-row--stacked">
                  {question.options?.map((option) => {
                    const optionId = String(option.id_chon_lua);
                    const checked = selectedValues.includes(optionId);
                    const isMultiple = Boolean(question.is_multiple);

                    return (
                      <label
                        key={`${question.visa_cau_hoi_id}-${option.id_chon_lua}`}
                        className={`visa-page__option-choice ${checked ? 'selected' : ''}`}
                      >
                        <input
                          type={isMultiple ? 'checkbox' : 'radio'}
                          name={`q-${question.visa_cau_hoi_id}`}
                          checked={checked}
                          onChange={() => toggleQuestionAnswer(question.visa_cau_hoi_id, optionId, isMultiple)}
                        />
                        <span>{option.chon_lua}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );

  const renderCustomerInfoStep = () => (
    <div className="visa-page__step visa-page__step--customer">
      <div className="visa-page__customer-form">
        <h2 className="visa-page__title">Ghi nhận thông tin người thực hiện</h2>
        <p className="visa-page__subtitle">Vui lòng điền thông tin để hệ thống lưu kết quả đánh giá Visa.</p>

        <div className="visa-page__form-grid">
          <label className="visa-page__field">
            <span>Họ và tên *</span>
            <input
              type="text"
              value={customerInfo.ho_ten}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, ho_ten: e.target.value }))}
              placeholder="Nhập họ và tên"
            />
          </label>

          <label className="visa-page__field">
            <span>Số điện thoại *</span>
            <input
              type="tel"
              value={customerInfo.so_dien_thoai}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, so_dien_thoai: e.target.value }))}
              placeholder="Nhập số điện thoại"
            />
          </label>

          <label className="visa-page__field visa-page__field--full">
            <span>Email *</span>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Nhập email"
            />
          </label>

          <label className="visa-page__field visa-page__field--full">
            <span>Notes</span>
            <textarea
              rows={4}
              value={customerInfo.notes}
              onChange={(e) => setCustomerInfo((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Nhập ghi chú hoặc yêu cầu bổ sung"
            />
          </label>
        </div>

        <label className="visa-page__checkbox-row">
          <input
            type="checkbox"
            checked={customerInfo.agree}
            onChange={(e) => setCustomerInfo((prev) => ({ ...prev, agree: e.target.checked }))}
          />
          <span>Thông tin của bạn được lưu để phục vụ đánh giá visa. Vui lòng kiểm tra dữ liệu trước khi gửi.</span>
        </label>
      </div>
    </div>
  );

  const renderWindow = () => {
    if (loading) {
      return <div className="visa-page__empty">Đang tải dữ liệu visa...</div>;
    }

    if (error) {
      return <div className="visa-page__empty visa-page__empty--error">{error}</div>;
    }

    if (currentStep === 1) return renderCountryStep();
    if (currentStep === 2) return renderTypeAndGroupStep();
    if (currentStep === 3) return renderQuestionStep();
    return renderCustomerInfoStep();
  };

    //nếu có query param random_code thì gọi api visa.php?action=get_visa_by_code&random_code=xxx để lấy thông tin của visa đã submitted
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const randomCode = urlParams.get('random_code');

    if (!randomCode) return;

    const fetchTicketInfo = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE}/visa.php?action=get_visa_by_code&random_code=${encodeURIComponent(randomCode)}`
        );
        const data = await response.json();

        if (data.status !== 'success') {
          throw new Error(data.message || 'Không thể lấy thông tin visa.');
        }

        setTicket(data.data || null);
      } catch (fetchErr) {
        console.error(fetchErr);
        setError('Không thể lấy thông tin visa. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchTicketInfo();
  }, []);

  return (
    <div className="visa-page">
      {ticket && ticket.random_code && (
        <div className="alert alert-success mb-3">
          <h2>Thông tin visa đã gửi:</h2>
          <ul className="mb-0">
            <li><strong>Mã visa:</strong> {ticket.random_code}</li>
            <li><strong>Họ tên:</strong> {ticket.ho_ten || 'N/A'}</li>
            <li><strong>Điện thoại:</strong> {ticket.so_dien_thoai || 'N/A'}</li>
            <li><strong>Email:</strong> {ticket.email || 'N/A'}</li>
            <li><strong>Thời gian gửi:</strong> {ticket.register_submit || 'N/A'}</li>
            <li><strong>Trạng thái:</strong> {ticket.visa_test_status || 'N/A'}</li>
            {ticket.notes && <li><strong>Ghi chú:</strong> {ticket.notes}</li>}
            <li><strong>Quốc gia:</strong> {ticket.country || 'N/A'}</li>
            <li><strong>Điểm theo công cụ đánh giá (chỉ mang tính chất tham khảo):</strong> {ticket.tong_diem || 'N/A'}/{ticket.total_max_point || 'N/A'}</li>
          </ul>
        </div>
      )}

      <section className="visa-page__hero">
        {/* <div className="visa-page__hero-badge">✦ Do đói ngũ Tư vấn Visa Lựa Việt phát triển ✦</div> */}
        <h1>
          Đánh giá <span>Xác suất</span>
          <br />
          Visa Du lịch của bạn
        </h1>
        <p>
          Công cụ đánh giá dựa trên chi tiêu, mục đích chuyến đi, độ tuổi, hiện trạng tài chính, và khả năng
          đáp ứng các tiêu chí nhập cảnh theo từng quốc gia.
        </p>

        <div className="visa-page__note-box">
          Lưu ý quan trọng: Kết quả từ công cụ này chỉ mang tính tham khảo và không thay thế quyết định của
          cơ quan xét duyệt visa. Lựa chọn không chắc chắn có thể khiến bạn mất phí hoặc bị từ chối visa.
        </div>
      </section>

      <section className="visa-page__stats">
        <div className="visa-page__stat-box">
          <div className="visa-page__stat-number">9</div>
          <div className="visa-page__stat-label">Quốc gia/Khu vực</div>
        </div>
        <div className="visa-page__stat-box">
          <div className="visa-page__stat-number">5'</div>
          <div className="visa-page__stat-label">Hoàn thành</div>
        </div>
        <div className="visa-page__stat-box">
          <div className="visa-page__stat-number">100%</div>
          <div className="visa-page__stat-label">Miễn phí</div>
        </div>
      </section>

      <section className="visa-page__wizard">
        <div className="visa-page__wizard-topbar">
          <div className="visa-page__wizard-title">{SECTION_META[currentStep]?.title || 'Chọn điểm đến'}</div>
          <div className="visa-page__wizard-step">{SECTION_META[currentStep]?.caption || 'Bước 1 / 5'}</div>
        </div>

        <div className="visa-page__wizard-inner">{renderWindow()}</div>

        {submitSuccess && <div className="visa-page__message visa-page__message--success">{submitSuccess}</div>}
        {submitError && <div className="visa-page__message visa-page__message--error">{submitError}</div>}

        {currentStep === 1 ? (
          <div className="visa-page__footer-actions visa-page__footer-actions--single">
            <button type="button" className="visa-page__next" onClick={handleStepNext} disabled={!selectedCountryId}>
              Thực hiện đánh giá thử →
            </button>
          </div>
        ) : (
          <div className="visa-page__footer-actions">
            <button type="button" className="visa-page__back" onClick={handleStepBack}>
              ← Quay lại
            </button>
            <button
              type="button"
              className="visa-page__next"
              onClick={handleStepNext}
              disabled={
                (currentStep === 2 && !canProceedFromStep2) ||
                (currentStep === 3 && (questionsLoading || !areAllQuestionsAnswered)) ||
                (currentStep === 4 && submitLoading)
              }
            >
              {currentStep === 2 ? 'Bắt đầu đánh giá' : currentStep === 3 ? 'Tiếp theo' : submitLoading ? 'Đang gửi...' : 'Gửi thông tin'} →
            </button>
          </div>
        )}

        {renderCountryPricing()}
      </section>
    </div>
  );
}

export default VisaPage;


