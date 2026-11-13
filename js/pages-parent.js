// pages-parent.js - Parent-facing pages (PocketBase)

function renderParentDashboard() {
  var myRes = App.reservations;
  var pending = myRes.filter(function(r){return r.status==='pending';});
  var approved = myRes.filter(function(r){return r.status==='approved';});
  var upcoming = approved.filter(function(r){return r.reservation_date>=todayStr();});

  var html = '<div class="page-header-row">'
    + '<div class="page-header"><h2>Welcome, '+escHtml((App.profile&&App.profile.full_name)?(App.profile.full_name.trim().split(' ')[0]):'there')+'!</h2>'
    + '<p>Manage your lunch table reservations for '+escHtml(cfg.SCHOOL_NAME)+'</p></div>'
    + '<button class="btn btn-primary" onclick="navigate(\'new-reservation\')">'
    + '<i class="fa fa-plus"></i> New Reservation</button></div>'
        + '<div class="stat-grid">'
    + '<div class="stat-card" style="cursor:pointer;" onclick="navigate(\'my-reservations\',{tab:\'approved\'})"><div class="stat-icon stat-icon-blue"><i class="fa fa-calendar-check"></i></div>'
    + '<div><div class="stat-num">'+upcoming.length+'</div><div class="stat-label">Upcoming</div></div></div>'
    + '<div class="stat-card" style="cursor:pointer;" onclick="navigate(\'my-reservations\',{tab:\'pending\'})"><div class="stat-icon stat-icon-yellow"><i class="fa fa-clock"></i></div>'
    + '<div><div class="stat-num">'+pending.length+'</div><div class="stat-label">Pending</div></div></div>'
    + '<div class="stat-card" style="cursor:pointer;" onclick="navigate(\'my-reservations\',{tab:\'approved\'})"><div class="stat-icon stat-icon-green"><i class="fa fa-check-circle"></i></div>'
    + '<div><div class="stat-num">'+approved.length+'</div><div class="stat-label">Approved</div></div></div>'
    + '<div class="stat-card" style="cursor:pointer;" onclick="navigate(\'my-reservations\',{tab:\'all\'})"><div class="stat-icon stat-icon-red"><i class="fa fa-list"></i></div>'
    + '<div><div class="stat-num">'+myRes.length+'</div><div class="stat-label">Total</div></div></div>'
    + '</div>';


  if (upcoming.length > 0) {
    html += '<div class="card" style="margin-bottom:24px;">'
      + '<div class="card-header"><h3><i class="fa fa-calendar-check" style="color:var(--secondary);margin-right:8px;"></i>Upcoming Approved Reservations</h3></div>'
      + '<div class="card-body" style="padding:0;"><div class="table-wrapper"><table><thead><tr>'
      + '<th>Date</th><th>Time Slot</th><th>Table</th><th>Guests</th><th>Actions</th></tr></thead><tbody>';
    upcoming.slice(0,5).forEach(function(r) {
      var ts = r.timeslots || {};
      html += '<tr><td>'+fmtShort(r.reservation_date)+'</td>'
        + '<td>'+escHtml(ts.name||'')+'<br><small style="color:var(--gray-500);">'+fmtTime(ts.start_time)+' - '+fmtTime(ts.end_time)+'</small></td>'
        + '<td><strong>Table '+r.table_number+'</strong></td>'
        + '<td>'+r.num_guests+' guest'+(r.num_guests>1?'s':'')+'</td>'
        + '<td><button class="btn btn-outline-danger btn-sm" onclick="cancelReservation(\''+r.id+'\')">'
        + '<i class="fa fa-times"></i> Cancel</button></td></tr>';
    });
    html += '</tbody></table></div></div></div>';
  }

  if (pending.length > 0) {
    html += '<div class="alert alert-info"><i class="fa fa-info-circle"></i>'
      + 'You have <strong>'+pending.length+'</strong> reservation request(s) awaiting admin approval.</div>';
  }

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;margin-top:8px;">'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'new-reservation\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x1F4C5;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">New Reservation</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">Book a lunch table for your visit</p></div>'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'calendar\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x1F4C6;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">Calendar View</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">See all reservations on a calendar</p></div>'
    + '<div class="card" style="padding:20px;cursor:pointer;" onclick="navigate(\'my-reservations\')">'
    + '<div style="font-size:32px;margin-bottom:10px;">&#x1F4CB;</div>'
    + '<h4 style="font-weight:700;margin-bottom:4px;">My Reservations</h4>'
    + '<p style="font-size:13px;color:var(--gray-500);">Track status of your requests</p></div>'
    + '</div>';
  return html;
}

