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
  RAW_TAB: 'Raw Data',
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
  TAB: 'Transaksi',
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
    .addSeparator()
    .addItem('Backfill Cek AI (15 baris)', 'backfillCekAi')
    .addItem('Cek AI Baris Terpilih', 'cekAiBarisTerpilih')
    .addItem('Reset Posisi Backfill', 'resetBackfillCursor')
    .addToUi();
}

// ---------------------------------------------------------------------------
// Attendance (Kehadiran) — Web App endpoint
// ---------------------------------------------------------------------------
//
// Form kehadiran acara di halaman /kehadiran POST ke Web App ini; halaman
// /rekap-kehadiran membacanya lewat doGet. Data masuk ke tab terpisah
// (ATTENDANCE_SHEET), tidak mengganggu tab Raw Data / Validated / Transaksi.
//
// Kolom tab "Kehadiran":
//   Timestamp | Blok | Nomor Rumah | Nama | WhatsApp | Email | Status

var ATTENDANCE_SHEET = 'Kehadiran';

/**
 * Menerima submit form kehadiran.
 * Upsert: kalau Blok + Nomor Rumah yang sama sudah pernah mengisi, baris
 * lamanya ditimpa (bukan menambah baris baru) — jadi 1 rumah = 1 baris.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(ATTENDANCE_SHEET);
    var p = (e && e.parameter) ? e.parameter : {};

    var row = [
      p.timestamp || new Date().toISOString(),
      p.blok || '',
      p.nomorRumah || '',
      p.nama || '',
      p.whatsapp || '',
      p.email || '',
      p.status || ''
    ];

    var values = sheet.getDataRange().getValues();
    var targetRow = 0; // 0 = tidak ketemu
    for (var i = 1; i < values.length; i++) {
      // kolom B = Blok (index 1), kolom C = Nomor Rumah (index 2)
      if (
        String(values[i][1]) === String(p.blok) &&
        String(values[i][2]) === String(p.nomorRumah)
      ) {
        targetRow = i + 1; // nomor baris di sheet (1-based, header di baris 1)
        break;
      }
    }

    if (targetRow > 0) {
      sheet.getRange(targetRow, 1, 1, row.length).setValues([row]);
    } else {
      sheet.appendRow(row);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengembalikan data kehadiran untuk halaman rekap.
 * Sengaja TIDAK mengirim WhatsApp & Email agar data pribadi tidak bocor ke publik.
 */
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(ATTENDANCE_SHEET);
  var values = sheet.getDataRange().getValues();

  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[1] && !r[2]) continue; // lewati baris kosong
    out.push({
      blok: String(r[1]),
      nomorRumah: String(r[2]),
      nama: String(r[3]),
      // r[4] = WhatsApp & r[5] = Email TIDAK disertakan (privasi)
      status: String(r[6]),
      timestamp: r[0]
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data: out }))
    .setMimeType(ContentService.MimeType.JSON);
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

  var totalMasuk = rutinTotalMasuk;
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

// ===========================================================================
// Verifikasi Bukti Transfer dengan Claude API (vision)
// ===========================================================================
//
// Pembagian wewenang (lihat docs/adr/0001-rantai-wewenang-verifikasi-bukti.md):
//   Claude    → HANYA mengekstrak apa yang terbaca di gambar, tanpa penilaian
//   Code.gs   → membandingkannya dengan EXPECTED_* dan menghasilkan aiVerdict
//   Bendahara → satu-satunya yang boleh menulis validationStatus
//
// Kode di bawah ini TIDAK PERNAH menulis ke kolom validationStatus.
//
// Script Properties yang dibutuhkan:
//   ANTHROPIC_API_KEY   — API key dari console.anthropic.com
//   EXPECTED_REKENING   — nomor rekening Jago bendahara (digit saja)
//   EXPECTED_NAMA       — nama pemilik rekening, mis. "Ihsan Satriawan"

