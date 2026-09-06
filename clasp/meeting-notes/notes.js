function test_notes() {
  console.log(getFormFieldInfo())
}
function getFormFieldInfo() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formUrl = ss.getFormUrl();
  
  if (!formUrl) {
    Logger.log("No form is associated with this spreadsheet.");
    return;
  }
  
  const form = FormApp.openByUrl(formUrl);
  const items = form.getItems();
  
  Logger.log(`Form: ${form.getTitle()}`);
  Logger.log(`Total fields: ${items.length}`);
  Logger.log("---");
  
  items.forEach((item, index) => {
    const info = {
      index: index + 1,
      id: item.getId(),
      title: item.getTitle(),
      type: item.getType().name(),
      helpText: item.getHelpText(),
      required: null,
      choices: null,
    };
    
    // Get type-specific details
    switch (item.getType()) {
      case FormApp.ItemType.MULTIPLE_CHOICE:
        const mc = item.asMultipleChoiceItem();
        info.required = mc.isRequired();
        info.choices = mc.getChoices().map(c => c.getValue());
        break;
      case FormApp.ItemType.CHECKBOX:
        const cb = item.asCheckboxItem();
        info.required = cb.isRequired();
        info.choices = cb.getChoices().map(c => c.getValue());
        break;
      case FormApp.ItemType.LIST:
        const li = item.asListItem();
        info.required = li.isRequired();
        info.choices = li.getChoices().map(c => c.getValue());
        break;
      case FormApp.ItemType.TEXT:
        info.required = item.asTextItem().isRequired();
        break;
      case FormApp.ItemType.PARAGRAPH_TEXT:
        info.required = item.asParagraphTextItem().isRequired();
        break;
      case FormApp.ItemType.SCALE:
        const sc = item.asScaleItem();
        info.required = sc.isRequired();
        info.choices = `${sc.getLowerBound()} to ${sc.getUpperBound()}`;
        break;
      case FormApp.ItemType.DATE:
        info.required = item.asDateItem().isRequired();
        break;
      case FormApp.ItemType.TIME:
        info.required = item.asTimeItem().isRequired();
        break;
      case FormApp.ItemType.DATETIME:
        info.required = item.asDateTimeItem().isRequired();
        break;
      case FormApp.ItemType.DURATION:
        info.required = item.asDurationItem().isRequired();
        break;
      case FormApp.ItemType.LINEAR_SCALE:
        const ls = item.asScaleItem();
        info.required = ls.isRequired();
        info.choices = `${ls.getLowerBound()} to ${ls.getUpperBound()}`;
        break;
      case FormApp.ItemType.GRID:
        const gr = item.asGridItem();
        info.required = gr.isRequired();
        info.choices = { rows: gr.getRows(), columns: gr.getColumns() };
        break;
      case FormApp.ItemType.CHECKBOX_GRID:
        const cg = item.asCheckboxGridItem();
        info.required = cg.isRequired();
        info.choices = { rows: cg.getRows(), columns: cg.getColumns() };
        break;
      // SECTION_HEADER and PAGE_BREAK have no required/choices
    }
    
    //Logger.log(JSON.stringify(info, null, 2));
  });
  
  return items.map(item => ({
    id: item.getId(),
    title: item.getTitle(),
    type: item.getType().name(),
  }));
}