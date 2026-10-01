(function(){
  const btn = document.getElementById('scrollTopBtn');
  if (!btn) return;
  window.addEventListener('scroll', function(){
    btn.style.display = window.pageYOffset > 180 ? 'flex' : 'none';
  });
  btn.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();
        // Đăng xuất
        function cmsLogout() {
            localStorage.removeItem('cms_token');
            window.location.href = 'cms-login.html';
        }
