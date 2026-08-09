/**
 * Google Apps Script untuk pendaftaran Lomba 17-an
 * (catat-uang-warga — halaman /lomba dan /rekap-lomba)
 *
 * PENTING: file ini dipasang di Apps Script milik **Google Sheet khusus lomba**,
 * TERPISAH dari spreadsheet IPL. Jangan digabung dengan Code.gs — keduanya
 * sama-sama mendefinisikan doPost/doGet, dan Apps Script hanya mengenali satu
 * doPost + satu doGet per project. Menaruh keduanya di satu project membuat
 * salah satunya diam-diam tertimpa.
 *
 * Setup lengkap: docs/lomba-apps-script.md
 *
 * Tab "Lomba" dibuat otomatis pada submit pertama, jadi spreadsheet-nya boleh
 * dibiarkan kosong.
 *
 * Kolom tab "Lomba":
 *   A Timestamp | B Submit ID | C Blok | D Nomor Rumah | E Rumah
 *   F Nama Ayah | G Nama Ibu | H WhatsApp
 *   I Nama Peserta | J Peran | K Umur
 *   L–S 8 kolom lomba (diisi angka 1) | T Detail Pentas | U Total
 */

var LOMBA_SHEET = 'Lomba';

// Urutan harus sama dengan LOMBA_LIST di src/data/lomba.js — penulisan ke sheet
// berdasarkan POSISI kolom, bukan nama.
var LOMBA_KEYS = ['bendera', 'air', 'kerupuk', 'paku', 'karung', 'kelereng', 'tepung', 'pentas'];

var LOMBA_HEADERS = [
  'Timestamp', 'Submit ID', 'Blok', 'Nomor Rumah', 'Rumah',
  'Nama Ayah', 'Nama Ibu', 'WhatsApp',
  'Nama Peserta', 'Peran', 'Umur',
  'Bendera', 'Air', 'Kerupuk', 'Paku', 'Karung', 'Kelereng', 'Tepung', 'Pentas',
  'Detail Pentas', 'Total'
];

// Posisi kolom (0-based) di dalam satu baris
var LOMBA_COL_BLOK = 2;
var LOMBA_COL_NOMOR = 3;
var LOMBA_COL_FIRST_LOMBA = 11;
var LOMBA_COL_DETAIL_PENTAS = 19;

// ---------------------------------------------------------------------------
// Web App entry points
// ---------------------------------------------------------------------------

function doPost(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  return handleLombaPost_(p);
}

