// auth.js - Authentication pages & routing (PocketBase)

async function checkAuth() {
  if (pb.authStore.isValid && pb.authStore.record) {
    App.user = pb.authStore.record;
    await loadProfile();
    return true;
  }
  return false;
}

async function loadProfile() {
  try {
    var rec = await pb.collection('users').getOne(App.user.id);
    App.profile = rec;
    if (!App.profile.full_name) App.profile.full_name = App.profile.name || '';
  } catch(e) {
    console.error('loadProfile error:', e);
    App.profile = App.user;
    if (!App.profile.full_name) App.profile.full_name = App.profile.name || '';
  }
}

function navigate(page, params) {
  App.currentPage = page; App.pageParams = params || {};
  var isAdmin = App.profile && App.profile.role === 'admin';
  var reload = (page==='dashboard'||page==='my-reservations'||page==='approvals'||page==='reports'||page==='calendar'||page==='new-reservation');
  if (reload) {
    var resLoader = isAdmin ? loadAllReservations() : loadMyReservations();
    Promise.all([resLoader, loadDayScenarios()])
      .then(function(){ renderLayout(); }).catch(function(){ renderLayout(); });
  } else { renderLayout(); }
}

function renderAuth(view) {
  var views={login:renderLoginPage,register:renderRegisterPage,forgot:renderForgotPage,reset:renderResetPage};
  (views[view]||renderLoginPage)();
}

function authLogo() {
  return '<div class="auth-logo"><div class="school-icon"><i class="fa fa-utensils"></i></div>'
    + '<h1>'+escHtml(cfg.SCHOOL_NAME)+'</h1><p>'+escHtml(cfg.APP_NAME)+'</p></div>';
}

function renderLoginPage() {
  var html = '<div class="auth-wrapper"><div class="auth-card">'
    + authLogo()
    + '<h2 class="auth-title">Welcome back</h2>'
    + '<p class="auth-subtitle">Sign in to manage your lunch reservations</p>'
    + '<div id="authAlert"></div><form id="loginForm">'
    + '<div class="form-group"><label>Email <span class="required">*</span></label>'
    + '<input type="email" class="form-control" id="loginEmail" placeholder="your@email.com" autocomplete="email" required /></div>'
    + '<div class="form-group"><label>Password <span class="required">*</span></label>'
    + '<input type="password" class="form-control" id="loginPassword" placeholder="Password" autocomplete="current-password" required /></div>'
    + '<button type="submit" class="btn btn-primary btn-full btn-lg" id="loginBtn"><i class="fa fa-sign-in-alt"></i> Sign In</button>'
    + '</form><div style="text-align:center;margin-top:24px;font-size:14px;color:var(--gray-500);">'
    + '<a href="#" id="goForgot" style="color:var(--primary);">Forgot password?</a> &nbsp;&middot;&nbsp; '
    + '<a href="#" id="goRegister" style="color:var(--primary);font-weight:600;">Create account</a>'
    + '</div></div></div>';
  document.getElementById('app').innerHTML = html;
  document.getElementById('goForgot').onclick=function(e){e.preventDefault();renderAuth('forgot');};
  document.getElementById('goRegister').onclick=function(e){e.preventDefault();renderAuth('register');};
  document.getElementById('loginForm').onsubmit = async function(e) {
    e.preventDefault();
    var btn=document.getElementById('loginBtn'),alertDiv=document.getElementById('authAlert');
    btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Signing in...'; alertDiv.innerHTML='';
    try {
      await pb.collection('users').authWithPassword(
        document.getElementById('loginEmail').value.trim(),
        document.getElementById('loginPassword').value
      );
      App.user=pb.authStore.record; await loadProfile();
      App.currentPage='dashboard'; App.calendarDate=new Date(); renderApp();
    } catch(err) {
      var msg=(err&&err.message)?err.message:String(err);
      alertDiv.innerHTML='<div class="alert alert-error"><i class="fa fa-exclamation-circle"></i> '+escHtml(msg)+'</div>';
      btn.disabled=false; btn.innerHTML='<i class="fa fa-sign-in-alt"></i> Sign In';
    }
  };
}