var AI_CONFIG = {
  // Ganti satu baris ini untuk pindah model. Kandidat lain: 'claude-sonnet-5'
  MODEL: 'claude-haiku-4-5',
  API_URL: 'https://api.anthropic.com/v1/messages',
  API_VERSION: '2023-06-01',
  MAX_TOKENS: 1024,

  // Kolom di tab Raw Data — dicari BY HEADER NAME, dibuat kalau belum ada.
  // Jangan pernah pakai index: Google Form bisa menambah field dan menggeser kolom.
  VERDICT_HEADER: 'aiVerdict',
  ALASAN_HEADER: 'aiAlasan',
  SIDIK_JARI_HEADER: 'aiSidikJari',
  BUKTI_HEADER: 'Unggah Bukti Transfer Pembayaran IPL-2026',

  // Hanya format yang bisa dibaca Claude. HEIC dari iPhone sengaja ditolak
  // di sini supaya tidak membuang satu panggilan API untuk pasti gagal.
  ALLOWED_MIME: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_BYTES: 4500000, // batas API ~5MB per gambar, disisakan margin

  // Selisih Nominal (Nominal Bukti − Nominal Klaim) yang masih diloloskan.
  // Sengaja asimetris: longgar ke atas (biaya admin bank), ketat ke bawah.
  TOLERANSI_ADMIN: 10000,

  BACKFILL_BATCH: 15,
  BACKFILL_CURSOR_KEY: 'AI_BACKFILL_CURSOR',

  RETRY_DELAYS_MS: [2000, 5000], // 3 percobaan total
  RETRYABLE_CODES: [429, 500, 502, 503, 529]
};

var VERDICT = {
  COCOK: '✅ COCOK',
  BEDA_NOMINAL: '⚠️ BEDA NOMINAL',
  RAGU: '❓ RAGU',
  DUPLIKAT: '🔴 DUPLIKAT',
  GAGAL: '🔴 GAGAL'
};

var AI_SYSTEM_PROMPT = [
  'Kamu membaca screenshot bukti transfer bank Indonesia.',
  'Laporkan HANYA apa yang terbaca di gambar. Jangan menilai, jangan menyimpulkan, jangan menebak.',
  '',
  'Aturan tiap field:',
  '- nomorRekeningTujuan: nomor rekening PENERIMA persis seperti tertulis, termasuk',
  '  tanda bintang atau x kalau disamarkan bank. Bukan rekening pengirim. null kalau tidak ada.',
  '- empatDigitTerakhir: 4 digit terakhir rekening penerima kalau terbaca, selain itu null.',
  '- namaPenerima: nama pemilik rekening TUJUAN persis seperti tertulis. Bukan nama pengirim.',
  '  null kalau tidak ada.',
  '- nominal: jumlah yang DITERIMA penerima, BUKAN total yang didebet dari pengirim.',
  '  Struk sering menampilkan "Nominal", "Biaya Admin", dan "Total" secara terpisah —',
  '  ambil angka Nominal / Jumlah Transfer, JANGAN Total. Tulis angka saja tanpa "Rp"',
  '  dan tanpa pemisah ribuan. null kalau tidak terbaca.',
  '- tanggal: tanggal transaksi, format YYYY-MM-DD. null kalau tidak terbaca.',
  '- jam: jam transaksi, format HH:MM 24 jam. null kalau tidak terbaca.',
  '- catatan: satu kalimat singkat bahasa Indonesia. Sebut nama bank atau aplikasi kalau',
  '  terlihat, dan apa saja yang tidak terbaca atau meragukan. String kosong kalau semua jelas.',
  '',
  'Kalau gambar jelas bukan bukti transfer, isi semua field null dan jelaskan di catatan.'
].join('\n');

/** Schema structured outputs — menjamin bentuk JSON balikan Claude. */
var AI_SCHEMA = {
  type: 'object',
  properties: {
    nomorRekeningTujuan: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    empatDigitTerakhir: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    namaPenerima: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    nominal: { anyOf: [{ type: 'number' }, { type: 'null' }] },
    tanggal: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    jam: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    catatan: { type: 'string' }
  },
  required: [
    'nomorRekeningTujuan', 'empatDigitTerakhir', 'namaPenerima',
    'nominal', 'tanggal', 'jam', 'catatan'
  ],
  additionalProperties: false
};

