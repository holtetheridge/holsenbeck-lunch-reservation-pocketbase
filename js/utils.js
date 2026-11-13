// utils.js - Shared utilities, state, PocketBase init
'use strict';
const cfg = window.__APP_CONFIG__;
let pb;
if (!cfg || !cfg.POCKETBASE_URL) {
  document.getElementById('app').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px;background:#f9fafb;"><div style="background:white;border-radius:16px;padding:40px;max-width:540px;width:100%;box-shadow:0 10px 15px rgba(0,0,0,0.1);text-align:center;"><div style="font-size:48px;margin-bottom:16px;">\u2699\ufe0f</div><h2 style="font-size:22px;font-weight:700;color:#111827;margin-bottom:12px;">Setup Required</h2><p style="color:#6b7280;margin-bottom:20px;">Please configure your PocketBase URL in <strong>config.js</strong></p><div style="background:#f3f4f6;border-radius:8px;padding:16px;text-align:left;font-size:13px;color:#374151;line-height:1.8;"><strong>Steps:</strong><br>1. Download PocketBase at <a href="https://pocketbase.io" target="_blank">pocketbase.io</a><br>2. Run: ./pocketbase serve<br>3. Open http://127.0.0.1:8090/_/ and create superuser<br>4. Import pocketbase/pb_schema.json via Settings &gt; Import collections<br>5. Update POCKETBASE_URL in config.js and reload</div></div></div>';
} else {
  pb = new PocketBase(cfg.POCKETBASE_URL);
}

const App = {
  user: null, profile: null, settings: {}, timeslots: [], breaks: [],
  currentPage: 'dashboard', pageParams: {}, calendarDate: new Date(),
  reservations: [], adminEmails: [], emailTemplates: {}, pendingCount: 0,
  dayScenarios: {}, takenSlots: [],
};

