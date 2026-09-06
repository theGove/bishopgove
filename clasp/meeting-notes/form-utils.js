function getFormUrl() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var formUrl = sheet.getFormUrl();
  
  if (formUrl) {
    Logger.log("Form URL: " + formUrl);
    SpreadsheetApp.getUi().alert("Form URL:\n" + formUrl);
  } else {
    SpreadsheetApp.getUi().alert("No form is linked to this spreadsheet.");
  }
}

function getFormFields(formUrl) {
  var html = UrlFetchApp.fetch(formUrl).getContentText();
  
  // Google Forms embeds field data as FB_PUBLIC_LOAD_DATA_
  var match = html.match(/FB_PUBLIC_LOAD_DATA_ = ([\s\S]*?);\s*<\/script>/);
  if (!match) return null;

  var data = JSON.parse(match[1]);
  var fields = data[1][1]; // Array of field definitions

  return fields.map(function(field) {
    return {
      label: field[1],
      entryId: "entry." + field[4][0][0]
    };
  });
}