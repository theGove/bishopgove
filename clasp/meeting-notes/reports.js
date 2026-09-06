const SAVED_REPORTS_FOLDER_ID = "1-Na1jTumOMyI2KJ2Fr9BugINqF4itgzP";

// Creates a new Google Sheet in SAVED_REPORTS_FOLDER_ID from a report scraped out of LCR by
// the Flock/YSA Tools extension's "Save Report" button. `pages` is an array of
// { title, headers, rows } — one entry per sheet. Tabbed reports (e.g. "Out-of-Unit Callings")
// produce one page per tab; untabbed reports produce a single page.
function saveReport(title, pages) {
  const reportName = (title || "Report").trim() || "Report";
  const dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd");
  const fileName = `${reportName} (${dateStr})`;

  // Re-exporting the same report on the same day overwrites its existing sheet (same file,
  // same URL) instead of piling up duplicates.
  const folder = DriveApp.getFolderById(SAVED_REPORTS_FOLDER_ID);
  const existingFiles = folder.getFilesByName(fileName);
  const isNew = !existingFiles.hasNext();
  const ss = isNew
    ? SpreadsheetApp.create(fileName)
    : resetSpreadsheet(SpreadsheetApp.openById(existingFiles.next().getId()));

  const usedNames = new Set();
  pages.forEach((page, i) => {
    const sheet = i === 0 ? ss.getSheets()[0] : ss.insertSheet();
    sheet.setName(uniqueSheetName(page.title || `Sheet ${i + 1}`, usedNames));

    const width = page.headers.length;
    const data = [page.headers, ...page.rows.map(row => {
      const padded = row.slice(0, width);
      while (padded.length < width) padded.push("");
      return padded;
    })];
    sheet.getRange(1, 1, data.length, width).setValues(data);
    sheet.setFrozenRows(1);
  });

  // A reused spreadsheet is already in the target folder (that's how it was found); only a
  // freshly created one needs to be moved out of the root folder it was created in.
  if (isNew) {
    const file = DriveApp.getFileById(ss.getId());
    folder.addFile(file);
    DriveApp.getRootFolder().removeFile(file);
  }

  return { status: "success", url: ss.getUrl(), fileName };
}

// Strips a reused spreadsheet down to a single blank sheet before saveReport() rebuilds it,
// so a re-export with fewer sheets or shorter rows/columns than last time doesn't leave stale
// leftover sheets or cells behind.
function resetSpreadsheet(ss) {
  const sheets = ss.getSheets();
  for (let i = 1; i < sheets.length; i++) ss.deleteSheet(sheets[i]);
  ss.getSheets()[0].clear();
  return ss;
}

// Google Sheets sheet names can't contain [ ] * ? / \ : , must be non-empty, <=100 chars,
// and unique within the spreadsheet.
function uniqueSheetName(name, usedNames) {
  const base = name.toString().replace(/[\[\]\*\?\/\\:]/g, " ").trim().slice(0, 95) || "Sheet";
  let candidate = base;
  let n = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base} (${n++})`;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}
