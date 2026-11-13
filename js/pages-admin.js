// pages-admin.js - Admin-facing pages (PocketBase)

function renderAdminDashboard() {
  var all = App.reservations;
  var pending = all.filter(function(r){return r.status==='pending';});
  var today = all.filter(function(r){return r.reservation_date===todayStr()&&r.status==='approved';});

  var html = '<div class="page-header"><h2>Admin Dashboard</h2>'
    + '<p>'+escHtml(cfg.SCHOOL_NAME)+' Lunch Table Management</p></div>'
    + '<div class="stat-grid">'
    + '<div class="stat-card" style="cursor:pointer;" onclick="navigate(\'approvals\')"><div class="stat-icon stat-icon-yellow"><i class="fa fa-clock"></i></div>'
    + '<div><div class="stat-num">'+pending.length+'</div><div class="stat-label">Pending Approval</div></div></div>'
    + '<div class="stat-card"><div class="stat-icon stat-icon-blue"><i class="fa fa-calendar-day"></i></div>'
    + '<div><div class="stat-num">'+today.length+'</div><div class="stat-label">Today\'s Reservations</div></div></div>'
    + '</div>';

  if (pending.length > 0) {
    html += '<div class="alert alert-warning"><i class="fa fa-exclamation-triangle"></i>'
      + '<div><strong>'+pending.length+' reservation(s)</strong> require your review. '
      + '<a href="#" onclick="navigate(\'approvals\');return false;">Go to Approvals &#8594;</a></div></div>';
  }

  if (today.length > 0) {
    html += '<div class="card" style="margin-bottom:24px;">'
      + '<div class="card-header"><h3><i class="fa fa-calendar-day" style="color:var(--primary);margin-right:8px;"></i>Today\'s Reservations ('+fmtShort(todayStr())+')</h3>'
      + '<button class="btn btn-ghost btn-sm no-print" onclick="navigate(\'reports\')"><i class="fa fa-print"></i> Print Report</button></div>'
      + '<div class="card-body" style="padding:0;"><div class="table-wrapper"><table><thead><tr>'
      + '<th>Requestor</th><th>Time Slot</th><th>Table</th><th>Guests</th><th>Student</th><th>Teacher</th><th>Guest Names</th></tr></thead><tbody>';
    today.forEach(function(r) {
      var ts=r.timeslots||{}, prof=r.profiles||{};
      html += '<tr><td><strong>'+escHtml(prof.full_name||prof.email||'')+'</strong><br><small>'+escHtml(prof.email||'')+'</small></td>'
        + '<td>'+escHtml(ts.name||'')+'<br><small style="color:var(--gray-500);">'+fmtTime(ts.start_time)+'-'+fmtTime(ts.end_time)+'</small></td>'
        + '<td>Table '+r.table_number+'</td>'
          + '<td>'+r.num_guests+'</td>'
          + '<td>'+escHtml(r.student_name||'')+'</td>'
          + '<td>'+escHtml(r.teacher_name||'')+'</td>'
          +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+escHtml(r.guest_names||'')+'</td></tr>';
    });
    html += '</tbody></table></div></div></div>';
  }

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'approvals\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x2705;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">Approvals</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">Review pending reservations</p></div>'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'calendar\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x1F4C6;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">Calendar</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">View all reservations</p></div>'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'reports\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x1F4C4;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">Reports</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">Print daily and pending reports</p></div>'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'settings\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x2699;&#xFE0F;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">Settings</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">Manage tables, timeslots, and breaks</p></div>'
    + '</div>';
  return html;
}

// ── Approvals page ───────────────────────────────────────────────────────────

function renderApprovalsPage() {
  var pending = App.reservations.filter(function(r){return r.status==='pending';})
    .sort(function(a,b){return a.reservation_date<b.reservation_date?1:-1;});

  return '<div class="page-header-row">'
    + '<div class="page-header"><h2>Approvals</h2><p>Review pending reservation requests</p></div>'
    + '</div>'
    + '<div id="approvalsTabContent">'
    + buildApprovalsTabContent(pending)
    + '</div>';
}

function buildApprovalsTabContent(pending) {
  var html = '<div id="bulkBar" style="display:none;" class="bulk-bar">'
    + '<span id="bulkCount">0 selected</span>'
    + '<div class="bulk-bar-actions">'
    + '<button class="btn btn-secondary btn-sm" onclick="bulkAction(\'approved\')"><i class="fa fa-check"></i> Approve All</button>'
    + '<button class="btn btn-danger btn-sm" onclick="bulkAction(\'rejected\')"><i class="fa fa-times"></i> Reject All</button>'
    + '</div></div>';

  if (pending.length === 0) {
    return html + '<div class="empty-state"><i class="fa fa-check-circle" style="color:var(--secondary)"></i>'
      + '<h3>All caught up!</h3><p>No pending reservations to review.</p></div>';
  }

  html += '<div class="card">'
    + '<div class="card-header" style="justify-content:space-between;">'
    + '<h3 style="margin:0;">'+pending.length+' pending reservation'+(pending.length!==1?'s':'')+'</h3>'
    + '<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;">'
    + '<input type="checkbox" id="selectAllCheck" onchange="toggleSelectAll(this)"> Select All</label>'
    + '</div><div class="card-body" style="padding:16px;">';

  pending.forEach(function(r) {
    var ts=r.timeslots||{}, prof=r.profiles||{};
    html += '<div class="approval-card" id="ac-'+r.id+'">'
      + '<div style="display:flex;align-items:flex-start;gap:12px;">'
      + '<input type="checkbox" class="row-check approval-check" value="'+r.id+'" onchange="updateBulkBar()">'
      + '<div style="flex:1;">'
      + '<div class="approval-card-header">'
      + '<div class="approval-card-info">'
      + '<h4>'+escHtml(prof.full_name||prof.email||'Unknown')+'</h4>'
      + '<p>'+escHtml(prof.email||'')+'</p></div>'
      + '<div class="approval-card-actions">'
      + '<button class="btn btn-secondary btn-sm" onclick="reviewReservation(\''+r.id+'\',\'approved\')"><i class="fa fa-check"></i> Approve</button>'
      + '<button class="btn btn-danger btn-sm" onclick="reviewReservation(\''+r.id+'\',\'rejected\')"><i class="fa fa-times"></i> Reject</button>'
      + '<button class="btn btn-ghost btn-sm" onclick="showApprovalNoteModal(\''+r.id+'\')"><i class="fa fa-comment"></i> Add Note</button>'
      + '</div></div>'
      + '<div class="approval-card-meta">'
      + '<span>'+statusBadge(r.status)+'</span>'
      + '<span><i class="fa fa-calendar"></i> '+fmt(r.reservation_date)+'</span>'
      + '<span><i class="fa fa-clock"></i> '+escHtml(ts.name||'')+' ('+fmtTime(ts.start_time)+'-'+fmtTime(ts.end_time)+')</span>'
      + '<span><i class="fa fa-chair"></i> Table '+r.table_number+'</span>'
      + '<span><i class="fa fa-users"></i> '+r.num_guests+' guest'+(r.num_guests>1?'s':'')+'</span>'
      + (r.student_name?'<span><i class="fa fa-user-graduate"></i> '+escHtml(r.student_name)+'</span>':'')
      + (r.teacher_name?'<span><i class="fa fa-chalkboard-teacher"></i> '+escHtml(r.teacher_name)+'</span>':'')
      + '<span><i class="fa fa-id-card"></i> '+(r.guest_names?escHtml(r.guest_names):'<em style="color:var(--gray-400)">none listed</em>')+'</span>'
      + '</div>'
      + (r.notes?'<div class="alert alert-info" style="padding:8px 12px;margin:0;font-size:13px;"><i class="fa fa-comment"></i> '+escHtml(r.notes)+'</div>':'')
      + (r.admin_notes?'<div class="alert alert-warning" style="padding:8px 12px;margin-top:8px;font-size:13px;"><i class="fa fa-sticky-note"></i> Admin note: '+escHtml(r.admin_notes)+'</div>':'')
      + '</div></div></div>';
  });

  html += '</div></div>';
  return html;
}

