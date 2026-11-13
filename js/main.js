// main.js - Application entry point and event wiring (PocketBase)

function switchTab(btn, panelId) {
  var allBtns = btn.closest ? btn.closest('.tabs') : null;
  document.querySelectorAll('.tab-btn').forEach(function(b){
    if(!allBtns || (allBtns && allBtns.contains(b))) b.classList.remove('active');
  });
  btn.classList.add('active');
  var panel = document.getElementById(panelId);
  if(panel){
    var parent = panel.parentElement;
    if(parent) parent.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active');});
    panel.classList.add('active');
  }
}

function wirePageEvents() {
  var page = App.currentPage;
  if (page === 'calendar') wireCalendarEvents();
  if (page === 'new-reservation') {
    var form = document.getElementById('newResForm');
    if (!form) return;

    function updateSlotOptions(date) {
      var rs = document.getElementById('resSlot');
      if (!rs) return;
      var scenarioTypes = getDistinctScenarioTypes();
      var sc = date ? getScenarioForDate(date) : null;
      var scNote = document.getElementById('scenarioNote');
      // If scenarios are configured but this date has none assigned, block the form entirely
      if (date && scenarioTypes.length > 0 && !sc) {
        rs.innerHTML = '<option value="">No time slots available</option>';
        if (scNote) scNote.innerHTML = '<span style="color:var(--danger);font-weight:600;"><i class="fa fa-ban"></i> No schedule assigned for this date \u2014 reservations cannot be made</span>';
        var note = document.getElementById('tableAvailNote');
        if (note) note.innerHTML = '';
        var btn2 = document.getElementById('submitResBtn');
        if (btn2) btn2.disabled = true;
        return;
      }
      // Re-enable submit in case a previous date had no scenario
      var btn2 = document.getElementById('submitResBtn');
      if (btn2) btn2.disabled = false;
      var slots = date ? getTimeslotsForDate(date) : App.timeslots;
      var curVal = rs.value;
      rs.innerHTML = '<option value="">Select a time slot...</option>';
      slots.forEach(function(ts) {
        var label = escHtml(ts.name) + ' (' + fmtTime(ts.start_time) + '-' + fmtTime(ts.end_time) + ')';
        if (ts.description) label += ' \u2013 ' + escHtml(ts.description);
        var opt = '<option value="' + ts.id + '"' + (ts.id === curVal ? ' selected' : '') + '>' + label + '</option>';
        rs.innerHTML += opt;
      });
      if (date && scenarioTypes.length > 0) {
        if (scNote) scNote.innerHTML = '<span style="color:var(--primary);font-weight:600;">Scenario ' + escHtml(sc) + ' day</span>';
      } else {
        if (scNote) scNote.innerHTML = '';
      }
    }

    // Returns table numbers already blocked (pending or approved) for a date+slot,
    // drawn from App.takenSlots — which covers ALL users via the taken_slots view.
    function takenTablesFor(date, slotId) {
      return App.takenSlots
        .filter(function(r) { return r.reservation_date === date && r.timeslot_id === slotId; })
        .map(function(r) { return r.table_number; });
    }

    function checkAvail() {
      var date   = document.getElementById('resDate').value;
      var slotId = document.getElementById('resSlot').value;
      var note   = document.getElementById('tableAvailNote');
      var tbl    = document.getElementById('resTable');
      if (!date || !slotId) {
        if (note) note.textContent = 'Select date and time slot to check availability';
        return;
      }
      if (!isDateAvailable(date)) {
        if (note) note.innerHTML = '<span style="color:var(--danger);">Date not available</span>';
        return;
      }
      var taken = takenTablesFor(date, slotId);
      var tc    = parseInt(App.settings.table_count) || 10;
      var free  = tc - taken.length;
      if (note) {
        if (free <= 0) {
          note.innerHTML = '<span style="color:var(--danger);font-weight:600;">No tables available for this date and time</span>';
        } else {
          note.innerHTML = '<span style="color:var(--secondary);">' + free + ' of ' + tc + ' tables available</span>';
        }
      }
      // Disable taken options in the table <select> and append an UNAVAILABLE label
      if (tbl) {
        Array.from(tbl.options).forEach(function(opt) {
          var val = parseInt(opt.value);
          if (!val) return;
          var isTaken = taken.indexOf(val) !== -1;
          opt.disabled = isTaken;
          opt.text = opt.text.replace(/ \u2014 UNAVAILABLE$/, '');
          if (isTaken) opt.text += ' \u2014 UNAVAILABLE';
          if (isTaken && tbl.value === opt.value) tbl.value = '';
        });
      }
    }

    var rd = document.getElementById('resDate');
    var rs = document.getElementById('resSlot');
    if (rd) rd.addEventListener('change', function() { updateSlotOptions(rd.value); checkAvail(); });
    if (rs) rs.addEventListener('change', checkAvail);

    // Show/hide Student 2 name field based on guest count
    var rgEl = document.getElementById('resGuests');
    if (rgEl) {
      rgEl.addEventListener('change', function() {
        var s2 = document.getElementById('guest2Field');
        if (s2) s2.style.visibility = rgEl.value === '2' ? 'visible' : 'hidden';
      });
    }

    if (App.pageParams && App.pageParams.prefillDate && rd) {
      rd.value = App.pageParams.prefillDate;
      updateSlotOptions(rd.value);
      checkAvail();
    }

    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      var btn2     = document.getElementById('submitResBtn');
      var alertDiv = document.getElementById('newResAlert');
      function showErr(msg) {
        alertDiv.innerHTML = '<div class="alert alert-error"><i class="fa fa-exclamation-circle"></i> ' + msg + '</div>';
        alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        btn2.disabled = false;
        btn2.innerHTML = '<i class="fa fa-paper-plane"></i> Submit Request';
      }
      btn2.disabled = true; btn2.innerHTML = '<span class="spinner"></span> Submitting...';
      alertDiv.innerHTML = '';
      var date2    = document.getElementById('resDate').value;
      var slotId2  = document.getElementById('resSlot').value;
      var tableNum = parseInt(document.getElementById('resTable').value);
      var guests2    = parseInt(document.getElementById('resGuests').value);
      var studentName= document.getElementById('resStudentName').value.trim();
      var teacherName= document.getElementById('resTeacherName').value.trim();
      var sn1        = (document.getElementById('resGuestName1')||{value:''}).value.trim();
      var sn2        = (document.getElementById('resGuestName2')||{value:''}).value.trim();
      var gn         = guests2 === 2 ? [sn1, sn2].filter(Boolean).join('; ') : sn1;
      var ns         = document.getElementById('resNotes').value.trim();
      if (!date2 || !slotId2 || !tableNum) { showErr('Please fill in all required fields.'); return; }
      if (!studentName) { showErr('Please enter the student\'s name.'); return; }
      if (!teacherName) { showErr('Please enter the teacher\'s name.'); return; }
      if (!isDateAvailable(date2)) { showErr('This date is not available.'); return; }
      var validSlots = getTimeslotsForDate(date2);
      if (validSlots.length > 0 && !validSlots.find(function(ts){ return ts.id === slotId2; })) {
        showErr('Selected time slot is not available on this date.'); return;
      }
      // Guard against no-scenario dates (isDateAvailable catches this, but belt-and-suspenders)
      if (getDistinctScenarioTypes().length > 0 && !getScenarioForDate(date2)) {
        showErr('No schedule has been assigned for this date. Reservations cannot be made.'); return;
      }
      // Re-fetch taken slots immediately before inserting to catch race conditions
      // between when the page loaded and when the user hits Submit.
      await loadTakenSlots();
      var takenNow = takenTablesFor(date2, slotId2);
      if (takenNow.indexOf(tableNum) !== -1) {
        checkAvail(); // refresh the table dropdown to show the updated state
        showErr('Table ' + tableNum + ' is no longer available \u2014 it was just reserved by someone else. Please choose another table.');
        return;
      }
      var r3 = await pb.collection('reservations').create({user_id:App.user.id, reservation_date:date2, timeslot_id:slotId2, table_number:tableNum, num_guests:guests2, student_name:studentName, teacher_name:teacherName, guest_names:gn, notes:ns, status:'pending'});
      // PocketBase throws on error; r3 is the created record if we get here
      toast('Reservation submitted! You will be notified when approved.', 'success');
      await Promise.all([loadMyReservations(), loadTakenSlots()]);
      navigate('dashboard');
    });
  }
  if (page === 'settings') wireSettingsEvents();
  if (page === 'reports') {
    var dp = document.getElementById('reportDatePicker');
    if (dp) dp.addEventListener('change', function() {
      var body = document.getElementById('reportDailyBody');
      if (body) body.innerHTML = buildDailyBody(dp.value);
    });
  }
}