function renderRegisterPage() {
  var html = '<div class="auth-wrapper"><div class="auth-card">'
    + authLogo()
    + '<h2 class="auth-title">Create account</h2>'
    + '<p class="auth-subtitle">Register to book lunch tables for your visit</p>'
    + '<div id="authAlert"></div><form id="registerForm">'
    + '<div class="form-group"><label>Full Name <span class="required">*</span></label>'
    + '<input type="text" class="form-control" id="regName" placeholder="Jane Smith" autocomplete="name" required /></div>'
    + '<div class="form-group"><label>Email <span class="required">*</span></label>'
    + '<input type="email" class="form-control" id="regEmail" placeholder="your@email.com" autocomplete="email" required /></div>'
    + '<div class="form-group"><label>Password <span class="required">*</span></label>'
    + '<input type="password" class="form-control" id="regPassword" placeholder="Min. 6 characters" autocomplete="new-password" required minlength="6" /></div>'
    + '<button type="submit" class="btn btn-primary btn-full btn-lg" id="regBtn"><i class="fa fa-user-plus"></i> Create Account</button>'
    + '<button type="button" class="btn btn-ghost btn-full" id="regCancelBtn" style="margin-top:8px;"><i class="fa fa-arrow-left"></i> Back to Sign In</button>'
    + '</form><div style="text-align:center;margin-top:24px;font-size:14px;">Already have an account? <a href="#" id="goLoginFromReg" style="color:var(--primary);font-weight:600;">Sign in</a></div></div></div>';
  document.getElementById('app').innerHTML = html;
  document.getElementById('goLoginFromReg').onclick=function(e){e.preventDefault();renderAuth('login');};
  document.getElementById('regCancelBtn').onclick=function(){renderAuth('login');};
  document.getElementById('registerForm').onsubmit = async function(e) {
    e.preventDefault();
    var btn=document.getElementById('regBtn'),alertDiv=document.getElementById('authAlert');
    var name=document.getElementById('regName').value.trim();
    var email=document.getElementById('regEmail').value.trim();
    var password=document.getElementById('regPassword').value;
    if(!name||!email||!password){alertDiv.innerHTML='<div class="alert alert-error"><i class="fa fa-exclamation-circle"></i> Please fill in all fields.</div>';return;}
    if(password.length<6){alertDiv.innerHTML='<div class="alert alert-error"><i class="fa fa-exclamation-circle"></i> Password must be at least 6 characters.</div>';return;}
    btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Creating account...'; alertDiv.innerHTML='';
    try {
      var role='parent';
      try { await pb.collection('admin_emails').getFirstListItem(pb.filter('email={:e}',{e:email})); role='admin'; } catch(e2){}
      await pb.collection('users').create({email:email,password:password,passwordConfirm:password,name:name,role:role});
      await pb.collection('users').authWithPassword(email,password);
      App.user=pb.authStore.record; await loadProfile();
      App.currentPage='dashboard'; App.calendarDate=new Date();
      toast('Account created! Welcome.','success'); renderApp();
    } catch(err) {
      var msg=(err&&err.message)?err.message:String(err);
      alertDiv.innerHTML='<div class="alert alert-error"><i class="fa fa-exclamation-circle"></i> '+escHtml(msg)+'</div>';
      btn.disabled=false; btn.innerHTML='<i class="fa fa-user-plus"></i> Create Account';
    }
  };
}
function renderForgotPage() {
  var html = '<div class="auth-wrapper"><div class="auth-card">'
    + authLogo()
    + '<h2 class="auth-title">Reset password</h2>'
    + '<p class="auth-subtitle">Enter your email and we will send you a reset link</p>'
    + '<div id="authAlert"></div><form id="forgotForm">'
    + '<div class="form-group"><label>Email <span class="required">*</span></label>'
    + '<input type="email" class="form-control" id="forgotEmail" placeholder="your@email.com" required /></div>'
    + '<button type="submit" class="btn btn-primary btn-full" id="forgotBtn"><i class="fa fa-envelope"></i> Send Reset Link</button>'
    + '</form><div style="text-align:center;margin-top:24px;font-size:14px;">'
    + '<a href="#" id="goLoginFromForgot" style="color:var(--primary);">&larr; Back to sign in</a></div></div></div>';
  document.getElementById('app').innerHTML = html;
  document.getElementById('goLoginFromForgot').onclick=function(e){e.preventDefault();renderAuth('login');};
  document.getElementById('forgotForm').onsubmit = async function(e) {
    e.preventDefault();
    var btn=document.getElementById('forgotBtn'),alertDiv=document.getElementById('authAlert');
    btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Sending...'; alertDiv.innerHTML='';
    try {
      await pb.collection('users').requestPasswordReset(document.getElementById('forgotEmail').value.trim());
      alertDiv.innerHTML='<div class="alert alert-success"><i class="fa fa-check-circle"></i> Reset link sent! Check your email.</div>';
    } catch(err) {
      var msg=(err&&err.message)?err.message:String(err);
      alertDiv.innerHTML='<div class="alert alert-error">'+escHtml(msg)+'</div>';
      btn.disabled=false; btn.innerHTML='<i class="fa fa-envelope"></i> Send Reset Link';
    }
  };
}