// ---------------------------------------------------------------------------
// Menu: Backfill
// ---------------------------------------------------------------------------

/**
 * Memproses maksimal AI_CONFIG.BACKFILL_BATCH baris per klik.
 *
 * Apps Script mati di 6 menit dan satu panggilan vision makan beberapa detik,
 * jadi seluruh riwayat tidak muat dalam satu eksekusi. Posisi terakhir disimpan
 * di Script Properties supaya bisa dilanjut.
 *
 * Idempoten: baris yang aiVerdict-nya sudah terisi dilewati tanpa panggilan API.
 * Baris yang validationStatus-nya sudah terisi TIDAK dilewati — justru itu kunci
 * jawaban yang dipakai untuk mengukur akurasi.
 */
function backfillCekAi() {
  var ui = SpreadsheetApp.getUi();
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.RAW_TAB);
  if (!sheet) {
    ui.alert('Tab "' + CONFIG.RAW_TAB + '" tidak ditemukan.');
    return;
  }

  var ctx;
  try {
    ctx = buildAiContext_(sheet);
  } catch (err) {
    ui.alert('Setup belum lengkap: ' + err.message);
    return;
  }

  var props = PropertiesService.getScriptProperties();
  var cursor = parseInt(props.getProperty(AI_CONFIG.BACKFILL_CURSOR_KEY) || '1', 10);
  if (!cursor || cursor < 1) cursor = 1;

  var lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    ui.alert('Tab Raw Data masih kosong.');
    return;
  }

  var startRow = Math.max(2, cursor + 1);
  var diproses = 0;
  var dilewati = 0;
  var ringkasan = {};
  var row = startRow;

  for (; row <= lastRow && diproses < AI_CONFIG.BACKFILL_BATCH; row++) {
    var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

    if (String(rowData[ctx.idx.verdict] || '').trim() !== '') {
      dilewati++;
      continue;
    }

    var hasil = verifikasiBaris_(sheet, ctx, rowData, row);
    ringkasan[hasil.verdict] = (ringkasan[hasil.verdict] || 0) + 1;
    diproses++;
  }

  props.setProperty(AI_CONFIG.BACKFILL_CURSOR_KEY, String(row - 1));

  var selesai = (row - 1) >= lastRow;
  var pesan = diproses + ' baris diproses';
  if (dilewati > 0) pesan += ', ' + dilewati + ' dilewati (sudah ada aiVerdict)';
  pesan += '.\n\n';
  for (var v in ringkasan) pesan += '  ' + v + ' : ' + ringkasan[v] + '\n';
  pesan += '\n' + (selesai
    ? 'Sudah sampai baris terakhir. Backfill selesai.'
    : 'Berhenti di baris ' + (row - 1) + ' dari ' + lastRow + '. Klik lagi untuk melanjutkan.');

  ui.alert('Backfill Cek AI', pesan, ui.ButtonSet.OK);
}

/**
 * Memproses ulang baris yang sedang dipilih, walaupun aiVerdict-nya sudah terisi.
 * Dipakai untuk menguji satu bukti tertentu tanpa menjalankan seluruh backfill.
 */
function cekAiBarisTerpilih() {
  var ui = SpreadsheetApp.getUi();
  var sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== CONFIG.RAW_TAB) {
    ui.alert('Pilih dulu satu baris di tab "' + CONFIG.RAW_TAB + '".');
    return;
  }

  var row = sheet.getActiveRange().getRow();
  if (row < 2) {
    ui.alert('Baris 1 itu header. Pilih baris data.');
    return;
  }

  var ctx;
  try {
    ctx = buildAiContext_(sheet);
  } catch (err) {
    ui.alert('Setup belum lengkap: ' + err.message);
    return;
  }

  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];
  var hasil = verifikasiBaris_(sheet, ctx, rowData, row);

  ui.alert('Baris ' + row, hasil.verdict + '\n\n' + hasil.alasan, ui.ButtonSet.OK);
}

