
async function getMembers(){

const response=await fetch("https://lcr.churchofjesuschrist.org/mlt/records/member-list?lang=eng", {
  "headers": {
    "accept": "text/x-component",
    "accept-language": "en-US,en;q=0.9",
    "content-type": "text/plain;charset=UTF-8",
    "next-action": "60c06cfc1900d3f10ed9e37303d3fd9c1ddeba28e3",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Chromium\";v=\"148\", \"Google Chrome\";v=\"148\", \"Not/A)Brand\";v=\"99\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin"
  },
  "referrer": "https://lcr.churchofjesuschrist.org/",
  "body": "[\"$undefined\",\"eng\"]",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});

const data = await response.text();
let working = `{"members":[` + data.split(`{"members":[`)[1].split("\n")[0]    
return JSON.parse(working).members
}

function getMembers2(){
  // Extract column headers, skipping the checkbox th
  const tableEl = document.querySelector('table.eden-table-table');
  const toCamelCase = str => str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^(.)/, c => c.toLowerCase());

  const headers = Array.from(tableEl.querySelectorAll('thead th'))
    .slice(1)
    .map(th => {
      const directText = Array.from((th.querySelector('button')?.childNodes || th.childNodes))
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .find(t => t.length > 0);
      return toCamelCase(directText || th.textContent.trim());
    });

  return Array.from(tableEl.querySelectorAll('tbody tr')).map(row => {
    const cells = Array.from(row.querySelectorAll('td')).slice(1);
    const obj = { uuid: row.id };

    cells.forEach((cell, i) => {
      const key = headers[i];
      if (!key) return;

      const printable = cell.querySelector('[data-printable-text]');
      if (printable) { obj[key] = printable.getAttribute('data-printable-text'); return; }

      const nameBtn = cell.querySelector('button.member-card__styled-ghost');
      if (nameBtn) { obj[key] = nameBtn.textContent.trim(); return; }

      const link = cell.querySelector('a');
      if (link) { obj[key] = link.textContent.trim(); return; }

      const clonedHeader = cell.querySelector('.eden-table-card-view__cloned-column-header');
      const fullText = cell.textContent.trim();
      obj[key] = clonedHeader ? fullText.replace(clonedHeader.textContent.trim(), '').trim() : fullText;
    });

    const commaIdx = (obj.name || '').indexOf(',');
    if (commaIdx !== -1) {
      obj.lastName = obj.name.slice(0, commaIdx).trim();
      obj.firstName = obj.name.slice(commaIdx + 1).trim();
    } else {
      obj.lastName = obj.name || '';
      obj.firstName = '';
    }
    delete obj.name;

    return obj;
  });
}
async function updateContacts(){
window.config = {deploymentId:"AKfycbxunSd1qQemgfOs1hzmNUeaPmFIrWal6BJfhahUX_kzgtZaFyhIObftS_OnCWbyKaER"}
    // let url="https://lcr.churchofjesuschrist.org/mlt/records/member-list?lang=eng"
    // //let url="https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=" + window.config.unitNumber
    // console.log("url", url)
    // let response = await fetch(url);
    // const members = await response.text()
    const members = await getMembers()
    console.log("members",members)
    sessionStorage.setItem("members",JSON.stringify(members))

    
    const html=[startHTML("Updating Contacts")]
    html.push('<div id="log"></div>')
    html.push('<table id="progress" style="border-collapse: collapse;">')
    html.push(`<tr id="header"><th>id</th><th>First Name</th><th>Last Name</th><th>Email</th><th>Phone</th><th>address</th><th>birthdate</th><th>gender</th><th>Status</th></tr>`)
    for(const member of members){
        console.log("member",member)
        const name=member.nameFormats.listPreferredLocal.split(", ")
        html.push(`<tr id="m-${member.uuid}" ><td>${member.uuid}</td><td>${name[1]}</td><td>${name[0]}</td><td>${member.email}</td><td>${member.phone}</td><td>${member.address.formattedAddress.join("\n")}</td><td>${member.birthDateSort}</td><td>${member.sex}</td><td class="status">Pending</td></tr>`)
    }
    html.push("</table></body></html>")

    openNewTabWithHtml(html.join("\n"))
}

function openNewTabWithHtml(htmlString) {
  const newWindow = window.open('', '_blank');
  if (newWindow) {
    newWindow.document.write(htmlString);
    newWindow.document.close();
  } else {
    alert('Popup blocked! Please allow pop-ups for this site.');
  }
}