async function adminCancelReservation(id) {
  var r = App.reservations.find(function(x){return x.id===id;}); if(!r)return;
  var ts = r.timeslots||{}, prof = r.profiles||{};
  var modal = '<div class="modal-backdrop" id="adminCancelModal"><div class="modal">'
    +'<div class="modal-header"><h3><i class="fa fa-ban" style="color:var(--danger);margin-right:8px;"></i>Cancel Reservation</h3>'
    +'<button class="modal-close" onclick="document.getElementById(\'adminCancelModal\').remove()"><i class="fa fa-times"></i></button></div>'
    +'<div class="modal-body">'
    +'<p style="margin-bottom:12px;">Cancelling approved reservation for <strong>'+escHtml(prof.full_name||prof.email||'Unknown')+'</strong>:</p>'
    +'<div style="background:var(--gray-50);border-radius:8px;padding:12px;font-size:13px;margin-bottom:16px;">'
    +'<div>'+fmt(r.reservation_date)+' &nbsp;&middot;&nbsp; '+escHtml(ts.name||'')+' ('+fmtTime(ts.start_time)+' - '+fmtTime(ts.end_time)+')</div>'
    +'<div>Table '+r.table_number+' &nbsp;&middot;&nbsp; '+r.num_guests+' guest'+(r.num_guests>1?'s':'')+'</div>'
    +'</div>'
    +'<div class="form-group"><label>Reason for cancellation <span class="required">*</span></label>'
    +'<textarea class="form-control" id="adminCancelNote" rows="3" placeholder="Required — this note will be visible to the parent"></textarea>'
    +'<div class="form-hint">A note is required when cancelling an approved reservation.</div></div>'
    +'</div><div class="modal-footer">'
    +'<button class="btn btn-danger" id="adminCancelConfirmBtn"><i class="fa fa-ban"></i> Confirm Cancellation</button>'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'adminCancelModal\').remove()">Keep Reservation</button>'
    +'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', modal);
  document.getElementById('adminCancelConfirmBtn').addEventListener('click', async function() {
    var note = document.getElementById('adminCancelNote').value.trim();
    if (!note) {
      var ta = document.getElementById('adminCancelNote');
      ta.style.borderColor = 'var(--danger)';
      ta.placeholder = 'A reason is required before cancelling';
      ta.focus(); return;
    }
    var btn = document.getElementById('adminCancelConfirmBtn');
    btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Cancelling...';
    var upd = {status:'cancelled', admin_notes:note, cancelled_at:new Date().toISOString(), cancelled_by:App.user.id};
    var res2; try { await pb.collection('reservations').update(id, upd); res2={error:null}; } catch(e2) { res2={error:e2}; }
    if (res2 && res2.error) {
      toast('Error: '+res2.error.message, 'error');
      btn.disabled = false; btn.innerHTML = '<i class="fa fa-ban"></i> Confirm Cancellation'; return;
    }
    document.getElementById('adminCancelModal').remove();
    toast('Reservation cancelled', 'success');
    // Notify the parent — use their profile data captured before the modal opened
    var cancelledRes = Object.assign({}, r, {status:'cancelled', admin_notes:note, timeslots:ts, profiles:prof});
    if (App.emailTemplates['cancelled']) {
      await sendEmail(cancelledRes, 'cancelled', note);
    }
    await Promise.all([loadAllReservations(), loadTakenSlots()]);
    renderPage();
  });
}

// ── Reservation History page ──────────────────────────────────────────────────

function renderHistoryPage() {
  var statusParam = (App.pageParams && App.pageParams.historyStatus) || 'all';
  var searchName  = (App.pageParams && App.pageParams.historyName)   || '';
  var searchEmail = (App.pageParams && App.pageParams.historyEmail)  || '';
  var searchDate  = (App.pageParams && App.pageParams.historyDate)   || '';
  var tabDefs = [
    {key:'all',       label:'All',       icon:'fa-list',         color:'var(--primary)'},
    {key:'approved',  label:'Approved',  icon:'fa-check-circle', color:'var(--secondary)'},
    {key:'rejected',  label:'Rejected',  icon:'fa-times-circle', color:'var(--danger)'},
    {key:'cancelled', label:'Cancelled', icon:'fa-ban',          color:'var(--gray-500)'},
  ];
  var tabBtns = tabDefs.map(function(t) {
    var active = t.key === statusParam;
    return '<button class="btn btn-sm '+(active?'btn-primary':'btn-ghost')+'" '
      +'onclick="setHistoryTab(\''+t.key+'\')" style="'+(active?'':'color:'+t.color+';')+'">'
      +'<i class="fa '+t.icon+'"></i> '+t.label+'</button>';
  }).join('');
  return '<div class="page-header-row">'
    +'<div class="page-header"><h2><i class="fa fa-history" style="color:var(--primary);margin-right:10px;"></i>Reservation History</h2>'
    +'<p>Search and review approved, rejected, and cancelled reservations</p></div></div>'
    +'<div class="card" style="margin-bottom:16px;"><div class="card-body" style="padding:16px;">'
    +'<div class="form-row" style="align-items:flex-end;gap:12px;flex-wrap:wrap;">'
    +'<div class="form-group" style="margin:0;flex:1;min-width:180px;"><label style="font-size:12px;margin-bottom:4px;display:block;">Name</label>'
    +'<div style="position:relative;"><i class="fa fa-user" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>'
    +'<input type="text" id="histSearchName" class="form-control" placeholder="Search by parent name\u2026" value="'+escHtml(searchName)+'" style="padding-left:32px;"/></div></div>'
    +'<div class="form-group" style="margin:0;flex:1;min-width:200px;"><label style="font-size:12px;margin-bottom:4px;display:block;">Email</label>'
    +'<div style="position:relative;"><i class="fa fa-envelope" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>'
    +'<input type="text" id="histSearchEmail" class="form-control" placeholder="Search by email\u2026" value="'+escHtml(searchEmail)+'" style="padding-left:32px;"/></div></div>'
    +'<div class="form-group" style="margin:0;min-width:160px;"><label style="font-size:12px;margin-bottom:4px;display:block;">Date</label>'
    +'<input type="date" id="histSearchDate" class="form-control" value="'+escHtml(searchDate)+'"/></div>'
    +'<div style="display:flex;gap:8px;align-items:flex-end;padding-bottom:1px;">'
    +'<button class="btn btn-primary btn-sm" onclick="filterHistory()"><i class="fa fa-search"></i> Search</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="clearHistorySearch()"><i class="fa fa-times"></i> Clear</button>'
    +'</div></div></div></div>'
    +'<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">'+tabBtns+'</div>'
    +'<div id="historyResults">'+buildHistoryResults(statusParam,searchName,searchEmail,searchDate)+'</div>';
}