/** Mengembalikan posisi backfill ke awal. Tidak menghapus aiVerdict yang sudah ada. */
function resetBackfillCursor() {
  var ui = SpreadsheetApp.getUi();
  PropertiesService.getScriptProperties().deleteProperty(AI_CONFIG.BACKFILL_CURSOR_KEY);
  ui.alert(
    'Posisi backfill direset ke baris 2.\n\n' +
    'Baris yang aiVerdict-nya sudah terisi tetap dilewati. Untuk memproses ulang, ' +
    'kosongkan dulu kolom aiVerdict-nya.'
  );
}

// ---------------------------------------------------------------------------
// Trigger onFormSubmit
// ---------------------------------------------------------------------------

/**
 * Memverifikasi satu Setoran baru begitu form disubmit.
 *
 * JANGAN pasang trigger ini sebelum backfill dijalankan dan matriks
 * aiVerdict x validationStatus direview bersama bendahara — lihat
 * docs/adr/0001-rantai-wewenang-verifikasi-bukti.md.
 */
function onFormSubmitHandler(e) {
  if (!e || !e.range) return;

  var sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.RAW_TAB) return;

  var row = e.range.getRow();
  if (row < 2) return;

  var ctx = buildAiContext_(sheet);
  var rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  verifikasiBaris_(sheet, ctx, rowData, row);
}

// ---------------------------------------------------------------------------
// Orkestrasi satu baris
// ---------------------------------------------------------------------------

/**
 * Membaca konfigurasi + header sekali di awal, supaya tidak diulang per baris.
 * Melempar Error kalau Script Properties belum lengkap.
 */
function buildAiContext_(sheet) {
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('ANTHROPIC_API_KEY');
  var rekening = String(props.getProperty('EXPECTED_REKENING') || '').replace(/\D/g, '');
  var nama = String(props.getProperty('EXPECTED_NAMA') || '').trim();

  var kurang = [];
  if (!apiKey) kurang.push('ANTHROPIC_API_KEY');
  if (!rekening) kurang.push('EXPECTED_REKENING');
  if (!nama) kurang.push('EXPECTED_NAMA');
  if (kurang.length) {
    throw new Error('Script Properties belum diisi: ' + kurang.join(', '));
  }

  var idx = ensureAiColumns_(sheet);

  return {
    apiKey: apiKey,
    expectedRekening: rekening,
    expectedEmpatDigit: rekening.slice(-4),
    expectedNama: normalisasiNama_(nama),
    idx: idx,
    sidikJariIndex: buildSidikJariIndex_(sheet, idx)
  };
}

/**
 * Mencari kolom aiVerdict / aiAlasan / aiSidikJari by header name.
 * Kolom yang belum ada dibuat di ujung kanan.
 */
function ensureAiColumns_(sheet) {
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  function cariAtauBuat(nama) {
    var i = headers.indexOf(nama);
    if (i !== -1) return i;
    lastCol++;
    sheet.getRange(1, lastCol).setValue(nama);
    headers.push(nama);
    return lastCol - 1;
  }

  var idx = {
    verdict: cariAtauBuat(AI_CONFIG.VERDICT_HEADER),
    alasan: cariAtauBuat(AI_CONFIG.ALASAN_HEADER),
    sidikJari: cariAtauBuat(AI_CONFIG.SIDIK_JARI_HEADER),
    bukti: headers.indexOf(AI_CONFIG.BUKTI_HEADER),
    timestamp: headers.indexOf('Timestamp'),
    jumlah: headers.indexOf('Jumlah Pembayaran'),
    status: headers.indexOf(CONFIG.STATUS_COLUMN_HEADER)
  };

  if (idx.bukti === -1) {
    throw new Error('Kolom "' + AI_CONFIG.BUKTI_HEADER + '" tidak ditemukan di Raw Data.');
  }
  if (idx.jumlah === -1) {
    throw new Error('Kolom "Jumlah Pembayaran" tidak ditemukan di Raw Data.');
  }

  return idx;
}

/**
 * Mengumpulkan Sidik Jari Bukti dari baris yang sudah diproses, supaya deteksi
 * duplikat tetap jalan lintas batch backfill (tanpa memanggil API ulang).
 * Map: sidikJari -> nomor baris pertama yang memakainya.
 */
