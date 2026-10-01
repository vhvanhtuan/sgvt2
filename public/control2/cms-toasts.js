/* cms-toasts.js
   Fetch latest unread toasts and render Bootstrap toasts.
*/
(function(){
    'use strict';

    function escapeHtml(s){
        return String(s||'')
            .replace(/&/g,'&amp;')
            .replace(/</g,'&lt;')
            .replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;')
            .replace(/'/g,'&#39;');
    }

    function timeAgo(ts){
        if(!ts) return '';
        const t = new Date(ts).getTime();
        if(isNaN(t)) return ts;
        const diff = Math.floor((Date.now() - t)/1000);
        if(diff < 60) return diff + ' giây trước';
        if(diff < 3600) return Math.floor(diff/60) + ' phút trước';
        if(diff < 86400) return Math.floor(diff/3600) + ' giờ trước';
        return Math.floor(diff/86400) + ' ngày trước';
    }

    const toastState = {
        lastHash: '',
        refreshTimer: null
    };

    async function markClosed(toastId){
        try {
            const token = localStorage.getItem('cms_token') || '';
            await fetch('/api/generic.php?action=mark_closed_toast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({ toast_id: String(toastId) })
            });
        } catch(e) { /* ignore errors */ }
    }

    function buildToastNode(t){
        const id = t.id;
        const title = escapeHtml(t.toast || 'Thông báo');
        const content = t.toast_content || '';
        const sender = escapeHtml(t.sender_name || 'Hệ thống');
        const url = t.url || '';
        const close_manually = (t.close_manually && (t.close_manually === '1' || t.close_manually === 1 || t.close_manually === true));
        const submitted = t.submit || '';

        // Build DOM compatible with provided markup
        const wrapper = document.createElement('div');
        wrapper.className = 'toast align-items-center text-bg-light border shadow fade';
        wrapper.setAttribute('role','alert');
        wrapper.setAttribute('aria-live','assertive');
        wrapper.setAttribute('aria-atomic','true');
        wrapper.dataset.toastId = String(id);

        const header = document.createElement('div');
        header.className = 'toast-header';

        const strong = document.createElement('strong');
        strong.className = 'me-auto';
        strong.innerText = title;

        const small = document.createElement('small');
        small.className = 'text-muted';
        small.innerText = timeAgo(submitted);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-close ms-2 mb-1';
        btn.setAttribute('aria-label','Close');
        btn.setAttribute('data-bs-dismiss','toast');
        // icon inside close button to match existing style
        const icon = document.createElement('i');
        icon.className = 'fa-solid fa-xmark cms-uncheck-icon';
        icon.setAttribute('aria-label','unchecked');
        btn.appendChild(icon);

        header.appendChild(strong);
        header.appendChild(small);
        header.appendChild(btn);

        const body = document.createElement('div');
        body.className = 'toast-body';

        const senderWrap = document.createElement('div');
        senderWrap.className = 'mb-1';
        const senderSmall = document.createElement('small');
        senderSmall.className = 'text-muted';
        senderSmall.innerText = 'Từ ' + sender;
        senderWrap.appendChild(senderSmall);

        const contentDiv = document.createElement('div');
        contentDiv.innerText = content;

        body.appendChild(senderWrap);
        body.appendChild(contentDiv);
        if (url) {
            const urlWrap = document.createElement('div');
            urlWrap.className = 'mt-2';
            const a = document.createElement('a');
            a.className = 'btn btn-sm btn-primary';
            a.href = url;
            a.target = '_blank';
            a.rel = 'noreferrer noopener';
            a.innerText = 'Mở liên kết';
            urlWrap.appendChild(a);
            body.appendChild(urlWrap);
        }

        wrapper.appendChild(header);
        wrapper.appendChild(body);

        // bootstrap toast instance
        let instance = null;
        const autohide = !close_manually;

        wrapper.init = function(){
            try {
                instance = bootstrap.Toast.getOrCreateInstance(wrapper, { autohide: autohide, delay: 5000 });
                // attach click handler to close button to mark closed
                btn.addEventListener('click', function(e){
                    e.preventDefault();
                    markClosed(id);
                    try { instance.hide(); } catch(_) {}
                });
                instance.show();
            } catch(e) {
                wrapper.style.display = '';
            }
        };

        return wrapper;
    }

    function clearToasts(){
        const container = document.getElementById('cms-toast-container');
        if(!container) return;
        container.innerHTML = '';
    }

    function renderToasts(toasts){
        const container = document.getElementById('cms-toast-container');
        if(!container) return;
        clearToasts();
        toasts.forEach(t => {
            const node = buildToastNode(t);
            container.appendChild(node);
            try { node.init(); } catch(e) {}
        });
    }

    async function loadToasts(){
        return;
        try {
            const token = localStorage.getItem('cms_token') || '';
            const res = await fetch('/api/generic.php?action=get_last_unread_toast', { headers: { 'Authorization': 'Bearer ' + token } });
            if(!res.ok) return;
            const j = await res.json();
            if(!j || !j.success) return;
            const currentHash = String(j.toasts_hash || '');
            if(currentHash === toastState.lastHash) return;
            toastState.lastHash = currentHash;
            const toasts = Array.isArray(j.toasts) ? j.toasts : (j.toast ? [j.toast] : []);
            renderToasts(toasts);
        } catch(e) { /* ignore */ }
    }

    function startToastPolling(){
        stopToastPolling();
        toastState.refreshTimer = window.setInterval(loadToasts, 30000);
    }

    function stopToastPolling(){
        if(toastState.refreshTimer){
            window.clearInterval(toastState.refreshTimer);
            toastState.refreshTimer = null;
        }
    }

    function initToasts(){
        return;
        loadToasts();
        startToastPolling();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToasts);
    } else {
        initToasts();
    }

})();