function renderResetPage() {
  var params=new URLSearchParams(window.location.search);
  var token=params.get('token')||'';
  var html = '<div class="auth-wrapper"><div class="auth-card">'
    + authLogo()
    + '<h2 class="auth-title">Set new password</h2>'
    + '<p class="auth-subtitle">Enter your new password below</p>'
    + '<div id="authAlert"></div><form id="resetForm">'
    + '<div class="form-group"><label>New Password <span class="required">*</span></label>'
    + '<input type="password" class="form-control" id="newPassword" placeholder="Min. 6 characters" required minlength="6" autocomplete="new-password" /></div>'
    + '<div class="form-group"><label>Confirm Password <span class="required">*</span></label>'
    + '<input type="password" class="form-control" id="newPasswordConfirm" placeholder="Repeat password" required minlength="6" autocomplete="new-password" /></div>'
    + '<button type="submit" class="btn btn-primary btn-full" id="resetBtn"><i class="fa fa-lock"></i> Update Password</button>'
    + '</form></div></div>';
  document.getElementById('app').innerHTML = html;
  document.getElementById('resetForm').onsubmit = async function(e) {
    e.preventDefault();
    var btn=document.getElementById('resetBtn'),alertDiv=document.getElementById('authAlert');
    var newPw=document.getElementById('newPassword').value;
    var confirmPw=document.getElementById('newPasswordConfirm').value;
    if(newPw!==confirmPw){alertDiv.innerHTML='<div class="alert alert-error"><i class="fa fa-exclamation-circle"></i> Passwords do not match.</div>';return;}
    btn.disabled=true; btn.innerHTML='<span class="spinner"></span> Updating...'; alertDiv.innerHTML='';
    try {
      await pb.collection('users').confirmPasswordReset(token,newPw,confirmPw);
      alertDiv.innerHTML='<div class="alert alert-success"><i class="fa fa-check-circle"></i> Password updated! Redirecting...</div>';
      setTimeout(function(){renderAuth('login');},2000);
    } catch(err) {
      var msg=(err&&err.message)?err.message:String(err);
      alertDiv.innerHTML='<div class="alert alert-error">'+escHtml(msg)+'</div>';
      btn.disabled=false; btn.innerHTML='<i class="fa fa-lock"></i> Update Password';
    }
  };
}