function buildSidikJariIndex_(sheet, idx) {
  var index = {};
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return index;

  var kolom = sheet.getRange(2, idx.sidikJari + 1, lastRow - 1, 1).getValues();
  for (var i = 0; i < kolom.length; i++) {
    var sj = String(kolom[i][0] || '').trim();
    if (!sj) continue;
    if (!(sj in index)) index[sj] = i + 2; // baris pertama yang memakainya menang
  }
  return index;
}

/**
 * Alur satu baris: baca file Drive -> cek MIME -> panggil Claude -> bandingkan
 * -> tulis aiVerdict / aiAlasan / aiSidikJari.
 *
 * TIDAK PERNAH menyentuh kolom validationStatus.
 */
function verifikasiBaris_(sheet, ctx, rowData, rowNum) {
  var hasil;
  var sidikJari = '';

  var gambar = bacaBuktiGambar_(rowData[ctx.idx.bukti]);

  if (!gambar.ok) {
    hasil = { verdict: VERDICT.GAGAL, alasan: gambar.error };
  } else {
    var api = panggilClaudeVision_(ctx.apiKey, gambar.base64, gambar.mimeType);

    if (!api.ok) {
      hasil = { verdict: VERDICT.GAGAL, alasan: api.error };
    } else {
      var klaim = toIntAmount(rowData[ctx.idx.jumlah]);
      var submit = ctx.idx.timestamp !== -1 ? rowData[ctx.idx.timestamp] : null;

      sidikJari = buatSidikJari_(api.data);
      hasil = nilaiBukti_(api.data, klaim, submit, ctx, sidikJari, rowNum);

      if (gambar.jumlahFile > 1) {
        hasil.alasan = gambar.jumlahFile + ' file di-upload, yang dibaca file pertama | ' + hasil.alasan;
      }
    }
  }

  sheet.getRange(rowNum, ctx.idx.verdict + 1).setValue(hasil.verdict);
  sheet.getRange(rowNum, ctx.idx.alasan + 1).setValue(hasil.alasan);
  sheet.getRange(rowNum, ctx.idx.sidikJari + 1).setValue(sidikJari);

  // Baris ini sekarang ikut jadi pembanding untuk baris berikutnya
  if (sidikJari && !(sidikJari in ctx.sidikJariIndex)) {
    ctx.sidikJariIndex[sidikJari] = rowNum;
  }

  return hasil;
}

// ---------------------------------------------------------------------------
// Aturan pembanding — dieksekusi kode, bukan Claude
// ---------------------------------------------------------------------------

/**
 * Mengubah hasil ekstraksi menjadi aiVerdict + aiAlasan.
 *
 * Urutan pemeriksaan sengaja begini: duplikat diperiksa paling awal karena
 * bukti lama yang di-upload ulang justru terbaca "cocok" di semua cek lain.
 */
