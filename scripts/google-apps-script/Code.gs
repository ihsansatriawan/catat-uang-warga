/**
 * Google Apps Script for catat-uang-warga
 * Automates: validation copy + JSON deploy to GitHub
 *
 * Setup:
 *   1. Script Properties: GITHUB_TOKEN, GITHUB_REPO (e.g. "ihsansatriawan/catat-uang-warga")
 *   2. Installable onEdit trigger → onEditHandler
 *   3. Raw data tab needs a "validationStatus" column
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

var CONFIG = {
  RAW_TAB: 'Form Responses 1',       // adjust to your raw data tab name
  VALIDATED_TAB: 'Validated',
  STATUS_COLUMN_HEADER: 'validationStatus',
  VALID_STATUS: 'Valid',
  // Columns to copy from raw → validated (must match header names exactly)
  COPY_FIELDS: ['Timestamp', 'Blok', 'Nomor rumah', 'Nama Pemilik', 'Jumlah Pembayaran'],
  // GitHub target
  FILE_PATH: 'src/data/validated.json',
  BRANCH: 'main'
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IPL Tools')
    .addItem('Deploy to Site', 'deployToSite')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Auto-copy on validation
// ---------------------------------------------------------------------------

/**
 * Installable onEdit trigger.
 * When validationStatus is set to "Valid", copies the row to Validated tab.
 */
function onEditHandler(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.RAW_TAB) return;

  // Find the validationStatus column index
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var statusColIdx = headers.indexOf(CONFIG.STATUS_COLUMN_HEADER);
  if (statusColIdx === -1) return;

  // Check if the edited cell is in the status column and value is "Valid"
  var editedCol = e.range.getColumn() - 1; // 0-based
  if (editedCol !== statusColIdx) return;
  if (e.value !== CONFIG.VALID_STATUS) return;

  // Get the full row data
  var row = e.range.getRow();
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Build the values to copy (only the fields we want)
  var copyValues = CONFIG.COPY_FIELDS.map(function(field) {
    var idx = headers.indexOf(field);
    return idx !== -1 ? rowData[idx] : '';
  });

  // Append to Validated tab
  var validatedSheet = e.range.getSheet().getParent().getSheetByName(CONFIG.VALIDATED_TAB);
  if (!validatedSheet) {
    SpreadsheetApp.getUi().alert('Tab "' + CONFIG.VALIDATED_TAB + '" not found.');
    return;
  }

  validatedSheet.appendRow(copyValues);
}

// ---------------------------------------------------------------------------
// Deploy to GitHub
// ---------------------------------------------------------------------------

/**
 * Reads Validated tab, converts to JSON, pushes to GitHub.
 * Triggered from custom menu "IPL Tools > Deploy to Site".
 */
function deployToSite() {
  var ui = SpreadsheetApp.getUi();

  // Confirm
  var response = ui.alert(
    'Deploy to Site',
    'This will update the live site with current Validated data. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  try {
    var json = buildValidatedJson();
    var jsonString = JSON.stringify(json, null, 2) + '\n';

    pushToGitHub(jsonString);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      json.data.length + ' records deployed successfully!',
      'Deploy Complete',
      5
    );
  } catch (err) {
    ui.alert('Deploy failed: ' + err.message);
  }
}

/**
 * Reads Validated tab and returns the JSON object matching validated.json format.
 */
