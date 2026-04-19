/**
 * Google Apps Script for catat-uang-warga
 * Automates: validation copy + JSON deploy to GitHub
 *
 * Setup:
 *   1. Script Properties: GITHUB_TOKEN, GITHUB_REPO (e.g. "ihsansatriawan/catat-uang-warga")
 *   2. Installable onEdit trigger → onEditHandler
 *   3. Raw data tab needs a "validationStatus" column
 *
 * Raw tab columns:
 *   Timestamp | Email address | Blok dan Nomor Rumah | Jumlah Pembayaran | Unggah Bukti Transfer Pembayaran IPL-2026 | validationStatus
 *
 * Validated tab columns:
 *   Timestamp | Email address | Blok dan Nomor Rumah | Jumlah Pembayaran | Unggah Bukti Transfer Pembayaran IPL-2026 | B | Nomor rumah | Nama Pemilik
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

var CONFIG = {
  RAW_TAB: 'Form_Responses',
  VALIDATED_TAB: 'Validated',
  STATUS_COLUMN_HEADER: 'validationStatus',
  VALID_STATUS: 'Valid',
  // Raw tab columns to copy as-is to Validated tab
  RAW_FIELDS: [
    'Timestamp',
    'Email address',
    'Blok dan Nomor Rumah',
    'Jumlah Pembayaran',
    'Unggah Bukti Transfer Pembayaran IPL-2026'
  ],
  // Combined field that contains "B 5. Nama Pemilik"
  COMBINED_FIELD: 'Blok dan Nomor Rumah',
  // Validated tab column headers for reading JSON
  VALIDATED_BLOK_HEADER: 'B',
  VALIDATED_NOMOR_HEADER: 'Nomor rumah',
  VALIDATED_NAMA_HEADER: 'Nama Pemilik',
  // GitHub target
  FILE_PATH: 'src/data/validated.json',
  BRANCH: 'main'
};

// ---------------------------------------------------------------------------
// Expenses Configuration
// ---------------------------------------------------------------------------

var EXPENSES_CONFIG = {
  TAB: 'Pengeluaran Rutin',
  FILE_PATH: 'src/data/expenses.json',
  // Tabel Rutin (left): columns A, B, C (Keterangan, Masuk, Keluar)
  RUTIN_KETERANGAN_COL: 1,
  RUTIN_MASUK_COL: 2,
  RUTIN_KELUAR_COL: 3,
  // Tabel Insidental (right): columns E, F, G, H, I (Keterangan, Masuk, Keluar, Tanggal, Kategori)
  INSIDENTAL_KETERANGAN_COL: 5,
  INSIDENTAL_MASUK_COL: 6,
  INSIDENTAL_KELUAR_COL: 7,
  INSIDENTAL_TANGGAL_COL: 8,
  INSIDENTAL_KATEGORI_COL: 9,
};

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('IPL Tools')
    .addItem('Deploy Data ke Website', 'deployToSite')
    .addSeparator()
    .addItem('Deploy Pengeluaran ke Website', 'deployExpensesToSite')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Auto-copy on validation
// ---------------------------------------------------------------------------

/**
 * Installable onEdit trigger.
 * When validationStatus is set to "Valid", copies the row to Validated tab
 * with parsed Blok, Nomor rumah, and Nama Pemilik columns.
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

  // Copy raw fields
  var copyValues = CONFIG.RAW_FIELDS.map(function(field) {
    var idx = headers.indexOf(field);
    return idx !== -1 ? rowData[idx] : '';
  });

  // Parse "Blok dan Nomor Rumah" → Blok, Nomor rumah, Nama Pemilik
  var combinedIdx = headers.indexOf(CONFIG.COMBINED_FIELD);
  var combined = combinedIdx !== -1 ? String(rowData[combinedIdx]) : '';
  var parsed = parseBlokNomorNama(combined);

  // Append parsed columns: B, Nomor rumah, Nama Pemilik
  copyValues.push(parsed.blok);
  copyValues.push(parsed.nomorRumah);
  copyValues.push(parsed.namaPemilik);

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

  // Map column headers to indices
  var colIdx = {
    timestamp: headers.indexOf('Timestamp'),
    blok: headers.indexOf(CONFIG.VALIDATED_BLOK_HEADER),
    nomorRumah: headers.indexOf(CONFIG.VALIDATED_NOMOR_HEADER),
    namaPemilik: headers.indexOf(CONFIG.VALIDATED_NAMA_HEADER),
    jumlahPembayaran: headers.indexOf('Jumlah Pembayaran'),
    combined: headers.indexOf(CONFIG.COMBINED_FIELD)
  };

  var data = [];
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];

    var blok = colIdx.blok !== -1 ? String(row[colIdx.blok]).trim().toUpperCase() : '';
    var nomorRumah = colIdx.nomorRumah !== -1 ? String(parseInt(row[colIdx.nomorRumah], 10)) : '';
    var namaPemilik = colIdx.namaPemilik !== -1 ? String(row[colIdx.namaPemilik]).trim() : '';

    // Fallback: parse from combined field if parsed columns are empty
    if ((!blok || !nomorRumah || nomorRumah === 'NaN') && colIdx.combined !== -1) {
      var parsed = parseBlokNomorNama(String(row[colIdx.combined]));
      blok = blok || parsed.blok;
      nomorRumah = (nomorRumah && nomorRumah !== 'NaN') ? nomorRumah : parsed.nomorRumah;
      namaPemilik = namaPemilik || parsed.namaPemilik;
    }

    var jumlahPembayaran = colIdx.jumlahPembayaran !== -1 ? toIntAmount(row[colIdx.jumlahPembayaran]) : 0;
    var timestamp = colIdx.timestamp !== -1 ? toIsoWIB(row[colIdx.timestamp]) : null;

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
// Expenses — GitHub push (generic)
// ---------------------------------------------------------------------------

/**
 * Pushes content to a specific file path in the GitHub repo.
 * Generic version that accepts filePath parameter (unlike pushToGitHub which hardcodes CONFIG.FILE_PATH).
 */
