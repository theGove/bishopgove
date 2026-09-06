function testFlashcards() {
  console.log(listAllContactLabels())
}

function getFalshcards(label="Flash Cards"){

  const contacts = getContactsByLabel(label)
  console.log(contacts)
  const cards=[]
  let cardNum = 1
  for(const contact of contacts){
    console.log("contact", contact)
    cards.push({
      id:cardNum++,
      name:contact.names[0].displayName,
      image:contact.photos[0].url + "0"
    })
  }
  return cards
}


function listAllContactLabels() {
  // 1. List all contact groups
  let response = People.ContactGroups.list();
  let contactGroups = response.contactGroups;

  if (!contactGroups || contactGroups.length === 0) {
    console.log('No contact groups found.');
    return;
  }

  console.log('Label Name | Contact Count');
  console.log('--------------------------');
  const data={}

  // 2. Loop through each group to get the member count
  contactGroups.forEach(group => {
    // We need to call .get() to get accurate memberCount in metadata
    let groupDetails = People.ContactGroups.get(group.resourceName, {
      groupFields: 'name,memberCount'
    });
    
    // 3. Log name and count
    console.log(`${groupDetails.name} | ${groupDetails.memberCount || 0}`);
    if(groupDetails.memberCount){
      data[groupDetails.name] =  groupDetails.memberCount
    }
  });

  return data
}
