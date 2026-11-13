// layout.js - Main navigation layout and page router (PocketBase)

function renderLayout() {
  var isAdmin = App.profile && App.profile.role === 'admin';
  var navLinks = isAdmin
    ? [
        {page:'dashboard', icon:'fa-tachometer-alt', label:'Dashboard'},
        {page:'calendar', icon:'fa-calendar-alt', label:'Calendar'},
        {page:'approvals', icon:'fa-check-double', label:'Approvals', badge: App.pendingCount},
        {page:'history', icon:'fa-history', label:'History'},
        {page:'reports', icon:'fa-file-alt', label:'Reports'},
        {page:'settings', icon:'fa-cog', label:'Settings'},
      ]
    : [
        {page:'dashboard', icon:'fa-home', label:'Dashboard'},
        {page:'calendar', icon:'fa-calendar-alt', label:'Calendar'},
        {page:'new-reservation', icon:'fa-plus-circle', label:'New Reservation'},
        {page:'my-reservations', icon:'fa-list', label:'My Reservations'},
      ];

  var navHtml = navLinks.map(function(nl) {
    var badge = nl.badge ? ' <span class="tab-count" style="background:var(--danger);color:white;">'+nl.badge+'</span>' : '';
    return '<a href="#" class="nav-link'+(App.currentPage===nl.page?' active':'')+'" data-page="'+nl.page+'">'
      + '<i class="fa '+nl.icon+'"></i>'+nl.label+badge+'</a>';
  }).join('');

  var mobileNavHtml = navLinks.map(function(nl) {
    return '<a href="#" class="mobile-nav-link'+(App.currentPage===nl.page?' active':'')+'" data-page="'+nl.page+'">'
      + '<i class="fa '+nl.icon+'"></i>'+nl.label+'</a>';
  }).join('');

  var name = App.profile ? (App.profile.full_name || App.profile.name || App.profile.email || '') : '';
  var role = App.profile ? App.profile.role : 'parent';

  var html = '<div class="mobile-nav" id="mobileNav">'
    + '<div class="mobile-nav-backdrop" id="mobileNavBackdrop"></div>'
    + '<div class="mobile-nav-drawer">'
    + '<div style="display:flex;align-items:center;gap:10px;">'
    + '<div class="navbar-brand-icon"><i class="fa fa-utensils"></i></div>'
    + '<div><div class="school-name">'+escHtml(cfg.SCHOOL_NAME)+'</div></div>'
    + '</div>'
    + '<div class="mobile-nav-links">'+mobileNavHtml+'</div>'
    + '<div style="margin-top:auto;padding-top:20px;border-top:1px solid var(--gray-200);font-size:13px;color:var(--gray-600);">'
    + escHtml(name)+'<br><button class="btn btn-ghost btn-sm" id="mobileLogout" style="margin-top:8px;"><i class="fa fa-sign-out-alt"></i> Sign Out</button>'
    + '</div></div></div>'
    + '<nav class="navbar"><div class="navbar-inner">'
    + '<a href="#" class="navbar-brand" id="brandLink">'
    + '<div class="navbar-brand-icon"><i class="fa fa-utensils"></i></div>'
    + '<div class="navbar-brand-text"><div class="school-name">'+escHtml(cfg.SCHOOL_NAME)+'</div>'
    + '<div class="app-name">'+escHtml(cfg.APP_NAME)+'</div></div></a>'
    + '<div class="navbar-nav">'+navHtml+'</div>'
    + '<div class="navbar-user">'
    + '<div class="user-badge"><i class="fa fa-user-circle"></i><span>'+escHtml(name.split(' ')[0]||name)+'</span>'
    + '<span class="role-tag'+(role==='admin'?' admin':'')+'">'+role+'</span></div>'
    + '<button class="btn btn-ghost btn-sm" id="logoutBtn"><i class="fa fa-sign-out-alt"></i></button>'
    + '</div>'
    + '<button class="btn btn-ghost btn-sm" id="mobileMenuBtn" style="display:none"><i class="fa fa-bars"></i></button>'
    + '</div></div></nav>'
    + '<main class="main-content" id="mainContent"><div class="spinner-dark" style="margin:80px auto;display:block;width:40px;height:40px;border-width:4px;"></div></main>';

  document.getElementById('app').innerHTML = html;

  // Wire nav links
  document.querySelectorAll('[data-page]').forEach(function(el) {
    el.addEventListener('click', function(e) {
      e.preventDefault();
      var pg = el.getAttribute('data-page');
      document.getElementById('mobileNav').classList.remove('open');
      navigate(pg);
    });
  });

  document.getElementById('logoutBtn').addEventListener('click', function() {
    pb.authStore.clear();
    App.user = null; App.profile = null;
    renderAuth('login');
  });
  if (document.getElementById('mobileLogout')) {
    document.getElementById('mobileLogout').addEventListener('click', function() {
      pb.authStore.clear();
      App.user = null; App.profile = null;
      renderAuth('login');
    });
  }
  document.getElementById('brandLink').addEventListener('click',function(e){e.preventDefault();navigate('dashboard');});
  if (document.getElementById('mobileMenuBtn')) {
    document.getElementById('mobileMenuBtn').addEventListener('click',function(){document.getElementById('mobileNav').classList.add('open');});
  }
  if (document.getElementById('mobileNavBackdrop')) {
    document.getElementById('mobileNavBackdrop').addEventListener('click',function(){document.getElementById('mobileNav').classList.remove('open');});
  }

  // Show mobile menu button on small screens
  function checkMobile() {
    var mb = document.getElementById('mobileMenuBtn');
    if (mb) mb.style.display = window.innerWidth <= 768 ? 'inline-flex' : 'none';
  }
  checkMobile();
  window.addEventListener('resize', checkMobile);

  // Render the actual page content
  renderPage();
}

function renderPage() {
  var isAdmin = App.profile && App.profile.role === 'admin';
  var mc = document.getElementById('mainContent');
  if (!mc) return;

  switch(App.currentPage) {
    case 'dashboard': mc.innerHTML = isAdmin ? renderAdminDashboard() : renderParentDashboard(); break;
    case 'calendar': mc.innerHTML = renderCalendar(); break;
    case 'new-reservation': mc.innerHTML = renderNewReservation(App.pageParams.prefillDate, App.pageParams.prefillSlot, App.pageParams.prefillTable); break;
    case 'my-reservations': mc.innerHTML = renderMyReservations(); break;
    case 'approvals': mc.innerHTML = isAdmin ? renderApprovalsPage() : ''; break;
    case 'history': mc.innerHTML = isAdmin ? renderHistoryPage() : ''; if(isAdmin) wireHistoryEvents(); break;
    case 'reports': mc.innerHTML = isAdmin ? renderReportsPage() : ''; break;
    case 'settings': mc.innerHTML = isAdmin ? (renderSettingsPage() + renderAdminEmailsSection() + renderEmailTemplatesSection()) : ''; if(isAdmin) wireSettingsEvents(); break;
    default: mc.innerHTML = isAdmin ? renderAdminDashboard() : renderParentDashboard();
  }
  wirePageEvents();
}
