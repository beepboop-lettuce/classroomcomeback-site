/**
 * Classroom Comeback — website lead capture
 * ------------------------------------------
 * Paste this into Extensions > Apps Script on the "Classroom Comeback Lead Tracker"
 * Google Sheet, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). Copy the /exec URL into
 * assets/site.js -> CC_CONFIG.LEADS_ENDPOINT.
 *
 * Every website inquiry:
 *   1. is added as a new row on the "Leads" tab (columns follow SOP CC-SOP-001, section 4)
 *   2. sends a notification email to the leads inbox, with Reply-To set to the lead
 *
 * Every booked discovery call (Google Calendar appointment schedule):
 *   syncBookings() runs every 15 minutes (installed by setup()). If the person who booked
 *   is already a lead, their row moves to stage 04; otherwise a new row is added.
 */

const NOTIFY_EMAIL = 'classroomcomeback@classroomcomeback.com';
const SHEET_NAME = 'Leads';

const HEADERS = [
  'Date Received', 'Contact Name', 'Email', 'Phone', 'Organization / Center',
  'City / State / Country', 'Lead Type', 'Service Interest', 'Classrooms & Ages',
  'Key Challenges / Message', 'Preferred Timeline', 'Estimated Budget', 'Referral Source',
  'Assigned Owner', 'Current Stage', 'Next Action', 'Follow-up Date', 'Source Page',
  'Calendar Event ID'
];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return json_({ ok: true }); // honeypot field filled = bot

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getSheet_();
    const now = new Date();
    const followUp = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    sheet.appendRow([
      now,
      clean_(p.name), clean_(p.email), clean_(p.phone), clean_(p.organization),
      clean_(p.location), clean_(p.role), clean_(p.service), clean_(p.classrooms),
      clean_(p.message), clean_(p.timeline), clean_(p.budget), clean_(p.referral),
      '',                                   // Assigned Owner (set by team)
      '01. New inquiry received',
      'Acknowledge and request photos/videos',
      followUp,
      clean_(p.page),
      ''
    ]);

    const body = HEADERS.slice(1, 13).map(function (h, i) {
      const keys = ['name','email','phone','organization','location','role','service','classrooms','message','timeline','budget','referral'];
      return h + ': ' + (p[keys[i]] || '-');
    }).join('\n');

    MailApp.sendEmail({
      to: NOTIFY_EMAIL,
      replyTo: isEmail_(p.email) ? p.email : NOTIFY_EMAIL,
      subject: 'New website inquiry: ' + (p.name || 'Unknown') + ' (' + (p.service || 'general') + ')',
      body: body + '\n\nLogged in the lead tracker: ' + SpreadsheetApp.getActive().getUrl()
    });

    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return json_({ ok: true, service: 'Classroom Comeback lead capture' });
}

/** Run once from the editor to create the Leads tab and authorize email sending. */
function setup() {
  getSheet_();
  MailApp.getRemainingDailyQuota();
  CalendarApp.getDefaultCalendar();
  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'syncBookings'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncBookings').timeBased().everyMinutes(15).create();
}

// Appointment schedule names to watch (must match the titles you give the schedules).
const BOOKING_TITLES = ['Discovery Call', 'Build & Partner Strategy Call'];

/** Logs newly booked calls from the default calendar into the tracker. */
function syncBookings() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();
  const col = function (h) { return HEADERS.indexOf(h); };
  const rows = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues() : [];
  const seenIds = {};
  const rowByEmail = {};
  rows.forEach(function (r, i) {
    if (r[col('Calendar Event ID')]) seenIds[r[col('Calendar Event ID')]] = true;
    const em = String(r[col('Email')] || '').toLowerCase();
    if (em) rowByEmail[em] = i + 2;
  });

  const now = new Date();
  const until = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const me = Session.getEffectiveUser().getEmail().toLowerCase();

  CalendarApp.getDefaultCalendar().getEvents(now, until).forEach(function (ev) {
    const title = ev.getTitle();
    if (!BOOKING_TITLES.some(function (t) { return title.indexOf(t) !== -1; })) return;
    const id = ev.getId();
    if (seenIds[id]) return;
    const guest = ev.getGuestList().filter(function (g) { return g.getEmail().toLowerCase() !== me; })[0];
    if (!guest) return;
    const email = guest.getEmail().toLowerCase();
    const when = Utilities.formatDate(ev.getStartTime(), Session.getScriptTimeZone(), 'MMM d, yyyy h:mm a');
    const note = 'Call booked: ' + title + ' on ' + when;

    if (rowByEmail[email]) {
      const r = rowByEmail[email];
      sheet.getRange(r, col('Current Stage') + 1).setValue('04. Consultation scheduled and completed');
      sheet.getRange(r, col('Next Action') + 1).setValue(note + '. Prepare briefing packet.');
      sheet.getRange(r, col('Follow-up Date') + 1).setValue(ev.getStartTime());
      sheet.getRange(r, col('Calendar Event ID') + 1).setValue(id);
    } else {
      const row = HEADERS.map(function () { return ''; });
      row[col('Date Received')] = now;
      row[col('Contact Name')] = clean_(guest.getName() || email);
      row[col('Email')] = clean_(email);
      row[col('Key Challenges / Message')] = clean_(ev.getDescription()).slice(0, 2000);
      row[col('Current Stage')] = '04. Consultation scheduled and completed';
      row[col('Next Action')] = note + '. Booked without the web form: collect intake details.';
      row[col('Follow-up Date')] = ev.getStartTime();
      row[col('Source Page')] = 'Booking page';
      row[col('Calendar Event ID')] = id;
      sheet.appendRow(row);
    }
    seenIds[id] = true;
  });
}

function getSheet_() {
  const ss = SpreadsheetApp.getActive();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#0E3B3F').setFontColor('#FFFFFF');
    addStageDropdown_(sheet);
  }
  return sheet;
}

function addStageDropdown_(sheet) {
  const stages = [
    '01. New inquiry received', '02. Lead qualified', '03. Photos and information collected',
    '04. Consultation scheduled and completed', '05. Proposal prepared and sent', '06. Follow-up completed',
    '07. Contract signed and deposit received', '08. Project officially booked', '09. Pre-project preparation',
    '10. Classroom Comeback implementation', '11. Post-project follow-up', '12. Testimonial and referral requested',
    'Closed - not a fit', 'Nurture - future date'
  ];
  const col = HEADERS.indexOf('Current Stage') + 1;
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(stages, true).setAllowInvalid(false).build();
  sheet.getRange(2, col, 1000, 1).setDataValidation(rule);
  const owner = SpreadsheetApp.newDataValidation().requireValueInList(['Shavonda', 'Erica', 'Assistant'], true).build();
  sheet.getRange(2, HEADERS.indexOf('Assigned Owner') + 1, 1000, 1).setDataValidation(owner);
}

// Stop spreadsheet formula injection (values starting with = + - @) and trim length.
function clean_(v) {
  v = String(v || '').trim().slice(0, 5000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function isEmail_(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || ''));
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
