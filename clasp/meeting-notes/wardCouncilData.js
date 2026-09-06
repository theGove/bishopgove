/**
 * Update Form Dropdown Options
 * ------------------------------------------------------------
 * Standalone Google Apps Script (NOT bound to the form).
 * Lives in its own script project and opens the form by ID.
 *
 * What it does:
 *   Reads a list of values from column A of a Google Sheet tab and
 *   uses them to replace the choices in a dropdown ("List") question
 *   on the target form (the "Member" question, by default).
 *
 * SETUP:
 *   1. Go to https://script.google.com and click "New project".
 *      (This creates a script that isn't attached to any form or
 *      sheet — you open both by ID from inside the code instead.)
 *   2. Delete any boilerplate code and paste this whole file in.
 *   3. Fill in the CONFIG values below:
 *        - FORM_ID: the ID from the form's EDIT url — open the form
 *          in the Forms editor (not the public "viewform" link) and
 *          copy the ID out of
 *          https://docs.google.com/forms/d/FORM_ID/edit
 *          Note: this is different from the long token in a
 *          published "viewform" sharing link — that token won't work
 *          here, it has to be the edit-URL ID.
 *        - SHEET_ID: the ID from your source Google Sheet's URL
 *          (the long string in .../spreadsheets/d/SHEET_ID/edit)
 *        - TAB_NAME: the name of the tab/sheet within that
 *          spreadsheet that holds the list of names
 *        - COLUMN: the column letter that holds the values
 *          (defaults to "A")
 *        - HAS_HEADER_ROW: true if row 1 is a header you want to skip
 *        - QUESTION_TITLE: the exact title of the dropdown question
 *          on the form (defaults to "Member")
 *   4. Save the project (give it any name).
 *   5. Select the "updateDropdownOptions" function in the toolbar
 *      dropdown and click Run. The first run will prompt you to
 *      authorize the script — approve it (it needs access to the
 *      form and to the source spreadsheet; since it's standalone it
 *      needs to be granted access to both explicitly).
 *   6. Check the dropdown question in the form to confirm the
 *      options updated.
 *
 * OPTIONAL - keep it updated automatically:
 *   In the Apps Script editor, click the clock icon ("Triggers") on
 *   the left sidebar > Add Trigger > choose "updateDropdownOptions",
 *   event source "Time-driven", and pick how often you want it to
 *   refresh (e.g. every hour, or daily).
 */

// ===================== CONFIG — edit these ======================
const FORM_ID = '1VgPaQUwbwmymrjP1Jo7KPx-ITryIsmVGj4w2eNUBb94'; // ID from the form's /edit URL
const SHEET_ID = '1hfmIAAvt0OXv_g2HgQLSuYz7N1RRdVEQ8ZiFX1fAqrU';   // ID of the source Google Sheet
const TAB_NAME = 'Directory';                    // Tab within that spreadsheet
const COLUMN = 'A';                           // Column holding the values
const HAS_HEADER_ROW = true;                  // Skip row 1 if it's a header
const QUESTION_TITLE = 'Member';              // Exact title of the dropdown question
const SORT_ALPHABETICALLY = true;             // Set false to keep sheet order
// ==================================================================

/**
 * Main entry point: pulls values from the sheet and applies them as
 * the choices for the target dropdown question on the form.
 */
function updateMemberDropdownOptions() {
  const options = getOptionsFromSheet_();

  if (options.length === 0) {
    throw new Error(
      'No values found in ' + TAB_NAME + '!' + COLUMN +
      ' — check SHEET_ID, TAB_NAME, COLUMN, and HAS_HEADER_ROW in the CONFIG section.'
    );
  }

  const form = FormApp.openById(FORM_ID);
  const item = findDropdownItem_(form, QUESTION_TITLE);
  item.asListItem().setChoiceValues(options);

  Logger.log(
    'Updated "' + QUESTION_TITLE + '" with ' + options.length + ' option(s): ' +
    options.join(', ')
  );
}

/**
 * Reads and cleans the list of values from the configured sheet/column.
 * - Skips the header row if HAS_HEADER_ROW is true
 * - Trims whitespace
 * - Drops blank cells
 * - Removes duplicates (case-sensitive)
 * - Sorts alphabetically if SORT_ALPHABETICALLY is true
 */
function getOptionsFromSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(TAB_NAME);
  if (!sheet) {
    throw new Error('No tab named "' + TAB_NAME + '" found in the spreadsheet.');
  }

  const lastRow = sheet.getLastRow();
  const startRow = HAS_HEADER_ROW ? 2 : 1;
  if (lastRow < startRow) return [];

  const colRange = sheet.getRange(COLUMN + startRow + ':' + COLUMN + lastRow);
  const values = colRange.getValues().map(function (row) { return String(row[0]).trim(); });

  const seen = {};
  const unique = [];
  values.forEach(function (v) {
    if (v && !seen[v]) {
      seen[v] = true;
      unique.push(v);
    }
  });

  if (SORT_ALPHABETICALLY) {
    unique.sort(function (a, b) { return a.localeCompare(b); });
  }

  return unique;
}

/**
 * Finds the dropdown (LIST-type) item on the given form matching the
 * given title. Throws a clear error if it's missing or isn't a dropdown.
 */
function findDropdownItem_(form, title) {
  const items = form.getItems();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.getTitle() === title) {
      if (item.getType() !== FormApp.ItemType.LIST) {
        throw new Error(
          'The question "' + title + '" was found, but it is a ' +
          item.getType() + ', not a dropdown (LIST) question.'
        );
      }
      return item;
    }
  }

  throw new Error(
    'No question titled "' + title + '" was found on this form (FORM_ID: ' + form.getId() + '). ' +
    'Check QUESTION_TITLE in the CONFIG section (it must match exactly, including case).'
  );
}