/**
 * Batch updates multiple contacts using the People API.
 * @param {Object[]} updateData Array of objects containing resourceName and fields to update.
 */
function batchUpdateContacts() {
  // 1. Define the updates
  // Note: 'updatePersonFields' tells Google which fields to actually overwrite.
  const body = {
    "contacts": {
      "people/c3487213073911154734":{"names":[{"displayNameLastFirst":"Pincock, Jonathan","familyName":"Pincock","metadata":{"sourcePrimary":true,"source":{"type":"CONTACT","id":"306511d08e92882e"},"primary":true},"givenName":"Jonathan","unstructuredName":"Jonathan Pincock","displayName":"Jonathan Pincock"}],"etag":"%EggBAgkWLjc9PhoEAQIFByIMeHVteE12cWhUQUU9","emailAddresses":[{"formattedType":"personal","type":"personal","value":"jonbpincock@gmail.com","metadata":{"primary":true,"source":{"id":"306511d08e92882e","type":"CONTACT"}}}],"resourceName":"people/c3487213073911154734","memberships":[{"metadata":{"source":{"type":"CONTACT","id":"306511d08e92882e"}},"contactGroupMembership":{"contactGroupResourceName":"contactGroups/34b2e8cb8ff262df","contactGroupId":"34b2e8cb8ff262df"}},{"contactGroupMembership":{"contactGroupResourceName":"contactGroups/myContacts","contactGroupId":"myContacts"},"metadata":{"source":{"type":"CONTACT","id":"306511d08e92882e"}}}],"userDefined":[{"key":"legacyCmisId","metadata":{"source":{"type":"CONTACT","id":"306511d08e92882e"},"primary":true},"value":"20018685887"},{"metadata":{"source":{"type":"CONTACT","id":"306511d08e92882e"}},"value":"4f502172-fd88-4a48-883f-d388a7c56fa2","key":"uuid"}]},
      "people/c8479877932201416326":{"names":[{"displayName":"Macey Chidester","metadata":{"sourcePrimary":true,"primary":true,"source":{"type":"CONTACT","id":"75ae940d0f8a1686"}},"givenName":"Macey","familyName":"Chidester","displayNameLastFirst":"Chidester, Macey","unstructuredName":"Macey Chidester"}],"memberships":[{"contactGroupMembership":{"contactGroupId":"34b2e8cb8ff262df","contactGroupResourceName":"contactGroups/34b2e8cb8ff262df"},"metadata":{"source":{"id":"75ae940d0f8a1686","type":"CONTACT"}}},{"metadata":{"source":{"id":"75ae940d0f8a1686","type":"CONTACT"}},"contactGroupMembership":{"contactGroupResourceName":"contactGroups/myContacts","contactGroupId":"myContacts"}}],"userDefined":[{"key":"legacyCmisId","metadata":{"source":{"id":"75ae940d0f8a1686","type":"CONTACT"},"primary":true},"value":"8188542365"},{"key":"uuid","value":"ab492637-e2b9-4e66-ad9f-2904259cd9ae","metadata":{"source":{"id":"75ae940d0f8a1686","type":"CONTACT"}}}],"resourceName":"people/c8479877932201416326","emailAddresses":[{"metadata":{"primary":true,"source":{"id":"75ae940d0f8a1686","type":"CONTACT"}},"value":"Macey.chidester@yahoo.com","formattedType":"personal","type":"personal"}],"etag":"%EggBAgkWLjc9PhoEAQIFByIMZWdIT25nRHJDdU09"}
    },
    "updateMask": "names,emailAddresses,organizations"
  };

  try {
    // 2. Call the People API
    const response = People.People.batchUpdateContacts(body);
    
    console.log("Batch update successful!");
    console.log(JSON.stringify(response, null, 2));
  } catch (err) {
    console.error("Batch update failed: " + err.message);
  }
}
