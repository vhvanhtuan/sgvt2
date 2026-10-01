(function () {
  const API_URL = '/api/cargo.php';
  const modalId = 'cargo-edit-modal';
  const token = localStorage.getItem('cms_token') || localStorage.getItem('api_token') || '';
  let modal = null;
  let root = null;
  let fields = null;
  let state = { cargoId: 'new', row: null, meta: null };
  let initialized = false;

  function redirectToLogin() {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('api_token');
    window.location.href = 'cms-login.html';
  }

  function isAuthError(data, response) {
    if (response && (response.status === 401 || response.status === 403)) return true;
    const msg = data && data.message ? String(data.message) : '';
    return data && data.success === false && /invalid|expired|missing.*authorization|missing.*auth|access denied/i.test(msg);
  }

  async function requestJson(url, opts = {}) {
    const headers = opts.headers ? Object.assign({}, opts.headers) : {};
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
    }
    if (!opts.method || opts.method.toUpperCase() === 'GET') {
      headers['Accept'] = 'application/json';
    }
    if (opts.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const response = await fetch(url, Object.assign({ credentials: 'same-origin' }, opts, { headers }));
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch (err) { data = { success: false, message: 'Invalid response', raw: text }; }
    if (isAuthError(data, response)) {
      redirectToLogin();
      return data;
    }
    return data;
  }

  function createOption(value, text) {
    const o = document.createElement('option');
    o.value = value;
    o.textContent = text;
    return o;
  }

  function populateSelect(select, items) {
    if (!select) return;
    select.innerHTML = '<option value="">-- Chọn --</option>';
    (items || []).forEach(it => {
      const option = createOption(
        it.id,
        it.label || it.name || it.branch_name || it.payment || it.status_title || it.route_name || it.route_abbr || it.bus_plate || it.bus_type_name || it.id
      );
      if (it.bus_plate) {
        option.dataset.bus_plate = it.bus_plate;
      }
      select.appendChild(option);
    });
  }

  function q(selector) {
    return root ? root.querySelector(selector) : null;
  }

  function setValue(el, value) {
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = Boolean(Number(value) || value === true);
    } else {
      el.value = value != null ? value : '';
    }
  }

  function getValue(el) {
    if (!el) return null;
    if (el.type === 'checkbox') return el.checked ? 1 : 0;
    return el.value;
  }

  function normalizeLookupText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function getDriverAutocompleteState(isSubDriver) {
    const key = isSubDriver ? 1 : 0;
    if (!window.__driverAutocompleteState) {
      window.__driverAutocompleteState = {
        0: { timer: null, requestId: 0 },
        1: { timer: null, requestId: 0 }
      };
    }
    return window.__driverAutocompleteState[key];
  }

  function ensureDriverAutocompletePanel(input) {
    if (!input) return null;
    const fieldGroup = input.closest('.field-group');
    if (!fieldGroup) return null;
    fieldGroup.style.position = 'relative';
    let panel = fieldGroup.querySelector('.driver-autocomplete-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'driver-autocomplete-panel';
      panel.style.cssText = 'display:none; position:absolute; left:0; right:0; top:calc(100% + 4px); z-index:10020; background:#fff; border:1px solid #cbd5e1; border-radius:8px; box-shadow:0 10px 24px rgba(15,23,42,0.18); max-height:240px; overflow:auto; padding:4px 0;';
      fieldGroup.appendChild(panel);
    }
    return panel;
  }

  function hideDriverAutocomplete(panel) {
    if (!panel) return;
    panel.style.display = 'none';
    panel.innerHTML = '';
  }

  function renderDriverAutocomplete(panel, items, isSubDriver) {
    if (!panel) return;
    panel.innerHTML = '';
    const header = document.createElement('div');
    header.style.cssText = 'padding:6px 12px; font-size:11px; font-weight:700; color:#64748b; border-bottom:1px solid #e2e8f0; text-transform:uppercase; letter-spacing:0.04em;';
    header.textContent = isSubDriver ? 'Phụ xế' : 'Tài xế';
    panel.appendChild(header);

    if (!Array.isArray(items) || !items.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:10px 12px; color:#64748b; font-size:13px;';
      empty.textContent = 'Không tìm thấy tài xế phù hợp.';
      panel.appendChild(empty);
      panel.style.display = 'block';
      return;
    }

    items.forEach(name => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.driverName = name;
      button.style.cssText = 'display:block; width:100%; text-align:left; border:0; background:transparent; padding:8px 12px; cursor:pointer; font-size:13px; line-height:1.35;';
      button.textContent = name;
      panel.appendChild(button);
    });

    panel.style.display = 'block';
  }

  async function loadDriverSuggestions(query, isSubDriver) {
    const params = new URLSearchParams();
    params.set('action', 'get_drivers');
    params.set('driver_name', query);
    if (isSubDriver) params.set('is_sub_driver', '1');
    const response = await requestJson(`${API_URL}?${params.toString()}`);
    if (!response || !response.success || !Array.isArray(response.data)) {
      return [];
    }
    const seen = new Set();
    return response.data
      .map(item => String(item.label || item.driver_name || item.name || '').trim())
      .filter(name => Boolean(name))
      .filter(name => {
        const key = normalizeLookupText(name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, 12);
  }

  function bindDriverAutocomplete(input, isSubDriver) {
    if (!input || input.dataset.driverAutocompleteBound) return;
    const panel = ensureDriverAutocompletePanel(input);
    if (!panel) return;
    const state = getDriverAutocompleteState(isSubDriver);

    const closePanel = () => hideDriverAutocomplete(panel);

    const openPanel = async () => {
      const query = String(input.value || '').trim();
      if (query.length < 2) {
        closePanel();
        return;
      }
      const requestId = ++state.requestId;
      panel.innerHTML = '<div style="padding:10px 12px; color:#64748b; font-size:13px;">Đang tìm tài xế...</div>';
      panel.style.display = 'block';
      const items = await loadDriverSuggestions(query, isSubDriver);
      if (requestId !== state.requestId) return;
      renderDriverAutocomplete(panel, items, isSubDriver);
    };

    input.addEventListener('input', () => {
      clearTimeout(state.timer);
      state.timer = setTimeout(openPanel, 180);
    });

    input.addEventListener('focus', () => {
      if (String(input.value || '').trim().length >= 2) {
        openPanel();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (!panel.matches(':hover')) {
          closePanel();
        }
      }, 160);
    });

    panel.addEventListener('mousedown', (event) => {
      const button = event.target.closest('[data-driver-name]');
      if (!button) return;
      event.preventDefault();
      clearTimeout(state.timer);
      state.requestId += 1;
      input.value = String(button.dataset.driverName || '');
      input.dispatchEvent(new Event('change', { bubbles: true }));
      closePanel();
    });

    input.dataset.driverAutocompleteBound = '1';
  }

  function parseNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const n = Number(String(value).replace(/[\,\s]/g, ''));
    return Number.isFinite(n) ? n : 0;
  }

  function setStatusText(status, code) {
    const statusEl = q('#cargo-status-pill');
    const codeEl = q('#cargo-code-pill');
    if (statusEl) statusEl.textContent = status || 'Mới';
    if (codeEl) codeEl.textContent = `Mã: ${code || '-'}`;
  }

  function show() {
    if (!modal) return;
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('show'), 20);
  }

  function hide(reload = true) {
    if (!modal) return;
    modal.classList.remove('show');
    setTimeout(async () => {
      modal.style.display = 'none';
      if (reload) {
        if (window.location.pathname.includes('ticket-departure')) {
            await loadDepartures();
            document.getElementById('dept_id').value = window.currentDept.dept_id;
            loadDeptInfo(window.currentDept.dept_id);
// window.location.reload();
        } else {
          if (typeof window.loadList === 'function') window.loadList(1);
          if (typeof window.loadDepartures === 'function') window.loadDepartures();
          if (typeof window.loadDeptInfo === 'function' && state.cargoId && state.cargoId !== 'new') window.loadDeptInfo(state.cargoId);
        }
      }
    }, 160);
  }

  function resetForm(initial = {}) {
    setValue(fields.route_id, initial.route_id || '');
    setValue(fields.dept_date, initial.dept_date || '');
    setValue(fields.dept_time, initial.dept_time || '');
    setValue(fields.dept_notes, initial.dept_notes || '');
    setValue(fields.bus_id, initial.bus_id || '');
    setValue(fields.bus_plate, initial.bus_plate || '');
    setValue(fields.bus_type, initial.bus_type || '');
    setValue(fields.bus_notes, initial.bus_notes || '');
    setValue(fields.driver, initial.driver || '');
    setValue(fields.driver_mobile, initial.driver_mobile || '');
    setValue(fields.sub_driver, initial.sub_driver || '');
    setValue(fields.sub_driver_mobile, initial.sub_driver_mobile || '');
    setValue(fields.ticket_vnd, initial.ticket_vnd || '0');
    setValue(fields.status_id, initial.status_id || '');
    setValue(fields.cargo_only, initial.cargo_only || 0);
    setStatusText('Mới', '---');
    if (fields.bus_id) updateBusPlate();
  }

  async function loadMeta() {
    const data = await requestJson(`${API_URL}?action=meta_departures`);
    if (!data || !data.success) {
      alert('Không tải được metadata phơi.');
      return false;
    }
    state.meta = data;
    const opts = data.options || {};
    populateSelect(fields.route_id, opts.vexe_routes || []);
    populateSelect(fields.bus_id, opts.vexe_buses || []);
    populateSelect(fields.bus_type, opts.vexe_bus_types || []);
    populateSelect(fields.status_id, opts.vexe_cargo_status || []);
    return true;
  }

  async function loadDeparture(id) {
    const data = await requestJson(`${API_URL}?action=get_one_departure&dept_id=${encodeURIComponent(id)}`);
    if (!data || !data.success) {
      alert('Không tìm thấy chuyến này');
      return false;
    }
    state.row = data.row || {};
    setStatusText(state.row.status_label || 'Đã lưu', state.row.dept_id || '---');
    setValue(fields.route_id, state.row.route_id);
    setValue(fields.dept_date, state.row.dept_date);
    setValue(fields.dept_time, state.row.dept_time);
    setValue(fields.dept_notes, state.row.dept_notes);
    setValue(fields.bus_id, state.row.bus_id);
    setValue(fields.bus_plate, state.row.bus_plate);
    setValue(fields.bus_type, state.row.bus_type);
    setValue(fields.bus_notes, state.row.bus_notes);
    setValue(fields.driver, state.row.driver);
    setValue(fields.driver_mobile, state.row.driver_mobile);
    setValue(fields.sub_driver, state.row.sub_driver);
    setValue(fields.sub_driver_mobile, state.row.sub_driver_mobile);
    setValue(fields.ticket_vnd, state.row.ticket_vnd);
    setValue(fields.status_id, state.row.status_id);
    setValue(fields.cargo_only, state.row.cargo_only);
    return true;
  }

  function getFormData() {
    return {
      route_id: getValue(fields.route_id),
      dept_date: getValue(fields.dept_date),
      dept_time: getValue(fields.dept_time),
      dept_notes: getValue(fields.dept_notes),
      bus_id: getValue(fields.bus_id),
      bus_plate: getValue(fields.bus_plate),
      bus_type: getValue(fields.bus_type),
      bus_notes: getValue(fields.bus_notes),
      driver: getValue(fields.driver),
      driver_mobile: getValue(fields.driver_mobile),
      sub_driver: getValue(fields.sub_driver),
      sub_driver_mobile: getValue(fields.sub_driver_mobile),
      ticket_vnd: parseNumber(getValue(fields.ticket_vnd)),
      status_id: getValue(fields.status_id),
      cargo_only: getValue(fields.cargo_only)
    };
  }

  function validateForm(payload) {
    const errors = [];
    if (!payload.route_id) errors.push('Tuyến là bắt buộc.');
    if (!payload.dept_date) errors.push('Ngày khởi hành là bắt buộc.');
    if (!payload.dept_time) errors.push('Giờ khởi hành là bắt buộc.');
    if (!payload.ticket_vnd || payload.ticket_vnd <= 0) errors.push('Giá vé phải lớn hơn 0.');
    return errors;
  }

  async function save() {
    const payload = getFormData();
    const errors = validateForm(payload);
    if (errors.length) {
      alert(errors.join('\n'));
      return null;
    }
    const action = state.cargoId === 'new' ? 'insert_departure' : 'edit_departure';
    const endpoint = `${API_URL}?action=${action}${state.cargoId === 'new' ? '' : '&id=' + encodeURIComponent(state.cargoId)}`;
    const res = await requestJson(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (!res || !res.success) {
      alert(res?.message || 'Lưu thất bại');
      return null;
    }
    state.cargoId = res.insert_id || state.cargoId;
    if (res.row) state.row = res.row;
    // Lưu dept_id vào localStorage nếu ở ticket-departure.html
    if (window.location.pathname.includes('ticket-departure')) {
      try { localStorage.setItem('td_dept_id', String(state.cargoId)); } catch (e) {}
    }
    // alert('Lưu thành công!');
    hide(true);
    return res;
  }

  async function cancelOrder() {
    if (state.cargoId === 'new') return;
    const confirmed = confirm('Bạn có chắc chắn muốn xóa chuyến này?');
    if (!confirmed) return;
    const res = await requestJson(`${API_URL}?action=delete_departure&id=${encodeURIComponent(state.cargoId)}`, { method: 'POST' });
    if (!res || !res.success) {
      alert(res?.message || 'Xóa chuyến thất bại');
      return;
    }
    alert('Đã xóa chuyến.');
    hide(true);
  }

  function updateBusPlate() {
    if (!fields.bus_id || !fields.bus_plate) return;
    const busId = getValue(fields.bus_id);
    if (!busId) return;
    const option = fields.bus_id.querySelector(`option[value="${busId}"]`);
    if (option && option.dataset.bus_plate) {
      setValue(fields.bus_plate, option.dataset.bus_plate);
    }
  }

  function createModalIfMissing() {
    if (document.getElementById(modalId)) return;
    const template = `
      <div id="${modalId}" class="cargo-modal" role="dialog" aria-modal="true" style="display:none;">
        <div class="cargo-modal-backdrop"></div>
        <div class="cargo-modal-dialog">
          <div class="cargo-modal-body" style="height:100%; padding:0px; overflow:auto;">
            <div class="page-shell">
              <div class="page-title">
                <div>
                  <h1>Thêm/sửa chuyến xe (phơi)</h1>
                  <div class="status-bar">
                    <span class="status-pill" id="cargo-status-pill">Mới</span>
                    <span class="status-pill" id="cargo-code-pill">Mã: -</span>
                  </div>
                </div>
                <div class="toolbar no-print">
                  <button class="cms-btn" id="btn-save" type="button"><i class="fa fa-save"></i> Lưu</button>
                  <button class="cms-btn danger" id="btn-cancel-order" type="button"><i class="fa fa-ban"></i> Hủy chuyến</button>
                  <button class="cms-btn cms-btn-back" id="btn-back" type="button"><i class="fa fa-arrow-left"></i> Đóng</button>
                </div>
              </div>

              <div class="card">
                <div class="form-section-title">Thông tin chuyến xe</div>
                <div class="form-grid">
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="route_id">Tuyến <span style="color:#d00">*</span></label>
                    <select name="route_id" id="route_id" required></select>
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="dept_date">Ngày <span style="color:#d00">*</span></label>
                    <input name="dept_date" type="date" id="dept_date" required />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="dept_time">Giờ <span style="color:#d00">*</span></label>
                    <input name="dept_time" type="time" id="dept_time" required />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="ticket_vnd">Giá vé <span style="color:#d00">*</span></label>
                    <input name="ticket_vnd" type="text" id="ticket_vnd" required />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="dept_notes">Ghi chú</label>
                    <input name="dept_notes" type="text" id="dept_notes" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="bus_id">Xe</label>
                    <select name="bus_id" id="bus_id" required></select>
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="bus_plate">BKS</label>
                    <input name="bus_plate" type="text" id="bus_plate" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="bus_type">Loại <span style="color:#d00">*</span></label>
                    <select name="bus_type" id="bus_type" required></select>
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="bus_notes">Ghi chú xe</label>
                    <input name="bus_notes" type="text" id="bus_notes" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="driver">Tài xế</label>
                    <input type="text" id="driver" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="driver_mobile">SĐT tài xế</label>
                    <input type="text" id="driver_mobile" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="sub_driver">Phụ xế</label>
                    <input type="text" id="sub_driver" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="sub_driver_mobile">SĐT phụ xế</label>
                    <input type="text" id="sub_driver_mobile" />
                  </div>
                  <div class="field-group" style="grid-column: span 3;">
                    <label for="status_id">Trạng thái</label>
                    <select name="status_id" id="status_id" required></select>
                  </div>
                  <div class="field-group inline" style="grid-column: span 3;">
                    <input type="checkbox" id="cargo_only" />
                    <label for="cargo_only">Chỉ chở hàng</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = template;
    document.body.appendChild(wrapper.firstElementChild);
  }

  function initEditor() {
    if (initialized) return;
    createModalIfMissing();
    modal = document.getElementById(modalId);
    if (!modal) return;
    root = modal.querySelector('.page-shell');
    if (!root) return;
    fields = {
      route_id: q('#route_id'),
      dept_date: q('#dept_date'),
      dept_time: q('#dept_time'),
      dept_notes: q('#dept_notes'),
      bus_id: q('#bus_id'),
      bus_plate: q('#bus_plate'),
      bus_type: q('#bus_type'),
      bus_notes: q('#bus_notes'),
      driver: q('#driver'),
      driver_mobile: q('#driver_mobile'),
      sub_driver: q('#sub_driver'),
      sub_driver_mobile: q('#sub_driver_mobile'),
      ticket_vnd: q('#ticket_vnd'),
      status_id: q('#status_id'),
      cargo_only: q('#cargo_only')
    };

    bindDriverAutocomplete(fields.driver, false);
    bindDriverAutocomplete(fields.sub_driver, true);

    const btnSave = q('#btn-save');
    const btnBack = q('#btn-back');
    const btnCancelOrder = q('#btn-cancel-order');

    if (btnSave) btnSave.addEventListener('click', save);
    if (btnBack) btnBack.addEventListener('click', () => hide(false));
    if (btnCancelOrder) btnCancelOrder.addEventListener('click', cancelOrder);
    if (fields.bus_id) fields.bus_id.addEventListener('change', updateBusPlate);
    modal.addEventListener('click', (event) => {
      if (event.target === modal) hide(false);
    });
    initialized = true;
  }

  async function openEditor(id = 'new', initial = {}) {
    initEditor();
    if (!modal || !fields) return;
    state.cargoId = id || 'new';
    const ok = await loadMeta();
    if (!ok) return;
    if (state.cargoId === 'new') {
      resetForm(initial);
      if (initial.route_id) setValue(fields.route_id, initial.route_id);
      if (initial.dept_date) setValue(fields.dept_date, initial.dept_date);
      if (initial.dept_time) setValue(fields.dept_time, initial.dept_time);
      if (initial.ticket_vnd) setValue(fields.ticket_vnd, '120000');
      if (initial.status_id) setValue(fields.status_id, initial.status_id);
      if (initial.bus_type) setValue(fields.bus_type, '3');
      setStatusText('Mới', '---');
      show();
      return;
    }
    const loaded = await loadDeparture(state.cargoId);
    if (!loaded) return;
    show();
  }

  window.departureEditor = {
    open: openEditor,
    close: () => hide(true)
  };
})();