function pushFileToGitHub(filePath, content) {
  var props = PropertiesService.getScriptProperties();
  var token = props.getProperty('GITHUB_TOKEN');
  var repo = props.getProperty('GITHUB_REPO');

  if (!token || !repo) {
    throw new Error('Missing GITHUB_TOKEN or GITHUB_REPO in Script Properties.');
  }

  var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + filePath;
  var sha = getFileSha(apiUrl, token);

  var payload = {
    message: 'chore: update expense data',
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

// ---------------------------------------------------------------------------
// Expenses — Build and deploy
// ---------------------------------------------------------------------------

/**
 * Reads the "Pengeluaran Rutin" tab and builds the expenses JSON object.
 * Parses two tables: Rutin (left, cols A-C) and Insidental (right, cols E-I).
 */
function buildExpensesJson() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(EXPENSES_CONFIG.TAB);
  if (!sheet) throw new Error('Tab "' + EXPENSES_CONFIG.TAB + '" not found.');

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    return { lastUpdate: getTodayISO(), rutin: [], insidental: [], summary: { totalMasuk: 0, totalKeluar: 0, sisaAnggaran: 0 } };
  }

  // Read all rows, then find header row dynamically (handles leading empty/title rows)
  var allRows = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headerIdx = -1;
  for (var h = 0; h < allRows.length; h++) {
    if (String(allRows[h][0] || '').trim().toLowerCase() === 'keterangan') {
      headerIdx = h;
      break;
    }
  }
  if (headerIdx === -1) throw new Error('Header row not found — expected a row with "Keterangan" in column A');
  var allData = allRows.slice(headerIdx + 1);

  // Parse Rutin table (left: cols A, B, C)
  var rutin = [];
  var rutinTotalMasuk = 0;
  var rutinTotalKeluar = 0;

  for (var i = 0; i < allData.length; i++) {
    var row = allData[i];
    var keterangan = String(row[EXPENSES_CONFIG.RUTIN_KETERANGAN_COL - 1] || '').trim();

    if (!keterangan || keterangan.toLowerCase() === 'total' || keterangan.toLowerCase() === 'sisa') break;

    var masuk = toIntAmount(row[EXPENSES_CONFIG.RUTIN_MASUK_COL - 1]);
    var keluar = toIntAmount(row[EXPENSES_CONFIG.RUTIN_KELUAR_COL - 1]);

    rutin.push({
      keterangan: keterangan,
      masuk: masuk || null,
      keluar: keluar || null
    });

    rutinTotalMasuk += masuk;
    rutinTotalKeluar += keluar;
  }

  // Parse Insidental table (right: cols E, F, G, H, I)
  var insidental = [];
  var insidentalTotalMasuk = 0;
  var insidentalTotalKeluar = 0;

  for (var j = 0; j < allData.length; j++) {
    var row2 = allData[j];
    var ket2 = String(row2[EXPENSES_CONFIG.INSIDENTAL_KETERANGAN_COL - 1] || '').trim();

    if (!ket2 || ket2.toLowerCase() === 'total') break;

    var masuk2 = toIntAmount(row2[EXPENSES_CONFIG.INSIDENTAL_MASUK_COL - 1]);
    var keluar2 = toIntAmount(row2[EXPENSES_CONFIG.INSIDENTAL_KELUAR_COL - 1]);
    var tanggalRaw = row2[EXPENSES_CONFIG.INSIDENTAL_TANGGAL_COL - 1];
    var kategori = String(row2[EXPENSES_CONFIG.INSIDENTAL_KATEGORI_COL - 1] || '').trim();

    var tanggal = null;
    if (tanggalRaw instanceof Date) {
      tanggal = tanggalRaw.getFullYear() + '-' + pad2(tanggalRaw.getMonth() + 1) + '-' + pad2(tanggalRaw.getDate());
    } else if (tanggalRaw) {
      var parsed = new Date(tanggalRaw);
      if (!isNaN(parsed.getTime())) {
        tanggal = parsed.getFullYear() + '-' + pad2(parsed.getMonth() + 1) + '-' + pad2(parsed.getDate());
      }
    }

    insidental.push({
      keterangan: ket2,
      masuk: masuk2 || null,
      keluar: keluar2 || null,
      tanggal: tanggal,
      kategori: kategori
    });

    insidentalTotalMasuk += masuk2;
    insidentalTotalKeluar += keluar2;
  }

  var totalMasuk = insidentalTotalMasuk;
  var totalKeluar = rutinTotalKeluar + insidentalTotalKeluar;
  var sisaAnggaran = totalMasuk - totalKeluar;

  return {
    lastUpdate: getTodayISO(),
    rutin: rutin,
    insidental: insidental,
    summary: {
      totalMasuk: totalMasuk,
      totalKeluar: totalKeluar,
      sisaAnggaran: sisaAnggaran
    }
  };
}