function buildValidatedJson() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.VALIDATED_TAB);
  if (!sheet) throw new Error('Tab "' + CONFIG.VALIDATED_TAB + '" not found.');

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return { lastUpdate: getTodayISO(), data: [] };
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var rows = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();

  var colIdx = {};
  CONFIG.COPY_FIELDS.forEach(function(field) {
    colIdx[field] = headers.indexOf(field);
  });

  var data = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

    var blok = colIdx['Blok'] !== -1 ? String(row[colIdx['Blok']]).trim().toUpperCase() : '';
    var nomorRumah = colIdx['Nomor rumah'] !== -1 ? String(parseInt(row[colIdx['Nomor rumah']], 10)) : '';
    var namaPemilik = colIdx['Nama Pemilik'] !== -1 ? String(row[colIdx['Nama Pemilik']]).trim() : '';
    var jumlahPembayaran = colIdx['Jumlah Pembayaran'] !== -1 ? toIntAmount(row[colIdx['Jumlah Pembayaran']]) : 0;
    var timestamp = colIdx['Timestamp'] !== -1 ? toIsoWIB(row[colIdx['Timestamp']]) : null;

    if (!blok || !nomorRumah || nomorRumah === 'NaN') continue;

    data.push({
      timestamp: timestamp,
      blok: blok,
      nomorRumah: nomorRumah,
      namaPemilik: namaPemilik,
      jumlahPembayaran: jumlahPembayaran
    });
  }

  return {
    lastUpdate: getTodayISO(),
    data: data
  };
}

// ---------------------------------------------------------------------------
// GitHub API
// ---------------------------------------------------------------------------

/**
 * Pushes content to a file in the GitHub repo.
 * Uses the Contents API: PUT /repos/{owner}/{repo}/contents/{path}
 */
function pushToGitHub(content) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GITHUB_TOKEN');
  var repo = props.getProperty('GITHUB_REPO');

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO in Script Properties.');
  }

  var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + CONFIG.FILE_PATH;

  // Get current file SHA (required for update)
  var sha = getFileSha(apiUrl, token);

  var payload = {
    message: 'chore: update data',
    content: Utilities.base64Encode(content, Utilities.Charset.UTF_8),
    branch: CONFIG.BRANCH
  };

  if (sha) {
    payload.sha = sha;
  }

  var options = {
    method: 'put',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(apiUrl, options);
  var code = response.getResponseCode();

  if (code !== 200 && code !== 201) {
    throw new Error('GitHub API error (' + code + '): ' + response.getContentText());
  }
}

/**
 * Gets the current SHA of the file (needed to update an existing file).
 */
function getFileSha(apiUrl, token) {
  var options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(apiUrl + '?ref=' + CONFIG.BRANCH, options);
  if (response.getResponseCode() === 200) {
    var json = JSON.parse(response.getContentText());
    return json.sha;
  }
  return null; // file doesn't exist yet
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Converts a Google Sheets Date object to ISO 8601 string with WIB (+07:00).
 */
function toIsoWIB(value) {
  if (!value) return null;

  // If it's already a Date object (Google Sheets auto-parses dates)
  if (value instanceof Date) {
    var d = value;
    return (
      d.getFullYear() + '-' +
      pad2(d.getMonth() + 1) + '-' +
      pad2(d.getDate()) + 'T' +
      pad2(d.getHours()) + ':' +
      pad2(d.getMinutes()) + ':' +
      pad2(d.getSeconds()) + '+07:00'
    );
  }

  // If it's a string, try to parse DD/MM/YYYY HH:mm:ss format
  var s = String(value);
  var parts = s.split(' ');
  var datePart = parts[0];
  var timePart = parts[1] || '00:00:00';

  var d = datePart.split(/[\/\-]/);
  if (d.length !== 3) return null;

  var dd = parseInt(d[0], 10);
  var mm = parseInt(d[1], 10);
  var yyyy = parseInt(d[2], 10);

  var t = timePart.split(':');
  var hh = parseInt(t[0] || '0', 10);
  var mi = parseInt(t[1] || '0', 10);
  var ss = parseInt(t[2] || '0', 10);

  if (!yyyy || !mm || !dd) return null;

  return (
    yyyy + '-' + pad2(mm) + '-' + pad2(dd) + 'T' +
    pad2(hh) + ':' + pad2(mi) + ':' + pad2(ss) + '+07:00'
  );
}

/**
 * Strips non-digit characters and parses to integer.
 */
function toIntAmount(value) {
  if (typeof value === 'number') return Math.round(value);
  var cleaned = String(value || '').replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

/**
 * Returns today's date as YYYY-MM-DD string.
 */
function getTodayISO() {
  var d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

/**
 * Zero-pads a number to 2 digits.
 */
function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}