function buildHistoryResults(statusParam, searchName, searchEmail, searchDate) {
  var source = App.reservations.filter(function(r) {
    return r.status==='approved'||r.status==='rejected'||r.status==='cancelled';
  });
  if (statusParam!=='all') source=source.filter(function(r){return r.status===statusParam;});
  if (searchName) {
    var sn=searchName.toLowerCase();
    source=source.filter(function(r){return((r.profiles||{}).full_name||'').toLowerCase().indexOf(sn)!==-1;});
  }
  if (searchEmail) {
    var se=searchEmail.toLowerCase();
    source=source.filter(function(r){return((r.profiles||{}).email||'').toLowerCase().indexOf(se)!==-1;});
  }
  if (searchDate) source=source.filter(function(r){return r.reservation_date===searchDate;});
  source=source.slice().sort(function(a,b){return a.reservation_date<b.reservation_date?1:-1;});
  if (source.length===0) {
    return '<div class="empty-state"><i class="fa fa-search" style="color:var(--gray-300);"></i>'
      +'<h3>No reservations found</h3><p>Try adjusting your search or selecting a different status tab.</p></div>';
  }
  var html='<div class="card"><div class="card-header" style="justify-content:space-between;">'
    +'<h3 style="margin:0;">'+source.length+' reservation'+(source.length!==1?'s':'')+' found</h3>'
    +'</div><div class="card-body" style="padding:0;"><div class="table-wrapper"><table><thead><tr>'
    +'<th>Status</th><th>Date</th><th>Requestor</th><th>Time Slot</th>'
    +'<th>Table</th><th>Guests</th><th>Student</th><th>Teacher</th><th>Guest Names</th><th>Admin Notes</th><th>Submitted</th>'
    +'</tr></thead><tbody>';
  source.forEach(function(r){
    var ts=r.timeslots||{},prof=r.profiles||{};
    html+='<tr>'
      +'<td>'+statusBadge(r.status)+'</td>'
      +'<td style="white-space:nowrap;">'+fmt(r.reservation_date)+'</td>'
      +'<td><strong>'+escHtml(prof.full_name||'\u2014')+'</strong>'+(prof.email?'<br><small style="color:var(--gray-500);">'+escHtml(prof.email)+'</small>':'')+'</td>'
      +'<td>'+escHtml(ts.name||'\u2014')+'<br><small style="color:var(--gray-500);">'+fmtTime(ts.start_time)+' \u2013 '+fmtTime(ts.end_time)+'</small></td>'
      +'<td>Table '+r.table_number+'</td><td>'+r.num_guests+'</td>'
      +'<td>'+escHtml(r.student_name||'\u2014')+'</td>'
      +'<td>'+escHtml(r.teacher_name||'\u2014')+'</td>'
      +'<td>'+escHtml(r.guest_names||'\u2014')+'</td>'
      +'<td style="max-width:220px;word-break:break-word;">'+escHtml(r.admin_notes||'\u2014')+'</td>'
      +'<td style="white-space:nowrap;"><small>'+fmtShort((r.created_at||'').split('T')[0])+'</small></td>'
      +'</tr>';
  });
  return html+'</tbody></table></div></div></div>';
}

function setHistoryTab(status) {
  App.pageParams = App.pageParams || {};
  App.pageParams.historyStatus = status;
  var tabColors = {all:'var(--primary)',approved:'var(--secondary)',rejected:'var(--danger)',cancelled:'var(--gray-500)'};
  ['all','approved','rejected','cancelled'].forEach(function(key) {
    var btn = document.querySelector('[onclick="setHistoryTab(\''+key+'\')"]');
    if (!btn) return;
    var isActive = key === status;
    btn.className = btn.className.replace(/btn-primary|btn-ghost/g,'').trim()+(isActive?' btn-primary':' btn-ghost');
    btn.style.color = isActive ? '' : tabColors[key];
  });
  var name  = (document.getElementById('histSearchName')  ||{}).value||'';
  var email = (document.getElementById('histSearchEmail') ||{}).value||'';
  var date  = (document.getElementById('histSearchDate')  ||{}).value||'';
  App.pageParams.historyName  = name;
  App.pageParams.historyEmail = email;
  App.pageParams.historyDate  = date;
  var el = document.getElementById('historyResults');
  if (el) el.innerHTML = buildHistoryResults(status, name, email, date);
}

function filterHistory() {
  var name  = (document.getElementById('histSearchName')  ||{}).value||'';
  var email = (document.getElementById('histSearchEmail') ||{}).value||'';
  var date  = (document.getElementById('histSearchDate')  ||{}).value||'';
  var status = (App.pageParams && App.pageParams.historyStatus)||'all';
  App.pageParams = App.pageParams || {};
  App.pageParams.historyName  = name;
  App.pageParams.historyEmail = email;
  App.pageParams.historyDate  = date;
  var el = document.getElementById('historyResults');
  if (el) el.innerHTML = buildHistoryResults(status, name, email, date);
}

function clearHistorySearch() {
  App.pageParams = App.pageParams || {};
  App.pageParams.historyName  = '';
  App.pageParams.historyEmail = '';
  App.pageParams.historyDate  = '';
  var n = document.getElementById('histSearchName');  if (n) n.value  = '';
  var e = document.getElementById('histSearchEmail'); if (e) e.value  = '';
  var d = document.getElementById('histSearchDate');  if (d) d.value  = '';
  var status = (App.pageParams && App.pageParams.historyStatus)||'all';
  var el = document.getElementById('historyResults');
  if (el) el.innerHTML = buildHistoryResults(status, '', '', '');
}

function wireHistoryEvents() {
  ['histSearchName','histSearchEmail','histSearchDate'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('keydown', function(ev) { if (ev.key==='Enter') filterHistory(); });
  });
}

function updateBulkBar() {
  var checked = document.querySelectorAll('.approval-check:checked');
  var bar = document.getElementById('bulkBar');
  var cnt = document.getElementById('bulkCount');
  if (bar) bar.style.display = checked.length > 0 ? 'flex' : 'none';
  if (cnt) cnt.textContent = checked.length + ' selected';
}

function toggleSelectAll(cb) {
  document.querySelectorAll('.approval-check').forEach(function(c){c.checked=cb.checked;});
  updateBulkBar();
}

async function bulkAction(action) {
  var checked = Array.from(document.querySelectorAll('.approval-check:checked')).map(function(c){return c.value;});
  if (checked.length === 0) return;
  var note = '';
  if (action === 'rejected') {
    var noteResult = prompt('Add a rejection note (optional):');
    if (noteResult === null) return;   // admin clicked Cancel — abort
    note = noteResult;
  }
  var confirmed = confirm((action==='approved'?'Approve':'Reject')+' '+checked.length+' reservation(s)?');
  if (!confirmed) return;
  var failed = 0;
  for (var i=0;i<checked.length;i++) {
    var id = checked[i];
    var upd = { status:action, admin_notes:note||null, reviewed_by:App.user.id, reviewed_at:new Date().toISOString() };
    var r2; try { await pb.collection('reservations').update(id, upd); r2={error:null}; } catch(e2) { r2={error:e2}; }
    if (r2.error) { failed++; continue; }
    var res = App.reservations.find(function(x){return x.id===id;});
    if (res) { res.status=action; res.admin_notes=note||null; await sendEmail(res,action,note); }
    if (action==='rejected') {
      var adminProf = App.profile||{};
      var adminEmail = adminProf.email||'';
      if (adminEmail) {
        var adminEmailRes = Object.assign({},res,{profiles:{full_name:'Admin',email:adminEmail}});
        await sendEmail(adminEmailRes,action,note);
      }
    }
  }
  if (failed > 0) toast(failed+' failed to update','error');
  else toast('Bulk action complete','success');
  await Promise.all([loadAllReservations(), loadTakenSlots()]);
  renderPage();
}

async function reviewReservation(id, action) {
  var note = '';
  if (action === 'rejected') {
    var result = prompt('Add a rejection note (optional):');
    if (result === null) return;   // admin clicked Cancel — abort
    note = result;
  }
  var upd = { status:action, admin_notes:note||null, reviewed_by:App.user.id, reviewed_at:new Date().toISOString() };
  var r; try { await pb.collection('reservations').update(id, upd); r={error:null}; } catch(e2) { r={error:e2}; }
  if (r.error) { toast('Error: '+r.error.message,'error'); return; }
  var res = App.reservations.find(function(x){return x.id===id;});
  if (res) { res.status=action; res.admin_notes=note||null; await sendEmail(res, action, note); }
  if (action==='rejected') {
    var adminProf2=App.profile||{};
    if (adminProf2.email) {
      var adminRes=Object.assign({},res,{profiles:{full_name:'Admin',email:adminProf2.email}});
      await sendEmail(adminRes,action,note);
    }
  }
  toast('Reservation '+action,'success');
  await Promise.all([loadAllReservations(), loadTakenSlots()]);
  renderPage();
}