function resTable(list) {
  if (list.length === 0) return '<div class="empty-state"><i class="fa fa-inbox"></i><h3>No reservations</h3><p>No reservations in this category.</p></div>';
  var h = '<div class="table-wrapper"><table><thead><tr><th>Date</th><th>Time Slot</th><th>Table</th><th>Guests</th><th>Guest Names</th><th>Status</th><th>Submitted</th><th>Notes</th><th>Actions</th></tr></thead><tbody>';
  list.forEach(function(r) {
    var ts = r.timeslots || {};
    h += '<tr><td>'+fmtShort(r.reservation_date)+'</td>'
      + '<td>'+escHtml(ts.name||'')+'<br><small style="color:var(--gray-500);">'+fmtTime(ts.start_time)+'-'+fmtTime(ts.end_time)+'</small></td>'
      + '<td>Table '+r.table_number+'</td>'
      + '<td>'+r.num_guests+'</td>'
      + '<td>'+escHtml(r.guest_names||'')+'</td>'
      + '<td>'+statusBadge(r.status)+'</td>'
      + '<td>'+fmtShort((r.created_at||'').split('T')[0])+'</td>'
      + '<td>'+(r.admin_notes?'<small>'+escHtml(r.admin_notes.substring(0,40))+(r.admin_notes.length>40?'...':'')+'</small>':'-')+'</td>'
      + '<td>';
    if (r.status !== 'cancelled') {
      h += '<button class="btn btn-outline-danger btn-sm" onclick="cancelReservation(\''+r.id+'\')">'
        + '<i class="fa fa-times"></i> Cancel</button>';
    }
    h += '</td></tr>';
  });
  return h + '</tbody></table></div>';
}

function renderMyReservations() {
  var all = App.reservations;
  var pending = all.filter(function(r){return r.status==='pending';});
  var approved = all.filter(function(r){return r.status==='approved';});
  var rejected = all.filter(function(r){return r.status==='rejected';});
  var cancelled = all.filter(function(r){return r.status==='cancelled';});
  var activeTab = (App.pageParams && App.pageParams.tab) || 'all';
  var tabMap = {all:'tabAll',pending:'tabPending',approved:'tabApproved',rejected:'tabRejected',cancelled:'tabCancelled'};
  var activeId = tabMap[activeTab] || 'tabAll';
  function tabBtn(panelId, icon, label, count) {
    return '<button class="tab-btn'+(panelId===activeId?' active':'')+'" onclick="switchTab(this,\''+panelId+'\')">'
      +'<i class="fa '+icon+'"></i>'+label+' <span class="tab-count">'+count+'</span></button>';
  }
  function tabPanel(panelId, content) {
    return '<div class="tab-panel'+(panelId===activeId?' active':'')+'" id="'+panelId+'">'+content+'</div>';
  }
  return '<div class="page-header-row">'
    + '<div class="page-header"><h2>My Reservations</h2><p>Track all your reservation requests and their status</p></div>'
    + '<button class="btn btn-primary" onclick="navigate(\'new-reservation\')">'
    + '<i class="fa fa-plus"></i> New Reservation</button></div>'
    + '<div class="tabs">'
    + tabBtn('tabAll',       'fa-list',         'All',       all.length)
    + tabBtn('tabPending',   'fa-clock',        'Pending',   pending.length)
    + tabBtn('tabApproved',  'fa-check-circle', 'Approved',  approved.length)
    + tabBtn('tabRejected',  'fa-times-circle', 'Rejected',  rejected.length)
    + tabBtn('tabCancelled', 'fa-ban',          'Cancelled', cancelled.length)
    + '</div>'
    + tabPanel('tabAll',       resTable(all))
    + tabPanel('tabPending',   resTable(pending))
    + tabPanel('tabApproved',  resTable(approved))
    + tabPanel('tabRejected',  resTable(rejected))
    + tabPanel('tabCancelled', resTable(cancelled));
}