function nilaiBukti_(data, nominalKlaim, waktuSubmit, ctx, sidikJari, rowNum) {
  var catatan = [];

  // --- Duplikat ---------------------------------------------------------
  if (sidikJari && (sidikJari in ctx.sidikJariIndex) && ctx.sidikJariIndex[sidikJari] !== rowNum) {
    return {
      verdict: VERDICT.DUPLIKAT,
      alasan: 'sidik jari bukti sama dengan baris ' + ctx.sidikJariIndex[sidikJari] +
              ' (' + sidikJari + ')'
    };
  }

  // --- Sinyal Tujuan (bertingkat) ---------------------------------------
  var sinyal = cekSinyalTujuan_(data, ctx);
  if (!sinyal.cocok) {
    return {
      verdict: VERDICT.RAGU,
      alasan: gabungAlasan_([sinyal.alasan, catatanClaude_(data)])
    };
  }
  catatan.push(sinyal.alasan);

  // --- Nominal ----------------------------------------------------------
  if (data.nominal === null || data.nominal === undefined) {
    return {
      verdict: VERDICT.RAGU,
      alasan: gabungAlasan_(catatan.concat(['nominal tidak terbaca di gambar', catatanClaude_(data)]))
    };
  }

  var nominalBukti = Math.round(Number(data.nominal));
  var selisih = nominalBukti - nominalKlaim;

  // Umur bukti: dicatat saja, TIDAK menghasilkan flag. Belum ada data jeda
  // upload yang wajar di komplek ini, jadi ambang batas apa pun masih tebakan.
  var umur = hitungUmurBukti_(data.tanggal, waktuSubmit);
  if (umur !== null) catatan.push('upload H+' + umur);

  if (selisih < 0) {
    return {
      verdict: VERDICT.BEDA_NOMINAL,
      alasan: gabungAlasan_(catatan.concat([
        'bukti ' + formatAngka_(nominalBukti) + ' KURANG ' + formatAngka_(-selisih) +
        ' dari klaim ' + formatAngka_(nominalKlaim),
        catatanClaude_(data)
      ]))
    };
  }

  if (selisih > AI_CONFIG.TOLERANSI_ADMIN) {
    // Tidak ada di spesifikasi awal. Diperlakukan sebagai perlu-dilihat karena
    // selisih sebesar ini biasanya berarti bukti tertukar atau pembayaran
    // beberapa bulan yang diklaim satu bulan — warga yang rugi, bukan kas.
    return {
      verdict: VERDICT.BEDA_NOMINAL,
      alasan: gabungAlasan_(catatan.concat([
        'bukti ' + formatAngka_(nominalBukti) + ' LEBIH ' + formatAngka_(selisih) +
        ' dari klaim ' + formatAngka_(nominalKlaim) + ' — di luar toleransi biaya admin',
        catatanClaude_(data)
      ]))
    };
  }

  catatan.push(selisih === 0
    ? 'nominal ' + formatAngka_(nominalBukti) + ' persis sama dengan klaim'
    : 'nominal ' + formatAngka_(nominalBukti) + ' lebih ' + formatAngka_(selisih) +
      ' dari klaim (kemungkinan biaya admin bank)');

  return {
    verdict: VERDICT.COCOK,
    alasan: gabungAlasan_(catatan.concat([catatanClaude_(data)]))
  };
}

/**
 * Sinyal Tujuan bertingkat: nomor penuh (kuat) -> 4 digit terakhir (sedang)
 * -> nama saja (lemah). Sinyal lemah tetap diloloskan, tapi kekuatannya
 * selalu ditulis di aiAlasan supaya bisa diaudit.
 */
function cekSinyalTujuan_(data, ctx) {
  var digitRekening = String(data.nomorRekeningTujuan || '').replace(/\D/g, '');

  if (digitRekening && digitRekening === ctx.expectedRekening) {
    return { cocok: true, alasan: 'cocok via NOMOR REKENING PENUH (sinyal kuat)' };
  }

  var empatDigit = String(data.empatDigitTerakhir || '').replace(/\D/g, '').slice(-4);
  if (!empatDigit && digitRekening.length >= 4) {
    // Nomor tersamar seperti "50379xxxx221" — sisa digitnya masih berguna
    empatDigit = digitRekening.slice(-4);
  }
  if (empatDigit && empatDigit === ctx.expectedEmpatDigit) {
    return {
      cocok: true,
      alasan: 'cocok via 4 DIGIT TERAKHIR ' + empatDigit +
              ' (sinyal sedang — nomor penuh tidak terbaca)'
    };
  }

  var namaBukti = normalisasiNama_(data.namaPenerima);
  if (namaBukti && cocokNama_(namaBukti, ctx.expectedNama)) {
    return {
      cocok: true,
      alasan: 'cocok via NAMA saja "' + namaBukti +
              '" (sinyal lemah — nomor rekening tidak terbaca)'
    };
  }

  var terbaca = [];
  if (digitRekening) terbaca.push('rekening "' + data.nomorRekeningTujuan + '"');
  if (namaBukti) terbaca.push('nama "' + namaBukti + '"');

  return {
    cocok: false,
    alasan: terbaca.length
      ? 'tidak ada sinyal tujuan yang cocok — terbaca ' + terbaca.join(', ')
      : 'tidak ada sinyal tujuan yang terbaca di gambar'
  };
}

