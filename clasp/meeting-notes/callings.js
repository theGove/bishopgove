  //Provo 141st Ward Callings Sheet owned by bishopGove

const sheetId="1DCejp2goiXiHIi0XSPKzUu3gtUbZwtZptb4iU3NUQwg"

function callingsTest(){
  console.log(getCallings())
}

function importCallings(){

const data=[
    [
        "794369c2-3898-4bea-be7e-c3ad5d4b547b",
        "Bishop",
        "Priests Quorum President"
    ],
    [
        "4fbec858-1ea0-4e49-9924-6af2b746ab73",
        "Relief Society Assistant Secretary"
    ],
    [
        "c320f3e5-00a1-4973-9f7f-5749af37c404",
        "FHE Committee"
    ],
    [
        "467c8542-e136-433b-a3f1-4914d35d4573",
        "Ward Missionary - Greeter"
    ],
    [
        "7adb9aa1-dd74-4356-bacc-8378557b9203",
        "Ward Clerk"
    ],
    [
        "cada223c-d169-41b8-a434-05fa0a916264",
        "Temple Worker"
    ],
    [
        "f7c9c11e-751f-446d-a663-9b1f228e1227",
        "Sunday School First Counselor"
    ],
    [
        "beccdc32-8636-4b2a-bc33-8acf19e97b69",
        "Ward Assistant Clerk--Finance",
        "Ward Assistant Clerk--Membership"
    ],
    [
        "1013021a-1c76-43ca-934c-7ead04036b22",
        "Temple & Family History Committee"
    ],
    [
        "7e0713c3-8f8b-4522-b613-880ecc272b5c",
        "Ward Activities Committee"
    ],
    [
        "8e47b41e-a3b1-44df-a5d3-f7cc1241adde",
        "Temple & Family History Committee Leader",
        "Young Women President"
    ],
    [
        "eedfee9b-ca4f-4e32-be05-022c48513c0c",
        "FHE committee"
    ],
    [
        "94c7b81e-2428-4143-a2d9-9a75e9539aed",
        "Sacrament Coordinator"
    ],
    [
        "635c2172-6f18-451d-b9df-3bb0e27a210d",
        "Bishopric First Counselor"
    ],
    [
        "4f43cfe9-7007-414c-bae2-267b4dc90ff0",
        "Choir Director",
        "Munch and Mingle Leader"
    ],
    [
        "586f1a9c-8114-45f4-8b72-8e2de3195362",
        "Physical Facilities Representative"
    ],
    [
        "d9e67fa1-ac7b-4f98-9731-652b67be7a90",
        "Temple & Family History Committee",
        "Temple Worker"
    ],
    [
        "a3d65d74-6c23-4eac-9d32-2a4d01d93616",
        "Munch and Mingle",
        "Ward Choir Member",
        "Ward Chorister"
    ],
    [
        "5210ab13-c107-4301-8c59-c0654dd436b0",
        "Ward Activities Committee"
    ],
    [
        "ac6114fb-0fa0-4626-8046-2881b4aa997f",
        "Sunday School Second Counselor"
    ],
    [
        "d6ebf850-d013-4de2-9410-dfd4ed7e542c",
        "Ward Activities Committee"
    ],
    [
        "fc6245f9-7d34-4e7e-9b65-39a83c474224",
        "Temple Worker",
        "Ward Service Committee Leader"
    ],
    [
        "df2b1213-b90c-43fa-8f2e-c838a434d396",
        "Adult Sunday School"
    ],
    [
        "4f0eb8d2-de28-4be8-92a5-8819d976dcbc",
        "Ward Prayer Leader"
    ],
    [
        "97da1b48-6e1e-4f81-8286-ae5288d865d8",
        "Ward Assistant Executive Secretary"
    ],
    [
        "97fddd17-57f1-4881-9584-43caf148bf10",
        "Sacrament Coordinator",
        "Adult Sunday School"
    ],
    [
        "c89bd260-9f3c-4104-afb7-b491f21b7b2f",
        "Ward Executive Secretary"
    ],
    [
        "fb363935-90aa-4647-9350-ea949a7b84a6",
        "Relief Society Teacher"
    ],
    [
        "0141f095-43dc-48a3-b6ae-a8529ae33e49",
        "Accompanist",
        "Break The Fast Committee"
    ],
    [
        "42360503-3d59-4c53-ab39-c877d5ff7a1b",
        "Temple & Family History Committee"
    ],
    [
        "c000b5d4-5184-4002-85ed-6581b36c2cd3",
        "Ward Activities Committee"
    ],
    [
        "f8295173-3c87-46c2-a774-656d8eeedac7",
        "Break The Fast Committee"
    ],
    [
        "0e1760f7-7341-4f88-87b7-54997aa8ab07",
        "Temple Worker"
    ],
    [
        "f6125847-88d5-47b7-a792-f80a9848848c",
        "Relief Society Service Committee Member"
    ],
    [
        "23425c4c-15e8-4e26-bf6a-24f5349b471b",
        "Ward Prayer Leader"
    ],
    [
        "ffd40fe1-c681-4d81-ab72-a183028ab668",
        "Break the Fast Committee"
    ],
    [
        "a767927f-cb8d-4c31-ad5f-d6f6901ff65b",
        "Elders Quorum Teacher"
    ],
    [
        "80ab90f6-723f-4d90-a26f-b7a54c54e9d4",
        "Relief Society Teacher"
    ],
    [
        "35ca6574-086f-4d39-81c1-50fa32d2cfe2",
        "Relief Society First Counselor"
    ],
    [
        "a1b58c16-c72d-4a04-92ed-c8f1bc817d8b",
        "Ward Missionary"
    ],
    [
        "f0bd38db-acd2-4b8c-a2d8-3f2b628b7c62",
        "Relief Society Teacher"
    ],
    [
        "f1b18a2a-57e5-49fe-9665-41a93e91b1d0",
        "Ward Missionary"
    ],
    [
        "3b601f4b-41c3-49eb-8314-e076dcd2e746",
        "Relief Society Assistant Secretary",
        "Stake Relief Society Assistant Secretary"
    ],
    [
        "8f6c715c-67c7-407f-9afd-37f41b64515f",
        "Auditor",
        "Stake High Councilor",
        "Stake Temple and Family History Consultant"
    ],
    [
        "194237b7-2007-482f-9977-433540d32c98",
        "Relief Society Service Committee Member"
    ],
    [
        "9cb539e3-c150-49ca-b688-d494bc38199c",
        "Break The Fast Committee"
    ],
    [
        "61608e2d-5ef8-4884-80d3-83d07a411879",
        "Ward Missionary - Greeter"
    ],
    [
        "31d2b606-719a-47e9-9ea4-0d090bb4859e",
        "Munch and Mingle Leader"
    ],
    [
        "0aca4881-ca76-4979-9e55-fe46ac66e217",
        "Stake Relief Society President"
    ],
    [
        "4ca57d7b-956b-4151-ae85-602cdd6c9e28",
        "Stake Music Specialist",
        "Ward Organist"
    ],
    [
        "f6cda425-f552-4276-ad04-79717e925873",
        "Adult Sunday School"
    ],
    [
        "71c5365c-7255-4cc2-8ddc-5e23895c60aa",
        "Stake Organist",
        "Ward Choir Pianist"
    ],
    [
        "cb8ac6b6-4999-433f-9c65-6ac011dc6105",
        "Munch and Mingle"
    ],
    [
        "6dc680bc-a3b2-419e-b098-0363ea3df7a3",
        "Relief Society President"
    ],
    [
        "2e6991d8-882d-48e5-a6c1-c7ebfb12791f",
        "Temple & Family History Committee"
    ],
    [
        "03a636cf-ed07-4900-ae96-2e3727070317",
        "Adult Sunday School"
    ],
    [
        "9ba27e9e-6ff9-425b-ba6f-be11c63c1515",
        "FHE Leader"
    ],
    [
        "1fcad5b3-14cc-4044-bf63-5849ad7737ce",
        "Temple Worker"
    ],
    [
        "9f24719f-166e-4f93-85da-25a4d14fb13f",
        "Relief Society Service Committee Member"
    ],
    [
        "34915dad-0af3-425e-aca9-953852b44122",
        "Ward Activities Committee"
    ],
    [
        "d199b246-8fe4-43d3-91c3-5f23cb627f75",
        "Elders Quorum President",
        "Elders Quorum Teacher"
    ],
    [
        "669094f1-1b9f-4782-b102-eb879bfa5e87",
        "Relief Society Activity Coordinator"
    ],
    [
        "bbd1997a-ec1a-407b-b34a-18d930dc4f4c",
        "Break the Fast Committee"
    ],
    [
        "7d291542-1ee8-4ecb-b1ab-8d1a711007da",
        "Elders Quorum Service Committee Member"
    ],
    [
        "dd251e15-0e53-42d6-b006-f5594fc70653",
        "Relief Society Teacher"
    ],
    [
        "031702a2-aa21-453b-8f61-8f191d3af997",
        "Adult Sunday School"
    ],
    [
        "49dbf31d-400e-4b64-aa70-d567fd20b01a",
        "Adult Sunday School"
    ],
    [
        "8fd31e24-5186-47b5-a6d1-9e8e5af76792",
        "Ward Missionary"
    ],
    [
        "ac7c0641-e6b1-4a6c-89d1-b9bf166c6cbd",
        "Relief Society President",
        "Temple Worker"
    ],
    [
        "49143946-b414-448b-af16-18dcbad6f080",
        "Temple & Family History Committee"
    ],
    [
        "809b1c96-cabb-499e-8478-e365534135bd",
        "Ward Organist"
    ],
    [
        "1c109b0d-7507-4c7e-a88a-935757f3f452",
        "FHE Committee"
    ],
    [
        "eb71b455-d2ee-4f70-b34f-23055d584cb3",
        "Munch and Mingle"
    ],
    [
        "b1d7a28d-959c-4176-a713-ef5215c75176",
        "Munch & Mingle Committee"
    ],
    [
        "0fa38ff0-1cc3-4d79-962f-b0010a0cf03f",
        "Physical Facilities Representative"
    ],
    [
        "d8f14687-be42-4ae0-9d87-5cbab8fbfbd8",
        "Adult Sunday School"
    ],
    [
        "43d7d2df-be02-40d9-b13e-415cb7131d3e",
        "Elders Quorum President"
    ],
    [
        "ba463bdf-4d08-4577-b1db-b6eb24665c0c",
        "Temple Worker"
    ],
    [
        "837ee326-2ebb-4cef-a5d2-91815efeda38",
        "Relief Society Service Committee Member"
    ],
    [
        "28b029b1-80d0-4eed-9420-67a4219447b0",
        "Auditor",
        "Stake High Councilor",
        "Stake Music Coordinator"
    ],
    [
        "92a391a6-3b45-4eef-bcde-e5da622427f1",
        "Physical Facilities Representative"
    ],
    [
        "f8f18eae-6a78-4b0e-bcf1-60c5a1216048",
        "Elders Quorum Second Counselor"
    ],
    [
        "ffbfbec5-2f1a-45e8-94ae-6ecb2bfee7b4",
        "Relief Society Secretary"
    ],
    [
        "3fd400a3-bec8-40dd-8728-49ec210f0c41",
        "Ward Activites Committee Leader"
    ],
    [
        "147b2a5f-6437-4a5b-94f9-c869fc3c8e00",
        "Institute Representative"
    ],
    [
        "6ff9055b-d480-4469-b063-351e258674fc",
        "Relief Society Second Counselor"
    ],
    [
        "8d1bb79d-acf5-4b7c-812d-d9d412b0baf7",
        "Temple & Family History Committee"
    ],
    [
        "d383a306-b32a-4f96-8c27-dacd49154f46",
        "Munch and Mingle"
    ],
    [
        "ac6badf5-d13a-41e7-a8ec-8595e14ba3a3",
        "Relief Society Teacher",
        "Ward Choir Member"
    ],
    [
        "7d4e1f62-c855-497b-9292-8683fc912c32",
        "Temple & Family History Committee"
    ],
    [
        "2875cc91-1f6f-40c5-84a6-32f577d573d9",
        "Adult Sunday School"
    ],
    [
        "1187d5f8-fb32-4d85-ba7d-eb22176c6e58",
        "FHE Committee"
    ],
    [
        "bfe16e90-a9d8-402b-bca3-5860b29036d6",
        "Temple Worker",
        "Ward Missionary"
    ],
    [
        "2fd43d00-9f5d-44a0-adf2-c231a9bc206d",
        "Bishopric First Counselor"
    ],
    [
        "68f85305-402d-442c-987d-0c79ddcebaef",
        "Adult Sunday School"
    ],
    [
        "00af9d1c-c497-43cf-8485-fd5f28032748",
        "Relief Society Teacher"
    ],
    [
        "d1f1941a-0041-4efd-906f-898d69a050d3",
        "Elders Quorum First Counselor"
    ],
    [
        "d4de02ae-664e-4b67-9145-081ccfc47ccc",
        "Bishopric Second Counselor"
    ],
    [
        "90a5a765-7b05-4ddb-af01-cc4056ad1402",
        "Break The Fast Committee"
    ],
    [
        "734fea7a-783b-45e5-b4a7-39ed75e0bb75",
        "Break The Fast Leader"
    ],
    [
        "f2a79d54-a4cc-40ba-9f75-d650064fcce0",
        "Ward Missionary - Greeter"
    ],
    [
        "6f7ab0f9-1159-4a7e-8292-5f395ed3cbb9",
        "FHE committee"
    ],
    [
        "61d4ed72-f10b-4a36-ab70-3364ebcd096b",
        "Ward Activities Committee"
    ],
    [
        "0beb4709-03b2-4599-93af-aa5eafddf291",
        "Adult Sunday School"
    ],
    [
        "013bc454-2af7-480e-8877-2c42f51a83aa",
        "Sacrament Committee Leader"
    ],
    [
        "d6a32b58-6113-440d-9f09-eb5550d4c750",
        "Sunday School President"
    ],
    [
        "ee5ba605-3d6d-49d0-9d29-f75980ba61bf",
        "Relief Society First Counselor"
    ],
    [
        "b3736684-cf3b-468e-8e40-bffa9c7cffa6",
        "Ward Missionary"
    ],
    [
        "82062f11-c615-45d4-82ff-191cd58c2c61",
        "Relief Society Service Committee Member",
        "Adult Sunday School",
        "Temple Worker"
    ],
    [
        "b25d6bfc-2769-4a10-9b60-05e962a79673",
        "Sacrament Coordinator"
    ],
    [
        "da5497a4-7d48-4b22-b8d8-42aef5182c5a",
        "Ward Activities Committee Leader"
    ],
    [
        "b1cc948d-d3c3-4873-952f-ecbcbe80c3e0",
        "Temple Worker",
        "Ward Mission Leader"
    ],
    [
        "91e747e8-46b3-43c3-a8d6-48b0712a3683",
        "Relief Society Compassionate Service"
    ],
    [
        "ed8f47b1-bf40-4a34-99c0-eb5cc97fa5dd",
        "Elders Quorum Teacher",
        "Temple Worker"
    ],
    [
        "52135869-9938-4ee5-bb2d-dbfa8300b14d",
        "Break The Fast Committee"
    ],
    [
        "6b3e73d6-e02a-45a5-9780-f172fa635cfa",
        "Institute Representative"
    ],
    [
        "07927faf-1622-450b-aa0b-4428a2420efb",
        "Break The Fast Leader"
    ],
    [
        "d664fc4b-34c2-43d1-9e94-a4d3f275f50a",
        "Ward Missionary"
    ],
    [
        "00460856-09e7-497c-9df0-d40941af37b9",
        "Relief Society Second Counselor"
    ]
]

  const ss = SpreadsheetApp.openById("1hfmIAAvt0OXv_g2HgQLSuYz7N1RRdVEQ8ZiFX1fAqrU");
  const sheet = ss.getSheetByName("callings");  



 
    sheet.clear();
 
  if (!data || data.length === 0) {
    return sheet; // nothing to write — sheet is now just empty
  }
 
  const numCols = data.reduce(function (max, row) {
    return Math.max(max, row.length);
  }, 0);
 
  if (numCols === 0) {
    return sheet; // every row was empty — nothing to write
  }
 
  // Pad rows so the array is rectangular — setValues() requires every
  // row to have the same number of columns.
  const rectangularData = data.map(function (row) {
    if (row.length === numCols) return row;
    const padded = row.slice();
    while (padded.length < numCols) padded.push('');
    return padded;
  });
 
  sheet.getRange(1, 1, rectangularData.length, numCols).setValues(rectangularData);
 






}

function getCallings() {
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName("Callings");  
  const data = sheet.getDataRange().getValues()
  callings=[]
  for(let r=1;r<data.length;r++){
    const row = data[r]
    if((row[0]+row[1]+row[2]).length>0){
      callings.push({
        member:row[1],
        calling:row[2],
        called:row[4],
        sustained:row[3],
        setApart:row[6]
      })

    }
  }
  return (callings)
}

function updateCallingList(list) {
  //Provo 141st Ward Callings Sheet owned by bishopGove
  const spreadsheet = SpreadsheetApp.openById(sheetId);
  const sheet = spreadsheet.getSheetByName("lookups");  

  sheet.getRange(2, 2, sheet.getLastRow(), 1).clear()
  sheet.getRange(2, 2, list.length, 1).setValues(list.map(str => [str]))

  return {status:"success"};
  
}