async function cancelReservation(id) {
  if (!confirm('Are you sure you want to cancel this reservation?')) return;
  var isAdmin = App.profile && App.profile.role === 'admin';
  var updateData = {
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    cancelled_by: App.user.id
  };
  if (!isAdmin) updateData.admin_notes = 'Cancelled by parent';
  var r; try { await pb.collection('reservations').update(id, updateData); r={error:null}; } catch(e2) { r={error:e2}; }
  if (r.error) { toast('Failed to cancel: '+r.error.message,'error'); return; }
  toast('Reservation cancelled','success');
  if (isAdmin) { await Promise.all([loadAllReservations(), loadTakenSlots()]); }
  else { await Promise.all([loadMyReservations(), loadTakenSlots()]); }
  renderPage();
}

function renderNewReservation(prefillDate, prefillSlot, prefillTable) {
  var advance = parseInt(App.settings.advance_booking_days)||2;
  var minDate = addDays(todayStr(), advance);
  var tsOptions = App.timeslots.map(function(ts) {
    var sel = (prefillSlot && prefillSlot===ts.id)?' selected':'';
    return '<option value="'+ts.id+'"'+sel+'>'+escHtml(ts.name)+' ('+fmtTime(ts.start_time)+'-'+fmtTime(ts.end_time)+')'+(ts.description?' – '+escHtml(ts.description):'')+' </option>';
  }).join('');
  var tableCount = parseInt(App.settings.table_count)||10;
  var tableOptions = '';
  for (var i=1;i<=tableCount;i++) {
    var sel2 = (prefillTable && prefillTable==i)?' selected':'';
    tableOptions += '<option value="'+i+'"'+sel2+'>Table '+i+'</option>';
  }
  return '<div class="page-header"><h2>New Reservation</h2>'
    + '<p>Book a lunch table. Reservations must be made at least '+advance+' day(s) in advance.</p></div>'
    + '<div class="card" style="max-width:640px;">'
    + '<div class="card-header"><h3><i class="fa fa-calendar-plus" style="color:var(--primary);margin-right:8px;"></i>Reservation Request</h3></div>'
    + '<div class="card-body">'
    + '<div class="alert alert-info"><i class="fa fa-info-circle"></i>'
    + '<div>Reservations require admin approval. You will receive an email once reviewed. '
    + 'School breaks and non-school days are blocked.</div></div>'
    + '<form id="newResForm">'
    + '<div class="form-row" style="grid-template-columns:1fr;">'
    + '<div class="form-group"><label>Date <span class="required">*</span></label>'
    + '<input type="date" class="form-control" id="resDate" min="'+minDate+'" value="'+(prefillDate||'')+'" required />'
    + '<div class="form-hint">Earliest available: '+fmtShort(minDate)+'</div></div>'
    + '<div id="scenarioNote" style="font-size:13px;margin-bottom:4px;"></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label>Time Slot <span class="required">*</span></label>'
    + '<select class="form-control" id="resSlot" required><option value="">Select a time slot...</option>'+tsOptions+'</select></div>'
    + '<div class="form-group"><label>Table <span class="required">*</span></label>'
    + '<select class="form-control" id="resTable" required><option value="">Select a table...</option>'+tableOptions+'</select>'
    + '<div class="form-hint" id="tableAvailNote">Select date and time slot to check availability</div></div>'
    + '</div>'
    + '<div class="form-row">'
    + '<div class="form-group"><label>Student Name <span class="required">*</span></label>'
    + '<div style="position:relative;"><i class="fa fa-user-graduate" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>'
    + '<input type="text" class="form-control" id="resStudentName" placeholder="Student\'s first and last name" style="padding-left:32px;" required /></div>'
    + '<div class="form-hint">Name of the student being visited.</div></div>'
    + '<div class="form-group"><label>Teacher Name <span class="required">*</span></label>'
    + '<div style="position:relative;"><i class="fa fa-chalkboard-teacher" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--gray-400);font-size:13px;"></i>'
    + '<input type="text" class="form-control" id="resTeacherName" placeholder="Teacher\'s first and last name" style="padding-left:32px;" required /></div>'
    + '<div class="form-hint">The student\'s classroom teacher.</div></div>'
    + '</div>'
    + '<div class="form-group"><label>Number of Guests <span class="required">*</span></label>'
    + '<select class="form-control" id="resGuests" required>'
    + '<option value="1">1 Guest</option><option value="2">2 Guests</option></select>'
    + '<div class="form-hint"><i class="fa fa-info-circle"></i> Max 2 guests per reservation. All visitors must be on the approved visitor list.</div></div>'
    + '<div class="form-group"><label>Guest Name(s)</label>'
    + '<div id="guestNameFields">'
    + '<div class="form-row" style="gap:12px;">'
    + '<div class="form-group" style="margin-bottom:0;">'
    + '<label style="font-size:12px;font-weight:500;color:var(--gray-600);"><i class="fa fa-user" style="margin-right:4px;color:var(--primary);"></i>Guest 1</label>'
    + '<input type="text" class="form-control" id="resGuestName1" placeholder="First and last name" /></div>'
    + '<div class="form-group" id="guest2Field" style="margin-bottom:0;visibility:hidden;">'
    + '<label style="font-size:12px;font-weight:500;color:var(--gray-600);"><i class="fa fa-user" style="margin-right:4px;color:var(--primary);"></i>Guest 2</label>'
    + '<input type="text" class="form-control" id="resGuestName2" placeholder="First and last name" /></div>'
    + '</div></div>'
    + '<div class="form-hint"><i class="fa fa-info-circle"></i> Enter the name of each guest joining you for lunch.</div></div>'
    + '<div class="form-group"><label>Additional Notes</label>'
    + '<textarea class="form-control" id="resNotes" placeholder="Any special requests or information..."></textarea></div>'
    + '<div id="newResAlert"></div>'
    + '<div style="display:flex;gap:12px;margin-top:8px;">'
    + '<button type="submit" class="btn btn-primary" id="submitResBtn">'
    + '<i class="fa fa-paper-plane"></i> Submit Request</button>'
    + '<button type="button" class="btn btn-ghost" onclick="navigate(\'dashboard\')">'
    + '<i class="fa fa-arrow-left"></i> Cancel</button>'
    + '</div></form></div></div>';
}