function showApprovalNoteModal(id) {
  var r = App.reservations.find(function(x){return x.id===id;}); if(!r)return;
  var existing = r.admin_notes||'';
  var html = '<div class="modal-backdrop" id="noteModal"><div class="modal">'
    +'<div class="modal-header"><h3>Add Admin Note</h3>'
    +'<button class="modal-close" onclick="document.getElementById(\'noteModal\').remove()"><i class="fa fa-times"></i></button></div>'
    +'<div class="modal-body">'
    +'<div class="form-group"><label>Note</label>'
    +'<textarea class="form-control" id="noteText" rows="4" placeholder="Enter note...">'+escHtml(existing)+'</textarea></div>'+'</div><div class="modal-footer">'
    +'<button class="btn btn-primary" id="saveNoteBtn"><i class="fa fa-save"></i> Save Note</button>'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'noteModal\').remove()">Cancel</button>'
    +'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('saveNoteBtn').addEventListener('click', async function(){
    var note2=document.getElementById('noteText').value;
    var r2; try { await pb.collection('reservations').update(id,{admin_notes:note2}); r2={error:null}; } catch(e2) { r2={error:e2}; }
    if(r2.error){toast('Error: '+r2.error.message,'error');return;}
    if(r)r.admin_notes=note2;
    toast('Note saved','success');
    document.getElementById('noteModal').remove();
    renderPage();
  });
}

// ── Report export helpers ────────────────────────────────────────────────────

function reportDownload(filename, content, mime) {
  var blob = new Blob([content], { type: mime });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(function() { URL.revokeObjectURL(url); a.remove(); }, 200);
}

