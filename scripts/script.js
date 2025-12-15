document.addEventListener('DOMContentLoaded', function(){
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  toggle.addEventListener('click', function(){
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    if(!expanded){
      nav.style.display = 'block'
    } else {
      nav.style.display = ''
    }
  })

  const form = document.getElementById('contact-form');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      const name = form.elements['name'].value || '익명';
      alert(name + '님, 메시지가 전송되었습니다 (샘플 폼).');
      form.reset();
    })
  }

  // Map and geolocation
  const showLocationBtn = document.getElementById('show-location-btn');
  const mapModal = document.getElementById('map-modal');
  const mapClose = document.getElementById('map-close');
  const mapMessage = document.getElementById('map-message');
  const address = document.getElementById('address-text')?.textContent || '';
  let map, marker, accuracyCircle, tileLayer;

  function openMapModal(){
    if(!mapModal) return;
    mapModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  }
  function closeMapModal(){
    if(!mapModal) return;
    mapModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }

  function initMap(lat=37.5665, lng=126.9780, zoom=13){
    if(!map){
      map = L.map('map').setView([lat,lng], zoom);
      tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
      marker = L.marker([lat,lng]).addTo(map);
      accuracyCircle = L.circle([lat,lng], {radius: 50}).addTo(map);
    } else {
      map.setView([lat,lng], zoom);
      marker.setLatLng([lat,lng]);
      accuracyCircle.setLatLng([lat,lng]);
      accuracyCircle.setRadius(50);
    }
    marker.bindPopup('현재 위치').openPopup();
  }

  function geocodeAddress(query){
    if(!query) return Promise.reject(new Error('주소가 없습니다.'));
    const url = 'https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=1';
    return fetch(url, {headers: {'Accept': 'application/json'}})
      .then(r => r.json())
      .then(data => {
        if(!data || !data.length) throw new Error('주소 위치를 찾을 수 없음');
        return {lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon)};
      });
  }

  function showMessage(msg){
    if(mapMessage) mapMessage.textContent = msg;
  }

  if(showLocationBtn){
    showLocationBtn.addEventListener('click', function(){
      openMapModal();
      showMessage('현재 위치 정보를 가져오는 중입니다...');
      if(!('geolocation' in navigator)){
        showMessage('브라우저에서 위치 기능을 지원하지 않습니다. 주소로 위치를 검색합니다.');
        geocodeAddress(address).then(p => {
          initMap(p.lat, p.lng, 15);
          showMessage('주소에 해당하는 위치를 표시했습니다.');
        }).catch(err => {
          showMessage('위치 정보를 가져오지 못했습니다: ' + err.message);
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(function(pos){
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = pos.coords.accuracy || 50;
        initMap(lat, lng, 16);
        if(accuracyCircle){
          accuracyCircle.setRadius(accuracy);
        }
        showMessage('현재 위치가 표시되었습니다. (정확도: ' + Math.round(accuracy) + 'm)');
      }, function(err){
        console.warn('geolocation error', err);
        showMessage('위치 권한이 거부되었거나 오류가 발생했습니다. 주소로 위치를 검색합니다.');
        geocodeAddress(address).then(p => {
          initMap(p.lat, p.lng, 15);
          showMessage('주소에 해당하는 위치를 표시했습니다.');
        }).catch(err => {
          showMessage('위치 정보를 가져오지 못했습니다: ' + err.message);
        });
      }, {enableHighAccuracy: true, timeout: 10000, maximumAge: 0});
    });
  }

  if(mapClose){
    mapClose.addEventListener('click', closeMapModal);
  }
  if(mapModal){
    mapModal.addEventListener('click', function(e){
      if(e.target === mapModal) closeMapModal();
    });
  }
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && mapModal && mapModal.getAttribute('aria-hidden') === 'false'){
      closeMapModal();
    }
  });

  // Authentication (simple client-side check)
  const ADMIN_USER = 'jasper';
  const ADMIN_PASS = '279813';
  const authModal = document.getElementById('auth-modal');
  const loginForm = document.getElementById('login-form');
  const loginUser = document.getElementById('login-user');
  const loginPass = document.getElementById('login-pass');
  const loginError = document.getElementById('login-error');
  const rememberMe = document.getElementById('remember-me');
  const logoutBtn = document.getElementById('logout-btn');

  function isLoggedIn(){
    const local = localStorage.getItem('authUser');
    const sess = sessionStorage.getItem('authUser');
    return (local === ADMIN_USER || sess === ADMIN_USER);
  }

  function showAuthModal(){
    if(!authModal) return;
    authModal.setAttribute('aria-hidden','false');
    document.body.classList.add('site-locked');
    if(loginError) loginError.style.display = 'none';
    if(loginPass) loginPass.value = '';
    if(loginUser) {
      // Focus username without triggering scroll when possible
      try {
        loginUser.focus({preventScroll: true});
        loginUser.select?.();
      } catch(e){
        setTimeout(() => { loginUser.focus(); loginUser.select?.(); }, 100);
      }
    }
    // Pressing Enter on username moves focus to password (better UX)
    if(loginUser && loginPass){
      loginUser.addEventListener('keydown', enterToPasswordHandler);
    }
    // Prevent background scroll while modal is open
    if(!document.body.classList.contains('modal-open')) document.body.classList.add('modal-open');
    // Add focus trap for modal
    authKeydownHandler = function(e){ trapFocusInModal(e); };
    document.addEventListener('keydown', authKeydownHandler);
  }
  function hideAuthModal(){
    if(!authModal) return;
    authModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('site-locked');
    document.body.classList.remove('modal-open');
    if(authKeydownHandler){
      document.removeEventListener('keydown', authKeydownHandler);
      authKeydownHandler = null;
    }
  }

  function enterToPasswordHandler(e){
    if(e.key === 'Enter'){
      e.preventDefault();
      if(loginPass){
        try { loginPass.focus({preventScroll:true}); } catch(err) { loginPass.focus(); }
      }
    }
  }

  // Focus trap while auth modal is open
  let authKeydownHandler = null;
  function trapFocusInModal(e){
    if(e.key !== 'Tab') return;
    const focusable = authModal.querySelectorAll('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])');
    if(!focusable || !focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if(e.shiftKey){
      if(document.activeElement === first){
        e.preventDefault();
        last.focus();
      }
    } else {
      if(document.activeElement === last){
        e.preventDefault();
        first.focus();
      }
    }
  }

  function setAuthVisible(isVisible){
    // Toggle .auth-only elements
    const authOnlyElements = document.querySelectorAll('.auth-only');
    authOnlyElements.forEach(el => {
      if(isVisible){
        el.classList.add('visible');
        el.setAttribute('aria-hidden','false');
      } else {
        el.classList.remove('visible');
        el.setAttribute('aria-hidden','true');
      }
    });

    // Handle logout button UI when present
    if(!logoutBtn) return;
    if(isVisible){
      // show with animation
      logoutBtn.classList.remove('removing');
      logoutBtn.classList.add('visible','showing');
      logoutBtn.setAttribute('aria-hidden','false');
      // remove entrance animation class after animation
      setTimeout(()=> logoutBtn.classList.remove('showing'), 350);
    } else {
      // fade out
      logoutBtn.classList.add('removing');
      logoutBtn.setAttribute('aria-hidden','true');
      // after animation, fully hide
      setTimeout(()=> logoutBtn.classList.remove('visible','removing'), 260);
    }
    
  }

  // Initial check
  if(!isLoggedIn()){
    showAuthModal();
    setAuthVisible(false);
  } else {
    hideAuthModal();
    setAuthVisible(true);
  }

  if(loginForm){
    loginForm.addEventListener('submit', function(e){
      e.preventDefault();
      const u = (loginUser.value || '').trim();
      const p = (loginPass.value || '');
      if(u === ADMIN_USER && p === ADMIN_PASS){
        if(rememberMe && rememberMe.checked){
          localStorage.setItem('authUser', ADMIN_USER);
          sessionStorage.removeItem('authUser');
        } else {
          sessionStorage.setItem('authUser', ADMIN_USER);
          localStorage.removeItem('authUser');
        }
        hideAuthModal();
        setAuthVisible(true);
        if(loginError) loginError.style.display = 'none';
      } else {
        if(loginError) {
          loginError.style.display = 'block';
          loginError.textContent = '아이디 또는 비밀번호가 올바르지 않습니다.';
        }
      }
    });
  }

  // Remove focus handler when closing/hiding modal to avoid duplicates
  const originalHideAuth2 = hideAuthModal;
  hideAuthModal = function(){
    // Remove enter key listener on username
    try { loginUser && loginUser.removeEventListener('keydown', enterToPasswordHandler); } catch(e){}
    originalHideAuth2();
  }

  if(logoutBtn){
    logoutBtn.addEventListener('click', function(){
      // Navigate to the logout splash which will clear auth after 3s and redirect back
      window.location.href = 'logout.html';
    });
  }

  // Image modal & private image handlers
  const imageModal = document.getElementById('image-modal');
  const imageModalImg = document.getElementById('image-modal-img');
  const imageModalCaption = document.getElementById('image-modal-caption');
  const imageClose = document.getElementById('image-close');
  let pendingAction = null;

  function openImageModal(src, caption){
    if(!imageModal) return;
    if(imageModalImg) imageModalImg.src = src || '';
    if(imageModalImg) imageModalImg.alt = caption || '';
    if(imageModalCaption) imageModalCaption.textContent = caption || '';
    imageModal.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
  }
  function closeImageModal(){
    if(!imageModal) return;
    imageModal.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
    if(imageModalImg) imageModalImg.src = '';
  }

  if(imageClose){
    imageClose.addEventListener('click', closeImageModal);
  }
  if(imageModal){
    imageModal.addEventListener('click', function(e){
      if(e.target === imageModal) closeImageModal();
    });
  }

  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && imageModal && imageModal.getAttribute('aria-hidden') === 'false'){
      closeImageModal();
    }
  });

  function handlePrivateClick(evt, element){
    const img = element.querySelector('img');
    const caption = element.querySelector('figcaption')?.textContent || '';
    const src = img ? img.src : '';
    if(!isLoggedIn()){
      pendingAction = {type:'image', src, caption};
      showAuthModal();
      return;
    }
    openImageModal(src, caption);
  }

  // Attach to private items
  const privateItems = document.querySelectorAll('[data-private]');
  if(privateItems && privateItems.length){
    privateItems.forEach(item => {
      item.addEventListener('click', function(e){
        e.preventDefault();
        handlePrivateClick(e, this);
      })
    })
  }

  // Attach to public gallery images (open modal on click)
  const galleryFigures = document.querySelectorAll('.gallery-grid figure');
  if(galleryFigures && galleryFigures.length){
    galleryFigures.forEach(item => {
      if(item.getAttribute('data-private') === 'true') return; // already handled
      item.addEventListener('click', function(e){
        e.preventDefault();
        const img = item.querySelector('img');
        const caption = item.querySelector('figcaption')?.textContent || '';
        const src = img ? img.src : '';
        openImageModal(src, caption);
      })
    })
  }

  // When login succeeds, perform pending action (if any)
  function performPendingAction(){
    if(!pendingAction) return;
    if(pendingAction.type === 'image'){
      openImageModal(pendingAction.src, pendingAction.caption);
    }
    pendingAction = null;
  }

  // Hook performPendingAction into login success flow
  // Replace previous hideAuthModal() wrapper: call performPendingAction() after hiding
  const originalHideAuth = hideAuthModal;
  hideAuthModal = function(){
    originalHideAuth();
    performPendingAction();
  }
})
