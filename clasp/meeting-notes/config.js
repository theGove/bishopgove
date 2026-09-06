function initialSetup(){
  const form = FormApp.create("Meeting Notes Form")
  console.log(form.getPublishedUrl())
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  const wardName =  ss.getRangeByName("wardname").getValue()

  form.setDescription("Use this form to submit information to the Bishop of the " + wardName)
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  for(const sheet of ss.getSheets()){
    if(sheet.getName().startsWith("Form Responses")){
      sheet.setName("Notes")
      break
    }
  }

  ss.getSheets()[0].setName("Notes")
  const urlParts = form.getPublishedUrl().split("/")
  console.log("urlParts",urlParts)
  urlParts.pop()
  const config={
    formId:urlParts.pop(),
    token:ss.getId().toString(),
    fields:{}
  }

  

  let field = form.addTextItem().setTitle("LCR ID").setHelpText(`This is the record number of the member in LCR.  You probably don't know this, so just leave it blank".`)
  config.fields.memberId = getFieldUrlId(form,field)
  
  field = form.addTextItem().setTitle("Note Type").setHelpText(`This this kind of note you are submitting.  If the bishop has not given you specific instructions about what to enter here, just enter "Information.`)
  config.fields.noteType = getFieldUrlId(form,field)

  field = form.addTextItem().setTitle("Member Name").setHelpText(`This is the name of the member about whom you are submitting a note to the bishop.`)
  config.fields.memberName = getFieldUrlId(form,field)

  field = form.addParagraphTextItem().setTitle("Note").setHelpText(`This is the information you are conveying to the bishop about the member named above.`)
  config.fields.notes = getFieldUrlId(form,field)

  field = form.addDateItem().setTitle("Next Action Date").setHelpText("If you are recommending some action be taken, this is the date by which that action should be initiated.")
  config.fields.nextMeeting = getFieldUrlId(form,field, "date")
  
  field = form.addTextItem().setTitle("Submitted By").setHelpText(`This is your name.`)
  config.fields.submittedBy = getFieldUrlId(form,field)

  ss.getRangeByName("configToken").setValue(JSON.stringify(config))
  const folders = DriveApp.getFileById(ss.getId()).getParents()

  if(folders.hasNext()){
    const destinationFolder=folders.next()
    const formId = form.getId();
    const formFile = DriveApp.getFileById(formId);
    formFile.moveTo(destinationFolder);
  }

  ss.getRangeByName("remoteconfig").setValue("Enabled")
}
function getFieldUrlId(form, field, dataType="text"){
  
  if(dataType==="text"){
    return form.createResponse().withItemResponse(field.createResponse("text")).toPrefilledUrl().split("entry.")[1].split("=")[0]
  }else if(dataType==="date"){
    return form.createResponse().withItemResponse(field.createResponse(new Date('2025-12-25'))).toPrefilledUrl().split("entry.")[1].split("=")[0]
  }
  
}
function onOpen() {
  var ui = SpreadsheetApp.getUi()
  ui.createMenu('LCR')
      .addItem('Initial Configuration', 'initialSetup')
      .addToUi()
}