function csvEscape(v) {
  var s = String(v == null ? '' : v);
  if (s.indexOf(',') !== -1 || s.indexOf('"') !== -1 || s.indexOf('\n') !== -1) {
    s = '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function exportDailyCSV() {
  var picker = document.getElementById('reportDatePicker');
  var today2 = picker ? picker.value : todayStr();
  var rows = [['Date','Time Slot','Start','End','Requestor','Email','Table','Guests','Student','Teacher','Guest Names','Notes']];
  App.reservations.filter(function(r){ return r.reservation_date===today2&&r.status==='approved'; }).forEach(function(r) {
    var ts=r.timeslots||{}, prof=r.profiles||{};
    rows.push([today2,ts.name||'',ts.start_time||'',ts.end_time||'',prof.full_name||'',prof.email||'','Table '+r.table_number,r.num_guests,r.student_name||'',r.teacher_name||'',r.guest_names||'',r.notes||'']);
  });
  reportDownload('daily-reservations-'+today2+'.csv', rows.map(function(r){return r.map(csvEscape).join(',');}).join('\r\n'), 'text/csv');
}

function exportPendingCSV() {
  var rows = [['Submitted','Requestor','Email','Date','Time Slot','Start','End','Table','Guests','Student','Teacher','Guest Names','Notes']];
  App.reservations.filter(function(r){return r.status==='pending';}).forEach(function(r) {
    var ts=r.timeslots||{}, prof=r.profiles||{};
    rows.push([(r.created_at||'').split('T')[0],prof.full_name||'',prof.email||'',r.reservation_date,ts.name||'',ts.start_time||'',ts.end_time||'','Table '+r.table_number,r.num_guests,r.student_name||'',r.teacher_name||'',r.guest_names||'',r.notes||'']);
  });
  reportDownload('pending-reservations-'+todayStr()+'.csv', rows.map(function(r){return r.map(csvEscape).join(',');}).join('\r\n'), 'text/csv');
}

function exportDailyText() {
  var picker = document.getElementById('reportDatePicker');
  var today2 = picker ? picker.value : todayStr();
  var todayRes = App.reservations.filter(function(r){return r.reservation_date===today2&&r.status==='approved';});
  var lines = [cfg.SCHOOL_NAME, 'Daily Reservations Report — '+new Date().toLocaleString(), '='.repeat(60), ''];
  if (todayRes.length===0) {
    lines.push('No reservations today.');
  } else {
    var bySlot={};
    todayRes.forEach(function(r){if(!bySlot[r.timeslot_id])bySlot[r.timeslot_id]=[];bySlot[r.timeslot_id].push(r);});
    App.timeslots.forEach(function(ts){
      var slotRes=bySlot[ts.id]||[]; if(slotRes.length===0)return;
      lines.push(ts.name+' ('+ts.start_time+' - '+ts.end_time+')');
      lines.push('-'.repeat(40));
      slotRes.forEach(function(r){
        var prof=r.profiles||{};
        lines.push('  '+(prof.full_name||'Unknown')+' <'+(prof.email||'')+'>');
        lines.push('  Table '+r.table_number+'  |  '+r.num_guests+' guest(s)'+(r.student_name?'  |  Student: '+r.student_name:'')+(r.teacher_name?'  |  Teacher: '+r.teacher_name:'')+(r.guest_names?'  |  Guests: '+r.guest_names:'')+(r.notes?'  |  Notes: '+r.notes:''));
      });
      lines.push('');
    });
  }
  lines.push('Total: '+todayRes.length+' reservation(s)');
  reportDownload('daily-reservations-'+today2+'.txt', lines.join('\r\n'), 'text/plain');
}

function exportPendingText() {
  var pendingRes = App.reservations.filter(function(r){return r.status==='pending';});
  var lines = [cfg.SCHOOL_NAME, 'Pending Reservations Report — '+new Date().toLocaleString(), '='.repeat(60), ''];
  if (pendingRes.length===0) {
    lines.push('No pending requests.');
  } else {
    pendingRes.forEach(function(r,i){
      var ts=r.timeslots||{}, prof=r.profiles||{};
      lines.push((i+1)+'. '+(prof.full_name||'Unknown')+' <'+(prof.email||'')+'>');
      lines.push('   Date: '+r.reservation_date+'  |  Slot: '+(ts.name||'')+' ('+(ts.start_time||'')+'-'+(ts.end_time||'')+')');
      lines.push('   Table '+r.table_number+'  |  '+r.num_guests+' guest(s)'+(r.student_name?'  |  Student: '+r.student_name:'')+(r.teacher_name?'  |  Teacher: '+r.teacher_name:'')+(r.guest_names?'  |  Guests: '+r.guest_names:'')+(r.notes?'  |  Notes: '+r.notes:''));
      lines.push('   Submitted: '+(r.created_at||'').split('T')[0]);
      lines.push('');
    });
  }
  lines.push('Total: '+pendingRes.length+' pending request(s)');
  reportDownload('pending-reservations-'+todayStr()+'.txt', lines.join('\r\n'), 'text/plain');
}

function printSection(sectionId) {
  var el = document.getElementById(sectionId);
  if (!el) return;
  var title = sectionId==='reportDaily' ? 'Daily Reservations' : 'Pending Requests';
  var w = window.open('','_blank','width=900,height=700');
  w.document.write('<!DOCTYPE html><html><head><title>'+escHtml(cfg.SCHOOL_NAME)+' \u2014 '+title+'</title>'
    +'<style>body{font-family:Inter,sans-serif;padding:24px;color:#111;}table{width:100%;border-collapse:collapse;}'
    +'th{background:#f3f4f6;padding:8px 12px;text-align:left;font-size:12px;text-transform:uppercase;border-bottom:2px solid #e5e7eb;}'
    +'td{padding:8px 12px;border-bottom:1px solid #f3f4f6;}h2,h3{margin:0 0 4px;}p{color:#6b7280;margin:0 0 16px;}'
    +'small{color:#6b7280;}</style></head><body>'
    +'<h2>'+escHtml(cfg.SCHOOL_NAME)+'</h2>'
    +'<p>'+escHtml(title)+' — Printed: '+new Date().toLocaleString()+'</p>'
    +el.querySelector('.card-body').innerHTML
    +'</body></html>');
  w.document.close(); w.focus();
  setTimeout(function(){ w.print(); }, 400);
}

function buildDailyBody(date) {
  var res = App.reservations.filter(function(r){return r.reservation_date===date&&r.status==='approved';});
  var bySlot={};
  res.forEach(function(r){if(!bySlot[r.timeslot_id])bySlot[r.timeslot_id]=[];bySlot[r.timeslot_id].push(r);});
  if(res.length===0){
    return '<div class="empty-state"><i class="fa fa-inbox"></i><h3>No approved reservations for this date</h3></div>';
  }
  var html='';
  App.timeslots.forEach(function(ts){
    var slotRes=bySlot[ts.id]||[]; if(slotRes.length===0)return;
    html+='<div style="margin-bottom:16px;"><div style="background:var(--gray-50);padding:10px 16px;border-bottom:1px solid var(--gray-200);">'
      +'<strong>'+escHtml(ts.name)+'</strong>'+(ts.description?' \u2014 <em>'+escHtml(ts.description)+'</em>':'')
      +' &nbsp; ('+fmtTime(ts.start_time)+' - '+fmtTime(ts.end_time)+')</div>'
      +'<table style="width:100%;border-collapse:collapse;"><thead><tr>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Requestor</th>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Email</th>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Table</th>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Guests</th>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Student</th>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Teacher</th>'
      +'<th style="padding:8px 16px;background:var(--gray-50);font-size:12px;font-weight:700;color:var(--gray-600);text-transform:uppercase;border-bottom:1px solid var(--gray-200);">Guest Names</th>'
      +'</tr></thead><tbody>';
    slotRes.forEach(function(r){
      var p=r.profiles||{};
      html+='<tr><td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+escHtml(p.full_name||'')+'</td>'
        +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+escHtml(p.email||'')+'</td>'
        +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">Table '+r.table_number+'</td>'
        +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+r.num_guests+'</td>'
        +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+escHtml(r.student_name||'')+'</td>'
        +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+escHtml(r.teacher_name||'')+'</td>'
        +'<td style="padding:10px 16px;border-bottom:1px solid var(--gray-100);">'+escHtml(r.guest_names||'')+'</td></tr>';
    });
    html+='</tbody></table></div>';
  });
  return html;
}

function renderReportsPage() {
  var today2=todayStr();
  var pendingRes=App.reservations.filter(function(r){return r.status==='pending';});

  var dailyBtns='<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<button class="btn btn-ghost btn-sm" onclick="printSection(\'reportDaily\')"><i class="fa fa-print"></i> Print</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="exportDailyCSV()"><i class="fa fa-file-csv"></i> CSV</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="exportDailyText()"><i class="fa fa-file-alt"></i> Text</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="printSection(\'reportDaily\')"><i class="fa fa-file-pdf"></i> PDF</button>'
    +'</div>';

  var pendingBtns='<div style="display:flex;gap:8px;flex-wrap:wrap;">'
    +'<button class="btn btn-ghost btn-sm" onclick="printSection(\'reportPending\')"><i class="fa fa-print"></i> Print</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="exportPendingCSV()"><i class="fa fa-file-csv"></i> CSV</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="exportPendingText()"><i class="fa fa-file-alt"></i> Text</button>'
    +'<button class="btn btn-ghost btn-sm" onclick="printSection(\'reportPending\')"><i class="fa fa-file-pdf"></i> PDF</button>'
    +'</div>';

  var html='<div class="page-header-row no-print">'
    +'<div class="page-header"><h2>Reports</h2><p>Print, export, or download reservation reports</p></div>'
    +'<button class="btn btn-primary" onclick="window.print()"><i class="fa fa-print"></i> Print All</button>'
    +'</div>'
    +'<div class="print-header" style="margin-bottom:20px;">'
    +'<h1 style="font-size:24px;font-weight:700;">'+escHtml(cfg.SCHOOL_NAME)+'</h1>'
    +'<p>Lunch Table Reservations Report \u2014 Printed: '+new Date().toLocaleString()+'</p></div>';

  html+='<div class="card" id="reportDaily" style="margin-bottom:24px;">'
    +'<div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
    +'<div style="display:flex;align-items:center;gap:12px;">'
    +'<h3 style="margin:0;"><i class="fa fa-calendar-day" style="color:var(--primary);margin-right:8px;"></i>Daily Reservations</h3>'
    +'<input type="date" id="reportDatePicker" class="form-control" style="width:auto;padding:4px 10px;font-size:14px;" value="'+today2+'">'
    +'</div>'
    +dailyBtns+'</div>'
    +'<div class="card-body" id="reportDailyBody" style="padding:0;">'
    +buildDailyBody(today2)
    +'</div></div>';

  html+='<div class="card" id="reportPending">'
    +'<div class="card-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">'
    +'<h3><i class="fa fa-clock" style="color:var(--warning);margin-right:8px;"></i>Pending Requests ('+pendingRes.length+')</h3>'
    +pendingBtns+'</div><div class="card-body" style="padding:0;">';
  if(pendingRes.length===0){
    html+='<div class="empty-state"><i class="fa fa-check-circle" style="color:var(--secondary);"></i><h3>No pending requests</h3></div>';
  } else {
    html+='<div class="table-wrapper"><table><thead><tr>'
      +'<th>Requestor</th><th>Date</th><th>Time Slot</th><th>Table</th><th>Guests</th><th>Student</th><th>Teacher</th><th>Guest Names</th><th>Submitted</th></tr></thead><tbody>';
    pendingRes.forEach(function(r){
      var ts5=r.timeslots||{}, prof5=r.profiles||{};
      html+='<tr><td><strong>'+escHtml(prof5.full_name||'')+'</strong><br><small>'+escHtml(prof5.email||'')+'</small></td>'
        +'<td>'+fmtShort(r.reservation_date)+'</td>'
        +'<td>'+escHtml(ts5.name||'')+'<br><small>'+fmtTime(ts5.start_time)+'-'+fmtTime(ts5.end_time)+'</small></td>'
        +'<td>Table '+r.table_number+'</td>'
        +'<td>'+r.num_guests+'</td>'
        +'<td>'+escHtml(r.student_name||'')+'</td>'
        +'<td>'+escHtml(r.teacher_name||'')+'</td>'
        +'<td>'+escHtml(r.guest_names||'')+'</td>'
        +'<td>'+fmtShort((r.created_at||'').split('T')[0])+'</td></tr>';
    });
    html+='</tbody></table></div>';
  }
  html+='</div></div>';
  return html;
}

function tsRowHtml(ts) {
  return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100);">'
    + '<div style="flex:1;"><strong>' + escHtml(ts.name) + '</strong><br>'
    + '<small style="color:var(--gray-500);">' + fmtTime(ts.start_time) + ' \u2013 ' + fmtTime(ts.end_time) + '</small>'
    + (ts.description ? '<br><small style="color:var(--gray-400);">' + escHtml(ts.description) + '</small>' : '')
    + '</div>'
    + (ts.is_active === false ? ' <span style="background:#fee2e2;color:#dc2626;font-size:11px;padding:1px 6px;border-radius:9px;font-weight:600;">inactive</span>' : '')
    + '<button class="btn btn-ghost btn-sm" onclick="editTimeslot(\'' + ts.id + '\')"><i class="fa fa-edit"></i></button>'
    + '<button class="btn btn-outline-danger btn-sm" onclick="deleteTimeslot(\'' + ts.id + '\')"><i class="fa fa-trash"></i></button>'
    + '</div>';
}