/**
 * Normalisasi nama: huruf besar, buang gelar/sapaan dan karakter non-alfanumerik.
 * "Bpk. IHSAN SATRIAWAN" -> "IHSAN SATRIAWAN"
 */
function normalisasiNama_(nama) {
  if (!nama) return '';

  var s = String(nama)
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  var sapaan = ['BPK', 'BAPAK', 'IBU', 'SDR', 'SDRI', 'TN', 'NY', 'MR', 'MRS', 'PT', 'CV'];
  var kata = s.split(' ');
  while (kata.length > 1 && sapaan.indexOf(kata[0]) !== -1) kata.shift();

  return kata.join(' ');
}

/**
 * Aturan longgar: kata pertama harus persis sama, DAN kalau nama yang diharapkan
 * punya kata kedua, huruf awal kata kedua di bukti harus cocok.
 *
 *   "IHSAN SATRIAWAN"   vs "IHSAN SATRIAWAN"  -> cocok
 *   "IHSAN S"           vs "IHSAN SATRIAWAN"  -> cocok  (bank memotong nama)
 *   "IHSAN SATRIAWAN P" vs "IHSAN SATRIAWAN"  -> cocok  (bank menambah nama)
 *   "I SATRIAWAN"       vs "IHSAN SATRIAWAN"  -> TIDAK  (kata pertama beda)
 *   "IHSAN"             vs "IHSAN SATRIAWAN"  -> TIDAK  (terlalu sedikit informasi)
 */
function cocokNama_(namaBukti, namaHarapan) {
  if (!namaBukti || !namaHarapan) return false;

  var bukti = namaBukti.split(' ');
  var harap = namaHarapan.split(' ');

  if (bukti[0] !== harap[0]) return false;
  if (harap.length === 1) return true;
  if (bukti.length < 2) return false;

  return bukti[1].charAt(0) === harap[1].charAt(0);
}

/**
 * Sidik Jari Bukti: nominal|tanggal|jam.
 * Jam wajib ikut — tanpa jam, dua warga yang transfer nominal sama di hari
 * yang sama akan saling tertuduh duplikat.
 * Mengembalikan string kosong kalau salah satu komponen tidak terbaca.
 */
function buatSidikJari_(data) {
  if (data.nominal === null || data.nominal === undefined) return '';
  if (!data.tanggal || !data.jam) return '';
  return Math.round(Number(data.nominal)) + '|' + data.tanggal + '|' + data.jam;
}

/** Selisih hari antara tanggal di gambar dan waktu submit form. null kalau tidak terhitung. */
function hitungUmurBukti_(tanggalBukti, waktuSubmit) {
  if (!tanggalBukti || !waktuSubmit) return null;

  var m = String(tanggalBukti).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;

  var bukti = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  var submit = (waktuSubmit instanceof Date) ? new Date(waktuSubmit) : new Date(String(waktuSubmit));
  if (isNaN(submit.getTime())) return null;

  submit = new Date(submit.getFullYear(), submit.getMonth(), submit.getDate());
  return Math.round((submit - bukti) / 86400000);
}

// ---------------------------------------------------------------------------
// Drive: baca file bukti
// ---------------------------------------------------------------------------

/**
 * Mengambil gambar bukti dari kolom upload Google Form.
 * Isinya berupa URL Drive; kalau form mengizinkan lebih dari satu file,
 * URL-nya dipisah koma dan yang dibaca hanya yang pertama.
 */
