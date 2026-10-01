/**
 * cms-help.js — Reusable help modal for CMS pages
 *
 * Usage:
 *   1. Include: <script src="cms-help.js"></script>
 *   2. Call:    await initCmsHelp(token);
 *      — reads ?table= from URL, fetches help data, appends [?] nav-link to #cms-shortcuts
 *
 * For opening programmatically from any CMS page:
 *   cmsHelpOpen({ help_title, help_content, downloadable, help_download });
 */
(function () {
    'use strict';

    var CSS = [
        '#cms-help-modal-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9000;align-items:center;justify-content:center}',
        '#cms-help-modal-overlay.open{display:flex}',
        '#cms-help-modal{background:#fff;border-radius:8px;max-width:90vw;width:92%;max-height:82vh;display:flex;flex-direction:column;box-shadow:0 8px 32px rgba(106, 106, 106, 0.28)}',
        '#cms-help-modal-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #e0e0e0}',
        '#cms-help-modal-header h3{margin:0;font-size:1.1em;color:#1a237e}',
        '#cms-help-modal-close{background:none;border:none;font-size:1.5em;cursor:pointer;color:#888;line-height:1;padding:0 4px}',
        '#cms-help-modal-body{padding:18px 20px;overflow-y:auto;flex:1;font-size:.97em;line-height:1.6}',
        '#cms-help-modal-body a.help-download-link{display:inline-block;margin-top:12px;padding:6px 14px;background:#1565c0;color:#fff;border-radius:4px;text-decoration:none;font-size:.93em}',
        '#cms-help-modal-body a.help-download-link:hover{background:#0d47a1}',
        'a.cms-help-link{font-weight:bold;cursor:pointer}'
    ].join('');

    function injectModal() {
        if (document.getElementById('cms-help-modal-overlay')) return;

        // Inject CSS
        if (!document.getElementById('cms-help-style')) {
            var style = document.createElement('style');
            style.id = 'cms-help-style';
            style.textContent = CSS;
            document.head.appendChild(style);
        }

        // Inject HTML
        var wrap = document.createElement('div');
        wrap.innerHTML =
            '<div id="cms-help-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cms-help-modal-title">' +
            '<div id="cms-help-modal">' +
            '<div id="cms-help-modal-header">' +
            '<h3 id="cms-help-modal-title">H\u01b0\u1edbng d\u1eabn</h3>' +
            '<button id="cms-help-modal-close" title="\u0110\u00f3ng" aria-label="\u0110\u00f3ng">&times;</button>' +
            '</div>' +
            '<div id="cms-help-modal-body"></div>' +
            '</div></div>';
        document.body.insertBefore(wrap.firstElementChild, document.body.firstChild);

        // Close handlers (registered once)
        document.getElementById('cms-help-modal-close').addEventListener('click', closeModal);
        document.getElementById('cms-help-modal-overlay').addEventListener('click', function (e) {
            if (e.target === this) closeModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeModal();
        });
    }

    function closeModal() {
        var overlay = document.getElementById('cms-help-modal-overlay');
        if (overlay) overlay.classList.remove('open');
    }

    /**
     * Open the help modal with the given help object.
     * Can be called directly: cmsHelpOpen(helpObj)
     */
    function openModal(help) {
        injectModal();
        var titleEl = document.getElementById('cms-help-modal-title');
        var bodyEl  = document.getElementById('cms-help-modal-body');
        var overlay = document.getElementById('cms-help-modal-overlay');
        if (!titleEl || !bodyEl || !overlay) return;

        titleEl.textContent = help.help_title || 'H\u01b0\u1edbng d\u1eabn';

        var html = help.help_content || '';
        if (help.downloadable && String(help.downloadable) !== '0' && help.help_download) {
            html += '<br><a class="help-download-link" href="' +
                encodeURI(String(help.help_download)) +
                '" target="_blank" rel="noopener noreferrer">&#8681; T\u1ea3i file h\u01b0\u1edbng d\u1eabn</a>';
        }
        bodyEl.innerHTML = html;
        overlay.classList.add('open');
    }

    /**
     * Fetch help data for the current ?table= param and append a [?] nav-link
     * to #cms-shortcuts. Call this after user menus have been appended.
     *
     * @param {string} token  Bearer token
     */
    async function initCmsHelp(token) {
        var tableParam = new URLSearchParams(window.location.search).get('table');
        if (!tableParam) return;
        try {
            var res = await fetch(
                '/api/generic.php?action=get_help&table=' + encodeURIComponent(tableParam),
                { headers: { 'Authorization': 'Bearer ' + token } }
            );
            if (!res || !res.ok) return;
            var j = await res.json();
            if (!j || !j.success || !Array.isArray(j.helps) || j.helps.length === 0) return;
            var help = j.helps[0];

            injectModal();

            var container = document.getElementById('cms-shortcuts');
            if (!container) return;

            var a = document.createElement('a');
            a.href = '#';
            a.className = 'nav-link cms-help-link';
            a.textContent = '[?]';
            a.title = help.help_title || 'H\u01b0\u1edbng d\u1eabn s\u1eed d\u1ee5ng';
            a.addEventListener('click', function (e) {
                e.preventDefault();
                openModal(help);
            });
            container.appendChild(a);
        } catch (e) { /* ignore */ }
    }

    // Public API
    window.initCmsHelp  = initCmsHelp;
    window.cmsHelpOpen  = openModal;
    window.cmsHelpClose = closeModal;
})();