function renderSettingsPage() {
  var s = App.settings;
  var tableCount = parseInt(s.table_count)||10;
  var advDays = parseInt(s.advance_booking_days)||2;
  var availWd = s.available_weekdays||[1,2,3,4,5];
  var wdNames=[{v:1,n:'Monday'},{v:2,n:'Tuesday'},{v:3,n:'Wednesday'},{v:4,n:'Thursday'},{v:5,n:'Friday'}];
  var wdChecks = wdNames.map(function(w){
    return '<label class="checkbox-label"><input type="checkbox" value="'+w.v+'" class="wdCheck"'+(availWd.indexOf(w.v)!==-1?' checked':'')+'>'+w.n+'</label>';
  }).join('');

  var scenarioTypes = getDistinctScenarioTypes();

  // Sort timeslots by start_time, then group by scenario_type
  var sortedTs = App.timeslots.slice().sort(function(a, b) {
    return (a.start_time || '').localeCompare(b.start_time || '');
  });

  var tsHtml = '';
  if (scenarioTypes.length === 0) {
    // No scenario types assigned â€“ flat list sorted by start time
    sortedTs.forEach(function(ts) {
      tsHtml += tsRowHtml(ts);
    });
  } else {
    // Group by scenario type
    scenarioTypes.forEach(function(sc) {
      var group = sortedTs.filter(function(ts) { return ts.scenario_type === sc; });
      if (group.length === 0) return;
      tsHtml += '<div style="background:var(--gray-50);border-radius:6px;padding:4px 12px;margin-bottom:2px;font-size:12px;font-weight:700;color:var(--primary);letter-spacing:.05em;">SCENARIO ' + escHtml(sc) + '</div>';
      group.forEach(function(ts) { tsHtml += tsRowHtml(ts); });
    });
    // Timeslots with no scenario type (shouldn't exist once required, but handle gracefully)
    var unassigned = sortedTs.filter(function(ts) { return !ts.scenario_type; });
    if (unassigned.length > 0) {
      tsHtml += '<div style="background:var(--gray-50);border-radius:6px;padding:4px 12px;margin-bottom:2px;font-size:12px;font-weight:700;color:var(--gray-400);letter-spacing:.05em;">NO SCENARIO</div>';
      unassigned.forEach(function(ts) { tsHtml += tsRowHtml(ts); });
    }
  }


    var breaksHtml='';
  App.breaks.forEach(function(b){
    breaksHtml+='<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--gray-100);">'
      +'<div style="flex:1;"><strong>'+escHtml(b.name)+'</strong><br>'
      +'<small style="color:var(--gray-500);">'+fmtShort(b.start_date)+' – '+fmtShort(b.end_date)+'</small></div>'
      +'<button class="btn btn-outline-danger btn-sm" onclick="deleteBreak(\''+b.id+'\')"><i class="fa fa-trash"></i></button>'
      +'</div>';
  });

  return '<div class="page-header"><h2>Settings</h2><p>Configure system settings</p></div>'
    +'<div class="card" style="max-width:800px;">'
    +'<div class="card-header"><h3><i class="fa fa-cog" style="color:var(--primary);margin-right:8px;"></i>System Configuration</h3></div>'
    +'<div class="card-body">'
    +'<div class="settings-section">'
    +'<div class="settings-section-title"><i class="fa fa-chair"></i> Tables &amp; Booking</div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label>Number of Tables</label>'
    +'<input type="number" class="form-control" id="setTableCount" value="'+tableCount+'" min="1" max="100" /></div>'
    +'<div class="form-group"><label>Advance Booking (days)</label>'
    +'<input type="number" class="form-control" id="setAdvDays" value="'+advDays+'" min="0" max="30" />'
    +'<div class="form-hint">Minimum days in advance a reservation must be made</div></div>'
    +'</div></div>'
    +'<div class="settings-section">'
    +'<div class="settings-section-title"><i class="fa fa-calendar-week"></i> Available School Days</div>'
    +'<div class="checkbox-group" id="wdCheckGroup">'+wdChecks+'</div></div>'
    +'<div style="margin-top:8px;margin-bottom:24px;">'
    +'<button class="btn btn-primary" id="saveGeneralBtn"><i class="fa fa-save"></i> Save General Settings</button></div>'
    +'<hr class="divider">'
    +'<div class="settings-section">'
    +'<div class="settings-section-title"><i class="fa fa-clock"></i> Lunch Timeslots</div>'
    +tsHtml
    +'<button class="btn btn-outline btn-sm" style="margin-top:12px;" onclick="showAddTimeslotModal()"><i class="fa fa-plus"></i> Add Timeslot</button></div>'
    +'<hr class="divider">'
    +renderScenarioRotationSection()
    +'<hr class="divider">'
    +'<div class="settings-section">'
    +'<div class="settings-section-title"><i class="fa fa-umbrella-beach"></i> School Breaks</div>'
    +breaksHtml
    +'<button class="btn btn-outline btn-sm" style="margin-top:12px;" onclick="showAddBreakModal()"><i class="fa fa-plus"></i> Add Break</button></div>'
    +'</div></div>';
}

async function saveGeneralSettings() {
  var tc = parseInt(document.getElementById('setTableCount').value)||10;
  var adv = parseInt(document.getElementById('setAdvDays').value)||2;
  var wds = Array.from(document.querySelectorAll('.wdCheck:checked')).map(function(c){return parseInt(c.value);});
  var updates = [
    {key:'table_count',value:tc},
    {key:'advance_booking_days',value:adv},
    {key:'available_weekdays',value:wds},
  ];
  for(var i=0;i<updates.length;i++){
    var u=updates[i];
    var r;
    try {
      var sRec=null;
      try{sRec=await pb.collection('settings').getFirstListItem(pb.filter('key={:k}',{k:u.key}));}catch(notFound){}
      if(sRec){
        await pb.collection('settings').update(sRec.id,{value:JSON.stringify(u.value)});
      }else{
        await pb.collection('settings').create({key:u.key,value:JSON.stringify(u.value)});
      }
      r={error:null};
    }catch(e2){r={error:e2};}
    if(r.error){toast('Error saving '+u.key+': '+r.error.message,'error');return;}
  }
  await loadSettings();
  toast('Settings saved!','success');
}

function showAddTimeslotModal(existing) {
  var e=existing||{};
  var html='<div class="modal-backdrop" id="tsModal"><div class="modal">'
    +'<div class="modal-header"><h3>'+(e.id?'Edit':'Add')+' Timeslot</h3>'
    +'<button class="modal-close" onclick="document.getElementById(\'tsModal\').remove()"><i class="fa fa-times"></i></button></div>'
    +'<div class="modal-body">'
    +'<div class="form-group"><label>Name <span class="required">*</span></label>'
    +'<input type="text" class="form-control" id="tsName" value="'+escHtml(e.name||'')+'" placeholder="1st Lunch" required /></div>'
    +'<div class="form-group"><label>Description</label>'
    +'<input type="text" class="form-control" id="tsDesc" value="'+escHtml(e.description||'')+'" placeholder="Optional description..." /></div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label>Start Time <span class="required">*</span></label>'
    +'<input type="time" class="form-control" id="tsStart" value="'+(e.start_time||'')+'" required /></div>'
    +'<div class="form-group"><label>End Time <span class="required">*</span></label>'
    +'<input type="time" class="form-control" id="tsEnd" value="'+(e.end_time||'')+'" required /></div>'
    +'</div>'
    +'<div class="form-group"><label>Sort Order</label>'
    +'<input type="number" class="form-control" id="tsSortOrder" value="'+(e.sort_order||0)+'" /></div>'
    +'<div class="form-group" style="margin-top:12px;"><label>Scenario Type <span class="required">*</span></label>'
    +'<input type="text" class="form-control" id="tsScenarioType" maxlength="1" value="'+escHtml((e.scenario_type||'')).toUpperCase()+'" placeholder="A" style="text-transform:uppercase;max-width:80px;" /></div>'
    +'<div class="form-group" style="margin-top:12px;"><label class="checkbox-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox" id="tsIsActive" '+(e.is_active===false?'':'checked')+'> Active (show in booking)</label></div>'
+'</div><div class="modal-footer">'
    +'<button class="btn btn-primary" id="saveTsBtn"><i class="fa fa-save"></i> Save</button>'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'tsModal\').remove()">Cancel</button>'
    +'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('saveTsBtn').addEventListener('click', async function(){
    var rawScenario = (document.getElementById('tsScenarioType').value||'').trim().toUpperCase();
    var data={name:document.getElementById('tsName').value.trim(),description:document.getElementById('tsDesc').value.trim(),start_time:document.getElementById('tsStart').value,end_time:document.getElementById('tsEnd').value,sort_order:parseInt(document.getElementById('tsSortOrder').value)||0,scenario_type:rawScenario||null,is_active:document.getElementById('tsIsActive').checked};
    if(!data.name||!data.start_time||!data.end_time){toast('Name and times are required','error');return;}
    if(!rawScenario){toast('Scenario type is required','error');return;}
    if(!/^[A-Z]$/.test(rawScenario)){toast('Scenario type must be a single letter A-Z','error');return;}
    var prevTypes = getDistinctScenarioTypes();
    var r; try { if(e.id){ await pb.collection('timeslots').update(e.id,data); }else{ await pb.collection('timeslots').create(data); } r={error:null}; } catch(e2){ r={error:e2}; }
    if(r.error){toast('Error: '+r.error.message,'error');return;}
    toast('Timeslot '+(e.id?'updated':'added'),'success');
    document.getElementById('tsModal').remove();
    await loadAllTimeslots();
    var newTypes = getDistinctScenarioTypes();
    if(prevTypes.join(',') !== newTypes.join(',') && newTypes.length > 0){
      await applyScenarioRotation();
      toast('Scenario rotation applied starting 1st of next month','info');
    }
    renderPage();
  });
}

