(function (window) {
  'use strict';

  function getToken() {
    return localStorage.getItem('cms_token') || localStorage.getItem('api_token') || '';
  }

  function clearTokens() {
    localStorage.removeItem('cms_token');
    localStorage.removeItem('api_token');
  }

  function redirectToLogin(loginUrl) {
    clearTokens();
    window.location.href = loginUrl || 'cms-login.html';
  }

  function isAuthError(data, response) {
    if (response && (response.status === 401 || response.status === 403)) return true;
    var msg = data && data.message ? String(data.message) : '';
    return !!(data && data.success === false && /invalid|expired|missing.*authorization|missing.*auth|access denied/i.test(msg));
  }

  function createClient(options) {
    var opts = options || {};
    var loginUrl = opts.loginUrl || 'cms-login.html';

    function resolveToken() {
      if (typeof opts.tokenProvider === 'function') {
        return opts.tokenProvider() || '';
      }
      if (typeof opts.token === 'string') {
        return opts.token;
      }
      return getToken();
    }

    async function requestJson(url, requestOptions) {
      var ro = requestOptions || {};
      var headers = ro.headers ? Object.assign({}, ro.headers) : {};
      var token = resolveToken();

      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }
      if (!ro.method || String(ro.method).toUpperCase() === 'GET') {
        if (!headers.Accept) headers.Accept = 'application/json';
      }
      if (ro.body && !headers['Content-Type'] && ro.contentType !== false) {
        headers['Content-Type'] = 'application/json';
      }

      var response = await fetch(url, Object.assign({ credentials: 'same-origin' }, ro, { headers: headers }));
      var text = await response.text();
      var data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        data = { success: false, message: 'Invalid response', raw: text };
      }

      if (!ro.skipAuthRedirect && isAuthError(data, response)) {
        redirectToLogin(loginUrl);
      }
      return data;
    }

    return {
      requestJson: requestJson,
      redirectToLogin: function () { redirectToLogin(loginUrl); },
      isAuthError: isAuthError,
      getToken: resolveToken
    };
  }

  window.control2Auth = {
    getToken: getToken,
    clearTokens: clearTokens,
    redirectToLogin: redirectToLogin,
    isAuthError: isAuthError,
    createClient: createClient
  };
})(window);