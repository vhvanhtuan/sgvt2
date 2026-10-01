    function temp_console_log(s) {
      return;
      if(elems.moving_status) elems.moving_status.innerHTML=s;
      else console.log(s);
        }

    function formatNumberDisplay(value, digits) {
    if (value === null || value === undefined) return '';
    const numeric = Number(String(value).replace(/,/g, '').trim());
    if (!Number.isFinite(numeric)) return value;
    const decimalDigits = Number.isInteger(digits) && digits >= 0 ? digits : 0;
    return numeric.toLocaleString('en-US', {
        minimumFractionDigits: decimalDigits,
        maximumFractionDigits: decimalDigits
    });
}

    // hàm đổi format ngày giờ Y-m-d H:i:s sang dd/mm/yyyy hh:mm:ss
    function formatDateTime(datetimeStr) {
      if (!datetimeStr) return '-';
      const dt = new Date(datetimeStr);
      if (isNaN(dt)) return '-';
      const day = String(dt.getDate()).padStart(2, '0');
      const month = String(dt.getMonth() + 1).padStart(2, '0');
      const year = dt.getFullYear();
      const hours = String(dt.getHours()).padStart(2, '0');
      const minutes = String(dt.getMinutes()).padStart(2, '0');
      const seconds = String(dt.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

(function(){
  const target = document.getElementById('cms-header');
  if (!target) return;

          // Đăng xuất
        function cmsLogout() {
            localStorage.removeItem('cms_token');
            window.location.href = 'cms-login.html';
        }


  function injectBootstrapBundle(){
    if (window.bootstrap) return;
    if (document.querySelector('script[src*="bootstrap"][src*="bundle"]')) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js';
    script.crossOrigin = 'anonymous';
    script.defer = true;
    document.head.appendChild(script);
  }

  fetch('header.html')
    .then(response => {
      if (!response.ok) throw new Error('Header load failed');
      return response.text();
    })
    .then(html => {
      const template = document.createElement('template');
      template.innerHTML = html.trim();
      target.appendChild(template.content.cloneNode(true));

      const scripts = target.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const script = document.createElement('script');
        if (oldScript.src) {
          script.src = oldScript.src;
        }
        if (oldScript.type) {
          script.type = oldScript.type;
        }
        script.textContent = oldScript.textContent;
        oldScript.parentNode.replaceChild(script, oldScript);
      });

      injectBootstrapBundle();
    })
    .catch(err => {
      console.warn('Failed to load CMS header', err);
      injectBootstrapBundle();
    });
})();