function editTimeslot(id){var ts=App.timeslots.find(function(t){return t.id===id;});if(ts)showAddTimeslotModal(ts);}

async function deleteTimeslot(id){
  if(!confirm('Delete this timeslot? This cannot be undone.'))return;
  var r; try { await pb.collection('timeslots').delete(id); r={error:null}; } catch(e2){ r={error:e2}; }
  if(r.error){toast('Error: '+r.error.message,'error');return;}
  toast('Timeslot deleted','success');
  await loadAllTimeslots(); renderPage();
}

function showAddBreakModal() {
  var html='<div class="modal-backdrop" id="brModal"><div class="modal">'
    +'<div class="modal-header"><h3>Add School Break</h3>'
    +'<button class="modal-close" onclick="document.getElementById(\'brModal\').remove()"><i class="fa fa-times"></i></button></div>'
    +'<div class="modal-body">'
    +'<div class="form-group"><label>Break Name <span class="required">*</span></label>'
    +'<input type="text" class="form-control" id="brName" placeholder="Winter Break" required /></div>'
    +'<div class="form-row">'
    +'<div class="form-group"><label>Start Date <span class="required">*</span></label>'
    +'<input type="date" class="form-control" id="brStart" required /></div>'
    +'<div class="form-group"><label>End Date <span class="required">*</span></label>'
    +'<input type="date" class="form-control" id="brEnd" required /></div>'
    +'</div></div><div class="modal-footer">'
    +'<button class="btn btn-primary" id="saveBrBtn"><i class="fa fa-save"></i> Save</button>'
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'brModal\').remove()">Cancel</button>'
    +'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html);
  document.getElementById('saveBrBtn').addEventListener('click', async function(){
    var data={name:document.getElementById('brName').value.trim(),start_date:document.getElementById('brStart').value,end_date:document.getElementById('brEnd').value,created_by:App.user.id};
    if(!data.name||!data.start_date||!data.end_date){toast('All fields required','error');return;}
    var r; try { await pb.collection('school_breaks').create(data); r={error:null}; } catch(e2){ r={error:e2}; }
    if(r.error){toast('Error: '+r.error.message,'error');return;}
    toast('School break added','success');
    document.getElementById('brModal').remove();
    await loadBreaks(); renderPage();
  });
}

async function deleteBreak(id){
  if(!confirm('Delete this school break?'))return;
  var r; try { await pb.collection('school_breaks').delete(id); r={error:null}; } catch(e2){ r={error:e2}; }
  if(r.error){toast('Error: '+r.error.message,'error');return;}
  toast('Break deleted','success');
  await loadBreaks(); renderPage();
}

// Admin email management (in settings page as extra card)
function renderAdminEmailsSection() {
  var html='<div class="card" style="max-width:800px;margin-top:24px;">'
    +'<div class="card-header"><h3><i class="fa fa-user-shield" style="color:var(--warning);margin-right:8px;"></i>Admin Email Privileges</h3></div>'
    +'<div class="card-body">'
    +'<p style="font-size:13px;color:var(--gray-500);margin-bottom:16px;">Users who register with these email addresses will automatically receive admin privileges.</p>'
    +'<div id="adminEmailsList">';
  if(App.adminEmails.length===0){
    html+='<p style="color:var(--gray-400);font-size:14px;">No admin emails configured.</p>';
  } else {
    App.adminEmails.forEach(function(ae){
      html+='<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--gray-100);">'
        +'<i class="fa fa-envelope" style="color:var(--primary);"></i>'
        +'<span style="flex:1;font-size:14px;">'+escHtml(ae.email)+'</span>'
        +'<button class="btn btn-outline-danger btn-sm" onclick="removeAdminEmail(\''+ae.id+'\')"><i class="fa fa-trash"></i></button>'
        +'</div>';
    });
  }
  html+='</div>'
    +'<div style="display:flex;gap:10px;margin-top:16px;">'
    +'<input type="email" class="form-control" id="newAdminEmail" placeholder="newadmin@school.org" />'
    +'<button class="btn btn-primary" onclick="addAdminEmail()"><i class="fa fa-plus"></i> Add</button>'
    +'</div></div></div>';
  return html;
}

async function addAdminEmail(){
  var email=document.getElementById('newAdminEmail').value.trim();
  if(!email){toast('Enter an email address','error');return;}
  var r; try { await pb.collection('admin_emails').create({email:email,added_by:App.user.id}); r={error:null}; } catch(e2){ r={error:e2}; }
  if(r.error){toast('Error: '+r.error.message,'error');return;}
  toast('Admin email added','success');
  document.getElementById('newAdminEmail').value='';
  await loadAdminEmails();
  var mc=document.getElementById('mainContent');
  if(mc)mc.innerHTML=renderSettingsPage()+(renderAdminEmailsSection())+renderEmailTemplatesSection();
  wireSettingsEvents();
}

async function removeAdminEmail(id){
  if(!confirm('Remove this admin email?'))return;
  var r; try { await pb.collection('admin_emails').delete(id); r={error:null}; } catch(e2){ r={error:e2}; }
  if(r.error){toast('Error: '+r.error.message,'error');return;}
  toast('Removed','success');
  await loadAdminEmails();
  var mc=document.getElementById('mainContent');
  if(mc)mc.innerHTML=renderSettingsPage()+(renderAdminEmailsSection())+renderEmailTemplatesSection();
  wireSettingsEvents();
}

function renderEmailTemplatesSection() {
  var at=App.emailTemplates['approved']  ||{subject:'',body:''};
  var rt=App.emailTemplates['rejected']  ||{subject:'',body:''};
  var ct=App.emailTemplates['cancelled'] ||{subject:'',body:''};
  var html='<div class="card" style="max-width:800px;margin-top:24px;">'
    +'<div class="card-header"><h3><i class="fa fa-envelope-open-text" style="color:var(--primary);margin-right:8px;"></i>Email Templates</h3></div>'
    +'<div class="card-body">'
    +'<p style="font-size:13px;color:var(--gray-400);margin-bottom:16px;">Available variables: {{parent_name}}, {{reservation_date}}, {{timeslot_name}}, {{timeslot_start}}, {{timeslot_end}}, {{table_number}}, {{num_guests}}, {{student_name}}, {{teacher_name}}, {{guest_names}}, {{admin_notes_section}}</p>'
    +'<div class="tabs">'
    +'<button class="tab-btn active" onclick="switchTab(this,\'emailTabApproved\')">Approval Email</button>'
    +'<button class="tab-btn" onclick="switchTab(this,\'emailTabRejected\')">Rejection Email</button>'
    +'<button class="tab-btn" onclick="switchTab(this,\'emailTabCancelled\')">Cancellation Email</button>'
    +'</div>'
    +'<div class="tab-panel active" id="emailTabApproved">'
    +'<div class="form-group"><label>Subject</label><input type="text" class="form-control" id="approvedSubject" value="'+escHtml(at.subject)+'" /></div>'
    +'<div class="form-group"><label>Body</label><textarea class="form-control" id="approvedBody" rows="10">'+escHtml(at.body)+'</textarea></div>'
    +'<button class="btn btn-primary" onclick="saveEmailTemplate(\'approved\')"><i class="fa fa-save"></i> Save Approval Template</button>'
    +'</div>'
    +'<div class="tab-panel" id="emailTabRejected">'
    +'<div class="form-group"><label>Subject</label><input type="text" class="form-control" id="rejectedSubject" value="'+escHtml(rt.subject)+'" /></div>'
    +'<div class="form-group"><label>Body</label><textarea class="form-control" id="rejectedBody" rows="10">'+escHtml(rt.body)+'</textarea></div>'
    +'<button class="btn btn-primary" onclick="saveEmailTemplate(\'rejected\')"><i class="fa fa-save"></i> Save Rejection Template</button>'
    +'</div>'
    +'<div class="tab-panel" id="emailTabCancelled">'
    +'<div class="form-group"><label>Subject</label><input type="text" class="form-control" id="cancelledSubject" value="'+escHtml(ct.subject)+'" /></div>'
    +'<div class="form-group"><label>Body</label><textarea class="form-control" id="cancelledBody" rows="10">'+escHtml(ct.body)+'</textarea></div>'
    +'<button class="btn btn-primary" onclick="saveEmailTemplate(\'cancelled\')"><i class="fa fa-save"></i> Save Cancellation Template</button>'
    +'</div>'
    +'</div></div>';
  return html;
}