function toast(msg, type, dur) {
  type = type||'info'; dur = dur||4500;
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const t = document.createElement('div');
  const icons = {success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle'};
  t.className = 'toast '+type;
  t.innerHTML = '<i class="fa fa-solid '+(icons[type]||icons.info)+'"></i><span>'+msg+'</span>';
  c.appendChild(t);
  setTimeout(function(){t.style.opacity='0';t.style.transition='opacity 0.3s';setTimeout(function(){t.remove();},300);},dur);
}

function fmt(ds) {
  if (!ds) return '';
  return new Date(ds+'T00:00:00').toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
}
function fmtShort(ds) {
  if (!ds) return '';
  return new Date(ds+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}
function fmtTime(t) {
  if (!t) return '';
  var parts = t.split(':'), hr = parseInt(parts[0]);
  return (hr>12?hr-12:hr||12)+':'+parts[1]+' '+(hr>=12?'PM':'AM');
}
function todayStr() { return new Date().toISOString().split('T')[0]; }
function addDays(ds,n) {
  var d = new Date(ds+'T00:00:00'); d.setDate(d.getDate()+n);
  return d.toISOString().split('T')[0];
}
function getWeekday(ds) { return new Date(ds+'T00:00:00').getDay(); }
function isSchoolBreak(ds) { return App.breaks.some(function(b){return ds>=b.start_date&&ds<=b.end_date;}); }
function isAvailableWeekday(ds) {
  var wd = getWeekday(ds);
  return (App.settings.available_weekdays||[1,2,3,4,5]).indexOf(wd)!==-1;
}
function isDateAvailable(ds) {
  var adv = parseInt(App.settings.advance_booking_days)||2;
  if (ds < addDays(todayStr(),adv)) return false;
  if (!isAvailableWeekday(ds)) return false;
  if (isSchoolBreak(ds)) return false;
  if (getDistinctScenarioTypes().length > 0 && !getScenarioForDate(ds)) return false;
  return true;
}
function escHtml(s) {
  if (s==null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function statusBadge(status) {
  var map={pending:'&#x23F3; Pending',approved:'&#x2705; Approved',rejected:'&#x274C; Rejected',cancelled:'&#x1F6AB; Cancelled'};
  return '<span class="badge badge-'+status+'">'+(map[status]||status)+'</span>';
}

// Fold a single iCal property line per RFC 5545 s3.1
function icalFold(line) {
  var bytes = unescape(encodeURIComponent(line));
  var out = '';
  while (bytes.length > 75) {
    var chunk = bytes.substring(0, 75);
    out += decodeURIComponent(escape(chunk)) + '\r\n ';
    bytes = bytes.substring(75);
  }
  out += decodeURIComponent(escape(bytes));
  return out;
}

function generateIcal(r, ts, guestNames, adminNotes) {
  var schoolName = (cfg && cfg.SCHOOL_NAME) || 'Holsenbeck Elementary';
  var ds  = (r.reservation_date || '').replace(/-/g, '');
  var st  = ((ts.start_time || '12:00:00').replace(/:/g, '').substring(0, 4)) + '00';
  var et  = ((ts.end_time   || '13:00:00').replace(/:/g, '').substring(0, 4)) + '00';
  var now = new Date().toISOString().replace(/[-:.]/g, '').substring(0, 15) + 'Z';
  var uid = (r.id || (ds + '-' + r.table_number)) + '@holsenbeck-lunch';
  var descParts = [
    schoolName + ' \u2014 Lunch Reservation', '',
    'Date:       ' + fmt(r.reservation_date),
    'Time:       ' + fmtTime(ts.start_time) + ' \u2013 ' + fmtTime(ts.end_time) + ' (' + (ts.name || '') + ')',
    'Table:      ' + r.table_number,
    'Guests:     ' + (r.num_guests || 1) + (r.num_guests > 1 ? ' guests' : ' guest'),
  ];
  if (r.student_name) descParts.push('Student:    ' + r.student_name);
  if (r.teacher_name) descParts.push('Teacher:    ' + r.teacher_name);
  if (guestNames) descParts.push('Guest names: ' + guestNames);
  if (adminNotes) descParts.push('Note from school: ' + adminNotes);
  descParts.push('', 'Status: CONFIRMED');
  var lines = [
    'BEGIN:VCALENDAR','VERSION:2.0',
    icalFold('PRODID:-//' + schoolName + '//Lunch Reservation//EN'),
    'CALSCALE:GREGORIAN','METHOD:REQUEST','BEGIN:VEVENT',
    icalFold('UID:' + uid),'DTSTAMP:' + now,
    'DTSTART:' + ds + 'T' + st,'DTEND:' + ds + 'T' + et,
    icalFold('SUMMARY:Lunch at ' + schoolName + ' \u2013 Table ' + r.table_number),
    icalFold('DESCRIPTION:' + descParts.join('\\n')),
    icalFold('LOCATION:' + schoolName + ' Cafeteria'),
    'STATUS:CONFIRMED','CLASS:PUBLIC','TRANSP:OPAQUE',
    'BEGIN:VALARM','ACTION:DISPLAY',
    icalFold('DESCRIPTION:Reminder: Lunch at ' + schoolName + ' in 15 minutes'),
    'TRIGGER:-PT15M','END:VALARM','END:VEVENT','END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

function applyTemplate(tmpl,vars) {
  var r=tmpl;
  for (var k in vars) r=r.replace(new RegExp('{{'+k+'}}','g'),vars[k]||'');
  return r;
}

function googleCalendarUrl(r, ts) {
  var schoolName = (cfg && cfg.SCHOOL_NAME) || 'Holsenbeck Elementary';
  var ds = (r.reservation_date || '').replace(/-/g, '');
  var st = ((ts.start_time || '12:00:00').replace(/:/g, '').substring(0, 6)).padEnd(6, '0');
  var et = ((ts.end_time   || '13:00:00').replace(/:/g, '').substring(0, 6)).padEnd(6, '0');
  var params = new URLSearchParams({
    action:'TEMPLATE', text:'Lunch at ' + schoolName + ' \u2013 Table ' + r.table_number,
    dates:ds+'T'+st+'/'+ds+'T'+et,
    details:schoolName+' lunch reservation\nTable: '+r.table_number+'\nGuests: '+(r.num_guests||1)+(r.guest_names?'\nGuest names: '+r.guest_names:''),
    location:schoolName+' Cafeteria', sf:'true', output:'xml',
  });
  return 'https://calendar.google.com/calendar/render?'+params.toString();
}


async function sendEmail(reservation, action, adminNotes) {
  var ts = (reservation.expand && reservation.expand.timeslot_id)
    ? reservation.expand.timeslot_id
    : (reservation.timeslots || App.timeslots.find(function(t){return t.id===reservation.timeslot_id;}) || {});
  var prof = (reservation.expand && reservation.expand.user_id)
    ? reservation.expand.user_id
    : (reservation.profiles || {});
  var parentName  = prof.name || prof.full_name || prof.email || 'Parent';
  var parentEmail = prof.email || '';
  var template = App.emailTemplates[action];
  if (!template) { toast('Email template not found','error'); return; }
  var notesSection = adminNotes ? '- Notes: '+adminNotes+'\n' : '';
  var vars = {
    parent_name:parentName, reservation_date:fmt(reservation.reservation_date),
    timeslot_name:ts.name||'', timeslot_start:fmtTime(ts.start_time), timeslot_end:fmtTime(ts.end_time),
    table_number:String(reservation.table_number), num_guests:String(reservation.num_guests||1),
    student_name:reservation.student_name||'', teacher_name:reservation.teacher_name||'',
    guest_names:reservation.guest_names||'', admin_notes_section:notesSection,
  };
  var subject = applyTemplate(template.subject,vars);
  var body    = applyTemplate(template.body,vars);
  var ical = action==='approved' ? generateIcal(reservation,ts,reservation.guest_names||'',adminNotes||'') : null;
  try {
    var res = await fetch(cfg.POCKETBASE_URL+'/api/send-email', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+pb.authStore.token},
      body:JSON.stringify({to:parentEmail,subject:subject,body:body,ical:ical}),
    });
    if (res.ok) { toast('Email sent to '+parentEmail,'success'); return; }
  } catch(e) {}
  var calBody = body;
  if (ical) {
    calBody += '\n\n----------------------------------------\nADD THIS EVENT TO YOUR CALENDAR:\n'
      +'  Google Calendar:\n  '+googleCalendarUrl(reservation,ts)+'\n\n'
      +'  To add to Outlook or Apple Calendar, save the attached .ics file and open it.\n';
  }
  window.open('mailto:'+encodeURIComponent(parentEmail)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(calBody),'_blank');
  toast('Email client opened for '+parentEmail,'info');
  if (ical) {
    var icsUrl=URL.createObjectURL(new Blob([ical],{type:'text/calendar'}));
    var a=document.createElement('a');
    a.href=icsUrl;
    a.download='lunch-'+(reservation.reservation_date||'event')+'-T'+((ts.start_time||'0000').replace(/:/g,'').substring(0,4))+'-tbl'+(reservation.table_number||'0')+'-'+(reservation.id||'x').substring(0,8)+'.ics';
    document.body.appendChild(a); a.click();
    setTimeout(function(){URL.revokeObjectURL(icsUrl);a.remove();},300);
  }
}
async function loadSettings() {
  try {
    var records=await pb.collection('settings').getFullList({sort:'key'});
    App.settings={};
    records.forEach(function(s){
      try { App.settings[s.key]=typeof s.value==='string'?JSON.parse(s.value):s.value; }
      catch(e) { App.settings[s.key]=s.value; }
    });
  } catch(e) { console.error('loadSettings:',e); }
}
async function loadTimeslots() {
  try { App.timeslots=await pb.collection('timeslots').getFullList({filter:'is_active=true',sort:'sort_order'}); }
  catch(e) { App.timeslots=[]; }
}
async function loadAllTimeslots() {
  try { App.timeslots=await pb.collection('timeslots').getFullList({sort:'sort_order,start_time'}); }
  catch(e) { App.timeslots=[]; }
}
async function loadBreaks() {
  try { App.breaks=await pb.collection('school_breaks').getFullList({sort:'start_date'}); }
  catch(e) { App.breaks=[]; }
}
async function loadMyReservations() {
  try {
    var recs=await pb.collection('reservations').getFullList({
      filter:pb.filter('user_id={:uid}',{uid:App.user.id}),
      sort:'-reservation_date', expand:'timeslot_id',
      requestKey:'myReservations',
    });
    recs.forEach(function(r){if(r.expand&&r.expand.timeslot_id)r.timeslots=r.expand.timeslot_id;});
    App.reservations=recs;
  } catch(e) { App.reservations=[]; }
}
async function loadAllReservations() {
  try {
    var recs=await pb.collection('reservations').getFullList({sort:'-reservation_date',expand:'timeslot_id,user_id',requestKey:'allReservations'});
    recs.forEach(function(r){
      if(r.expand){
        if(r.expand.timeslot_id) r.timeslots=r.expand.timeslot_id;
        if(r.expand.user_id){var u=r.expand.user_id;r.profiles={id:u.id,email:u.email,full_name:u.name||u.email,role:u.role};}
      }
    });
    App.reservations=recs;
    App.pendingCount=recs.filter(function(x){return x.status==='pending';}).length;
  } catch(e) { App.reservations=[]; App.pendingCount=0; }
}
async function loadTakenSlots() {
  try {
    App.takenSlots=await pb.collection('reservations').getFullList({
      filter:'status="pending"||status="approved"',
      fields:'reservation_date,timeslot_id,table_number,status',
      requestKey:'takenSlots',
    });
  } catch(e) { App.takenSlots=[]; }
}
async function loadAdminEmails() {
  try { App.adminEmails=await pb.collection('admin_emails').getFullList({sort:'created'}); }
  catch(e) { App.adminEmails=[]; }
}
async function loadEmailTemplates() {
  try {
    var records=await pb.collection('email_templates').getFullList();
    App.emailTemplates={};
    records.forEach(function(t){App.emailTemplates[t.template_key]=t;});
  } catch(e) { App.emailTemplates={}; }
}
async function loadDayScenarios() {
  App.dayScenarios={};
  try {
    var records=await pb.collection('day_scenarios').getFullList({sort:'date'});
    records.forEach(function(row){App.dayScenarios[row.date]=row.scenario_type;});
  } catch(e) { /* collection may not exist yet */ }
}
function getScenarioForDate(ds){return App.dayScenarios[ds]||null;}
function getTimeslotsForDate(ds){
  var scenario=getScenarioForDate(ds),scenarioTypes=getDistinctScenarioTypes();
  if(scenarioTypes.length===0) return App.timeslots;
  if(!scenario) return App.timeslots;
  return App.timeslots.filter(function(ts){return ts.scenario_type===scenario;});
}
function getDistinctScenarioTypes(){
  var seen={},types=[];
  App.timeslots.forEach(function(ts){
    if(ts.scenario_type&&!seen[ts.scenario_type]){seen[ts.scenario_type]=true;types.push(ts.scenario_type);}
  });
  return types.sort();
}