function bacaBuktiGambar_(cellValue) {
  var raw = String(cellValue || '').trim();
  if (!raw) {
    return { ok: false, error: 'tidak ada file bukti di kolom upload' };
  }

  var ids = [];
  var re = /(?:[?&]id=|\/d\/)([-\w]{20,})/g;
  var m;
  while ((m = re.exec(raw)) !== null) ids.push(m[1]);

  if (!ids.length) {
    return { ok: false, error: 'isi kolom bukti bukan link Drive yang dikenali: ' + raw.slice(0, 80) };
  }

  var file;
  try {
    file = DriveApp.getFileById(ids[0]);
  } catch (err) {
    return { ok: false, error: 'file Drive tidak bisa dibuka (' + ids[0] + '): ' + err.message };
  }

  var mime = file.getMimeType();
  if (AI_CONFIG.ALLOWED_MIME.indexOf(mime) === -1) {
    return {
      ok: false,
      error: 'format file "' + mime + '" tidak bisa dibaca AI — buka manual ' +
             '(hanya JPG/PNG/GIF/WEBP yang didukung)'
    };
  }

  var blob = file.getBlob();
  var bytes = blob.getBytes();
  if (bytes.length > AI_CONFIG.MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: 'gambar terlalu besar (' + Math.round(bytes.length / 1048576) + ' MB) — buka manual'
    };
  }

  return {
    ok: true,
    base64: Utilities.base64Encode(bytes),
    mimeType: mime,
    jumlahFile: ids.length
  };
}

// ---------------------------------------------------------------------------
// Claude API
// ---------------------------------------------------------------------------

/**
 * Memanggil Claude vision dengan structured outputs.
 *
 * Retry hanya untuk error yang bisa berubah hasilnya (429/5xx/koneksi putus).
 * Error 400/401 tidak diulang — hasilnya akan sama, cuma buang 3 panggilan.
 */
function panggilClaudeVision_(apiKey, base64, mimeType) {
  var payload = {
    model: AI_CONFIG.MODEL,
    max_tokens: AI_CONFIG.MAX_TOKENS,
    system: AI_SYSTEM_PROMPT,
    output_config: {
      format: { type: 'json_schema', schema: AI_SCHEMA }
    },
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
        { type: 'text', text: 'Baca bukti transfer ini.' }
      ]
    }]
  };

  var options = {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': AI_CONFIG.API_VERSION
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var errorTerakhir = '';

  for (var percobaan = 0; percobaan <= AI_CONFIG.RETRY_DELAYS_MS.length; percobaan++) {
    if (percobaan > 0) Utilities.sleep(AI_CONFIG.RETRY_DELAYS_MS[percobaan - 1]);

    var code, body;
    try {
      var response = UrlFetchApp.fetch(AI_CONFIG.API_URL, options);
      code = response.getResponseCode();
      body = response.getContentText();
    } catch (err) {
      errorTerakhir = 'koneksi gagal: ' + err.message;
      continue; // koneksi putus selalu layak diulang
    }

    if (code === 200) {
      try {
        return { ok: true, data: parseJawabanClaude_(body) };
      } catch (err) {
        return { ok: false, error: 'jawaban AI tidak bisa dibaca: ' + err.message };
      }
    }

    if (AI_CONFIG.RETRYABLE_CODES.indexOf(code) === -1) {
      return { ok: false, error: 'API error ' + code + ': ' + ringkasErrorApi_(body) };
    }

    errorTerakhir = 'API error ' + code + ': ' + ringkasErrorApi_(body);
  }

  return { ok: false, error: 'gagal setelah 3 percobaan — ' + errorTerakhir };
}

/** Mengambil objek JSON dari content block teks pertama. */
function parseJawabanClaude_(body) {
  var json = JSON.parse(body);
  var blocks = json.content || [];

  for (var i = 0; i < blocks.length; i++) {
    if (blocks[i].type === 'text') return JSON.parse(blocks[i].text);
  }

  throw new Error('tidak ada content block teks di jawaban API');
}

function ringkasErrorApi_(body) {
  try {
    var json = JSON.parse(body);
    if (json.error && json.error.message) return json.error.message;
  } catch (err) { /* body bukan JSON — pakai apa adanya */ }
  return String(body || '').slice(0, 200);
}

// ---------------------------------------------------------------------------
// Helper format
// ---------------------------------------------------------------------------

function gabungAlasan_(bagian) {
  var bersih = [];
  for (var i = 0; i < bagian.length; i++) {
    var s = String(bagian[i] || '').trim();
    if (s) bersih.push(s);
  }
  return bersih.join(' | ');
}

function catatanClaude_(data) {
  var c = String(data.catatan || '').trim();
  return c ? 'catatan AI: ' + c : '';
}

function formatAngka_(n) {
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