// ---- CALENDAR ----
function renderCalendar() {
  var d=App.calendarDate||new Date(), year=d.getFullYear(), month=d.getMonth();
  var mNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
  var dNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var firstDay=new Date(year,month,1), lastDay=new Date(year,month+1,0);
  var isAdmin=App.profile&&App.profile.role==='admin';
  var resByDate={};
  App.reservations.forEach(function(r){if(!resByDate[r.reservation_date])resByDate[r.reservation_date]=[];resByDate[r.reservation_date].push(r);});
  var breakDates={};
  App.breaks.forEach(function(b){var dc=new Date(b.start_date+'T00:00:00'),de=new Date(b.end_date+'T00:00:00');while(dc<=de){var ds2=dc.toISOString().split('T')[0];breakDates[ds2]=b.name;dc.setDate(dc.getDate()+1);}});
  var todayS=todayStr();
  var html='<div class="page-header-row"><div class="page-header"><h2><i class="fa fa-calendar-alt" style="color:var(--primary);margin-right:10px;"></i>Calendar</h2><p>View lunch table reservations</p></div>';
  if(!isAdmin)html+='<button class="btn btn-primary" onclick="navigate(\'new-reservation\')"><i class="fa fa-plus"></i> New Reservation</button>';
  html+='</div><div class="calendar-wrapper"><div class="calendar-header"><h3>'+mNames[month]+' '+year+'</h3>'
    +'<div class="calendar-nav"><button class="btn btn-ghost btn-sm" id="calPrev"><i class="fa fa-chevron-left"></i></button>'
    +'<button class="btn btn-ghost btn-sm" id="calToday">Today</button>'
    +'<button class="btn btn-ghost btn-sm" id="calNext"><i class="fa fa-chevron-right"></i></button></div></div>'
    +'<div class="calendar-grid-header">';
  dNames.forEach(function(dn){html+='<div class="cal-day-name">'+dn+'</div>';});
  html+='</div><div class="calendar-grid">';
  var prevLast=new Date(year,month,0);
  for(var i=0;i<firstDay.getDay();i++){html+='<div class="cal-cell other-month"><span class="cal-date">'+(prevLast.getDate()-firstDay.getDay()+1+i)+'</span></div>';}
  for(var day=1;day<=lastDay.getDate();day++){
    var ds3=year+'-'+String(month+1).padStart(2,'0')+'-'+String(day).padStart(2,'0');
    var wd2=getWeekday(ds3);
    var avWd2=(App.settings.available_weekdays||[1,2,3,4,5]).indexOf(wd2)!==-1;
    var isBreak2=!!breakDates[ds3], isBook2=isDateAvailable(ds3);
    var cls='cal-cell'+(ds3===todayS?' today':'')+(isBreak2?' school-break':(!avWd2?' unavailable':(isBook2?' available':'')));
    var dayR=resByDate[ds3]||[];
    if(isAdmin) dayR=dayR.filter(function(r2){return r2.status!=='cancelled'&&r2.status!=='rejected';});
    html+='<div class="'+cls+'" '+(isBook2&&!isAdmin?'data-date="'+ds3+'"':'')+'>';
    html+='<span class="cal-date">'+day+'</span>';
    var calScenario = getScenarioForDate(ds3);
    if(calScenario){
      html+='<span style="display:block;font-size:10px;font-weight:700;color:var(--primary);line-height:1;margin-top:1px;">'+escHtml(calScenario)+'</span>';
    } else if(!isAdmin&&!isBreak2&&avWd2&&getDistinctScenarioTypes().length>0){
      html+='<span style="display:block;font-size:10px;font-weight:600;color:var(--gray-400);line-height:1;margin-top:1px;">No schedule</span>';
    }
    if(isBreak2)html+='<span class="cal-event cal-event-break">&#127974; '+escHtml(breakDates[ds3])+'</span>';
    var sh=0;
    dayR.forEach(function(r2){if(sh>=3)return;var ts2=r2.timeslots||{};var lbl=isAdmin?(r2.profiles&&r2.profiles.full_name?r2.profiles.full_name.split(' ')[0]:'?')+' T'+r2.table_number:'T'+r2.table_number+' '+escHtml(ts2.name||'');html+='<span class="cal-event cal-event-'+r2.status+'" onclick="showResDetail(\''+r2.id+'\')">'+escHtml(lbl)+'</span>';sh++;});
    if(dayR.length>3)html+='<span class="cal-more">+'+(dayR.length-3)+' more</span>';
    if(isBook2&&!isAdmin){
      var daySlots=getTimeslotsForDate(ds3);
      var tc=parseInt(App.settings.table_count)||10;
      var totalCap=daySlots.length*tc;
      var takenCount=App.takenSlots.filter(function(s){return s.reservation_date===ds3;}).length;
      var freeCount=totalCap-takenCount;
      var availColor=freeCount===0?'var(--danger)':freeCount<=2?'#d97706':'var(--secondary)';
      html+='<span style="display:block;font-size:10px;font-weight:600;color:'+availColor+';line-height:1.3;margin-top:2px;">'+(freeCount===0?'Full':freeCount+' table'+(freeCount!==1?'s':'')+' avail')+'</span>';
      html+='<button class="cal-add-btn" data-date="'+ds3+'">+</button>';
    }
    html+='</div>';
  }
  var rem=(7-((firstDay.getDay()+lastDay.getDate())%7))%7;
  for(var j=1;j<=rem;j++)html+='<div class="cal-cell other-month"><span class="cal-date">'+j+'</span></div>';
  html+='</div><div class="cal-legend">'
    +'<div class="cal-legend-item"><div class="cal-legend-dot" style="background:#d1fae5;border:1px solid #10b981;"></div> Approved</div>'
    +'<div class="cal-legend-item"><div class="cal-legend-dot" style="background:#fef3c7;border:1px solid #f59e0b;"></div> Pending</div>'
    +'<div class="cal-legend-item"><div class="cal-legend-dot" style="background:#fee2e2;border:1px solid #ef4444;"></div> Rejected/Cancelled</div>'
    +'<div class="cal-legend-item"><div class="cal-legend-dot" style="background:#fef9e7;border:1px solid #f59e0b;"></div> School Break</div>'
    +'</div></div>';
  return html;
}

