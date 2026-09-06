function test(){
  console.log(getRowsById("16vzNcLEr4skBhkN93HhLj3AHpJNZykkrj39XKosgU-k","e7f7410b-6620-4e3d-8264-e433b22eef0c"))
}


function doGet(e) {
  if (e.parameter.page === "appointments") {
    return HtmlService.createHtmlOutputFromFile("Appointments").setTitle("Schedule an Appointment")
  }
  if (e.parameter.page === "cancel") {
    return HtmlService.createHtmlOutputFromFile("Cancel").setTitle("Cancel Appointment")
  }

  // Get the 'name' parameter from the URL.
  // If the 'name' parameter is not provided, default to "World".
  var mode = e.parameter.mode || "notes";

  let response={status:"error", message:"Unrecognided Mode: " + mode}
  switch(mode){
    case "get-contacts":
      response=getContactsByLabel("Ward")
      break
    case "callings":
      response=getCallings()
      break
    case "config":
      response=getConfig()
      break
    case "flash":
      response={
        status:"success",
        data:getFalshcards( e.parameter.set)
      }
      break
    case "labels"://returns the contact labels for the executing user
      response={
        status:"success",
        data:listAllContactLabels()
      }
      break
    case "types":
      response=getTypes(e.parameter.token)
      break
    case "appointment-types":
      response={status:"success", data:getAppointmentTypes()}
      break
    case "appointment-slots":
      try{
        response={status:"success", data:getAvailableSlots(e.parameter.type)}
      }catch(err){
        response={status:"error", message:err.message}
      }
      break
    case "appointment-cancel-info":
      response=getAppointmentForCancel(e.parameter.id)
      break
  }
  // Create an HTML output with a personalized greeting.
  var output = ContentService.createTextOutput(JSON.stringify(response))

  // Return the HTML output to be displayed in the browser.
  return output;
}



function doPost(e) {
  const rawContents = e.postData.contents
  console.log("rawContents",rawContents)
  const contents = JSON.parse(rawContents)
  let mode = contents.mode
  console.log("mode",mode)
  let response=null

  try{
    if(mode==="notes"){
      const sheetId = contents.token
      response={status:"success", data:getRowsById(sheetId, contents.id)}
    }else if(mode==="importCallings"){
      response=importCallings(contents.callings)
    }else if(mode==="callinglist"){
      response=updateCallingList(contents.callings)
    }else if(mode==="contacts"){
      response=updateContacts(contents.contacts)
    }else if(mode==="update-contact2"){
      response=updateContact2(contents)
    }else if(mode==="make-new-contact"){
      response=makeNewContact(contents)

    }else if(mode==="move-member-out"){
      response=moveMemberOut(contents.resourceName)

    }else if(mode==="update-contact"){

      response=updateContact({
        moveDate:contents.moveDate,
        uuid:contents.uuid,
        image:contents.image,
      })

    }else if(mode==="echo"){
      //echo back the data object passed in.  Debugging only
      response=e
    }else if(mode==="update-local-ward-list"){
      response=makeLocalWardDirectory(contents.members)
    }else if(mode==="save-report"){
      response=saveReport(contents.title, contents.pages)
    }else if(mode==="book-appointment"){
      response=bookAppointment(contents)
    }else if(mode==="cancel-appointment"){
      response=cancelAppointment(contents.id)
    }else{
      response={error:"Mode Not Recognized",mode:mode, contents}
    }
  }catch(err){
    // Without this, an uncaught error (e.g. Google API quota exceeded) makes Apps Script return its
    // own error page instead of JSON, so the caller can't tell what happened or that it's retryable.
    console.error("doPost error for mode " + mode + ": " + err.message)
    response={status:"error", mode, message:err.message}
  }
  console.log("response", response)
  return ContentService.createTextOutput(JSON.stringify(response))
}

function getConfig(){
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  if(ss.getRangeByName("remoteconfig").getValue()==="Enabled"){
    const  config =  JSON.parse(ss.getRangeByName("configtoken").getValue())
    config.unitNumber = ss.getRangeByName("unitnumber").getValue()
    return config
  }
  return({status:"failure", message:"Data repository does not allow remote access to configuration schema."})

}



function getTypes(spreadsheetId){
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var sheet = spreadsheet.getSheetByName('Info Types');
  const types = []
  for( const row of sheet.getDataRange().getValues()){
    types.push(row[0])
  }
  return types

}

function getRowsById(spreadsheetId, targetValue) {
  var spreadsheet = SpreadsheetApp.openById(spreadsheetId)
  var sheet = spreadsheet.getSheetByName('Notes');

  var targetColumnIndex = 1; // Column B (index 1)

  var range = sheet.getDataRange();
  var values = range.getValues();

  var matchingRows = [];

  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    console.log(typeof row[targetColumnIndex] , targetValue)
    // Ensure the column exists and the value matches
    if (row[targetColumnIndex] !== undefined && row[targetColumnIndex] === targetValue) {
      matchingRows.unshift(row);
    }
  }

return matchingRows
}