async function saveEmailTemplate(key){
  var subject=document.getElementById(key+'Subject').value;
  var body=document.getElementById(key+'Body').value;
  var t=App.emailTemplates[key];
  var r; try {
    if (t) { await pb.collection('email_templates').update(t.id,{subject:subject,body:body}); r={error:null}; }
    else { await pb.collection('email_templates').create({template_key:key,subject:subject,body:body}); r={error:null}; }
  } catch(e2) { r={error:e2}; }
  if(r.error){toast('Error: '+r.error.message,'error');return;}
  toast('Template saved','success');
  await loadEmailTemplates();
}

function wireSettingsEvents() {
  var btn=document.getElementById('saveGeneralBtn');
  if(btn) btn.addEventListener('click',saveGeneralSettings);
}


// ============================================================
// SCENARIO ROTATION
// ============================================================

function renderScenarioRotationSection() {
  var types = getDistinctScenarioTypes();
  var html = '<div class="settings-section">'
    +'<div class="settings-section-title"><i class="fa fa-rotate"></i> Scenario Rotation</div>';
  if (types.length === 0) {
    html += '<p style="font-size:13px;color:var(--gray-400);">No scenario types assigned to timeslots yet. '
      +'Edit a timeslot and assign a scenario type (A, B, C...) to enable rotation scheduling.</p>';
  } else {
    html += '<p style="font-size:13px;color:var(--gray-500);margin-bottom:12px;">'
      +'Scenario types: '
      + types.map(function(t){
          return '<span style="background:var(--primary);color:white;border-radius:4px;padding:2px 10px;font-weight:700;font-size:12px;margin-right:4px;">'+escHtml(t)+'</span>';
        }).join('')
      +'</p>'
      +'<p style="font-size:13px;color:var(--gray-500);margin-bottom:12px;">'
      +'Rotation cycles through scenario types on consecutive available school days, '
      +'starting on the <strong>1st of next month</strong>. '
      +'Changing a timeslot scenario type automatically updates the rotation.</p>'
      +'<div id="rotationPreview">' + buildRotationPreview(types) + '</div>'
      +'<button class="btn btn-outline btn-sm" style="margin-top:10px;" onclick="reapplyRotation()">'
      +'<i class="fa fa-refresh"></i> Re-apply Rotation Now</button>';
  }
  html += '</div>';
  return html;
}

function buildRotationPreview(types) {
  if (!types || types.length === 0) return '';
  var today = new Date();
  var nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  var preview = '<div style="overflow-x:auto;"><table style="font-size:12px;border-collapse:collapse;margin-top:4px;"><thead><tr>'
    +'<th style="padding:4px 10px;background:var(--gray-100);border:1px solid var(--gray-200);">Date</th>'
    +'<th style="padding:4px 10px;background:var(--gray-100);border:1px solid var(--gray-200);">Day</th>'
    +'<th style="padding:4px 10px;background:var(--gray-100);border:1px solid var(--gray-200);">Scenario</th>'
    +'</tr></thead><tbody>';
  var dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var avail = App.settings.available_weekdays || [1,2,3,4,5];
  var typeIdx = 0;
  var shown = 0;
  var d = new Date(nextMonth);
  while (shown < 14) {
    var ds = d.toISOString().split('T')[0];
    if (avail.indexOf(d.getDay()) !== -1 && !isSchoolBreak(ds)) {
      var sc = types[typeIdx % types.length];
      preview += '<tr>'
        +'<td style="padding:3px 10px;border:1px solid var(--gray-200);">' + fmtShort(ds) + '</td>'
        +'<td style="padding:3px 10px;border:1px solid var(--gray-200);">' + dayNames[d.getDay()] + '</td>'
        +'<td style="padding:3px 10px;border:1px solid var(--gray-200);text-align:center;">'
        +'<span style="background:var(--primary);color:white;border-radius:4px;padding:1px 8px;font-weight:700;">'+escHtml(sc)+'</span></td></tr>';
      typeIdx++;
      shown++;
    }
    d.setDate(d.getDate() + 1);
    if (shown === 0 && d - nextMonth > 90 * 86400000) break; // safety
  }
  preview += '</tbody></table><p style="font-size:11px;color:var(--gray-400);margin-top:4px;">Showing first 14 school days of next month</p></div>';
  return preview;
}

async function applyScenarioRotation() {
  var types = getDistinctScenarioTypes();
  if (types.length === 0) return;
  var today = new Date();
  var nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  // Delete existing day_scenarios from start of next month onwards
  var nextMonthStr = nextMonth.toISOString().split('T')[0];
  // PocketBase has no bulk delete — fetch all matching records then delete each
  var delRecs; try { delRecs=await pb.collection('day_scenarios').getFullList({filter:pb.filter('date>={:d}',{d:nextMonthStr})}); } catch(e2){delRecs=[];}
  for(var di=0;di<delRecs.length;di++){ try{await pb.collection('day_scenarios').delete(delRecs[di].id);}catch(e3){} }
  var del={error:null};
  if (del.error) { toast('Error clearing old scenarios: ' + del.error.message, 'error'); return; }
  // Generate rotation for 13 months
  var avail = App.settings.available_weekdays || [1,2,3,4,5];
  var endDate = new Date(today.getFullYear(), today.getMonth() + 14, 1);
  var rows = [];
  var typeIdx = 0;
  var d = new Date(nextMonth);
  while (d < endDate) {
    var ds = d.toISOString().split('T')[0];
    if (avail.indexOf(d.getDay()) !== -1 && !isSchoolBreak(ds)) {
      rows.push({ date: ds, scenario_type: types[typeIdx % types.length] });
      typeIdx++;
    }
    d.setDate(d.getDate() + 1);
  }
  // Insert in batches of 500
  for (var i = 0; i < rows.length; i += 500) {
    var batch = rows.slice(i, i + 500);
    // PocketBase has no bulk insert — create records individually within a batch
    var ins={error:null};
    for(var bi=0;bi<batch.length;bi++){try{await pb.collection('day_scenarios').create(batch[bi]);}catch(e2){ins={error:e2};break;}}
    if (ins.error) { toast('Error inserting scenarios: ' + ins.error.message, 'error'); return; }
  }
  await loadDayScenarios();
}

async function reapplyRotation() {
  var types = getDistinctScenarioTypes();
  if (types.length === 0) { toast('No scenario types configured on timeslots yet', 'error'); return; }
  await applyScenarioRotation();
  toast('Scenario rotation re-applied for next month onwards', 'success');
  renderPage();
}