function doGet(e) {
  return handleLombaGet_();
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---------------------------------------------------------------------------
// Sheet
// ---------------------------------------------------------------------------

/**
 * Ambil tab "Lomba", bikin dulu kalau belum ada (lengkap dengan header,
 * freeze pane, dan lebar kolom yang enak dibaca).
 */
function ensureLombaSheet_(ss) {
  var sheet = ss.getSheetByName(LOMBA_SHEET);
  var isNew = false;
  if (!sheet) {
    sheet = ss.insertSheet(LOMBA_SHEET);
    isNew = true;
  }

  if (isNew || sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, LOMBA_HEADERS.length).setValues([LOMBA_HEADERS]);
    sheet.getRange(1, 1, 1, LOMBA_HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#F1F5F9')
      .setWrap(true);
    sheet.setFrozenRows(1);
    // Kunci kolom A–I supaya nama peserta tetap terlihat saat scroll ke kanan
    sheet.setFrozenColumns(9);
    sheet.setColumnWidth(1, 150); // Timestamp
    sheet.setColumnWidth(2, 130); // Submit ID
    // Kolom lomba dibikin sempit — isinya cuma angka 1
    for (var c = 0; c < LOMBA_KEYS.length; c++) {
      sheet.setColumnWidth(LOMBA_COL_FIRST_LOMBA + 1 + c, 70);
    }
  }

  return sheet;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * Menerima submit pendaftaran lomba (satu rumah, banyak peserta).
 *
 * Upsert per rumah: semua baris lama dengan Blok + Nomor Rumah yang sama
 * dihapus lebih dulu, lalu daftar peserta yang baru ditulis ulang. Jadi warga
 * bisa membuka form lagi untuk menambah/mengurangi peserta tanpa jadi dobel.
 */
function handleLombaPost_(p) {
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    var peserta = [];
    try {
      peserta = JSON.parse(p.peserta || '[]');
    } catch (parseErr) {
      return jsonOutput_({ ok: false, error: 'Data peserta tidak terbaca: ' + parseErr });
    }
    if (!peserta.length) {
      return jsonOutput_({ ok: false, error: 'Tidak ada peserta yang dikirim.' });
    }

    var blok = String(p.blok || '');
    var nomorRumah = String(p.nomorRumah || '');
    if (!blok || !nomorRumah) {
      return jsonOutput_({ ok: false, error: 'Blok / nomor rumah kosong.' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ensureLombaSheet_(ss);

    // Timestamp ditulis sebagai objek Date (bukan teks) supaya kolomnya bisa
    // disortir & diformat sebagai tanggal di Google Sheet.
    var ts = p.timestamp ? new Date(p.timestamp) : new Date();
    if (isNaN(ts.getTime())) ts = new Date();
    var submitId = blok + '-' + nomorRumah + '-' + Math.floor(ts.getTime() / 1000);

    // Hapus baris lama rumah ini (dari bawah ke atas supaya index tidak geser)
    if (sheet.getLastRow() > 1) {
      var values = sheet.getDataRange().getValues();
      for (var i = values.length - 1; i >= 1; i--) {
        if (
          String(values[i][LOMBA_COL_BLOK]) === blok &&
          String(values[i][LOMBA_COL_NOMOR]) === nomorRumah
        ) {
          sheet.deleteRow(i + 1);
        }
      }
    }

    var rows = [];
    for (var j = 0; j < peserta.length; j++) {
      var orang = peserta[j] || {};
      var dipilih = Array.isArray(orang.lomba) ? orang.lomba : [];

      var row = [
        ts,
        submitId,
        blok,
        nomorRumah,
        blok + '-' + nomorRumah,
        String(p.namaAyah || ''),
        String(p.namaIbu || ''),
        String(p.whatsapp || ''),
        String(orang.nama || ''),
        String(orang.peran || ''),
        orang.umur === '' || orang.umur === null || orang.umur === undefined
          ? ''
          : Number(orang.umur)
      ];

      var total = 0;
      for (var k = 0; k < LOMBA_KEYS.length; k++) {
        var ikut = dipilih.indexOf(LOMBA_KEYS[k]) !== -1;
        row.push(ikut ? 1 : '');
        if (ikut) total++;
      }

      row.push(String(orang.detailPentas || ''));
      row.push(total);
      rows.push(row);
    }

    var startRow = sheet.getLastRow() + 1;
    sheet.getRange(startRow, 1, rows.length, LOMBA_HEADERS.length).setValues(rows);

    return jsonOutput_({ ok: true, submitId: submitId, rows: rows.length });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Mengembalikan data lomba untuk halaman /rekap-lomba dan untuk memperingatkan
 * warga yang rumahnya sudah terdaftar.
 * Sengaja TIDAK mengirim WhatsApp agar nomor pribadi tidak bocor ke publik.
 */
function handleLombaGet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOMBA_SHEET);
  // Tab belum ada = belum ada yang mendaftar. Balas daftar kosong, bukan error.
  if (!sheet || sheet.getLastRow() < 2) {
    return jsonOutput_({ ok: true, data: [] });
  }

  var values = sheet.getDataRange().getValues();
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[LOMBA_COL_BLOK] && !r[LOMBA_COL_NOMOR]) continue;

    var lomba = [];
    for (var k = 0; k < LOMBA_KEYS.length; k++) {
      if (Number(r[LOMBA_COL_FIRST_LOMBA + k]) === 1) lomba.push(LOMBA_KEYS[k]);
    }

    out.push({
      blok: String(r[LOMBA_COL_BLOK]),
      nomorRumah: String(r[LOMBA_COL_NOMOR]),
      namaAyah: String(r[5]),
      namaIbu: String(r[6]),
      // r[7] = WhatsApp TIDAK disertakan (privasi)
      nama: String(r[8]),
      peran: String(r[9]),
      umur: r[10] === '' ? '' : String(r[10]),
      lomba: lomba,
      detailPentas: String(r[LOMBA_COL_DETAIL_PENTAS]),
      timestamp: r[0]
    });
  }

  return jsonOutput_({ ok: true, data: out });
}