async function renderApp() {
  if(!pb)return;
  if(!App.user){renderAuth('login');return;}
  document.getElementById('app').innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;"><div class="spinner-dark" style="width:40px;height:40px;border-width:4px;"></div></div>';
  try {
    await Promise.all([loadSettings(),loadBreaks(),loadDayScenarios()]);
    await loadProfile();
    if(App.profile&&App.profile.role==='admin'){
      await Promise.all([loadAllTimeslots(),loadAllReservations(),loadAdminEmails(),loadEmailTemplates(),loadTakenSlots()]);
    } else {
      await Promise.all([loadTimeslots(),loadMyReservations(),loadTakenSlots()]);
    }
    renderLayout();

  } catch(err) {
    console.error('renderApp error:',err);
    document.getElementById('app').innerHTML='<div style="padding:40px;text-align:center;"><p style="color:red;">Error: '+escHtml(String(err))+'</p></div>';
  }
}

(async function init(){
  if(!pb)return;
  var params=new URLSearchParams(window.location.search);
  if(params.get('token')){renderAuth('reset');return;}
  pb.authStore.onChange(function(token,record){
    if(!token||!record){App.user=null;App.profile=null;renderAuth('login');}
  },false);
  var authed=await checkAuth();
  if(authed){App.calendarDate=new Date();await renderApp();}
  else{renderAuth('login');}
})();