function wireCalendarEvents() {
  var calP=document.getElementById('calPrev'), calN=document.getElementById('calNext'), calT=document.getElementById('calToday');
  if(calP)calP.addEventListener('click',function(){App.calendarDate.setMonth(App.calendarDate.getMonth()-1);renderPage();});
  if(calN)calN.addEventListener('click',function(){App.calendarDate.setMonth(App.calendarDate.getMonth()+1);renderPage();});
  if(calT)calT.addEventListener('click',function(){App.calendarDate=new Date();renderPage();});
  document.querySelectorAll('.cal-cell.available[data-date]').forEach(function(el){
    el.addEventListener('click',function(e){
      if(e.target.classList.contains('cal-event')||e.target.classList.contains('cal-more'))return;
      navigate('new-reservation',{prefillDate:el.getAttribute('data-date')});
    });
  });
  document.querySelectorAll('.cal-add-btn[data-date]').forEach(function(el){
    el.addEventListener('click',function(e){e.stopPropagation();navigate('new-reservation',{prefillDate:el.getAttribute('data-date')});});
  });
}

function showResDetail(id) {
  var r=App.reservations.find(function(x){return x.id===id;}); if(!r)return;
  var ts3=r.timeslots||{}, prof3=r.profiles||{};
  var isAdm=App.profile&&App.profile.role==='admin';
  var html2='<div class="modal-backdrop" id="resDetailModal"><div class="modal">'
    +'<div class="modal-header"><h3>Reservation Details</h3>'
    +'<button class="modal-close" onclick="document.getElementById(\'resDetailModal\').remove()"><i class="fa fa-times"></i></button></div>'
    +'<div class="modal-body">'
    +'<div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">'+statusBadge(r.status)+'</span></div>'
    +'<div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">'+fmt(r.reservation_date)+'</span></div>'
    +'<div class="detail-row"><span class="detail-label">Time Slot</span><span class="detail-value">'+escHtml(ts3.name||'')+(ts3.start_time?' ('+fmtTime(ts3.start_time)+' - '+fmtTime(ts3.end_time)+')':'')+'</span></div>'
    +'<div class="detail-row"><span class="detail-label">Table</span><span class="detail-value">Table '+r.table_number+'</span></div>'
    +'<div class="detail-row"><span class="detail-label">Guests</span><span class="detail-value">'+r.num_guests+'</span></div>'
    +(r.student_name?'<div class="detail-row"><span class="detail-label">Student</span><span class="detail-value">'+escHtml(r.student_name)+'</span></div>':'')
    +(r.teacher_name?'<div class="detail-row"><span class="detail-label">Teacher</span><span class="detail-value">'+escHtml(r.teacher_name)+'</span></div>':'')
    +(r.guest_names?'<div class="detail-row"><span class="detail-label">Guest Names</span><span class="detail-value">'+escHtml(r.guest_names)+'</span></div>':'')
    +(r.notes?'<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">'+escHtml(r.notes)+'</span></div>':'')
    +(r.admin_notes?'<div class="detail-row"><span class="detail-label">Admin Notes</span><span class="detail-value">'+escHtml(r.admin_notes)+'</span></div>':'')
    +(isAdm&&prof3.email?'<div class="detail-row"><span class="detail-label">Requestor</span><span class="detail-value">'+escHtml(prof3.full_name||'')+' ('+escHtml(prof3.email)+')</span></div>':'')
    +'</div><div class="modal-footer">'
    +(r.status!=='cancelled'?'<button class="btn btn-outline-danger btn-sm" onclick="cancelReservation(\''+r.id+'\');document.getElementById(\'resDetailModal\').remove()"><i class="fa fa-times"></i> Cancel</button>':'')
    +(isAdm&&r.status==='pending'?'<button class="btn btn-primary btn-sm" onclick="document.getElementById(\'resDetailModal\').remove();navigate(\'approvals\')"><i class="fa fa-check"></i> Review</button>':'')
    +'<button class="btn btn-ghost" onclick="document.getElementById(\'resDetailModal\').remove()">Close</button>'
    +'</div></div></div>';
  document.body.insertAdjacentHTML('beforeend', html2);
}

