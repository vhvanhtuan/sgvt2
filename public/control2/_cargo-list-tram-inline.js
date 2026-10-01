
function formatNumberString(value) {
    let raw = String(value || '');
    raw = raw.replace(/[^0-9.,]/g, '');
    raw = raw.replace(/,/g, '');
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
        return raw;
    }
    const parts = raw.split('.');
    const intPart = parts[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    const decimals = parts.slice(1).join('').replace(/[^0-9]/g, '');
    const formattedInt = intPart ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '0';
    return formattedInt + (decimals ? '.' + decimals : '');
}

function parseNumericValue(value) {
    if (value === undefined || value === null) return '';
    let raw = String(value).replace(/[^0-9.,]/g, '').replace(/,/g, '');
    const parts = raw.split('.');
    if (parts.length <= 1) return raw;
    return parts.shift() + '.' + parts.join('').replace(/\./g, '');
}

function sanitizeNumberInputValue(value) {
    return formatNumberString(parseNumericValue(value));
}

  const today = new Date().toISOString().split("T")[0];
  document.getElementById("modal-dept-date").setAttribute("min", today);
    
    const API_URL = '/api/cargo.php';
    const token = localStorage.getItem('cms_token') || localStorage.getItem('api_token') || '';
    if (!token) {
      window.location.href = 'cms-login.html';
    }

    const state = {
      meta: null,
      activeTab: 'outgoing',
      outgoing: { rows: [], selected: {}, page: 1, limit: 30, total: 0 },
      on_delivery: { rows: [], selected: {}, page: 1, limit: 30, total: 0 },
      on_delivery_to: { rows: [], selected: {}, page: 1, limit: 30, total: 0 },
      incoming: { rows: [], selected: {}, page: 1, limit: 30, total: 0 },
      delivered: { rows: [], selected: {}, page: 1, limit: 30, total: 0 },
      filters: {
        q: '',
        status_id: '',
        cod_service: '',
        dept_id: '',
        register_submit: '',
        onboard_at: '',
        offboard_at: '',
        receiver_money_confirmer_at: ''
      },
      moveOnboard: {
        selectedDeptId: null,
        departures: []
      },
      deliver: {
        cargo: null
      }
    };

    const elems = {
      search: document.getElementById('filter-search'),
      status: document.getElementById('filter-status'),
      dept: document.getElementById('filter-dept'),
      registerDate: document.getElementById('filter-register'),
      receiverConfirmedDate: document.getElementById('filter-receiver-confirmed'),
      codService: document.getElementById('filter-cod-service'),
      paidFilter: document.getElementById('filter-paid'),
      remainingFilter: document.getElementById('filter-remaining'),
      onboardBranch: document.getElementById('filter-onboard'),
      offboardBranch: document.getElementById('filter-offboard'),
      currentBranch: document.getElementById('current-branch'),
      limit: document.getElementById('filter-limit'),
      filterBtn: document.getElementById('btn-filter'),
      resetFilterBtn: document.getElementById('btn-reset-filter'),
      quickFilterCrBtn: document.getElementById('btn-quick-filter-cr'),
      quickFilterCcBtn: document.getElementById('btn-quick-filter-cc'),
      quickFilterWaitBoardBtn: document.getElementById('btn-quick-filter-wait-board'),
      quickFilterWaitDeliverBtn: document.getElementById('btn-quick-filter-wait-deliver'),
      refreshBtn: document.getElementById('btn-refresh'),
      selectAllPageOutgoing: document.getElementById('select-all-page-outgoing'),
      selectAllPageOnDelivery: document.getElementById('select-all-page-on-delivery'),
      selectAllPageIncoming: document.getElementById('select-all-page-incoming'),
      selectAllPageDelivered: document.getElementById('select-all-page-delivered'),
      selectAllButton: document.getElementById('btn-select-all'),
      clearSelectionButton: document.getElementById('btn-clear-selection'),
      moveOnboard: document.getElementById('btn-move-onboard'),
      moveOffboard: document.getElementById('btn-move-offboard'),
      deliverModal: document.getElementById('deliver-customer-modal'),
      deliverCode: document.getElementById('deliver-code'),
      deliverStatus: document.getElementById('deliver-status'),
      deliverPassName: document.getElementById('deliver-pass-name'),
      deliverPassMobile: document.getElementById('deliver-pass-mobile'),
      deliverOnboardBranch: document.getElementById('deliver-onboard-branch'),
      deliverOffboardBranch: document.getElementById('deliver-offboard-branch'),
      deliverReceiverName: document.getElementById('deliver-receiver-name'),
      deliverReceiverMobile: document.getElementById('deliver-receiver-mobile'),
      deliverTotal: document.getElementById('deliver-total'),
      deliverSenderPaid: document.getElementById('deliver-sender-paid'),
      deliverReceiverPaid: document.getElementById('deliver-receiver-paid'),
      deliverPaymentMethod: document.getElementById('deliver-payment-method'),
      deliverNotes: document.getElementById('deliver-notes'),
      deliverConfirm: document.getElementById('btn-confirm-deliver'),
      deliverCancel: document.getElementById('btn-cancel-deliver'),
      deliverClose: document.querySelector('#deliver-customer-modal .cargo-modal-close'),
      tabOutgoingBtn: document.getElementById('tab-outgoing'),
      tabOnDeliveryBtn: document.getElementById('tab-on-delivery'),
      tabOnDeliveryToBtn: document.getElementById('tab-on-delivery-to'),
      tabIncomingBtn: document.getElementById('tab-incoming'),
      tabDeliveredBtn: document.getElementById('tab-delivered'),
      tableBodyOutgoing: document.getElementById('cargo-table-body-outgoing'),
      tableBodyOnDelivery: document.getElementById('cargo-table-body-on-delivery'),
      tableBodyOnDeliveryTo: document.getElementById('cargo-table-body-on-delivery-to'),
      tableBodyIncoming: document.getElementById('cargo-table-body-incoming'),
      tableBodyDelivered: document.getElementById('cargo-table-body-delivered'),
      paginationOutgoing: document.getElementById('pagination-outgoing'),
      paginationOnDelivery: document.getElementById('pagination-on-delivery'),
      paginationOnDeliveryTo: document.getElementById('pagination-on-delivery-to'),
      paginationIncoming: document.getElementById('pagination-incoming'),
      paginationDelivered: document.getElementById('pagination-delivered'),
      summaryTotalOutgoing: document.getElementById('summary-total-outgoing'),
      summarySelectedOutgoing: document.getElementById('summary-selected-outgoing'),
      summarySelectedAmountOutgoing: document.getElementById('summary-selected-amount-outgoing'),
      summaryPaidOutgoing: document.getElementById('summary-paid-outgoing'),
      summaryRemainingOutgoing: document.getElementById('summary-remaining-outgoing'),
      summaryTotalOnDelivery: document.getElementById('summary-total-on-delivery'),
      summarySelectedOnDelivery: document.getElementById('summary-selected-on-delivery'),
      summarySelectedAmountOnDelivery: document.getElementById('summary-selected-amount-on-delivery'),
      summaryPaidOnDelivery: document.getElementById('summary-paid-on-delivery'),
      summaryRemainingOnDelivery: document.getElementById('summary-remaining-on-delivery'),
      summaryTotalOnDeliveryTo: document.getElementById('summary-total-on-delivery-to'),
      summarySelectedOnDeliveryTo: document.getElementById('summary-selected-on-delivery-to'),
      summarySelectedAmountOnDeliveryTo: document.getElementById('summary-selected-amount-on-delivery-to'),
      summaryPaidOnDeliveryTo: document.getElementById('summary-paid-on-delivery-to'),
      summaryRemainingOnDeliveryTo: document.getElementById('summary-remaining-on-delivery-to'),
      summaryTotalIncoming: document.getElementById('summary-total-incoming'),
      summarySelectedIncoming: document.getElementById('summary-selected-incoming'),
      summarySelectedAmountIncoming: document.getElementById('summary-selected-amount-incoming'),
      summaryPaidIncoming: document.getElementById('summary-paid-incoming'),
      summaryRemainingIncoming: document.getElementById('summary-remaining-incoming'),
      summaryTotalDelivered: document.getElementById('summary-total-delivered'),
      summarySelectedDelivered: document.getElementById('summary-selected-delivered',
      summarySelectedAmountDelivered: document.getElementById('summary-selected-amount-delivered'),
      summaryPaidDelivered: document.getElementById('summary-paid-delivered'),
      summaryRemainingDelivered: document.getElementById('summary-remaining-delivered'),
      emptyStateOutgoing: document.getElementById('cargo-empty-outgoing'),
      emptyStateOnDelivery: document.getElementById('cargo-empty-on-delivery'),
      emptyStateOnDeliveryTo: document.getElementById('cargo-empty-on-delivery-to'),
      emptyStateIncoming: document.getElementById('cargo-empty-incoming'),
      emptyStateDelivered: document.getElementById('cargo-empty-delivered'),
      selectAllPageOnDeliveryTo: document.getElementById('select-all-page-on-delivery-to'),
      moveOnboardModal: document.getElementById('move-onboard-modal'),
      modalRoute: document.getElementById('modal-route-select'),
      modalDate: document.getElementById('modal-dept-date'),
      modalDeparturesBody: document.getElementById('modal-departures-body'),
      modalConfirm: document.getElementById('btn-confirm-move-onboard'),
      modalCancel: document.getElementById('btn-cancel-move-onboard'),
      modalClose: document.querySelector('.cargo-modal-close')
    };

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
      const headers = opts.headers || {};
      headers['Authorization'] = 'Bearer ' + token;
      if (!opts.method || opts.method.toUpperCase() === 'GET') {
        headers['Accept'] = 'application/json';
      }
      if (opts.body && !opts.headers?.['Content-Type']) {
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

    function formatCurrency(num) {
      const n = Number(num);
      if (!isFinite(n)) return '0';
      return n.toLocaleString('vi-VN');
    }

    function getFilterStorageKey() {
      return 'cargoListFilters';
    }

    function getTabStorageKey() {
      return 'cargoListActiveTab';
    }

    function saveFiltersToStorage() {
      const filterData = {
        // q: elems.search.value.trim(),
        status_id: elems.status.value,
        cod_service: elems.codService.value,
        paid_filter: elems.paidFilter.value,
        remaining_filter: elems.remainingFilter.value,
        dept_id: elems.dept.value,
        register_submit: elems.registerDate.value,
        receiver_money_confirmer_at: elems.receiverConfirmedDate.value,
        onboard_at: elems.onboardBranch.value,
        offboard_at: elems.offboardBranch.value,
        limit: elems.limit.value,
        page: state[state.activeTab]?.page || 1
      };
      localStorage.setItem(getFilterStorageKey(), JSON.stringify(filterData));
    }

    function saveActiveTabToStorage(tab) {
      if (!tab) return;
      localStorage.setItem(getTabStorageKey(), tab);
    }

    function loadActiveTabFromStorage() {
      const saved = localStorage.getItem(getTabStorageKey());
      const validTabs = ['outgoing', 'on_delivery', 'on_delivery_to', 'incoming', 'delivered'];
      if (saved && validTabs.includes(saved)) {
        state.activeTab = saved;
      }
    }

    function loadFiltersFromStorage() {
      const raw = localStorage.getItem(getFilterStorageKey());
      if (!raw) return;
      try {
        const saved = JSON.parse(raw);
        if (saved.q !== undefined) elems.search.value = saved.q;
        if (saved.status_id !== undefined) elems.status.value = saved.status_id;
        if (saved.cod_service !== undefined) elems.codService.value = saved.cod_service;
        if (saved.paid_filter !== undefined) elems.paidFilter.value = saved.paid_filter;
        if (saved.remaining_filter !== undefined) elems.remainingFilter.value = saved.remaining_filter;
        if (saved.dept_id !== undefined) elems.dept.value = saved.dept_id;
        if (saved.register_submit !== undefined) elems.registerDate.value = saved.register_submit;
        if (saved.receiver_money_confirmer_at !== undefined) elems.receiverConfirmedDate.value = saved.receiver_money_confirmer_at;
        if (saved.onboard_at !== undefined) elems.onboardBranch.value = saved.onboard_at;
        if (saved.offboard_at !== undefined) elems.offboardBranch.value = saved.offboard_at;
        if (saved.limit !== undefined) elems.limit.value = saved.limit;
        if (saved.page !== undefined) {
          const pageValue = Number(saved.page) || 1;
          state.outgoing.page = pageValue;
          state.on_delivery.page = pageValue;
          state.on_delivery_to.page = pageValue;
          state.incoming.page = pageValue;
          state.delivered.page = pageValue;
        }
      } catch (err) {
        console.warn('Không thể đọc filter session', err);
      }
    }

    function resetFilters() {
      elems.search.value = '';
      elems.status.value = '';
      elems.codService.value = '';
      elems.paidFilter.value = '';
      elems.remainingFilter.value = '';
      elems.dept.value = '';
      elems.registerDate.value = '';
      elems.receiverConfirmedDate.value = '';
      elems.onboardBranch.value = '';
      elems.offboardBranch.value = '';
      elems.limit.value = '100';
      state.outgoing.page = 1;
      state.on_delivery.page = 1;
      state.on_delivery_to.page = 1;
      state.incoming.page = 1;
      state.delivered.page = 1;
      applyPageSelection(state.activeTab, false);
      saveFiltersToStorage();
      loadList(1);
    }

    function renderSummary(tab) {
      const tabState = state[tab];
      const map = {
        outgoing: {
          total: elems.summaryTotalOutgoing,
          selected: elems.summarySelectedOutgoing,
          amount: elems.summarySelectedAmountOutgoing,
          paid: elems.summaryPaidOutgoing,
          remaining: elems.summaryRemainingOutgoing
        },
        on_delivery: {
          total: elems.summaryTotalOnDelivery,
          selected: elems.summarySelectedOnDelivery,
          amount: elems.summarySelectedAmountOnDelivery,
          paid: elems.summaryPaidOnDelivery,
          remaining: elems.summaryRemainingOnDelivery
        },
        on_delivery_to: {
          total: elems.summaryTotalOnDeliveryTo,
          selected: elems.summarySelectedOnDeliveryTo,
          amount: elems.summarySelectedAmountOnDeliveryTo,
          paid: elems.summaryPaidOnDeliveryTo,
          remaining: elems.summaryRemainingOnDeliveryTo
        },
        incoming: {
          total: elems.summaryTotalIncoming,
          selected: elems.summarySelectedIncoming,
          amount: elems.summarySelectedAmountIncoming,
          paid: elems.summaryPaidIncoming,
          remaining: elems.summaryRemainingIncoming
        },
        delivered: {
          total: elems.summaryTotalDelivered,
          selected: elems.summarySelectedDelivered,
          amount: elems.summarySelectedAmountDelivered,
          paid: elems.summaryPaidDelivered,
          remaining: elems.summaryRemainingDelivered
        }
      };
      const target = map[tab] || map.outgoing;
      const selectedItems = Object.values(tabState.selected);
      const count = selectedItems.length;
      const sumTotal = selectedItems.reduce((s, row) => s + (Number(row.total_company_receive) || 0), 0);
      const sumPaid = selectedItems.reduce((s, row) => s + (Number(row.sender_paid_vnd) || 0), 0);
      const sumRemaining = selectedItems.reduce((s, row) => s + (Number(row.receiver_paid_vnd) || 0), 0);

      if (target.total) target.total.textContent = `Tổng: ${formatNumberDisplay(tabState.total)} đơn`;
      if (target.selected) target.selected.textContent = `Đã chọn: ${formatNumberDisplay(count)} đơn`;
      if (target.amount) target.amount.textContent = `Tổng tiền: ${formatNumberDisplay(sumTotal)} đ`;
      if (target.paid) target.paid.textContent = `Đã trả: ${formatNumberDisplay(sumPaid)} đ`;
      if (target.remaining) target.remaining.textContent = `Còn lại: ${formatNumberDisplay(sumRemaining)} đ`;
    }

    async function loadModalDepartures() {
      const routeId = elems.modalRoute.value;
      const deptDate = elems.modalDate.value;
      if (!routeId || !deptDate) {
        elems.modalDeparturesBody.innerHTML = '<tr><td colspan="3" class="text-center">Chọn tuyến và ngày.</td></tr>';
        return;
      }
      elems.modalDeparturesBody.innerHTML = '<tr><td colspan="3" class="text-center">Đang tải...</td></tr>';
      const data = await requestJson(`${API_URL}?action=departures&route_id=${encodeURIComponent(routeId)}&dept_date=${encodeURIComponent(deptDate)}`);
      if (!data || !data.success) {
        elems.modalDeparturesBody.innerHTML = `<tr><td colspan="3" class="text-center text-danger">${data?.message || 'Lỗi tải phơi.'}</td></tr>`;
        return;
      }
      if (!Array.isArray(data.data) || data.data.length === 0) {
        elems.modalDeparturesBody.innerHTML = '<tr><td colspan="3" class="text-center">Không có phơi phù hợp.</td></tr>';
        return;
      }
      state.moveOnboard.departures = data.data;
      elems.modalDeparturesBody.innerHTML = data.data.map(dept => `
        <tr>
          <td class="checkbox-center"><input type="radio" name="modal-departure" value="${dept.dept_id}" ${state.moveOnboard.selectedDeptId === dept.dept_id ? 'checked' : ''} /></td>
          <td>${dept.dept_time || ''}</td>
          <td>${dept.bus_plate || ''}</td>
        </tr>
      `).join('');
      document.querySelectorAll('input[name="modal-departure"]').forEach(input => {
        input.addEventListener('change', () => {
          state.moveOnboard.selectedDeptId = Number(input.value);
        });
      });
    }

    function showMoveOnboardModal() {
      if (!state.meta) {
        alert('Không có metadata tuyến. Vui lòng tải lại trang.');
        return;
      }
      elems.modalRoute.innerHTML = '<option value="">-- Chọn tuyến --</option>' + (state.meta.options.routes || []).map(route => `<option value="${route.id}">${route.label}</option>`).join('');
      if (state.meta.options.routes && state.meta.options.routes.length > 0) {
        elems.modalRoute.value = state.meta.options.routes[0].id;
      }
      elems.modalDate.value = new Date().toISOString().slice(0, 10);
      state.moveOnboard.selectedDeptId = null;
      elems.moveOnboardModal.classList.add('show');
      loadModalDepartures();
    }

    function hideMoveOnboardModal() {
      elems.moveOnboardModal.classList.remove('show');
      state.moveOnboard.selectedDeptId = null;
      elems.modalDeparturesBody.innerHTML = '';
    }

    async function confirmMoveOnboard() {
      const ids = getSelectedIds();
      if (!ids.length) {
        alert('Vui lòng chọn ít nhất một đơn hàng.');
        return;
      }
      if (!state.moveOnboard.selectedDeptId) {
        alert('Vui lòng chọn một phơi.');
        return;
      }
      if (!confirm(`Xác nhận chuyển ${ids.length} đơn hàng lên phơi này?`)) {
        return;
      }
      const data = await requestJson(`${API_URL}?action=move_onboard`, {
        method: 'POST',
        body: JSON.stringify({ cargo_ids: ids, dept_id: state.moveOnboard.selectedDeptId })
      });
      if (!data || !data.success) {
        alert(data?.message || 'Lỗi khi chuyển lên xe.');
        return;
      }
      hideMoveOnboardModal();
      alert(`Đã chuyển ${data.updated_rows || ids.length} đơn lên xe.`);
      location.reload();
    }

    function showDeliverModal(row) {
      state.deliver.cargo = row;
      elems.deliverCode.value = row.random_code || row.ticket_code || row.cargo_id;
      elems.deliverStatus.value = row.status_label || '';
      elems.deliverPassName.value = row.pass_name || '';
      elems.deliverPassMobile.value = row.pass_mobile || '';
      elems.deliverOnboardBranch.value = row.onboard_branch || '';
      elems.deliverOffboardBranch.value = row.offboard_branch || '';
      elems.deliverReceiverName.value = row.reveiver_name || '';
      elems.deliverReceiverMobile.value = row.receiver_mobile || '';
      elems.deliverTotal.value = formatCurrency(row.total_company_receive) + ' đ';
      elems.deliverSenderPaid.value = formatCurrency(row.sender_paid_vnd) + ' đ';
      elems.deliverReceiverPaid.value = formatCurrency(row.receiver_paid_vnd) + ' đ';
      elems.deliverPaymentMethod.value = row.payment_method_label || '';
      elems.deliverNotes.value = row.notes || '';
      elems.deliverModal.classList.add('show');
    }

    function hideDeliverModal() {
      elems.deliverModal.classList.remove('show');
      state.deliver.cargo = null;
      elems.deliverNotes.value = '';
    }

    async function confirmDeliver() {
      const cargo = state.deliver.cargo;
      if (!cargo) {
        alert('Không có đơn hàng để giao khách.');
        return;
      }
      if (!confirm('Xác nhận giao khách cho đơn này?')) {
        return;
      }
      const data = await requestJson(`${API_URL}?action=deliver_customer`, {
        method: 'POST',
        body: JSON.stringify({ cargo_id: cargo.cargo_id, notes: elems.deliverNotes.value.trim() })
      });
      if (!data || !data.success) {
        alert(data?.message || 'Lỗi khi giao khách.');
        return;
      }
      hideDeliverModal();
      alert('Đã giao khách thành công.');
      location.reload();
    }

    function updatePageSelectCheckbox(tab) {
      const selector = `.row-checkbox-${tab}`;
      const allCheckboxes = Array.from(document.querySelectorAll(selector));
      const checkboxMap = {
        outgoing: elems.selectAllPageOutgoing,
        on_delivery: elems.selectAllPageOnDelivery,
        on_delivery_to: elems.selectAllPageOnDeliveryTo,
        incoming: elems.selectAllPageIncoming,
        delivered: elems.selectAllPageDelivered
      };
      const checkboxEl = checkboxMap[tab];
      if (!checkboxEl) return;
      if (allCheckboxes.length === 0) {
        checkboxEl.checked = false;
        checkboxEl.indeterminate = false;
        return;
      }
      const checkedCount = allCheckboxes.filter(cb => cb.checked).length;
      checkboxEl.checked = checkedCount === allCheckboxes.length;
      checkboxEl.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }

    function setActiveTab(tab) {
      state.activeTab = tab;
      saveActiveTabToStorage(tab);
      const tabs = ['outgoing', 'on_delivery', 'on_delivery_to', 'incoming', 'delivered'];
      tabs.forEach(name => {
        let key;
        if (name === 'on_delivery') key = 'OnDelivery';
        else if (name === 'on_delivery_to') key = 'OnDeliveryTo';
        else if (name === 'delivered') key = 'Delivered';
        else key = name.charAt(0).toUpperCase() + name.slice(1);
        const btn = elems[`tab${key}Btn`];
        const paneId = name === 'on_delivery' ? 'tab-pane-on-delivery' : name === 'on_delivery_to' ? 'tab-pane-on-delivery-to' : `tab-pane-${name}`;
        const pane = document.getElementById(paneId);
        if (btn) btn.classList.toggle('active', name === tab);
        if (pane) pane.classList.toggle('active', name === tab);
      });
      renderSummary(tab);
      updatePageSelectCheckbox(tab);
    }

    function toggleSelection(tab, cargoId, selected, rowData) {
      const tabState = state[tab];
      if (selected) {
        tabState.selected[cargoId] = rowData || tabState.selected[cargoId] || { cargo_id: cargoId };
      } else {
        delete tabState.selected[cargoId];
      }
      renderSummary(tab);
      updatePageSelectCheckbox(tab);
    }

    function buildRow(row, tab) {
      const checked = state[tab].selected[String(row.cargo_id)] ? 'checked' : '';
      const senderPaidClass = row.phieu_cr_da_thu ? 'text-danger' : '';
      const receiverPaidClass = row.phieu_cc_da_thu ? 'text-success' : '';
      const senderPaidTitle = row.phieu_cr_da_thu ? `Phiếu CR: ${row.phieu_cr_da_thu}` : '';
      const receiverPaidTitle = row.phieu_cc_da_thu ? `Phiếu CC: ${row.phieu_cc_da_thu}` : '';
      return `
        <tr class="${checked ? 'selected' : ''}">
          <td class="checkbox-center"><input type="checkbox" class="row-checkbox row-checkbox-${tab}" data-tab="${tab}" data-id="${row.cargo_id}" ${checked} /></td>
          <td><strong>${row.random_code || row.ticket_code || row.cargo_id}</strong><br><small>${row.cargo_id ? 'ID: ' + row.cargo_id : ''}</small></td>
          <td>${row.pass_name || ''}<br><small>${row.pass_mobile || ''}</small></td>
          <td>${row.unit_name || ''}</td>
          <td>${row.onboard_branch || ''}<br><small>${row.temp_onboard || ''}</small></td>
          <td>${row.offboard_branch || ''}<br><small>${row.temp_offboard || ''}</small></td>
          <td>${row.reveiver_name || ''}<br><small>${row.receiver_mobile || ''}</small></td>
          <td class="text-right">${formatNumberDisplay(row.total_company_receive)} đ</td>
          <td class="text-right ${senderPaidClass}" title="${senderPaidTitle}">${formatNumberDisplay(row.sender_paid_vnd)} đ</td>
          <td class="text-right ${receiverPaidClass}" title="${receiverPaidTitle}">${formatNumberDisplay(row.receiver_paid_vnd)} đ</td>
          <td>${row.payment_method_label || ''}</td>
          <td>${row.status_label || ''}  ${row.bus_plate ? `(${row.bus_plate})` : ''}</td>
          <td>${(row.register_submit || row.submit) ? new Date(row.register_submit || row.submit).toLocaleString('vi-VN') : ''}</td>
            <td class="text-right">
              <button class="btn btn-sm btn-primary btn-edit" data-id="${row.cargo_id}" title="Sửa">Sửa</button>
              ${(row.status_id===5) ? `<button class="btn btn-sm btn-secondary btn-deliver" data-id="${row.cargo_id}" title="Giao">Giao</button>` : ''}
            </td>
        </tr>
      `;
    }

    function renderPane(tab) {
      const tabState = state[tab];
      const rowMap = Object.fromEntries(tabState.rows.map(r => [String(r.cargo_id), r]));
      let suffix;
      if (tab === 'on_delivery') suffix = 'OnDelivery';
      else if (tab === 'on_delivery_to') suffix = 'OnDeliveryTo';
      else if (tab === 'delivered') suffix = 'Delivered';
      else suffix = tab.charAt(0).toUpperCase() + tab.slice(1);
      const body = elems[`tableBody${suffix}`];
      const emptyState = elems[`emptyState${suffix}`];
      if (!body || !emptyState) return;
      const tableHtml = tabState.rows.map(row => buildRow(row, tab)).join('');
      body.innerHTML = tableHtml;
      emptyState.style.display = tabState.rows.length ? 'none' : 'block';

      const checkboxes = Array.from(body.querySelectorAll(`.row-checkbox-${tab}`));
      checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const id = cb.dataset.id;
          toggleSelection(tab, id, cb.checked, rowMap[id]);
          cb.closest('tr')?.classList.toggle('selected', cb.checked);
        });
      });

      const editButtons = Array.from(body.querySelectorAll('.btn-edit'));
      editButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          showCargoEditModal(id);
        });
      });

      const deliverButtons = Array.from(body.querySelectorAll('.btn-deliver'));
      deliverButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.dataset.id;
          const row = rowMap[String(id)];
          if (!row) { alert('Không tìm thấy đơn hàng.'); return; }
          showDeliverModal(row);
        });
      });

      renderPagination(tab);
      renderSummary(tab);
      updatePageSelectCheckbox(tab);
    }

    function renderPagination(tab) {
      const tabState = state[tab];
      let paginationSuffix;
      if (tab === 'on_delivery') paginationSuffix = 'OnDelivery';
      else if (tab === 'on_delivery_to') paginationSuffix = 'OnDeliveryTo';
      else if (tab === 'delivered') paginationSuffix = 'Delivered';
      else paginationSuffix = tab.charAt(0).toUpperCase() + tab.slice(1);
      const paginationKey = `pagination${paginationSuffix}`;
      const container = elems[paginationKey];
      const totalPages = Math.max(1, Math.ceil((tabState.total || 0) / (tabState.limit || 1)));
      const current = Number(tabState.page) || 1;
      if (!container) return;
      if (totalPages <= 1) {
        container.innerHTML = '';
        return;
      }
      let start = Math.max(1, current - 3);
      let end = Math.min(totalPages, start + 6);
      if (end - start < 6) start = Math.max(1, end - 6);

      const parts = [];
      parts.push(`<button data-page="${Math.max(1, current - 1)}" ${current === 1 ? 'disabled' : ''}>‹</button>`);
      if (start > 1) parts.push(`<button data-page="1">1</button>`);
      if (start > 2) parts.push(`<span class="mx-2">…</span>`);
      for (let p = start; p <= end; p++) {
        parts.push(`<button data-page="${p}" class="${p === current ? 'active' : ''}">${p}</button>`);
      }
      if (end < totalPages - 1) parts.push(`<span class="mx-2">…</span>`);
      if (end < totalPages) parts.push(`<button data-page="${totalPages}">${totalPages}</button>`);
      parts.push(`<button data-page="${Math.min(totalPages, current + 1)}" ${current === totalPages ? 'disabled' : ''}>›</button>`);

      container.innerHTML = parts.join('');
      const branchId = elems.currentBranch.value || localStorage.getItem('current_branch_id') || '';
      Array.from(container.querySelectorAll('button[data-page]')).forEach(btn => {
        btn.addEventListener('click', () => {
          const p = Number(btn.getAttribute('data-page')) || 1;
          if (p === current) return;
          if (tab === 'outgoing') {
            loadOutgoingList(p, branchId);
          } else if (tab === 'on_delivery') {
            loadOnDeliveryList(p, branchId);
          } else if (tab === 'on_delivery_to') {
            loadOnDeliveryToList(p, branchId);
          } else if (tab === 'incoming') {
            loadIncomingList(p, branchId);
          } else if (tab === 'delivered') {
            loadDeliveredList(p, branchId);
          }
        });
      });
    }

    function getSelectedIds() {
      return Object.keys(state[state.activeTab].selected);
    }

    function applyPageSelection(tab, selected) {
      if (typeof selected !== 'boolean') {
        selected = Boolean(tab);
        tab = state.activeTab;
      }
      const selector = `.row-checkbox-${tab}`;
      const checkboxes = Array.from(document.querySelectorAll(selector));
      const rowMap = Object.fromEntries(state[tab].rows.map(r => [String(r.cargo_id), r]));
      checkboxes.forEach(cb => {
        cb.checked = selected;
        const id = cb.dataset.id;
        toggleSelection(tab, id, selected, rowMap[id]);
        cb.closest('tr')?.classList.toggle('selected', selected);
      });
    }

    async function loadMeta() {
      const data = await requestJson(`${API_URL}?action=meta`);
      if (!data || !data.success) {
        alert('Không tải được metadata hàng hóa.');
        return;
      }
      state.meta = data;
      elems.status.innerHTML = '<option value="">-- Tất cả trạng thái --</option>' + (data.options.statuses || []).map(item => `<option value="${item.id}">${item.label}</option>`).join('');
      const onboardBranchOptions = '<option value="">-- Tất cả VP --</option>' + (data.options.branch_work || []).map(item => `<option value="${item.id}">${item.label}</option>`).join('');
      const offboardBranchOptions = '<option value="">-- Tất cả VP --</option>' + (data.options.branches || []).map(item => `<option value="${item.id}">${item.label}</option>`).join('');
      elems.onboardBranch.innerHTML = onboardBranchOptions;
      elems.offboardBranch.innerHTML = offboardBranchOptions;
      const branchWorkOptions = '<option value="">-- chọn VP --</option>' + (data.options.branch_work || []).map(item => `<option value="${item.id}">${item.label}</option>`).join('');
      elems.currentBranch.innerHTML = branchWorkOptions;
      const savedBranchId = localStorage.getItem('current_branch_id') || '';
      if (savedBranchId) {
        elems.currentBranch.value = savedBranchId;
      }
    }

    async function loadDeparturesWithCargos() {
      elems.dept.innerHTML = '<option value="">-- Tất cả phơi có hàng --</option>';
      const data = await requestJson(`${API_URL}?action=departures_with_cargos`);
      if (!data || !data.success) return;
      const rows = data.data || [];
      elems.dept.innerHTML = '<option value="">-- Tất cả phơi có hàng --</option>' + rows.map(r => `<option value="${r.dept_id}">${r.xe_co_hang}</option>`).join('');
      const raw = localStorage.getItem(getFilterStorageKey());
      if (raw) {
        try { const saved = JSON.parse(raw); if (saved.dept_id) elems.dept.value = saved.dept_id; } catch (e) {}
      }
    }

    function buildListParams(tab, page, branchId) {
      const params = new URLSearchParams();
      params.set('action', 'list');
      params.set('page', page);
      params.set('limit', state[tab].limit || 30);

      if (state.filters.q) params.set('q', state.filters.q);
      if (state.filters.cod_service !== '') params.set('cod_service', state.filters.cod_service);
      if (state.filters.paid_filter !== '') params.set('paid_filter', state.filters.paid_filter);
      if (state.filters.remaining_filter !== '') params.set('remaining_filter', state.filters.remaining_filter);
      if (state.filters.dept_id) params.set('dept_id', state.filters.dept_id);
      if (state.filters.register_submit) params.set('register_submit', state.filters.register_submit);
      if (state.filters.receiver_money_confirmer_at) params.set('receiver_money_confirmer_at', state.filters.receiver_money_confirmer_at);
      if (state.filters.onboard_at) params.set('onboard_at', state.filters.onboard_at);
      if (state.filters.offboard_at) params.set('offboard_at', state.filters.offboard_at);

      if (tab === 'outgoing' && branchId) {
        params.set('onboard_at', branchId);
        params.set('status_id', '1');
      }
      if (tab === 'on_delivery' && branchId) {
        // Hàng trên xe đi: status_id=4, onboard_at=current_branch
        params.set('status_id', '4');
        params.set('onboard_at', branchId);
      }
      if (tab === 'on_delivery_to' && branchId) {
        // Hàng trên xe đến: status_id=4, offboard_at=current_branch
        params.set('status_id', '4');
        params.set('offboard_at', branchId);
           }
      if (tab === 'incoming' && branchId) {
        params.set('offboard_at', branchId);
        params.set('status_id', '5');
      }
      if (tab === 'delivered' && branchId) {
        params.set('offboard_at', branchId);
        params.set('status_id', '11');
      }
      return params;
    }

    async function loadOutgoingList(page = 1, branchId, get_hash = false) {
      const tab = 'outgoing';
      const tabState = state[tab];
      tabState.page = page;
      tabState.limit = Number(elems.limit.value) || 30;
      const params = buildListParams(tab, tabState.page, branchId);
      server_hash='';
      if (get_hash) {
        const data = await requestJson(`${API_URL}?get_hash=1&${params.toString()}`);
        if (!data || !data.success) {
          alert(data?.message || 'Không tải được danh sách hàng đi.');
          return;
        }
      server_hash = data.data_hash || '';
      }
      if(!get_hash || !server_hash || server_hash != localStorage.getItem('hash_cargo_tram_outgoing')) {
      const data = await requestJson(`${API_URL}?${params.toString()}`);
      if (!data || !data.success) {
        alert(data?.message || 'Không tải được danh sách hàng đi.');
        return;
      }
      server_hash = data.data_hash || '';
      localStorage.setItem('hash_cargo_tram_outgoing', server_hash);
      tabState.rows = data.data || [];
      tabState.total = Number(data.total) || 0;
      renderPane(tab);
      }
      }

    async function loadOnDeliveryList(page = 1, branchId, get_hash = false) {
      const tab = 'on_delivery';
      const tabState = state[tab];
      tabState.page = page;
      tabState.limit = Number(elems.limit.value) || 30;
      const params = buildListParams(tab, tabState.page, branchId);
      server_hash='';
      if (get_hash) {
        const data = await requestJson(`${API_URL}?get_hash=1&${params.toString()}`);
        if (!data || !data.success) {
          alert(data?.message || 'Không tải được danh sách hàng đi.');
          return;
        }
      server_hash = data.data_hash || '';
      }
      if(!get_hash || !server_hash || server_hash != localStorage.getItem('hash_cargo_tram_on_delivery')) {
      const data = await requestJson(`${API_URL}?${params.toString()}`);
      if (!data || !data.success) {
        alert(data?.message || 'Không tải được danh sách hàng đi.');
        return;
      }
      server_hash = data.data_hash || '';
      localStorage.setItem('hash_cargo_tram_on_delivery', server_hash);
      tabState.rows = data.data || [];
      tabState.total = Number(data.total) || 0;
      renderPane(tab);
      }
    }

    async function loadOnDeliveryToList(page = 1, branchId, get_hash = false) {
      const tab = 'on_delivery_to';
      const tabState = state[tab];
      tabState.page = page;
      tabState.limit = Number(elems.limit.value) || 30;
      const params = buildListParams(tab, tabState.page, branchId);
      server_hash='';
      if (get_hash) {
        const data = await requestJson(`${API_URL}?get_hash=1&${params.toString()}`);
        if (!data || !data.success) {
          alert(data?.message || 'Không tải được danh sách hàng đi.');
          return;
        }
      server_hash = data.data_hash || '';
      }
      if(!get_hash || !server_hash || server_hash != localStorage.getItem('hash_cargo_tram_on_delivery_to')) {
      const data = await requestJson(`${API_URL}?${params.toString()}`);
      if (!data || !data.success) {
        alert(data?.message || 'Không tải được danh sách hàng đi.');
        return;
      }
      server_hash = data.data_hash || '';
      localStorage.setItem('hash_cargo_tram_on_delivery_to', server_hash);
      tabState.rows = data.data || [];
      tabState.total = Number(data.total) || 0;
      renderPane(tab);
      }
    }

    async function loadIncomingList(page = 1, branchId, get_hash = false) {
      const tab = 'incoming';
      const tabState = state[tab];
      tabState.page = page;
      tabState.limit = Number(elems.limit.value) || 30;
      const params = buildListParams(tab, tabState.page, branchId);
      server_hash='';
      if (get_hash) {
        const data = await requestJson(`${API_URL}?get_hash=1&${params.toString()}`);
        if (!data || !data.success) {
          alert(data?.message || 'Không tải được danh sách hàng đi.');
          return;
        }
      server_hash = data.data_hash || '';
      }
      if(!get_hash || !server_hash || server_hash != localStorage.getItem('hash_cargo_tram_incoming')) {
      const data = await requestJson(`${API_URL}?${params.toString()}`);
      if (!data || !data.success) {
        alert(data?.message || 'Không tải được danh sách hàng đi.');
        return;
      }
      server_hash = data.data_hash || '';
      localStorage.setItem('hash_cargo_tram_incoming', server_hash);
      tabState.rows = data.data || [];
      tabState.total = Number(data.total) || 0;
      renderPane(tab);
      }
    }

    async function loadDeliveredList(page = 1, branchId, get_hash = false) {
      const tab = 'delivered';
      const tabState = state[tab];
      tabState.page = page;
      tabState.limit = Number(elems.limit.value) || 30;
      const params = buildListParams(tab, tabState.page, branchId);
      server_hash='';
      if (get_hash) {
        const data = await requestJson(`${API_URL}?get_hash=1&${params.toString()}`);
        if (!data || !data.success) {
          alert(data?.message || 'Không tải được danh sách hàng đi.');
          return;
        }
      server_hash = data.data_hash || '';
      }
      if(!get_hash || !server_hash || server_hash != localStorage.getItem('hash_cargo_tram_delivered')) {
      const data = await requestJson(`${API_URL}?${params.toString()}`);
      if (!data || !data.success) {
        alert(data?.message || 'Không tải được danh sách hàng đi.');
        return;
      }
      server_hash = data.data_hash || '';
      localStorage.setItem('hash_cargo_tram_delivered', server_hash);
      tabState.rows = data.data || [];
      tabState.total = Number(data.total) || 0;
      renderPane(tab);
      }
    }

    async function loadList(page = 1, get_hash = false) {
      state.outgoing.page = page;
      state.on_delivery.page = page;
      state.incoming.page = page;
      state.delivered.page = page;
      state.outgoing.limit = Number(elems.limit.value) || 30;
      state.on_delivery.limit = state.outgoing.limit;
      state.on_delivery_to.limit = state.outgoing.limit;
      state.incoming.limit = state.outgoing.limit;
      state.delivered.limit = state.outgoing.limit;
      state.filters.q = elems.search.value.trim();
      state.filters.status_id = elems.status.value;
      state.filters.cod_service = elems.codService.value;
      state.filters.paid_filter = elems.paidFilter.value;
      state.filters.remaining_filter = elems.remainingFilter.value;
      state.filters.dept_id = elems.dept.value;
      state.filters.register_submit = elems.registerDate.value;
      state.filters.receiver_money_confirmer_at = elems.receiverConfirmedDate.value;
      state.filters.onboard_at = elems.onboardBranch.value;
      state.filters.offboard_at = elems.offboardBranch.value;

      const branchId = elems.currentBranch.value || localStorage.getItem('current_branch_id') || '';
      if (!branchId) {
        alert('Vui lòng chọn VP làm việc (current_branch_id) trước khi tải danh sách.');
        ['Outgoing','OnDelivery','OnDeliveryTo','Incoming','Delivered'].forEach(name => {
          const empty = elems[`emptyState${name}`];
          const body = elems[`tableBody${name}`];
          const pagination = elems[`pagination${name}`];
          if (empty) {
            empty.textContent = 'Vui lòng chọn VP làm việc trên thanh công cụ.';
            empty.style.display = 'block';
          }
          if (body) body.innerHTML = '';
          if (pagination) pagination.innerHTML = '';
        });
        return;
      }
      localStorage.setItem('current_branch_id', branchId);
      saveFiltersToStorage();

      await Promise.all([
        loadOutgoingList(state.outgoing.page, branchId, get_hash),
        loadOnDeliveryList(state.on_delivery.page, branchId, get_hash),
        loadOnDeliveryToList(state.on_delivery_to.page, branchId, get_hash),
        loadIncomingList(state.incoming.page, branchId, get_hash),
        loadDeliveredList(state.delivered.page, branchId, get_hash)
      ]);
      // renderPane(state.activeTab);
    }

    elems.filterBtn.addEventListener('click', () => loadList(1));
    elems.search.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        loadList(1);
      }
    });
    elems.resetFilterBtn.addEventListener('click', resetFilters);
    function applyQuickFilter(type) {
      const today = new Date().toISOString().slice(0, 10);
      const branchId = elems.currentBranch.value || localStorage.getItem('current_branch_id') || '';

      elems.search.value = '';
      elems.status.value = '';
      elems.codService.value = '';
      elems.paidFilter.value = '';
      elems.remainingFilter.value = '';
      elems.dept.value = '';
      elems.registerDate.value = '';
      elems.receiverConfirmedDate.value = '';
      elems.onboardBranch.value = '';
      elems.offboardBranch.value = '';
      elems.limit.value = '100';
      state.outgoing.page = 1;
      state.incoming.page = 1;

      if (type === 'cr') {
        elems.paidFilter.value = '0';
        elems.registerDate.value = today;
        if (branchId) elems.onboardBranch.value = branchId;
      } else if (type === 'cc') {
        elems.remainingFilter.value = '0';
        elems.receiverConfirmedDate.value = today;
        if (branchId) elems.offboardBranch.value = branchId;
      } else if (type === 'wait-board') {
        elems.status.value = '1';
        if (branchId) elems.onboardBranch.value = branchId;
      } else if (type === 'wait-deliver') {
        elems.status.value = '5';
        if (branchId) elems.offboardBranch.value = branchId;
      }

      saveFiltersToStorage();
      loadList(1);
    }
    elems.quickFilterCrBtn.addEventListener('click', () => applyQuickFilter('cr'));
    elems.quickFilterCcBtn.addEventListener('click', () => applyQuickFilter('cc'));
    elems.quickFilterWaitBoardBtn.addEventListener('click', () => applyQuickFilter('wait-board'));
    elems.quickFilterWaitDeliverBtn.addEventListener('click', () => applyQuickFilter('wait-deliver'));
    elems.refreshBtn.addEventListener('click', () => location.reload());
    document.getElementById('btn-create-new').addEventListener('click', () => {
      showCargoEditModal('new');
    });
    document.getElementById('btn-scan').addEventListener('click', () => {
      window.location.href = 'cargo-barcode.html';
    });
    elems.limit.addEventListener('change', () => loadList(1));
    elems.currentBranch.addEventListener('change', () => {
      localStorage.setItem('current_branch_id', elems.currentBranch.value || '');
      loadList(1);
    });
    elems.selectAllButton.addEventListener('click', () => applyPageSelection(state.activeTab, true));
    elems.clearSelectionButton.addEventListener('click', () => applyPageSelection(state.activeTab, false));
    if (elems.selectAllPageOutgoing) elems.selectAllPageOutgoing.addEventListener('change', () => applyPageSelection('outgoing', elems.selectAllPageOutgoing.checked));
    if (elems.selectAllPageOnDelivery) elems.selectAllPageOnDelivery.addEventListener('change', () => applyPageSelection('on_delivery', elems.selectAllPageOnDelivery.checked));
    if (elems.selectAllPageOnDeliveryTo) elems.selectAllPageOnDeliveryTo.addEventListener('change', () => applyPageSelection('on_delivery_to', elems.selectAllPageOnDeliveryTo.checked));
    if (elems.selectAllPageIncoming) elems.selectAllPageIncoming.addEventListener('change', () => applyPageSelection('incoming', elems.selectAllPageIncoming.checked));
    if (elems.selectAllPageDelivered) elems.selectAllPageDelivered.addEventListener('change', () => applyPageSelection('delivered', elems.selectAllPageDelivered.checked));
    if (elems.tabOutgoingBtn) elems.tabOutgoingBtn.addEventListener('click', () => setActiveTab('outgoing'));
    if (elems.tabOnDeliveryBtn) elems.tabOnDeliveryBtn.addEventListener('click', () => setActiveTab('on_delivery'));
    if (elems.tabOnDeliveryToBtn) elems.tabOnDeliveryToBtn.addEventListener('click', () => setActiveTab('on_delivery_to'));
    if (elems.tabIncomingBtn) elems.tabIncomingBtn.addEventListener('click', () => setActiveTab('incoming'));
    if (elems.tabDeliveredBtn) elems.tabDeliveredBtn.addEventListener('click', () => setActiveTab('delivered'));

    elems.moveOnboard.addEventListener('click', () => {
      const ids = getSelectedIds();
      if (!ids.length) { alert('Vui lòng chọn ít nhất một đơn hàng.'); return; }
      showMoveOnboardModal();
    });

    elems.moveOffboard.addEventListener('click', async () => {
      const ids = getSelectedIds();
      if (!ids.length) { alert('Vui lòng chọn ít nhất một đơn hàng.'); return; }

      const raw = localStorage.getItem(getFilterStorageKey());
      let saved = {};
      try { saved = raw ? JSON.parse(raw) : {}; } catch (e) { saved = {}; }
      if (0&&!saved.dept_id) {
        alert('Vui lòng lọc theo một "phơi" (dept) trước khi cho hàng xuống trạm.');
        return;
      }

      const offboardBranchId = elems.offboardBranch.value;
      
      // if (!offboardBranchId) {
      //   offboardBranchId=currentBranchId || localStorage.getItem('current_branch_id') || '';
      // // }
      // //   alert('Vui lòng chọn một VP nhận trong filter trước khi thực hiện xuống hàng.');
      // //   return;
      // }

      const missingOffboard = [];
      const selectedRows = Object.values(state[state.activeTab].selected || {});
      selectedRows.forEach(r => { if (!r || !r.offboard_at) missingOffboard.push(r.cargo_id || r.id || '?'); });
      if (missingOffboard.length) {
        alert('Một số đơn không có VP nhận (offboard_at): ' + missingOffboard.join(', ') + '. Vui lòng kiểm tra.');
        return;
      }

      if (!confirm(`Xác nhận cho hàng xuống trạm cho ${ids.length} đơn?`)) return;

      const data = await requestJson(`${API_URL}?action=move_offboard`, {
        method: 'POST',
        body: JSON.stringify({ cargo_ids: ids, to_branch_id: localStorage.getItem('current_branch_id') })
      });
      if (!data || !data.success) {
        alert(data?.message || 'Lỗi khi cho hàng xuống trạm.');
        return;
      }
      alert(`Đã cho xuống ${data.updated_rows || ids.length} đơn về kho nhận.`);
      location.reload();
    });

    elems.modalRoute.addEventListener('change', loadModalDepartures);
    // Collection (phiếu thu) modal logic
    const collectModal = document.getElementById('collect-modal');
    const collectAmount = document.getElementById('collect-amount');
    const collectCount = document.getElementById('collect-count');
    const collectNotes = document.getElementById('collect-notes');
    const collectCancel = document.getElementById('collect-cancel');
    const collectConfirm = document.getElementById('collect-confirm');
    const collectClose = collectModal.querySelector('.cargo-modal-close');
    let collectType = null; // 'cr' or 'cc'

    function openCollectModal(type) {
      const ids = getSelectedIds();
      if (!ids.length) { alert('Vui lòng chọn ít nhất một đơn hàng.'); return; }
      collectType = type === 'paid' ? 'cr' : 'cc';
      const selectedItems = Object.values(state[state.activeTab].selected || {});
      const sumPaid = selectedItems.reduce((s, r) => s + (Number(r.sender_paid_vnd) || 0), 0);
      const sumRemaining = selectedItems.reduce((s, r) => s + (Number(r.receiver_paid_vnd) || 0), 0);
      const defaultAmount = collectType === 'cr' ? sumPaid : sumRemaining;
      collectAmount.value = defaultAmount || 0;
      collectCount.value = ids.length;
      // Build default notes from current filters and type
      const today = new Date();
      const dateStr = elems.registerDate.value ? elems.registerDate.value : today.toISOString().slice(0,10);
      let branchLabel = '';
      if (collectType === 'cr') {
        const idx = elems.onboardBranch.selectedIndex;
        branchLabel = idx >= 0 ? elems.onboardBranch.options[idx].text : '';
        collectNotes.value = `Phiếu thu tiền đã trả ngày ${dateStr}` + (branchLabel ? ` VP gửi ${branchLabel}` : '');
      } else {
        const idx = elems.offboardBranch.selectedIndex;
        branchLabel = idx >= 0 ? elems.offboardBranch.options[idx].text : '';
        collectNotes.value = `Phiếu thu tiền còn lại ngày ${dateStr}` + (branchLabel ? ` VP nhận ${branchLabel}` : '');
      }
      collectModal.classList.add('show');
    }

    function closeCollectModal() {
      collectModal.classList.remove('show');
      collectType = null;
    }

    async function confirmCollect() {
      const ids = getSelectedIds();
      if (!ids.length) { alert('Vui lòng chọn ít nhất một đơn hàng.'); return; }
      if (!collectType) return;
      const amount = Number(collectAmount.value) || 0;
      const notes = collectNotes.value.trim();
      if (!confirm(`Xác nhận tạo phiếu thu cho ${ids.length} đơn, số tiền ${formatCurrency(amount)} đ ?`)) return;

      const payload = { type: collectType, cargo_ids: ids, amount_vnd: amount, notes };
      const res = await requestJson(`${API_URL}?action=create_collection`, { method: 'POST', body: JSON.stringify(payload) });
      if (!res || !res.success) {
        alert(res?.message || 'Lỗi tạo phiếu thu.');
        return;
      }
      alert('Đã tạo phiếu thu #' + (res.insert_id || '') + '. Cập nhật ' + (res.updated_rows || 0) + ' đơn.');
      closeCollectModal();
      location.reload();
    }

    collectCancel.addEventListener('click', closeCollectModal);
    collectClose.addEventListener('click', closeCollectModal);

    document.getElementById('btn-collect-paid').addEventListener('click', () => openCollectModal('paid'));
    document.getElementById('btn-collect-remaining').addEventListener('click', () => openCollectModal('remaining'));
        const btnPrintOrders = document.getElementById('btn-print-orders');
    if (btnPrintOrders) {
      btnPrintOrders.addEventListener('click', () => {
        const ids = getSelectedIds();
        if (!ids || ids.length === 0) {
          alert('Vui lòng chọn ít nhất một đơn hàng để in.');
          return;
        }
        const url = `cargo-report-don-hang.html?ids=${encodeURIComponent(ids.join(','))}`;
        window.open(url, '_blank');
      });
    }

    elems.modalDate.addEventListener('change', loadModalDepartures);
    elems.modalConfirm.addEventListener('click', confirmMoveOnboard);
    elems.modalCancel.addEventListener('click', hideMoveOnboardModal);
    elems.modalClose.addEventListener('click', hideMoveOnboardModal);
    elems.moveOnboardModal.addEventListener('click', event => {
      if (event.target === elems.moveOnboardModal) {
        hideMoveOnboardModal();
      }
    });
    elems.deliverConfirm.addEventListener('click', confirmDeliver);
    elems.deliverCancel.addEventListener('click', hideDeliverModal);
    elems.deliverClose.addEventListener('click', hideDeliverModal);
    elems.deliverModal.addEventListener('click', event => {
      if (event.target === elems.deliverModal) {
        hideDeliverModal();
      }
    });

    // Cargo edit modal logic (inline form)
    const cargoEditModule = (function(){
      const modal = document.getElementById('cargo-edit-modal');
      const root = modal ? modal.querySelector('.page-shell') : null;
      if (!modal || !root) return {
        open: (id) => { window.location.href = `cargo-edit.html?id=${encodeURIComponent(id)}`; }
      };

      const q = (sel) => root.querySelector(sel);
      const fields = {
        pass_mobile: q('#pass_mobile'), pass_name: q('#pass_name'), onboard_at: q('#onboard_at'), temp_onboard: q('#temp_onboard'),
        receiver_mobile: q('#receiver_mobile'), reveiver_name: q('#reveiver_name'), offboard_at: q('#offboard_at'), temp_offboard: q('#temp_offboard'),
        lay_tan_noi: q('#lay_tan_noi'), giao_tan_noi: q('#giao_tan_noi'), ticket_vnd: q('#ticket_vnd'), sum_vnd: q('#sum_vnd'),
        payment_method: q('#payment_method'), sender_paid_vnd: q('#sender_paid_vnd'), receiver_paid_vnd: q('#receiver_paid_vnd'),
        cod_service: q('#cod_service'), cod_vnd: q('#cod_vnd'), notes: q('#notes'), detailsBody: q('#details-body'),
        cargoStatus: q('#cargo-status-pill'), cargoCode: q('#cargo-code-pill'), printSection: q('#print-section')
      };

      let state = { meta: null, row: {}, details: [], cargoId: 'new' };

      function createOption(value, text) { const o = document.createElement('option'); o.value = value; o.textContent = text; return o; }
      function populateSelect(select, items){ if(!select) return;
        select.innerHTML = '<option value="">-- Chọn --</option>';
        (items||[]).forEach(it=> select.appendChild(createOption(it.id, it.label||it.name||it.branch_name||it.payment||it.status_title))); }
      function setValue(el, v){ if(!el) return; if(el.type==='checkbox') el.checked = Boolean(Number(v)||v===true); else el.value = v!=null? v : ''; }
      function getValue(el){ if(!el) return null; if(el.type==='checkbox') return el.checked?1:0; return el.value; }
      function parseNumber(v){ if(v===null||v===undefined||v==='') return 0; const n=Number(String(v).replace(/[\,\s]/g,'')); return Number.isFinite(n)?n:0; }
      function setMoneyInputValue(el, value){
        if (!el) return;
        if (value === null || value === undefined || value === '') {
          el.value = '';
          return;
        }
        el.value = sanitizeNumberInputValue(value);
      }

      const passengerSearchPanel = document.getElementById('cargo-passenger-search-panel');
      const passengerSearchTitle = passengerSearchPanel ? passengerSearchPanel.querySelector('#cargo-passenger-search-title') : null;
      const passengerSearchHead = passengerSearchPanel ? passengerSearchPanel.querySelector('#cargo-passenger-search-head') : null;
      const passengerSearchBody = passengerSearchPanel ? passengerSearchPanel.querySelector('#cargo-passenger-search-body') : null;
      const passengerSearchStatus = passengerSearchPanel ? passengerSearchPanel.querySelector('#cargo-passenger-search-status') : null;
      const passengerSearchClose = passengerSearchPanel ? passengerSearchPanel.querySelector('#cargo-passenger-search-close') : null;
      let passengerSearchResults = [];
      let passengerSearchAnchor = null;

      function updatePassengerSearchStatus(message, error) {
        if (!passengerSearchStatus) return;
        passengerSearchStatus.textContent = message || '';
        passengerSearchStatus.style.color = error ? '#c00' : '#333';
      }

      function updatePassengerSearchHeaders(mode) {
        if (!passengerSearchHead) return;
        if (mode === 'receiver') {
          passengerSearchHead.innerHTML = `<tr>
            <th>SĐT người nhận</th>
            <th>Người nhận</th>
            <th>VP nhận</th>
            <th>Giao hàng dọc đường</th>
            <th>Tên hàng</th>
            <th>Ghi chú</th>
          </tr>`;
        } else {
          passengerSearchHead.innerHTML = `<tr>
            <th>SĐT người gửi</th>
            <th>Người gửi</th>
            <th>VP gửi</th>
            <th>Nhận hàng dọc đường</th>
            <th>Tên hàng</th>
            <th>Ghi chú</th>
          </tr>`;
        }
      }

      function showPassengerSearchPanel(mode, anchorEl) {
        if (!passengerSearchPanel) return;
        passengerSearchAnchor = anchorEl || document.activeElement;
        if (passengerSearchTitle) passengerSearchTitle.textContent = mode === 'receiver' ? 'Tìm người nhận cũ' : 'Tìm người gửi cũ';
        updatePassengerSearchHeaders(mode);
        passengerSearchPanel.style.display = 'block';
        passengerSearchPanel.classList.add('show');
        // position under anchor element so it doesn't cover the phone field
        try {
          const ref = anchorEl || passengerSearchAnchor;
          if (ref && typeof ref.getBoundingClientRect === 'function') {
            const rect = ref.getBoundingClientRect();
            const left = Math.max(8, rect.left + window.scrollX);
            const top = rect.bottom + window.scrollY + 6;
            passengerSearchPanel.style.minWidth = (rect.width || 260) + 'px';
            passengerSearchPanel.style.left = left + 'px';
            passengerSearchPanel.style.top = top + 'px';
          } else {
            passengerSearchPanel.style.left = '10px';
            passengerSearchPanel.style.top = (window.scrollY + 80) + 'px';
            passengerSearchPanel.style.minWidth = '320px';
          }
        } catch (e) { }
      }

      function hidePassengerSearchPanel() {
        if (!passengerSearchPanel) return;
        passengerSearchPanel.style.display = 'none';
        if (passengerSearchBody) passengerSearchBody.innerHTML = '';
        updatePassengerSearchStatus('');
        passengerSearchAnchor = null;
      }

      function renderPassengerSearchResults(mode, rows) {
        if (!passengerSearchBody) return;
        passengerSearchBody.innerHTML = rows.map((row, index) => {
          const matched = mode === 'receiver'
            ? String(row.offboard_at) === String(getValue(fields.offboard_at) || '')
            : String(row.onboard_at) === String(getValue(fields.onboard_at) || '');
          const rowClass = matched ? (mode === 'receiver' ? 'text-success' : 'text-danger') : '';
          const phone = mode === 'receiver' ? (row.receiver_mobile || '') : (row.pass_mobile || '');
          const name = mode === 'receiver' ? (row.reveiver_name || '') : (row.pass_name || '');
          const branch = mode === 'receiver' ? (row.offboard_branch_name || row.offboard_at || '') : (row.onboard_branch_name || row.onboard_at || '');
          const routePlace = mode === 'receiver' ? (row.temp_offboard || '') : (row.temp_onboard || '');
          const cargoName = row.cargo_name || '';
          const cargoNotes = row.cargo_notes || '';
          return `<tr class="${rowClass}" data-passenger-index="${index}" style="cursor:pointer;">
            <td>${phone}</td>
            <td>${name}</td>
            <td>${branch}</td>
            <td>${routePlace}</td>
            <td>${cargoName}</td>
            <td>${cargoNotes}</td>
          </tr>`;
        }).join('');
        Array.from(passengerSearchBody.querySelectorAll('tr[data-passenger-index]')).forEach(tr => {
          tr.addEventListener('click', () => {
            const index = Number(tr.dataset.passengerIndex);
            selectPassengerRow(mode, index);
          });
        });
      }

      async function searchPassengerByPhone(phone, mode, anchorEl) {
        if (!phone || phone.length <= 5) {
          hidePassengerSearchPanel();
          return;
        }
        updatePassengerSearchStatus('Đang tìm kiếm...', false);
        const action = mode === 'receiver' ? 'get_cargo_receiver' : 'get_cargo_sender';
        const data = await requestJson(`${API_URL}?action=${action}&mobile=${encodeURIComponent(phone)}`);
        if (!data || !data.success) {
          updatePassengerSearchStatus(data?.message || 'Lỗi tìm kiếm khách hàng.', true);
          passengerSearchResults = [];
          renderPassengerSearchResults(mode, []);
          showPassengerSearchPanel(mode, anchorEl);
          return;
        }
        passengerSearchResults = Array.isArray(data.data) ? data.data : (data.rows || []);
        if (!passengerSearchResults.length) {
          updatePassengerSearchStatus('Không tìm thấy khách hàng phù hợp.', false);
        } else {
          updatePassengerSearchStatus(`Tìm thấy ${passengerSearchResults.length} khách hàng. Nhấn vào dòng để chọn.`, false);
        }
        renderPassengerSearchResults(mode, passengerSearchResults);
        showPassengerSearchPanel(mode, anchorEl);
      }

      function selectPassengerRow(mode, index) {
        const row = passengerSearchResults[index];
        if (!row) return;
        if (mode === 'receiver') {
          setValue(fields.receiver_mobile, row.receiver_mobile);
          setValue(fields.reveiver_name, row.reveiver_name);
          if (row.offboard_at && fields.offboard_at) {
            if (!fields.offboard_at.querySelector(`option[value="${row.offboard_at}"]`)) {
              fields.offboard_at.appendChild(createOption(row.offboard_at, row.offboard_branch_name || `#${row.offboard_at}`));
            }
            fields.offboard_at.value = row.offboard_at;
          }
          setValue(fields.temp_offboard, row.temp_offboard);
        } else {
          setValue(fields.pass_mobile, row.pass_mobile);
          setValue(fields.pass_name, row.pass_name);
          if (row.onboard_at && fields.onboard_at) {
            if (!fields.onboard_at.querySelector(`option[value="${row.onboard_at}"]`)) {
              fields.onboard_at.appendChild(createOption(row.onboard_at, row.onboard_branch_name || `#${row.onboard_at}`));
            }
            fields.onboard_at.value = row.onboard_at;
          }
          setValue(fields.temp_onboard, row.temp_onboard);
        }
        hidePassengerSearchPanel();
      }

      function debounce(fn, delay) {
        let timer = null;
        return (...args) => {
          if (timer) clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delay);
        };
      }

      let passengerSearchTypingTimer = null;

      function setupPassengerSearch() {
        if (fields.pass_mobile) {
          fields.pass_mobile.addEventListener('input', debounce(() => {
            const value = String(fields.pass_mobile.value || '').trim();
            if (value.length > 5) {
              clearTimeout(passengerSearchTypingTimer);
              passengerSearchTypingTimer = setTimeout(() => searchPassengerByPhone(value, 'sender', fields.pass_mobile), 180);
            } else {
              hidePassengerSearchPanel();
            }
          }, 180));
        }
        if (fields.receiver_mobile) {
          fields.receiver_mobile.addEventListener('input', debounce(() => {
            const value = String(fields.receiver_mobile.value || '').trim();
            if (value.length > 5) {
              clearTimeout(passengerSearchTypingTimer);
              passengerSearchTypingTimer = setTimeout(() => searchPassengerByPhone(value, 'receiver', fields.receiver_mobile), 180);
            } else {
              hidePassengerSearchPanel();
            }
          }, 180));
        }
        if (passengerSearchClose) passengerSearchClose.addEventListener('click', hidePassengerSearchPanel);
        document.addEventListener('click', (e) => {
          if (!passengerSearchPanel) return;
          if (passengerSearchPanel.style.display === 'none') return;
          const t = e.target;
          if (passengerSearchPanel.contains(t)) return;
          if (t === fields.pass_mobile || t === fields.receiver_mobile) return;
          hidePassengerSearchPanel();
        });
      }

      let detailRowId = 0;
      function addDetailRow(detail={}){
        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="number" class="detail-quantity" min="1" value="${detail.quantity||1}" /></td>
          <td><input type="text" class="detail-unit" value="${detail.unit_name||'kiện'}" /></td>
          <td><input type="text" class="detail-name" value="${detail.cargo_name||''}" /></td>
          <td><input type="number" class="detail-value" min="0" value="${detail.value_vnd||''}" /></td>
          <td><input type="text" class="detail-note" value="${detail.notes||''}" /></td>
          <td><input type="number" class="detail-ship" min="0" value="${detail.ship_fee_vnd||''}" /></td>
          <td><button type="button" class="action-btn remove"><i class="fa fa-trash"></i></button></td>
        `;
        row.querySelector('.remove').addEventListener('click', ()=>{ row.remove(); updateSummaryFromTotals(); });
        ['detail-value','detail-ship','detail-quantity'].forEach(cls=> row.querySelector('.'+cls).addEventListener('input', updateSummaryFromTotals));
        fields.detailsBody.appendChild(row);
      }

      function buildDetails(ds){ fields.detailsBody.innerHTML=''; if(!ds||ds.length===0){ addDetailRow({quantity:1, unit_name:'kiện'}); return; } ds.forEach(d=>addDetailRow(d)); }
      function gatherDetails(){ const rows=Array.from(fields.detailsBody.querySelectorAll('tr')); return rows.map(tr=>({ quantity: Number(tr.querySelector('.detail-quantity').value)||1, unit_name: tr.querySelector('.detail-unit').value.trim(), cargo_name: tr.querySelector('.detail-name').value.trim(), value_vnd: tr.querySelector('.detail-value').value.trim()||null, notes: tr.querySelector('.detail-note').value.trim()||null, ship_fee_vnd: tr.querySelector('.detail-ship').value.trim()||null })).filter(i=> i.cargo_name || i.value_vnd || i.ship_fee_vnd || i.unit_name); }

      function updateSummaryFromTotals(){ const rows = Array.from(fields.detailsBody.querySelectorAll('tr')); let totalValue=0, totalShip=0; rows.forEach(tr=>{ const q=Number(tr.querySelector('.detail-quantity').value)||1; const v=Number(tr.querySelector('.detail-value').value)||0; const s=Number(tr.querySelector('.detail-ship').value)||0; totalValue += q*v; totalShip += s; }); setMoneyInputValue(fields.ticket_vnd, totalValue||0); setMoneyInputValue(fields.sum_vnd, totalShip||0); const codFee = Number(fields.cod_vnd.value)||0; const senderPaid = Number(fields.sender_paid_vnd.value)||0; const codEnabled = Boolean(Number(getValue(fields.cod_service))); if(!codEnabled) fields.cod_vnd.value=0; const amountToCollect = codEnabled? totalValue:0; const receiverPay = (amountToCollect + (codEnabled?codFee:0) + totalShip) - senderPaid; fields.receiver_paid_vnd.value = Math.max(0, Math.round(receiverPay)); }

      function getFormData(){ return { pass_mobile: getValue(fields.pass_mobile), pass_name: getValue(fields.pass_name), onboard_at: getValue(fields.onboard_at)||null, temp_onboard: getValue(fields.temp_onboard), receiver_mobile: getValue(fields.receiver_mobile), reveiver_name: getValue(fields.reveiver_name), offboard_at: getValue(fields.offboard_at)||null, temp_offboard: getValue(fields.temp_offboard), lay_tan_noi: getValue(fields.lay_tan_noi)?1:0, giao_tan_noi: getValue(fields.giao_tan_noi)?1:0, ticket_vnd: parseNumber(getValue(fields.ticket_vnd)), sum_vnd: parseNumber(getValue(fields.sum_vnd)), payment_method: getValue(fields.payment_method)||null, sender_paid_vnd: parseNumber(getValue(fields.sender_paid_vnd)), receiver_paid_vnd: parseNumber(getValue(fields.receiver_paid_vnd)), cod_service: getValue(fields.cod_service)?1:0, cod_vnd: parseNumber(getValue(fields.cod_vnd)), notes: getValue(fields.notes), details: gatherDetails() }; }

      function setStatusText(status, code){ if(fields.cargoStatus) fields.cargoStatus.textContent = status||'Mới'; if(fields.cargoCode) fields.cargoCode.textContent = `Mã: ${code||'-'}`; }

            function resetFormFields(){
        state.row = {};
        setStatusText('Mới', '---');

        const textFields = ['pass_mobile','pass_name','temp_onboard','receiver_mobile','reveiver_name','temp_offboard','ticket_vnd','sum_vnd','sender_paid_vnd','receiver_paid_vnd','cod_vnd','notes'];
        textFields.forEach((key) => {
          const el = fields[key];
          if (el) el.value = '';
        });

        ['lay_tan_noi','giao_tan_noi','cod_service'].forEach((key) => {
          const el = fields[key];
          if (el) el.checked = false;
        });

        if (fields.onboard_at) fields.onboard_at.value = '';
        if (fields.offboard_at) fields.offboard_at.value = '';
        if (fields.payment_method) fields.payment_method.value = '1'; // thu tại VP

        buildDetails([]);
        updateSummaryFromTotals();
      }

      function applyCurrentBranchToNewForm(){
        const branchId = localStorage.getItem('current_branch_id') || '';
        if (branchId && fields.onboard_at) {
          fields.onboard_at.value = branchId;
        }
      }

      async function loadMeta(){ const data = await requestJson(`${API_URL}?action=meta`); if(!data||!data.success){ alert('Không tải được metadata hàng hóa.'); return; } state.meta = data; const opts = data.options || {}; populateSelect(fields.onboard_at, opts.branch_work||[]); populateSelect(fields.offboard_at, opts.branches||[]); populateSelect(fields.payment_method, opts.payments||[]); if(state.cargoId && state.cargoId !== 'new') loadCargo(state.cargoId); else { setStatusText('Mới','---'); buildDetails([]); } }

      async function loadCargo(id){ const data = await requestJson(`${API_URL}?action=get&id=${encodeURIComponent(id)}`); if(!data||!data.success){ alert('Không tìm thấy đơn hàng này'); return; } state.row = data.row||{}; setStatusText(state.row.status_label||'Đã lưu', state.row.random_code||state.row.cargo_id||'---'); setValue(fields.pass_mobile, state.row.pass_mobile); setValue(fields.pass_name, state.row.pass_name); setValue(fields.onboard_at, state.row.onboard_at); if(state.row.onboard_at) { try{ if(!fields.onboard_at.querySelector(`option[value="${state.row.onboard_at}"]`)) fields.onboard_at.appendChild(createOption(state.row.onboard_at, state.row.onboard_branch_name||('#'+state.row.onboard_at))); }catch(e){} } setValue(fields.temp_onboard, state.row.temp_onboard); setValue(fields.receiver_mobile, state.row.receiver_mobile); setValue(fields.reveiver_name, state.row.reveiver_name); setValue(fields.offboard_at, state.row.offboard_at); if(state.row.offboard_at){ try{ if(!fields.offboard_at.querySelector(`option[value="${state.row.offboard_at}"]`)) fields.offboard_at.appendChild(createOption(state.row.offboard_at, state.row.offboard_branch_name||('#'+state.row.offboard_at))); }catch(e){} } setValue(fields.temp_offboard, state.row.temp_offboard); setValue(fields.lay_tan_noi, state.row.lay_tan_noi); setValue(fields.giao_tan_noi, state.row.giao_tan_noi); setMoneyInputValue(fields.ticket_vnd, state.row.ticket_vnd); setMoneyInputValue(fields.sum_vnd, state.row.sum_vnd); setValue(fields.payment_method, state.row.payment_method); if(state.row.payment_method) { try{ if(!fields.payment_method.querySelector(`option[value="${state.row.payment_method}"]`)) fields.payment_method.appendChild(createOption(state.row.payment_method, state.row.payment_method_label||('#'+state.row.payment_method))); }catch(e){} } setMoneyInputValue(fields.sender_paid_vnd, state.row.sender_paid_vnd); setMoneyInputValue(fields.receiver_paid_vnd, state.row.receiver_paid_vnd); setValue(fields.cod_service, state.row.cod_service); setMoneyInputValue(fields.cod_vnd, state.row.cod_vnd); setValue(fields.notes, state.row.notes); buildDetails(state.row.details||[]); updateSummaryFromTotals(); }

      function validateForm(payload){ const errors=[]; if(!payload.onboard_at) errors.push('VP gửi là bắt buộc.'); if(!payload.offboard_at) errors.push('VP nhận là bắt buộc.'); return errors; }

      async function save(){
        const payload = getFormData();
        const errors = validateForm(payload);
        if(errors.length){ alert(errors.join('\n')); return; }
        const action = (state.cargoId==='new')? 'insert' : 'edit';
        const endpoint = `${API_URL}?action=${action}${state.cargoId==='new'?'':'&id='+encodeURIComponent(state.cargoId)}`;
        const res = await requestJson(endpoint, { method:'POST', body: JSON.stringify(payload) });
        if(!res||!res.success){
          try { console.error('Save failed response:', res); } catch(e){}
          alert((res && res.message) ? (res.message + '\n' + JSON.stringify(res)) : 'Lưu thất bại');
          return;
        }
        const currentId = res.insert_id || state.cargoId;
        if (state.cargoId === 'new' && res.insert_id) state.cargoId = res.insert_id;
        alert('Lưu thành công!');
        hide(true);
      }

      async function cancel(){ if(state.cargoId==='new') return; const confirmed = confirm('Bạn có chắc chắn muốn hủy đơn hàng này?'); if(!confirmed) return; const res = await requestJson(`${API_URL}?action=delete&id=${encodeURIComponent(state.cargoId)}`, { method:'POST' }); if(!res||!res.success){ alert(res?.message||'Hủy đơn thất bại'); return; } alert('Đã hủy đơn hàng thành công.'); hide(true); }

      function show(){ modal.style.display = 'block'; setTimeout(()=> modal.classList.add('show'),20); }
      function hide(reload=true){ modal.classList.remove('show'); setTimeout(()=>{ modal.style.display='none'; if(reload) loadList(1); },160); }

      function printCargo(){
        if(state.cargoId === 'new'){
          const proceed = confirm('Đơn hàng chưa được lưu. Bạn có muốn lưu trước khi in?');
          if(proceed){ save(); return; }
        }
        const data = getFormData();
        const onboardText = (fields.onboard_at.options[fields.onboard_at.selectedIndex] || {}).text || '';
        const offboardText = (fields.offboard_at.options[fields.offboard_at.selectedIndex] || {}).text || '';
        const codeValue = state.row.random_code || state.row.ticket_code || state.row.cargo_id || '---';
        const printedAt = new Date().toLocaleString('vi-VN');
        const fromAddress = state.row.onboard_branch_address || '';
        const fromPhone = state.row.onboard_branch_mobile || '';
        const toAddress = state.row.offboard_branch_address || '';
        const toPhone = state.row.offboard_branch_mobile || '';
        // Build print HTML similar to cargo-edit.html
        let printHtml = `<div class="print-box"><div class="print-header"><div><div class="meta-line"><strong>MÃ GD:</strong> ${codeValue}</div><div class="meta-line"><strong>In ngày:</strong> ${printedAt}</div></div></div></div>`;
        if(fields.printSection) fields.printSection.innerHTML = printHtml;
        window.print();
      }

      // wire buttons
      const btnSave = q('#btn-save'); if(btnSave) btnSave.addEventListener('click', save);
      const btnPrint = q('#btn-print'); if(btnPrint) btnPrint.addEventListener('click', printCargo);
      const btnNew = q('#btn-new'); if(btnNew) btnNew.addEventListener('click', async ()=>{
        state.cargoId = 'new';
        resetFormFields();
        await loadMeta();
        applyCurrentBranchToNewForm();
      });
      const btnBack = q('#btn-back'); if(btnBack) btnBack.addEventListener('click', ()=> hide(true));
      const btnAddRow = q('#btn-add-row'); if(btnAddRow) btnAddRow.addEventListener('click', ()=> addDetailRow());
      const btnCancelOrder = q('#btn-cancel-order'); if(btnCancelOrder) btnCancelOrder.addEventListener('click', cancel);
      // inputs affecting summary
      if (fields.ticket_vnd) fields.ticket_vnd.addEventListener('input', () => { fields.ticket_vnd.value = sanitizeNumberInputValue(fields.ticket_vnd.value); updateSummaryFromTotals(); });
      [q('#ticket_vnd'), q('#sum_vnd'), q('#cod_vnd'), q('#sender_paid_vnd')].forEach(el=>{ if(el) el.addEventListener('input', updateSummaryFromTotals); });
      if(q('#cod_service')) q('#cod_service').addEventListener('change', updateSummaryFromTotals);
      setupPassengerSearch();

      // modal backdrop click
      modal.addEventListener('click', (e)=>{ if(e.target === modal) hide(true); });

      return {
        open: async (id='new')=>{ 
          state.cargoId = id || 'new'; 
          buildDetails([]); 
          setStatusText('...','---'); 
          show(); 
          await loadMeta(); 
          // Pre-fill onboard_at with current_branch_id for new cargo
          if(state.cargoId === 'new') {
            const branchId = localStorage.getItem('current_branch_id') || '';
            if(branchId && fields.onboard_at) {
              fields.onboard_at.value = branchId;
            }
          }
        },
        close: ()=> hide(true)
      };
    })();

    function showCargoEditModal(id){
      if (typeof cargoEditModule !== 'undefined' && cargoEditModule && cargoEditModule.open) {
        cargoEditModule.open(id);
        return;
      }
      // fallback to navigation
      window.location.href = `cargo-edit.html?id=${encodeURIComponent(id)}`;
    }

    (async function init() {
      loadActiveTabFromStorage();
      setActiveTab(state.activeTab);
      await loadMeta();
      loadFiltersFromStorage();
      await loadDeparturesWithCargos();
      await loadList(state[state.activeTab].page || 1);

      try {
      if (window.td_check_interval) clearInterval(window.td_check_interval);
      window.td_check_interval = setInterval(() => {
      try { loadList(state[state.activeTab].page || 1, true); } catch (e) { console.error('td check error', e); }
      }, 10000);
      } catch (e) { console.error('start check interval error', e); }

    })();
  