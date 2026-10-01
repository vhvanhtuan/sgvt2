(function(){
  return;
  const API_BASE = window.__API_BASE__ || '';
  const token = localStorage.getItem('cms_token') || localStorage.getItem('api_token') || '';
  const currentUserId = localStorage.getItem('cms_user_id') || '';
  if (!token || !currentUserId) return;

  const CHAT_STORAGE_KEY = 'cms_chat_active_user_id';
  const widgetState = {
    activePartnerId: null,
    conversations: [],
    contacts: [],
    unreadCount: 0,
    unreadMap: {},
    refreshTimer: null,
    lastConversationsHash: '',
    lastMessagesHash: '',
    isOpen: sessionStorage.getItem('cms_chat_open') === 'true'
  };

  function getStoredActivePartnerId(){
    return localStorage.getItem(CHAT_STORAGE_KEY) || null;
  }

  function setStoredActivePartnerId(userId){
    if(userId) {
      localStorage.setItem(CHAT_STORAGE_KEY, String(userId));
    } else {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  }

  function createWidget() {
    if (document.getElementById('cms-chat-widget')) return;
    const wrapper = document.createElement('div');
    wrapper.id = 'cms-chat-widget';
    wrapper.innerHTML = `
      <div class="cms-chat-toggle" id="cms-chat-toggle">
        <span>Chat nội bộ</span>
        <span class="cms-chat-unread" id="cms-chat-unread" style="display:none">0</span>
      </div>
      <div class="cms-chat-panel" id="cms-chat-panel" ${widgetState.isOpen ? '' : 'hidden'}>
        <div class="cms-chat-body">
          <div class="cms-chat-sidebar">
            <div class="cms-chat-contacts" id="cms-chat-contacts">Đang tải...</div>
          </div>
          <div class="cms-chat-main">
            <div class="cms-chat-main-header">
              <div class="title" id="cms-chat-conversation-title">Chọn liên hệ để bắt đầu</div>
              <button class="btn btn-sm btn-outline-secondary" id="cms-chat-refresh">Làm mới</button>
            </div>
            <div class="cms-chat-messages" id="cms-chat-messages"></div>
            <div class="cms-chat-input">
              <input id="cms-chat-body" type="text" placeholder="Nhập tin nhắn..." autocomplete="off" />
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(wrapper);
  }

  function setOpen(open) {
    const panel = document.getElementById('cms-chat-panel');
    if (!panel) return;
    widgetState.isOpen = open;
    sessionStorage.setItem('cms_chat_open', open ? 'true' : 'false');
    panel.hidden = !open;
  }

  function escapeHtml(value) {
    return String(value||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  }

  function buildContactLink(contact) {
    const userId = contact.user_id;
    const isActive = String(userId) === String(widgetState.activePartnerId);
    const contactConversations = widgetState.conversations[userId] || [];
    const mapVal = widgetState.unreadMap && (widgetState.unreadMap[String(userId)] || widgetState.unreadMap[userId]);
    const unreadCount = parseInt(mapVal || 0, 10) || 0;
    const unreadBadge = unreadCount > 0 ? '' : '';
    const unreadClass = unreadCount > 0 ? ' unread' : '';
    return `<div class="cms-chat-contact-item${isActive ? ' active' : ''}${unreadClass}" data-user-id="${userId}">
      <div class="contact-header">
        <div class="name">${escapeHtml(contact.first_name || 'Người nhận')}</div>
        ${unreadBadge}
      </div>
    </div>`;
  }

  function renderContacts(contacts){
    const container = document.getElementById('cms-chat-contacts');
    if (!container) return;
    if (!Array.isArray(contacts) || contacts.length === 0) {
      container.innerHTML = '<div style="padding:10px;color:#6c757d;font-size:0.84rem">Chưa có cuộc trò chuyện. Chọn người nhận để bắt đầu.</div>';
      return;
    }
    container.innerHTML = contacts.map(buildContactLink).join('');
    Array.from(container.querySelectorAll('.cms-chat-contact-item')).forEach(el => {
      el.addEventListener('click', () => {
        const userId = el.getAttribute('data-user-id');
        if (userId) selectConversation(userId);
      });
    });
  }

  function renderMessages(messages){
    const container = document.getElementById('cms-chat-messages');
    const titleEl = document.getElementById('cms-chat-conversation-title');
    if (!container || !titleEl) return;
    if (!Array.isArray(messages) || messages.length === 0) {
      container.innerHTML = '<div style="color:#6c757d;font-size:0.9rem;margin:auto">Không có tin nhắn trong cuộc trò chuyện này.</div>';
      return;
    }
    container.innerHTML = messages.map(msg => {
      const sent = String(msg.user_id) === String(currentUserId);
      const label = sent ? 'Bạn' : escapeHtml(msg.sender_name || msg.partner_name || 'Người gửi');
      return `<div class="cms-chat-message ${sent ? 'sent' : 'received'}">
          <div>${escapeHtml(msg.body || '')}</div>
          <div class="meta">${label} · ${escapeHtml(msg.submit||'')}</div>
        </div>`;
    }).join('');
    container.scrollTop = container.scrollHeight;
  }

  function computeHash(value) {
    const str = String(value || '');
    let hash = 0;
    for (let i = 0; i < str.length; i += 1) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return (hash >>> 0).toString(16);
  }

  async function fetchJson(url, options = {}) {
    const headers = Object.assign({'Authorization':'Bearer '+token}, options.headers || {});
    const resp = await fetch(API_BASE + url, Object.assign({}, options, {headers}));
    return await resp.json();
  }

  function getUnreadCounter(){
    return document.getElementById('cms-chat-unread');
  }

  function updateUnreadBadge(count){
    const badge = getUnreadCounter();
    if (!badge) return;
    if (count > 0) {
      badge.style.display = 'inline-flex';
      badge.textContent = count;
    } else {
      badge.style.display = 'none';
    }
  }

  function findContactById(userId){
    return widgetState.contacts.find(c => String(c.user_id) === String(userId));
  }

  async function loadAllConversations(){
    const data = await fetchJson('/api/generic.php?action=new_pms_messages');
    if (!data || !data.success) return;
    
    // Extract talk_to_ids info
    const talkToIds = data.talk_to_ids || [];
    widgetState.contacts = talkToIds;
    
    // Extract conversations (object with user_id as key)
    const allConversations = data.conversations || {};
    // Update conversations and unread map
    widgetState.conversations = allConversations;
    widgetState.unreadMap = data.is_not_reads || {};
    // Compute total unread (from map, fallback to API count)
    let totalUnread = 0;
    Object.keys(widgetState.unreadMap || {}).forEach(k => { totalUnread += parseInt(widgetState.unreadMap[k] || 0, 10) || 0; });
    widgetState.unreadCount = totalUnread || data.unread_count || 0;
    updateUnreadBadge(widgetState.unreadCount);

    // Update conversations hash
    const newHash = data.conversations_hash || '';
    if (newHash !== widgetState.lastConversationsHash) {
      widgetState.lastConversationsHash = newHash;
    }

    // Render contacts once (reflects unread state)
    renderContacts(widgetState.contacts);
    
    // Restore previously-selected chat after reload/navigation
    const storedPartnerId = getStoredActivePartnerId();
    const isStoredValid = storedPartnerId && widgetState.contacts.some(c => String(c.user_id) === String(storedPartnerId));
    if (isStoredValid) {
      widgetState.activePartnerId = String(storedPartnerId);
      await loadConversationMessages(storedPartnerId, true);
      return;
    }

    // Auto-select first contact if none selected
    if (!widgetState.activePartnerId && widgetState.contacts.length) {
      selectConversation(widgetState.contacts[0].user_id);
    } else if (widgetState.activePartnerId && !widgetState.contacts.some(c => String(c.user_id) === String(widgetState.activePartnerId))) {
      widgetState.activePartnerId = null;
      setStoredActivePartnerId(null);
      if (widgetState.contacts.length) selectConversation(widgetState.contacts[0].user_id);
    }
  }

  async function loadConversationMessages(partnerId, markRead){
    if (!partnerId || String(partnerId) === String(currentUserId)) {
      widgetState.activePartnerId = null;
      const titleEl = document.getElementById('cms-chat-conversation-title');
      if (titleEl) titleEl.textContent = 'Không có cuộc trò chuyện hợp lệ';
      renderMessages([]);
      return;
    }
    widgetState.activePartnerId = String(partnerId);
    
    const contact = findContactById(partnerId);
    if (contact) {
      const titleEl = document.getElementById('cms-chat-conversation-title');
      if (titleEl) titleEl.textContent = contact.first_name || 'Cuộc trò chuyện';
    }
    
    const url = `/api/generic.php?action=new_pms_messages&get_hash=1&other_user_id=${encodeURIComponent(partnerId)}${markRead ? '&mark_read=1' : ''}`;
    let data = await fetchJson(url);
    if (!data || !data.success) return;
    const hash_key='message_hash';
    const hash=data.message_hash || '';
    if(hash == localStorage.getItem(hash_key)) {
      return;
    }
    const url1 = `/api/generic.php?action=new_pms_messages&other_user_id=${encodeURIComponent(partnerId)}${markRead ? '&mark_read=1' : ''}`;
    data = await fetchJson(url1);
    if (!data || !data.success) return;
    localStorage.setItem(hash_key, hash);
    const messages = Array.isArray(data.messages) ? data.messages : [];
    renderMessages(messages);

    // Merge server-provided is_not_reads for this response (other_user_id) so UI updates
    try {
      if (data.is_not_reads && Object.keys(data.is_not_reads).length > 0) {
        widgetState.unreadMap = widgetState.unreadMap || {};
        Object.keys(data.is_not_reads).forEach(k => {
          widgetState.unreadMap[String(k)] = parseInt(data.is_not_reads[k] || 0, 10) || 0;
        });
        // Recompute total unread and update badge
        let totalNow = 0;
        Object.keys(widgetState.unreadMap).forEach(k => { totalNow += parseInt(widgetState.unreadMap[k] || 0, 10) || 0; });
        widgetState.unreadCount = totalNow;
        updateUnreadBadge(widgetState.unreadCount);
        // Re-render contacts to reflect per-contact unread state
        renderContacts(widgetState.contacts);
      }
    } catch (e) {
      // ignore merge errors
    }

    // If we requested mark_read, clear unread for this partner in the UI
    if (markRead) {
      try {
        widgetState.unreadMap = widgetState.unreadMap || {};
        // Ensure this partner is cleared locally (server may or may not include it)
        widgetState.unreadMap[String(partnerId)] = 0;
        // Recompute total unread
        let total = 0;
        Object.keys(widgetState.unreadMap).forEach(k => { total += parseInt(widgetState.unreadMap[k] || 0, 10) || 0; });
        widgetState.unreadCount = total;
        updateUnreadBadge(widgetState.unreadCount);
        // Re-render contacts so highlight is removed for this partner
        renderContacts(widgetState.contacts);
      } catch (e) {
        // ignore
      }
    }
  }

  async function selectConversation(userId){
    if (!userId || String(userId) === String(currentUserId)) return;
    widgetState.activePartnerId = String(userId);
    setStoredActivePartnerId(userId);
    renderContacts(widgetState.contacts);
    await loadConversationMessages(userId, true);
  }

  async function sendMessage(){
    const partnerId = widgetState.activePartnerId;
    const bodyInput = document.getElementById('cms-chat-body');
    if (!partnerId || !bodyInput) return;
    const body = bodyInput.value.trim();
    if (!body) return;
    
    const payload = {to_user_id: partnerId, body};
    const data = await fetchJson('/api/generic.php?action=new_pms_messages', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(payload)
    });
    if (!data || !data.success) {
      console.error('Failed to send message:', data);
      return;
    }
    
    if (bodyInput) bodyInput.value = '';
    await loadAllConversations();
    await loadConversationMessages(partnerId, false);
  }

  function setupHandlers(){
    const toggle = document.getElementById('cms-chat-toggle');
    const closeBtn = document.getElementById('cms-chat-close');
    const refreshBtn = document.getElementById('cms-chat-refresh');
    const sendBtn = document.getElementById('cms-chat-send');
    if (toggle) toggle.addEventListener('click', ()=>setOpen(!widgetState.isOpen));
    if (closeBtn) closeBtn.addEventListener('click', ()=>setOpen(false));
    if (refreshBtn) refreshBtn.addEventListener('click', ()=>refreshCurrentConversation());
    if (sendBtn) sendBtn.addEventListener('click', ()=>sendMessage());
    const bodyInput = document.getElementById('cms-chat-body');
    if (bodyInput) bodyInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); sendMessage();
      }
    });
  }

  async function refreshCurrentConversation(){
    if (widgetState.activePartnerId) {
      await loadConversationMessages(widgetState.activePartnerId, false);
    } else {
      await loadAllConversations();
    }
  }

  function startAutoRefresh(){
    stopAutoRefresh();
    widgetState.refreshTimer = window.setInterval(() => {
      refreshCurrentConversation();
    }, 5000);
  }

  function stopAutoRefresh(){
    if (widgetState.refreshTimer) { window.clearInterval(widgetState.refreshTimer); widgetState.refreshTimer = null; }
  }

  function init(){
    createWidget();
    setupHandlers();
    loadAllConversations();
    startAutoRefresh();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();