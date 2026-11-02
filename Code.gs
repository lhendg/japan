/**
 * Japan trip — Google Sheets backend for index.html.
 *
 * Paste this into the sheet's Extensions → Apps Script, run `setup` once, then
 * Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Copy the …/exec URL into API_URL at the top of index.html.
 *
 * GET  ?action=list                       → { ok, data: { Itinerary: [...], Saved: [...], Expenses: [...] } }
 * POST { action, sheet, data }            → { ok, data: <saved record> }
 *      action: "create" | "update" | "delete"; data.id is required.
 *
 * Columns are matched by header name, so columns can be reordered in the sheet.
 * A field the site sends that has no column yet gets a new column at the end.
 */

const SCHEMA = {
  Itinerary: ['id', 'date', 'time', 'name', 'tag', 'area', 'notes', 'map_url', 'saved_id', 'created_at', 'updated_at'],
  Saved: ['id', 'name', 'tag', 'area', 'notes', 'map_url', 'created_at', 'updated_at'],
  Expenses: ['id', 'date', 'description', 'amount', 'currency', 'payment_method', 'payment_tag', 'payment_notes',
    'labels', 'split', 'split_type', 'split_amount_lhen', 'split_amount_owen', 'paid_by', 'notes', 'updated_by',
    'created_at', 'updated_at'],
};

// Columns stored as numbers / booleans; everything else is stored as plain text so
// Sheets never turns "2026-11-20" or "09:30" into a date.
const NUMERIC = [/^amount$/, /^split_amount_/];
const BOOLEAN = [/^split$/];

function setup() {
  Object.keys(SCHEMA).forEach(getSheet_);
  const blank = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Sheet1');
  if (blank && blank.getLastRow() === 0) SpreadsheetApp.getActiveSpreadsheet().deleteSheet(blank);
}

function doGet(e) {
  return respond_(() => {
    const action = (e && e.parameter && e.parameter.action) || 'list';
    if (action !== 'list') throw new Error('Unknown action: ' + action);
    const data = {};
    Object.keys(SCHEMA).forEach(name => { data[name] = readAll_(getSheet_(name)); });
    return data;
  });
}

function doPost(e) {
  return respond_(() => {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;
    const sheet = body.sheet;
    const data = body.data;
    if (!SCHEMA[sheet]) throw new Error('Unknown sheet: ' + sheet);
    if (!data || !data.id) throw new Error('Missing id');

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sh = getSheet_(sheet);
      if (action === 'create' || action === 'update') return upsert_(sh, data);
      if (action === 'delete') return remove_(sh, data.id);
      throw new Error('Unknown action: ' + action);
    } finally {
      lock.releaseLock();
    }
  });
}

function respond_(fn) {
  let out;
  try {
    out = { ok: true, data: fn() };
  } catch (err) {
    out = { ok: false, error: String((err && err.message) || err) };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

// ─── Sheet helpers ────────────────────────────────────────────────

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name) || ss.insertSheet(name);
  const have = headers_(sh);
  const missing = SCHEMA[name].filter(h => have.indexOf(h) === -1);
  if (missing.length) addColumns_(sh, have, missing);
  return sh;
}

function headers_(sh) {
  const lastCol = sh.getLastColumn();
  if (!lastCol) return [];
  return sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String);
}

function addColumns_(sh, have, names) {
  sh.getRange(1, have.length + 1, 1, names.length).setValues([names]).setFontWeight('bold');
  sh.setFrozenRows(1);
  return have.concat(names);
}

function matches_(patterns, header) {
  return patterns.some(p => p.test(header));
}

function formatFor_(header) {
  return matches_(NUMERIC, header) || matches_(BOOLEAN, header) ? 'General' : '@';
}

// Sheet value → JSON value (handles rows typed by hand into the sheet)
function fromCell_(header, value, tz) {
  if (value instanceof Date) {
    if (header === 'time') return Utilities.formatDate(value, tz, 'HH:mm');
    if (header === 'created_at' || header === 'updated_at') return value.toISOString();
    return Utilities.formatDate(value, tz, 'yyyy-MM-dd');
  }
  if (matches_(BOOLEAN, header)) return value === true || String(value).toUpperCase() === 'TRUE';
  return value;
}

// JSON value → sheet value
function toCell_(header, value) {
  if (value === null || value === undefined) return '';
  if (matches_(NUMERIC, header)) return value === '' ? '' : Number(value);
  if (matches_(BOOLEAN, header)) return value === true || String(value).toUpperCase() === 'TRUE';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function readAll_(sh) {
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const head = values[0].map(String);
  const idCol = head.indexOf('id');
  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  return values.slice(1)
    .filter(r => String(r[idCol]).trim() !== '')
    .map(r => {
      const o = {};
      head.forEach((h, i) => { if (h) o[h] = fromCell_(h, r[i], tz); });
      return o;
    });
}

function findRow_(sh, idCol, id) {
  const last = sh.getLastRow();
  if (last < 2) return 0;
  const ids = sh.getRange(2, idCol + 1, last - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) {
    if (String(ids[i][0]) === String(id)) return i + 2;
  }
  return 0;
}

function upsert_(sh, data) {
  let head = headers_(sh);
  const extra = Object.keys(data).filter(k => head.indexOf(k) === -1);
  if (extra.length) head = addColumns_(sh, head, extra);

  const tz = SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
  const rowIndex = findRow_(sh, head.indexOf('id'), data.id);
  const existing = rowIndex ? sh.getRange(rowIndex, 1, 1, head.length).getValues()[0] : null;

  const record = {};
  head.forEach((h, i) => { record[h] = existing ? fromCell_(h, existing[i], tz) : ''; });
  Object.keys(data).forEach(k => { record[k] = data[k]; });
  const now = new Date().toISOString();
  record.created_at = record.created_at || now;
  record.updated_at = now;

  const target = rowIndex || sh.getLastRow() + 1;
  const range = sh.getRange(target, 1, 1, head.length);
  range.setNumberFormats([head.map(formatFor_)]);
  range.setValues([head.map(h => toCell_(h, record[h]))]);
  return record;
}

function remove_(sh, id) {
  const rowIndex = findRow_(sh, headers_(sh).indexOf('id'), id);
  if (rowIndex) sh.deleteRow(rowIndex);
  return { id: id, deleted: Boolean(rowIndex) };
}
