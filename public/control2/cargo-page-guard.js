(function (window) {
  'use strict';

  function resolveFileName(explicitFileName) {
    if (explicitFileName && String(explicitFileName).trim()) {
      return String(explicitFileName).trim();
    }
    return (window.location.pathname.split('/').pop() || '').trim();
  }

  async function ensureCanOpenPage(options) {
    var opts = options || {};
    var apiUrl = opts.apiUrl || '/api/cargo.php';
    var token = opts.token || '';
    var redirectUrl = opts.redirectUrl || 'departure-list.html';
    var fileName = resolveFileName(opts.fileName);

    if (!fileName) {
      window.location.href = redirectUrl;
      return false;
    }

    var params = new URLSearchParams();
    params.set('action', 'can_open_file');
    params.set('file', fileName);

    var headers = { Accept: 'application/json' };
    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    try {
      var response = await fetch(apiUrl + '?' + params.toString(), {
        method: 'GET',
        credentials: 'same-origin',
        headers: headers
      });
      var text = await response.text();
      var data = null;
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = null;
      }

      if (data && data.success === true) {
        // update <title> : data.me.first_name
        if (data.me && data.me.e_mail) {
          document.title = data.me.e_mail + ' - ' + document.title;
        }
        return true;
      }
    } catch (err) {
      // Ignore and fall through to redirect.
    }

    window.location.href = redirectUrl;
    return false;
  }

  window.cargoPageGuard = {
    ensureCanOpenPage: ensureCanOpenPage
  };
})(window);