function startHTML(title){
    document.querySelector
    return `
  <!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <link rel="shortcut icon" href="https://www.churchofjesuschrist.org/services/platform/v4/resources/static/image/favicon.ico" />
    
    <script>
    function tag(id){return document.getElementById(id)}
    async function updateContacts(){
      console.log("updating contacts")
      while(true){
  
        log("Checking to see which contacts need to be added or updated.  This can take a few minutes if several ward members are not yet in your contacts")
        const payload= {
            mode:"contacts",
            contacts:JSON.parse(sessionStorage.getItem("members"))
        }
        console.log("payload",payload)
        const requestOptions = {
            method: "POST",
            body: JSON.stringify(payload),
            muteHttpExceptions: true,
            contentType: "application/json"
        };
        url="https://script.google.com/macros/s/${window.config.deploymentId}/exec"
        let data=null
        const response = await fetch(url, requestOptions);
        data = await response.json();
        
        if(data.membersAdded.length === 0){
            log("No contacts remain to add details.  Done updating contact.")
            return
        }else{    
            log("Completed initial contact check. Now updating contacts with details.")
           }
        console.log ("data",data)
        const rows= tag("progress").querySelectorAll("tr")
        for(let x=1;x<rows.length;x++){
          const row = rows[x]
          row.style.backgroundColor="#E0FACA"
          row.style.color="black"
          row.querySelector(".status").replaceChildren()
        }

        for(const uuid of data.membersAdded){
            const row = tag("m-"+uuid )
            console.log("uuid",uuid)
            if(row){
                row.style.backgroundColor="#faff6cff"
                row.querySelector(".status").innerHTML = "Queued"
                tag("header").after(row)
            }
        }

        // update all recently added contacts

        for(const uuid of data.membersAdded){
            log("Updating contact: " + uuid)

            // get person data
            let response=await fetch("https://lcr.churchofjesuschrist.org/mlt/records/member-profile/1d80ddd2-3ae3-4f0f-b5ee-b786637607a2", {
              "headers": {
                "next-action": "6044a1bce49bbc426c0f85916ab87508cf279e0349",
              },
              "body": "[\"1d80ddd2-3ae3-4f0f-b5ee-b786637607a2\",\"eng\"]",
              "method": "POST",
            });

            const data = await response.text();
            console.log(data)            


            const payload={
                mode:"update-contact",
                uuid,
                image: null
                }
                // no longer sending in the move date because the data is no longer readily available. It used to come as part of a json structure, but now it's embedded into JavaScript on HTML page.
                //moveDate: data[0].individual.moveDate,

            if(!data[1].image.tokenUrl.includes("nophoto")){
              payload.image = await imageToBase64(data[1].image.tokenUrl + "/MEDIUM")
              payload.image = payload.image.split(",")[1] // remove data:image/png;base64,
            }    
            console.log("payload",payload)
            const requestOptions = {
                method: "POST",
                body: JSON.stringify(payload),
                muteHttpExceptions: true,
                contentType: "application/json"
            };


            let row = tag("m-"+uuid )
            row.style.backgroundColor="darkgreen"
            row.style.color="white"
            row.querySelector(".status").innerHTML = "Updating"


            url="https://script.google.com/macros/s/${window.config.deploymentId}/exec"
           
            response = await fetch(url, requestOptions);
            data = await response.json();
            console.log("data",data)
            if(data.status==="success"){
                row = tag("m-"+uuid )
                row.style.backgroundColor="#004f79ff"
                row.querySelector(".status").innerHTML = "Completed"
            }
             


        }
      }      
    
    }

    async function imageToBase64(url) {
            // 1. Fetch the image
            const response = await fetch(url);
            
            // 2. Convert to Blob
            const blob = await response.blob();
            
            // 3. Use FileReader to convert to base64
            return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
            });
    }

    function log(text){
        const log=tag("log")
        log.id = "log"
        const newDiv = document.createElement("div");
        newDiv.className = "log-entry"
        newDiv.innerHTML = "<span class='time'>" + new Date().toLocaleTimeString() + "</span> " + text + "</div>"
        log.appendChild(newDiv);

    }
    </script>
    <style>
    table, th, td {
        border: 1px solid black;
        }
    .time{
        color:#eee;
        background-color:#444;
        padding: 5px 0;
    }    
    .log-entry{
        margin-top:2px
    }
    #log{
        margin: 0 1rem 1rem 1rem;
    }
  </style>
  </head>
  <body onload="updateContacts()">`
}

// async function junk(){
//     const response = await fetch("https://lcr.churchofjesuschrist.org/mlt/records/member-profile/40a692dc-a362-40b3-bcf9-ea26e50f8d4b?lang=eng")
//     const data = await response.text()
//     console.log("data", data)
// }
// junk()

updateContacts()
//console.log(getMembers())