/**
 * Reads expense data, converts to JSON, pushes to GitHub.
 * Triggered from custom menu "IPL Tools > Deploy Pengeluaran ke Website".
 */
function deployExpensesToSite() {
  var ui = SpreadsheetApp.getUi();

  var response = ui.alert(
    'Deploy Pengeluaran',
    'This will update the live site with current expense data. Continue?',
    ui.ButtonSet.YES_NO
  );
  if (response !== ui.Button.YES) return;

  try {
    var json = buildExpensesJson();
    var jsonString = JSON.stringify(json, null, 2) + '\n';

    pushFileToGitHub(EXPENSES_CONFIG.FILE_PATH, jsonString);

    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Expense data deployed successfully! (' + json.rutin.length + ' rutin, ' + json.insidental.length + ' insidental)',
      'Deploy Complete',
      5
    );
  } catch (err) {
    ui.alert('Deploy failed: ' + err.message);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parses "Blok dan Nomor Rumah" combined field.
 * Format: "E 5. Wiwi Dewi Murni" → { blok: "E", nomorRumah: "5", namaPemilik: "Wiwi Dewi Murni" }
 */
function parseBlokNomorNama(combined) {
  if (!combined) return { blok: '', nomorRumah: '', namaPemilik: '' };

  // Match: letter, space, number, dot, space, name
  // e.g. "E 5. Wiwi Dewi Murni" or "B 10. Kusumo"
  var m = combined.match(/^([A-Za-z])\s*(\d+)\.\s*(.+)$/);
  if (!m) {
    // Fallback: try without name (just "E 5")
    var m2 = combined.match(/([A-Za-z])\s*(\d+)/);
    if (!m2) return { blok: '', nomorRumah: '', namaPemilik: '' };
    return { blok: m2[1].toUpperCase(), nomorRumah: String(parseInt(m2[2], 10)), namaPemilik: '' };
  }

  return {
    blok: m[1].toUpperCase(),
    nomorRumah: String(parseInt(m[2], 10)),
    namaPemilik: m[3].trim()
  };
}

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
