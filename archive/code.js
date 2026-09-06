// v3
async function showMenu(){
    const menu = document.createElement('div');
    menu.id="addInSubNav"
    menu.className="subnav"
    menu.style="position: fixed; z-index: 100; top: 0; left: 0; background-color:white; padding:1.5rem"
    menu.innerHTML = `
    <div style="display: flex;">
      <div class="subnav-single-column" onclick="closeMenu();return false">
        ${getAddInLinks()}
      </div>
    </div>`
    document.body.appendChild(menu);
    initializeMessageSystem();

}

function getAddInLinks(){
  const addIns = [
    { label:"Member Notes",
      test: ()=>{
        if(location.pathname==="/records/member-list"){
          return {status:"active",clickString:`enableNotes()`}
        }else{
          return {status:"inactive",clickString:`window.location.href = 'https://lcr.churchofjesuschrist.org/records/member-list'`}
        }
        
      }
    },
    { label:"Update Contacts",
      test: ()=>{
        if(location.hostname==="lcr.churchofjesuschrist.org"){
          return {status:"active",clickString:`updateContacts()`}
        }else{
          return {status:"inactive",clickString:`window.location.href = 'https://lcr.churchofjesuschrist.org/records/member-list'`}
        }
        
      }
    },
    { label:"Ward Organization",
      test: ()=>{
        if(location.pathname==="/"){
          return {status:"active",clickString:`startCallings()`}
        }else{
            return {status:"inactive",clickString:`window.location.href = 'https://lcr.churchofjesuschrist.org/'`}
        }
        
      }
    }
  ]
  const linkArrays={active:[],inactive:[]}
  for(const addIn of addIns){
    const testResult = addIn.test()
    linkArrays[testResult.status].push([`<a class="subnav-link" style="display:block" onclick="${testResult.clickString};return false">${addIn.label}</a>`])
  }
  const html=[`<div class="subnav-header">Active Tools</div>`]
  html.push('<div class="active">')
  for(const link of linkArrays.active){
    html.push(link)
  }
  html.push('</div><div class="subnav-header" style="margin-top:1rem">Inactive Tools</div><div class="inactive">')
  for(const link of linkArrays.inactive){
    html.push(link)
  }
  html.push('</div>')

  return html.join("\n")

  
}

function tag(id){
  return document.getElementById(id)
}
function closeMenu(){
  tag("addInSubNav").remove()
}




async function getNotes(id) {
    const url = `https://script.google.com/macros/s/${config.deploymentId}/exec`;
    const requestHeaders = new Headers();
    requestHeaders.append("Content-Type", "application/json");
    const payload = {
        id,
        token: window.config.token,
        mode: "notes"
    };
    const requestOptions = {
        method: "POST",
        body: JSON.stringify(payload),
        muteHttpExceptions: true,
        contentType: "application/json"
    };
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    return data;
}

async function enableNotes() {
    
    console.log("window.config", window.config)  

    //try {
        window.globals = {rows: 0};
        window.config.infoTypes=await getInfoTypes()
        addVanJs();
        listenOnMemberListChange();
        addNoteButtons();
        //addNoteBookIcon();
    // } catch (err) {
    //     const url = "https://lcr.churchofjesuschrist.org/records/member-list";
        
    //     if (!window.location.href.startsWith(url)) {
    //         alert("You must first log into LCR and open the Member Directory. Redirecting you now.");
    //         window.location.href = url;
    //     }
    // }
}


async function getInfoTypes(){
    const infoTypes = sessionStorage.getItem("infoTypes")
    if(infoTypes){
        return JSON.parse(infoTypes)
    }else{
        const url = `https://script.google.com/macros/s/${window.config.deploymentId}/exec?mode=types&token=${window.config.token}`;
        const response = await fetch(url);
        const data = await response.json();
        sessionStorage.setItem("infoTypes",JSON.stringify(data))
        return data;        
    }


}

function listenOnMemberListChange() {
    const targetNode = document.querySelector("table.eden-table-table").querySelector("tbody");
    const observer = new MutationObserver(function(mutationsList) {
        addNoteButtons();
    });
    observer.observe(targetNode, {
        childList: true
    })
}

function addNoteButtons() {
    const {
        th,
        td,
        div
    } = van.tags;
    if (!tag("pencil-image")) {
        // add the pencil in the header
        //const cell = document.querySelector("th.fn");
        const cell = document.querySelector("table.eden-table-table").querySelectorAll("th")[1]
        const newCell = th({
            id: "pencil-image"
        });
        newCell.innerHTML = atob("PGRpdiBzdHlsZT0id2lkdGg6MTVweCI+PHN2ZyB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgcm9sZT0icHJlc2VudGF0aW9uIiBjbGFzcz0ic2MtczhvcjVzLTAga3BnS2lUIj4gPHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMTYuMjU1IDUuNjQ5bC44OTMtLjg5NC4zNTQtLjM1M2EuMjQ0LjI0NCAwIDAgMSAuMzQ0LjAxbDEuNzY4IDEuNzY3YS4yNDQuMjQ0IDAgMCAxIC4wMS4zNDRMMTguMzc1IDcuNzdsLTIuMTItMi4xMjF6bS02LjU3IDEwLjgxM2MtLjI4Ny4yODYtLjg5OC42MzgtMS4yOTQuNzQ0bC0yLjQwMi44MDQuODMtMi4zNzZjLjEwNi0uMzk2LjQ1OC0xLjAwNy43NDQtMS4yOTRsNy42MzEtNy42MyAyLjEyMiAyLjEyLTcuNjMxIDcuNjMyek0yMC42NjIgNS4xMDVsLTEuNzY4LTEuNzY3YTEuNzU0IDEuNzU0IDAgMCAwLTIuNDguMDA1bC0xLjIzMiAxLjIzMi0xLjA2IDEuMDYtNy44NTIgNy44NTJjLS40ODEuNDgxLS45OTMgMS4zNC0xLjE4NiAxLjk5M2wtMS4wNSAzLjU1NmMtLjE3LjU3LjM2IDEuMS45My45M2wzLjU1NS0xLjA1Yy42NTMtLjE5NCAxLjUxMi0uNzA1IDEuOTk0LTEuMTg3bDcuODUtNy44NSAxLjA2MS0xLjA2MSAxLjIzMi0xLjIzMmMuNjg3LS42ODcuNjktMS43OTcuMDA2LTIuNDh6Ij4gPC9wYXRoPjwvc3ZnPjwvZGl2Pg==");
        cell.after(newCell);
    }
    for (const cell of document.querySelectorAll("td.fn")) {
        if (!cell.dataset.noteAdded) {
            cell.dataset.noteAdded = "true";
            const newCell = td({
                style: "cursor:pointer"
            });
            newCell.addEventListener("click", showNote);
            newCell.innerHTML = atob("PHN2ZyBjbGFzcz0ic2MtY0lXZ2h4IGdLdnFOViBzYy1lVXp6c3QganhpbmJWIiB2aWV3Qm94PSIwIDAgMjQgMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgcm9sZT0icHJlc2VudGF0aW9uIj4gPHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMTEuNDYyIDE2LjIyM2EuNzUuNzUgMCAwIDAgMS4wNzYgMGw1LjI1LTUuNGEuNzUuNzUgMCAwIDAtMS4wNzYtMS4wNDZsLTQuNzEgNC44NS00LjcxNC00Ljg1YS43NS43NSAwIDEgMC0xLjA3NiAxLjA0Nmw1LjI1IDUuNHoiPiA8L3BhdGg+PC9zdmc+");
            cell.after(newCell);
        }
    }
}
async function showNote(evt) {
    const {
        table,
        th,
        tr,
        td,
        div,
        textarea,
        button,
        input,
        select,
        option
    } = van.tags;



    const typeSelect = select({
            style: "margin-right:5px",
            id: "info-type",   
        }
    )
    for(const infoType of window.config.infoTypes){
        typeSelect.appendChild(option({value:infoType}, infoType))
    }


    let elem = evt.target;
    while (elem.tagName !== "TR") {
        elem = elem.parentElement
    }
    const colCount = elem.querySelectorAll("td").length;
    //console.log("next Row", elem.nextElementSibling)
    if (elem.nextElementSibling && elem.nextElementSibling.className === "notes") {
        // Note is showing, delete it
        elem.querySelector("svg").style.transform = "";
        elem.nextElementSibling.remove();
    } else {
        // No note showing, make it
        elem.querySelector("svg").style.transform = "rotate(180deg)";
        const memberLink = elem.querySelector("a");
        const id = memberLink.href.split("?")[0].split("/").pop();
        console.log("memberid", id)
        const memberName = memberLink.innerText;
        //console.log("memberName", memberName)
        row = tr({
            class: "notes"
        }, td({
            colspan: colCount
        }, div({
            id: "waiting"
        }, "Getting Data .")));
        elem.after(row);
        window.interval = setInterval(() => {
            if (tag("waiting")) {
                van.add(tag("waiting"), ".")
            } else {
                clearInterval(window.interval)
            }
        }, 800)
        
        const notes = await getNotes(id)
        console.log("notes", notes)
        const theTd = tag("waiting").parentNode
        if (notes.status !== "success") {
            theTd.replaceChildren("Getting Notes Failed")
            return
        }
        console.log("id --->", id, notes)
        const tab = table(tr(th("Date"),th("Type"), th("Notes"), th("Meet Next")))
        let rowsAdded = false
        for (const row of notes.data) {
            rowsAdded = true
            const r = tab.insertRow(-1)
            let c = r.insertCell(0)
            c.style.whiteSpace = "nowrap"
            let d = new Date(row[0])
            c.replaceChildren(formatDateToYYYYMMDD(d))
            c = r.insertCell(1)
            c.replaceChildren(row[2])
            c = r.insertCell(2)
            c.replaceChildren(row[4] + ` (${row[6]})`)
            c = r.insertCell(3)
            c.style.whiteSpace = "nowrap"
            if (row[5]) {
                d = new Date(row[5])
                c.replaceChildren(formatDateToYYYYMMDD(d))
            } else {
                c.replaceChildren("")
            }
        }
        if (rowsAdded) {
            theTd.replaceChildren(tab)
        } else {
            const r = tab.insertRow(-1)
            let c = r.insertCell(0)
            c.style.whiteSpace = "nowrap"
            c = r.insertCell(1)
            c.style.color = "#aaa"
            c = r.insertCell(2)
            c.replaceChildren("There is not yet a note for this member.")
            theTd.replaceChildren(tab)
        }
        theTd.appendChild(div({
            class: "new-note-container"
        }, textarea({
            placeholder: "Enter notes from a new meeting here.",
            class: "new-note",
            style: "width:100%;height:80px"
        }), div({
            style: "margin-top:3px"
        }, "Info Type: ", 
        typeSelect
        , "Next Meeting: ", input({
            style: "margin-right:5px",
            id: "next-meeting",
            type: "date"
        }), button({
            onclick: (event) => {
                let elem = event.target
                while (elem.className !== "new-note-container") {
                    elem = elem.parentElement
                }
                const txtArea = elem.querySelector("textarea")
                const note = txtArea.value
                const infoType = elem.querySelector("#info-type").value
                let mo = ""
                let dy = ""
                let yr = ""
                if (tag("next-meeting").value) {
                    const dateParts = tag("next-meeting").value.split("-")
                    yr = dateParts[0]
                    mo = dateParts[1]
                    dy = dateParts[2]
                }
                fetch(`https://docs.google.com/forms/u/0/d/e/${window.config.formId}/formResponse?entry.${window.config.fields.memberId}=${id}&entry.${window.config.fields.notes}=${encodeURI(note)}&entry.${window.config.fields.memberName}=${encodeURI(memberName)}&entry.${window.config.fields.nextMeeting}_year=${yr}&entry.${window.config.fields.nextMeeting}_month=${mo}&entry.${window.config.fields.nextMeeting}_day=${dy}&entry.${window.config.fields.submittedBy}=LCR%3A%20${encodeURIComponent(window.userContext.ldsAccountPreferredName)}&entry.${window.config.fields.noteType}=${encodeURI(tag("info-type").value)}`, {
                    mode: 'no-cors'
                })
                txtArea.placeholder = "The note has been saved.  You can enter another note here."
                txtArea.value = ""
                tag("next-meeting").value = ""
                elem = event.target
                while (elem.tagName !== "TR") {
                    console.log(elem)
                    elem = elem.parentElement
                }
                const table = elem.querySelector("table")
                console.log("table", table)
                const lastRow = table.rows[table.rows.length - 1]
                const cells = lastRow.cells
                let dateText = formatDateToYYYYMMDD(new Date)
                console.log("dateText", dateText)
                if (lastRow.cells[0].innerText === "") {
                    // first note, replace
                    lastRow.cells[0].innerText = dateText
                    lastRow.cells[1].innerHTML = infoType
                    lastRow.cells[2].innerHTML = note
                    lastRow.cells[2].style.color = ""
                    dateText = `${yr}-${mo}-${dy}`
                    if (dateText !== "--") {
                      lastRow.cells[3].innerHTML =dateText
                    }
                } else {
                    // add a new row to record the note
                    const r = table.insertRow(1)
                    let c = r.insertCell(0)
                    c.style.whiteSpace = "nowrap"
                    console.log("dateText2", dateText)
                    c.replaceChildren(dateText)
                    c = r.insertCell(1)
                    c.replaceChildren(infoType)
                    c = r.insertCell(2)
                    c.replaceChildren(note)
                    c = r.insertCell(3)
                    dateText = `${yr}-${mo}-${dy}`
                    if (dateText === "--") {
                        c.replaceChildren()
                    } else {
                        c.replaceChildren(dateText)
                    }
                }
            }
        }, "Save"))))
    }
}

function formatDateToYYYYMMDD(date) {
    if (date === "") {
        return ""
    }
    console.log("date", date)
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function showNotesInGoogleSheets() {
    window.open(`https://docs.google.com/spreadsheets/d/${window.config.token}/edit`, "_blank")
}

// function addNoteBookIcon() {
//     return
//     if (tag("notebook-icon")) {
//         return
//     }
//     const {
//         div
//     } = van.tags
//     const icon = div({
//         id: "notebook-icon,cursor:pointer"
//     })
//     icon.addEventListener("click", showNotesInGoogleSheets)
//     icon.innerHTML = atob("PHN2ZyB2aWV3Qm94PSIwIDAgMzAgMzAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgcm9sZT0iaW1nIiBjbGFzcz0ic2MtMXU5NWxkMi0wIGNKeVlCcSI+PHBhdGggZmlsbD0iY3VycmVudENvbG9yIiBkPSJNMTkgMkg1YTEgMSAwIDAgMC0xIDF2MThhMSAxIDAgMCAwIDEgMWgxNGExIDEgMCAwIDAgMS0xVjNhMSAxIDAgMCAwLTEtMXptLTQgMTguNUg1LjV2LTE3SDd2Ni4yN2MwIC4yOS4xOS4zOS40Mi4yNGwxLjgzLTEuMTVMMTEuMDggMTBjLjIzLjE1LjQyIDAgLjQyLS4yNFYzLjVIMTV6bTMuNSAwSDE3di0xN2gxLjV6Ij4gPC9wYXRoPjwvc3ZnPg==")
//     tag("member-list-form").appendChild(icon)
// }

function addVanJs() {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.text = atob("e2xldCBlLHQscixvLG4scyxsLGksZixoLHcsYSx1LGQsYyxfLFMsZyx5LGIsbSx2LGoseCxPO2w9T2JqZWN0LmdldFByb3RvdHlwZU9mLGY9e30saD1sKGk9e2lzQ29ubmVjdGVkOjF9KSx3PWwobCksYT0oZSx0LHIsbyk9PihlPz8obz9zZXRUaW1lb3V0KHIsbyk6cXVldWVNaWNyb3Rhc2sociksbmV3IFNldCkpLmFkZCh0KSx1PShlLHQsbyk9PntsZXQgbj1yO3I9dDt0cnl7cmV0dXJuIGUobyl9Y2F0Y2goZSl7cmV0dXJuIGNvbnNvbGUuZXJyb3IoZSksb31maW5hbGx5e3I9bn19LGQ9ZT0+ZS5maWx0ZXIoZT0+ZS50Py5pc0Nvbm5lY3RlZCksYz1lPT5uPWEobixlLCgpPT57Zm9yKGxldCBlIG9mIG4pZS5vPWQoZS5vKSxlLmw9ZChlLmwpO249c30sMWUzKSxfPXtnZXQgdmFsKCl7cmV0dXJuIHI/Lmk/LmFkZCh0aGlzKSx0aGlzLnJhd1ZhbH0sZ2V0IG9sZFZhbCgpe3JldHVybiByPy5pPy5hZGQodGhpcyksdGhpcy5ofSxzZXQgdmFsKG8pe3I/LnU/LmFkZCh0aGlzKSxvIT09dGhpcy5yYXdWYWwmJih0aGlzLnJhd1ZhbD1vLHRoaXMuby5sZW5ndGgrdGhpcy5sLmxlbmd0aD8odD8uYWRkKHRoaXMpLGU9YShlLHRoaXMseCkpOnRoaXMuaD1vKX19LFM9ZT0+KHtfX3Byb3RvX186XyxyYXdWYWw6ZSxoOmUsbzpbXSxsOltdfSksZz0oZSx0KT0+e2xldCByPXtpOm5ldyBTZXQsdTpuZXcgU2V0fSxuPXtmOmV9LHM9bztvPVtdO2xldCBsPXUoZSxyLHQpO2w9KGw/P2RvY3VtZW50KS5ub2RlVHlwZT9sOm5ldyBUZXh0KGwpO2ZvcihsZXQgZSBvZiByLmkpci51LmhhcyhlKXx8KGMoZSksZS5vLnB1c2gobikpO2ZvcihsZXQgZSBvZiBvKWUudD1sO3JldHVybiBvPXMsbi50PWx9LHk9KGUsdD1TKCkscik9PntsZXQgbj17aTpuZXcgU2V0LHU6bmV3IFNldH0scz17ZjplLHM6dH07cy50PXI/P28/LnB1c2gocyk/P2ksdC52YWw9dShlLG4sdC5yYXdWYWwpO2ZvcihsZXQgZSBvZiBuLmkpbi51LmhhcyhlKXx8KGMoZSksZS5sLnB1c2gocykpO3JldHVybiB0fSxiPShlLC4uLnQpPT57Zm9yKGxldCByIG9mIHQuZmxhdCgxLzApKXtsZXQgdD1sKHI/PzApLG89dD09PV8/ZygoKT0+ci52YWwpOnQ9PT13P2cocik6cjtvIT1zJiZlLmFwcGVuZChvKX1yZXR1cm4gZX0sbT0oZSx0LC4uLnIpPT57bGV0W3tpczpvLC4uLm59LC4uLmldPWwoclswXT8/MCk9PT1oP3I6W3t9LC4uLnJdLGE9ZT9kb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoZSx0LHtpczpvfSk6ZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0LHtpczpvfSk7Zm9yKGxldFtlLHJdb2YgT2JqZWN0LmVudHJpZXMobikpe2xldCBvPXQ9PnQ/T2JqZWN0LmdldE93blByb3BlcnR5RGVzY3JpcHRvcih0LGUpPz9vKGwodCkpOnMsbj10KyIsIitlLGk9ZltuXT8/PW8obChhKSk/LnNldD8/MCxoPWUuc3RhcnRzV2l0aCgib24iKT8odCxyKT0+e2xldCBvPWUuc2xpY2UoMik7YS5yZW1vdmVFdmVudExpc3RlbmVyKG8sciksYS5hZGRFdmVudExpc3RlbmVyKG8sdCl9Omk/aS5iaW5kKGEpOmEuc2V0QXR0cmlidXRlLmJpbmQoYSxlKSx1PWwocj8/MCk7ZS5zdGFydHNXaXRoKCJvbiIpfHx1PT09dyYmKHI9eShyKSx1PV8pLHU9PT1fP2coKCk9PihoKHIudmFsLHIuaCksYSkpOmgocil9cmV0dXJuIGIoYSxpKX0sdj1lPT4oe2dldDoodCxyKT0+bS5iaW5kKHMsZSxyKX0pLGo9KGUsdCk9PnQ/dCE9PWUmJmUucmVwbGFjZVdpdGgodCk6ZS5yZW1vdmUoKSx4PSgpPT57bGV0IHI9MCxvPVsuLi5lXS5maWx0ZXIoZT0+ZS5yYXdWYWwhPT1lLmgpO2Rve3Q9bmV3IFNldDtmb3IobGV0IGUgb2YgbmV3IFNldChvLmZsYXRNYXAoZT0+ZS5sPWQoZS5sKSkpKXkoZS5mLGUucyxlLnQpLGUudD1zfXdoaWxlKCsrcjwxMDAmJihvPVsuLi50XSkubGVuZ3RoKTtsZXQgbj1bLi4uZV0uZmlsdGVyKGU9PmUucmF3VmFsIT09ZS5oKTtlPXM7Zm9yKGxldCBlIG9mIG5ldyBTZXQobi5mbGF0TWFwKGU9PmUubz1kKGUubykpKSlqKGUudCxnKGUuZixlLnQpKSxlLnQ9cztmb3IobGV0IGUgb2YgbillLmg9ZS5yYXdWYWx9LE89e3RhZ3M6bmV3IFByb3h5KGU9Pm5ldyBQcm94eShtLHYoZSkpLHYoKSksaHlkcmF0ZTooZSx0KT0+aihlLGcodCxlKSksYWRkOmIsc3RhdGU6UyxkZXJpdmU6eX0sd2luZG93LnZhbj1PO30=")
    document.head.appendChild(script)
}

// warning, this file is coped into menu.js for ease of handling


async function showMenu(){
    const menu = document.createElement('div');
    menu.id="addInSubNav"
    menu.className="subnav"
    menu.style="position: fixed; z-index: 100; top: 0; left: 0; background-color:white; padding:1.5rem"
    menu.innerHTML = `
    <div style="display: flex;">
      <div class="subnav-single-column" onclick="closeMenu();return false">
        ${getAddInLinks()}
      </div>
    </div>`
    document.body.appendChild(menu);

}

function closeMenu(){
  tag("addInSubNav").remove()
}






function initializeMessageSystem(){
    if(!tag("canvas")){
        const newDiv = document.createElement("div");
        newDiv.style = "pointer-events:none; position:fixed; bottom:0; right:0;top:0; z-index:1000;width:400px;    display: flex;    flex-direction: column;    gap: 0;    overflow: hidden;"
        newDiv.id = "canvas"
        document.body.appendChild(newDiv);
    }    
}

function message(messageText, title, type, duration=0){
  if(!tag("canvas")){
    initializeMessageSystem();    
  }
  const canvas = tag("canvas");
  const boxDiv = document.createElement("div");
  const titleDiv = document.createElement("div");
  const messageDiv = document.createElement("div");
  const closeDiv = document.createElement("div");
  let titleColor = "darkgreen"
  switch(type){
    case "error": titleColor="darkred"; break;
    case "warning": titleColor="darkorange"; break;
    case "info": titleColor="darkblue"; break;
  }
  const id =  getId()
  boxDiv.id = id
  console.log("tag('" + id + "').style.height=0")
  boxDiv.style = "padding-top:10px;transition: all 0.5s ease-in-out; width:100%; pointer-events:auto;  overflow: hidden; ";
  titleDiv.style = `text-align:center; position:relative; background-color:${titleColor}; color:white; padding:5px 30px 5px 5px; border-radius:8px 8px 0 0;`
  messageDiv.style = ` background-color:#eee; color:#333; padding:10px; border-radius:0 0 8px 8px;border:2px solid ${titleColor}`
  closeDiv.style = `cursor:pointer;width:20px; padding:2px 0 0 0; position:absolute; top:0;right:5px;bottom:0`;
  closeDiv.onclick = ()=>{closeMessage(boxDiv)}
  
  boxDiv.addEventListener('transitionend', () => {
            boxDiv.remove();
        }, { once: true });
      


  closeDiv.innerHTML = `<svg id="closeIcon" fill="inherit" style="stroke:white;fill:white;width: 24px; height: 24px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.4 13.06l4.596 4.597a.749.749 0 101.06-1.06L12.461 12l4.596-4.596a.749.749 0 10-1.06-1.06L11.4 10.939 6.804 6.343a.749.749 0 10-1.06 1.06L10.339 12l-4.596 4.596a.749.749 0 101.06 1.06l4.597-4.595z"></path></svg>`

  titleDiv.textContent = title
  messageDiv.textContent = messageText
  titleDiv.appendChild(closeDiv);
  boxDiv.appendChild(titleDiv);
  boxDiv.appendChild(messageDiv);
  canvas.appendChild(boxDiv);
  boxDiv.style.height = boxDiv.clientHeight + "px"
  if(duration){
    setTimeout(() => {
        closeMessage(boxDiv);
    }, duration*1000);
  }
  return id
}
function closeMessage(elementOrId){
  let elem =  elementOrId
  if(typeof elem==="string"){elem = tag(elem)}
    elem.style.height = 0
    elem.style.opacity = 0
    elem.style.padding = 0

}

function getId(){
  return ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz').charAt(Math.floor(Math.random() * 52)) + Math.random().toString(26).substring(2)

}






























async function updateContacts(){
    let url="https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=" + window.config.unitNumber
    console.log("url", url)
    let response = await fetch(url);
    const members = await response.json()
    sessionStorage.setItem("members",JSON.stringify(members))

    
    const html=[startHTML2("Updating Contacts")]
    html.push('<div id="log"></div>')
    html.push('<table id="progress" style="border-collapse: collapse;">')
    html.push(`<tr id="header"><th>First Names</th><th>Last Name</th><th>Email</th><th>Phone</th><th>Status</th></tr>`)
    for(const member of members){
        console.log("member",member)
        html.push(`<tr id="m-${member.uuid}" data-legacycmsid="${member.legacyCmisId}"><td>${member.nameGivenPreferredLocal}</td><td>${member.nameFamilyPreferredLocal}</td><td>${member.email}</td><td>${member.phoneNumber}</td><td class="status">Pending</td></tr>`)
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

function startHTML2(title){
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
            const legacyCmsId = tag("m-"+uuid).dataset.legacycmsid
            const urls = [
              "https://lcr.churchofjesuschrist.org/api/photos/manage-photos/approved-image-individual/"+legacyCmsId+"?lang=eng"
            ]
            log("Updating contact: " + uuid)
            console.log("urls",urls) 
            let response = await Promise.all(urls.map(url => fetch(url)));
            let data = await Promise.all(response.map(res => res.json()));
            //data[1] = JSON.parse(data[1])
            //data[0] = data[0].split("<script>")
            data.unshift("place holder for data no longer easily accessible")
            console.log('All data fetched:', data);
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

// window.config={deploymentId : "AKfycbz9iOg8nxA7XPpl3TignYvEH0R7Yzgj-3eUIxSwv02lTDMGkt6eXVawsQ9dQB4Y3vZi"
//     , unitNumber:"124648"
// }
window.callingsInProgressIndex={}
window.memberNameIndex={}

window.callingNames = new Set()
window.membersWithCallings ={}
async function startCallings(){
    //console.log("at start")

    // get callings 
    let url="https://lcr.churchofjesuschrist.org/mlt/orgs"
    let response = null
    let rawData = null
    
    try{
      //console.log("url", url)
      response = await fetch(url);
      rawData = await response.text()
    }catch(e){
        alert("You must log into https://lcr.churchofjesuschrist.org/ to run this script.")
        return
    }
    
    //console.log("rawData",rawData.split("<script>"))

    // we have the HTML with the org data, now parse it 
    for(const entry of rawData.split("<script>")){
      const elem = entry.split("</script>")[0]
      if(elem.includes("Additional Aaronic Priesthood Quorums Callings")){
        //console.log("elem",elem)
        const pos = elem.indexOf(':[')
        const text = '"' + elem.slice(pos+2,-2) 
        //console.log(text)
        const jsonText = JSON.parse(text)
        //console.log(jsonText)
        const allData = JSON.parse("[" + jsonText)
        getOrganization(Object.values(allData[3].unitOrgsMap)[0].unitOrgs)
        break
      }
    }
}

function idify(inputString){
  return "id-" + inputString.replace(/[^\p{L}\p{N}]/gu, '-').toLowerCase()
}


async function getOrganization(orgData){
  //console.log("orgData",orgData)
  initializeMessageSystem()

  const callingsInProgress = await getCallingsInProgress()
  //console.log("callings in progress", callingsInProgress)
  window.members = await getMembers()
  console.log("window.members",window.members)


  console.log("window.members.length",window.members.length)

  for(let x=0;x<Object.keys(window.members).length;x++){
    console.log(x)
    const member = window.members[Object.keys(window.members)[x]]
    window.memberNameIndex[member.nameGivenPreferredLocal + " " + member.nameFamilyPreferredLocal]= window.members[Object.keys(window.members)[x]]
    window.memberNameIndex[displayName(member.nameFormats.listPreferredLocal)]=window.members[Object.keys(window.members)[x]]
  }
  console.log("window.memberNameIndex-->",window.memberNameIndex)
  
  for(let x=0;x<callingsInProgress.length;x++){
      const calling = callingsInProgress[x]
      if(!window.callingsInProgressIndex[calling.calling]){
          window.callingsInProgressIndex[calling.calling]=[]
      }
      if(calling.calling && calling.member){
        window.callingsInProgressIndex[calling.calling].push(calling)
      }
  }
  //console.log("callingsInProgressIndex", window.callingsInProgressIndex)
  
  
  for(let x=orgData.length-1;x>=0;x--){
      const org = orgData[x]
      //console.log("org",org.name)
      let newName = ""
      switch(org.name){
          case "Relief Society":
          case "Relief Society 1":
              newName="North Relief Society"
              break
          case "Relief Society 2":
              newName="South Relief Society"
              break
          case "Elders Quorum 1":
              newName="North Elders Quorum"
              break
          case "Elders Quorum 2":
              newName="South Elders Quorum"
              break              
          case "Aaronic Priesthood Quorums":
              orgData.splice(x,1)// remove aaronic priesthood quorums
              break
          case "Young Women":
              orgData.splice(x,1)// remove Young Women
              break
          case "Primary":
              orgData.splice(x,1)// remove Primary
              break
          case null:
              orgData.splice(x,1)// remove full time missionaries
              break
      }

      if(newName){  // rename EW and RS
          const oldName = orgData[x].name
          
          orgData[x] = JSON.parse(JSON.stringify(orgData[x])
              .split(oldName).join("[---name---]")
              .split("Elders Quorum").join("[---name---]")
              .split("Relief Society").join("[---name---]")
              .split("[---name---]").join(newName)
          )
      }
  }

  //Now, orgData has been adjusted to match the calling names from callings in progress
  //console.log(orgData)

  // get the unit name
  let unitName = "Ward"
  outerLoop:for(let x=orgData.length-1;x>=0;x--){
    const org = orgData[x]
    //console.log("org",org)
    if(org.childUnitOrgs && org.childUnitOrgs.length>0){
      for(const cuOrg of org.childUnitOrgs){
        for(const position of cuOrg.positions){
          if(position.person){
            unitName = position.person.currentUnitName
            break outerLoop
          }
        }
      }
    }
  }



  const html = []
  html.push(getMenu()) 
  html.push(`<div id="header" >${unitName} Organization</div>`) 


  for(const org of orgData){
        html.push(...buildOrganization(org)) 
      //break // the main content controller
  }

html.push('<details class="level-1"><summary class="level-1">Members Without Callings</summary><div class="directory" id="id-members-without-callings">')

  for(const memberName of Object.keys(window.members)){
    const member = window.members[memberName]
    if(!window.membersWithCallings[member.uuid]){
      const mem={
          calling:null,
          //org:org.nam,
          displayName:displayName(member.nameListPreferredLocal),
          phone:member.phoneNumber,
          email:member.email,
          memberId:member.uuid,
          address:member.formattedAddress
      }
      //console.log("member without calling",mem)
      html.push(makeCard(mem))
    }

  }
  html.push("</details>")



  
  //console.log("members without callings",membersWithCallings)



  html.push("</div>")

  setTimeout(async()=>{// record the current calling list in teh google sheet used to track new callings
      const payload= {
          mode:"callinglist",
          callings:[...callingNames]
      }
      //console.log("payload",payload)
      const requestOptions = {
          method: "POST",
          body: JSON.stringify(payload),
          muteHttpExceptions: true,
          contentType: "application/json"
      };
      url=`https://script.google.com/macros/s/${window.config.deploymentId}/exec`
      let data=null
      //console.log("url",url)
      const response = await fetch(url, requestOptions);
      //console.log(response)
      data = await response.text();
      //console.log("data",data)

  },1000)
  // //console.log(html)
  //console.log("window.membersWithCallings",window.membersWithCallings)
  // make list of members wihout callings




  openNewTabWithHtml(startHTML("Ward Organization") + html.join("\n")+"</body></html>")

    function getMenu(){
    const menu=`
    <div id="burger" onclick="showMenu()" style="cursor: pointer;">

<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="width: 35px; height: 35px;" id="hamburger-icon"><path d="M4 7.75c0-.414.334-.75.75-.75h14.5a.749.749 0 1 1 0 1.5H4.75A.748.748 0 0 1 4 7.75zm0 4c0-.414.334-.75.75-.75h14.5a.749.749 0 1 1 0 1.5H4.75a.748.748 0 0 1-.75-.75zm0 4c0-.414.334-.75.75-.75h14.5a.749.749 0 1 1 0 1.5H4.75a.748.748 0 0 1-.75-.75z" fill="currentColor"></path></svg>


    </div>
    <div id="menu" class="slide" style="left: -210px;">
        <div class="menu-item" onclick="showMenu(false)">
        <svg id="closeIcon" fill="inherit" style="width: 35px; height: 35px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M11.4 13.06l4.596 4.597a.749.749 0 101.06-1.06L12.461 12l4.596-4.596a.749.749 0 10-1.06-1.06L11.4 10.939 6.804 6.343a.749.749 0 10-1.06 1.06L10.339 12l-4.596 4.596a.749.749 0 101.06 1.06l4.597-4.595z"></path></svg>
        </div>

        <div class="menu-item" onclick="showVacant()">Show Vacant callings</div>
        <div class="menu-item" onclick="hideVacant()">Hide Vacant Callings</div>
        <div class="menu-item" onclick="showAllOrganizations()">Show All Organizations</div>
        <div class="menu-item" onclick="closeAllOrganizations()">Close All Organizations</div>
        <div class="menu-item" onclick="clearCache()">Clear Cached Data</div>
    </div>
    ` 


    return menu
}


    function buildOrganization(org, level = 1, html=[]){
      const indentStr = ' '.repeat((level-1)*2);
      //console.log("org", org, org.positions)
      //console.log(`${indentStr}- ${org.name}`);
      html.push(`<details class="level-${level}"><summary class="level-${level}">${org.name}</summary><div class="directory" id="${idify(org.name)}">`)
      if(org.positions && org.positions.length>0){
        for(const calling of org.positions){
          
            //console.log("calling",calling)
            const member={
                calling:calling.positionType.name,
                org:org.name,
                displayName:"Vacant",
                memberId:null
            }
            if(calling.person){
              const mem=window.memberNameIndex[displayName(calling.person.name)]
              //console.log("mem from lcr",mem)            
              member.displayName = displayName(calling.person.name)
              if(mem){
                member.phone = mem.phoneNumber
                member.email = mem.email
                member.memberId = mem.personUuid
                member.address = mem.formattedAddress
              }

            }
            //console.log("member-->",member)
            window.callingNames.add(member.calling)
            if(window.callingsInProgressIndex[member.calling]){
                console.log("---------------------------------------------")
                console.log("window.memberNameIndex",window.memberNameIndex)
                // add callings in progress
                for(const cip of window.callingsInProgressIndex[member.calling]){
                    //console.log(calling.positionType.name, cip)
                    const mem=window.memberNameIndex[cip.member]
                    console.log("mem",mem)
                    const member={
                        calling:calling.positionType.name,
                        org:org.nam,
                        displayName:cip.member,
                        phone:mem.phoneNumber,
                        email:mem.email,
                        memberId:mem.uuid,
                        called:cip.called,
                        sustained:cip.sustained,
                        setApart:cip.setApart,
                        address:mem.formattedAddress,
                        pending:true
                    }
                    html.push(makeCard(member))
                }

                delete window.callingsInProgressIndex[member.calling]
            }
            html.push(makeCard(member))
        }
      }
      html.push("</div>")
      if(org.childUnitOrgs && org.childUnitOrgs.length > 0){
          for(const child of org.childUnitOrgs){
              buildOrganization(child, level + 1, html);
          }
      }
      html.push("</details>")
      return html
    }
    
}
function displayName(memberName){
    if(memberName){
        const data = memberName.split(",")
        return data[1].trim() + " " + data[0].trim()
    }
    return "Vacant"
}

function makeCard(member){
window.membersWithCallings[member.memberId]=true
//console.log("makeCard(member)",member)
let backColor="white"
if(member.pending){
    backColor="lemonchiffon"
}
const card =[`
<div class="card" onclick="showMember(event)" id="${member.memberId}" style="background-color:${backColor};${member.calling?"":"height:250px;"}">
    <div class="photo">
        <img data-fetched="false" data-id="${member.memberId}" src="https://directory.churchofjesuschrist.org/api/v4/photos/members/${member.memberId}" onerror="getImage(this)">
    </div>
    <div class="calling-container"${member.calling?"":" style='display:none'"}>
      <div class="calling">
        ${member.calling}
      </div>  
    </div>  
    <div class="name-container">
      <div class="name ${member.displayName==='Vacant' ? 'vacant' : ''}">${member.displayName}</div>  
    </div>  
    <div class='data' style="display:none">`]
    card.push(``)

    if(member.phone){
        card.push(`<div class="data-label">Phone</div>`)
        card.push(`<div class="data-item">${member?.phone}</div>`)
    }
      
    if(member.email){
        card.push(`<div class="data-label">Email</div>`)
        card.push(`<div class="data-item">${member?.email}</div>`)
    }
    if(member.address){
        card.push(`<div class="data-label">Address</div>`)
        card.push(`<div class="data-item">${member.address}</div>`)
    }

    if(member.pending){
        card.push(`<div class="data-label">Called</div>`)
        card.push(`<div class="data-item">${member.called?"Yes":"No"}</div>`)
        card.push(`<div class="data-label">Sustained</div>`)
        card.push(`<div class="data-item">${member.sustained?member.sustained.split("T")[0]:"No"}</div>`)
        card.push(`<div class="data-label">Set Apart</div>`)
        card.push(`<div class="data-item">${member.setApart?"Yes":"No"}</div>`)
    }
    
    card.push("</div></div>")
return card.join("\n")   

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



async function getMembers(){
    let members=sessionStorage.getItem("members")

    if(members && !Array.isArray(members)){// we need this to be an object.  the contacts tool makes in an array
        members=JSON.parse(members)
    }else{
        const messageId = message("Getting Member Information","Data Request","info", 0) 
        url=`https://lcr.churchofjesuschrist.org/api/umlu/report/member-list?lang=eng&unitNumber=${window.config.unitNumber}`
        //console.log("url", url)
        response = await fetch(url);
        const rawMembers = await response.json()
        //console.log("rawMembers", rawMembers)
        members={}
        for(const member of rawMembers){
            members[member.nameGivenPreferredLocal + " " + member.nameFamilyPreferredLocal]=member
            }
        sessionStorage.setItem("members",JSON.stringify(members))
        closeMessage(messageId)
    }
    return members
}

async function getCallingsInProgress(){
    let callingsInProgress=sessionStorage.getItem("callingsInProgress")

    if(callingsInProgress){
        callingsInProgress=JSON.parse(callingsInProgress)
        return callingsInProgress
    }else{
        const messageId = message("Getting callings in progress","Data Request","info", 0) 
        let url = `https://script.google.com/macros/s/${window.config.deploymentId}/exec?mode=callings`
        //console.log("url",url)
        let response = await fetch(url); 
        const callingsInProgress = await response.json();
        //console.log("callingsInProgress",callingsInProgress)
        sessionStorage.setItem("callingsInProgress",JSON.stringify(callingsInProgress))
        closeMessage(messageId)
        return callingsInProgress
    }
}


async function addCallingsInProgress(){

    const members = await getMembers()
    const data = await getCallingsInProgress()


    for(let x=0;x<data.length;x++){
        data[x].memberDetails = members[data[x].member]
        const card = makeCard({
            memberId:data[x].memberDetails.legacyCmisId,
            calling:data[x].calling,
            displayName:data[x].member,
            phone:data[x].memberDetails.phoneNumber,
            email:data[x].memberDetails.email,
            address:data[x].memberDetails.formattedAddress,
        })
        //console.log("id",data[x].organization,idify(data[x].organization)) 
        //console.log(data[x])
        //console.log("id",data[x].calling,idify(data[x].calling)) 
        const cards=document.getElementById(idify(data[x].organization)).parentElement.querySelectorAll(".vacant")
        //console.log("vacant cards",cards)
        
        for(let x=0;x<cards.length;x++){
            const existingCard = cards[x]
            //console.log(data[x].calling, existingCard.querySelector("div.name").innerHTML.trim())
            //console.log("card")
        }

    }
    
    //console.log("data",data)
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
            //cache the image override urls
            if(sessionStorage.getItem("imageUrls")){
                window.imageUrls = JSON.parse(sessionStorage.getItem("imageUrls"))
            }else{
                const url="https://thegove.github.io/bishopgove/images"
                fetch(url).then(response => {
                    if (!response.ok) {
                    //console.log("url",url)
                    throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => { 
                    window.imageUrls = data
                    sessionStorage.setItem("imageUrls",JSON.stringify(data))
                })
                .catch(error => { 
                    console.error('There was a problem with the fetch operation:', error);
                });
            }

        function showAllOrganizations(){
        
          showMenu(false)
            // close all details with only vacancies
            for(const d of document.querySelectorAll("details")){
              if(d.querySelectorAll(".card").length!==d.querySelectorAll("#null").length){
                d.setAttribute("open","")
              }
            }
        }
        function closeAllOrganizations(){
          showMenu(false)
            // close all details with only vacancies
            for(const d of document.querySelectorAll("details")){
                d.removeAttribute("open")
            }
        }

        function getImage(img){

            console.log("getting Img", img)
            if (img.dataset.fetched==="true"){
                img.src="https://lcr.churchofjesuschrist.org/images/nophoto.svg"
              return
            }
            img.dataset.fetched = "true"
            if(img.dataset.id==="null"){
                //position is vacant
                img.src = "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEikeysIyiw4ep_voyPOg2hcS77IQodXQli5o4vqi-PFN1RBXConcvRmMCLHomlCIbQtxF6GoHlR7-TaaztLxXxb3u02Zeul6FMjkCvVbJvI-wjH_5HHEnazma_cQ8Hm9i4nJcmf0VK7MydU7GI1PqQTumnpiiBsyRYya-JWvKGe6X17c0s4fsTfwjBm2N8e/s1600/Copilot_20251108_134243.png"
            // }else if(window.imageUrls[img.dataset.id]){
            //   // this is an image that has an override url
            //     img.src = window.imageUrls[img.dataset.id]
            }else{
                //const url="https://lcr.churchofjesuschrist.org/api/photos/manage-photos/approved-image-individual/" + img.dataset.id + "?lang=eng"
                const url="https://directory.churchofjesuschrist.org/api/v4/photos/members/" + img.dataset.id + "?lang=eng"
                fetch(url) 
                .then(response => {
                    if (!response.ok) {
                    //console.log("url",url)
                    throw new Error('Network response was not ok: ' + response.statusText);
                    }
                    return response.json();
                })
                .then(data => { 
                    //console.log(data); 
                    if(data && data.image && data.image.tokenUrl){
                        img.src =data.image.tokenUrl + "/MEDIUM"
                    }
                })
                .catch(error => { 
                    console.error('There was a problem with the fetch operation:', error);
                });
            }

        }
        function showVacant(){
          showMenu(false)
          for(const card of document.querySelectorAll(".card")){
            card.style.display=""
          }

            for(const d of document.querySelectorAll("details")){
                    d.style.display=""
            }          
        }

        function hideVacant(){
          showMenu(false)
          for(const card of document.querySelectorAll(".card")){
            if(card.id==="null"){
            card.style.display="none"
            }
          }

          // now hide hide all details unless they have at least one card that is visible
            for(const d of document.querySelectorAll("details")){
                const visibleCards = d.querySelectorAll("div.card:not([style*='display: none'])").length
                //console.log("visibleCards",visibleCards)
                if(visibleCards===0){
                    d.style.display="none"
                }
            }
        }

        function showMember(evt){
        //console.log(evt)
          let card = evt.target
          while(card.className !== "card"){
            card = card.parentElement
          }

          if(evt.altKey || evt.ctrlKey){
            card.remove()          
          } 


          if (window.getSelection().toString().length === 0) {
            card.querySelector(".name").style.display=""
            const photo = card.querySelector(".photo")
            const data = card.querySelector(".data")
            if(data.style.display==="none"){
              photo.style.display="none"
              data.style.display=""
            }else{
              photo.style.display=""
              data.style.display="none"
            }  
          }
        }    

        function handleImageError(imgElement) {
          const container = imgElement.parentElement
          container.style.backgroundColor="#bbb"

          container.innerHTML = "<div class='no-image'><br><br><br><br>Image<br>not<br>Available</div>"
        }        
        function tag(id){return document.getElementById(id)}  

        function showMenu(show=true){
          if(show){
            tag("menu").style.left="0"
          }else{
            tag("menu").style.left="-210px"
          }
        }
        function clearCache(){
          showMenu(false)
          try{sessionStorage.removeItem('orgData')}catch(e){console.log(e)}
          try{sessionStorage.removeItem('callingsInProgress')}catch(e){console.log(e)}
          try{sessionStorage.removeItem('members')}catch(e){console.log(e)}
          try{sessionStorage.removeItem('881423b25094fd4fd6c503b545971be4_menu.js')}catch(e){console.log(e)}
          try{sessionStorage.removeItem('881423b25094fd4fd6c503b545971be4_callings.js')}catch(e){console.log(e)}
        }
      
    </script>
    <style>${getStyle()}
    </style>
  </head>
  <body>
  <div id="debug"/>
  `
}

function getStyle(){
    return`     
    body { 
      font-family: sans-serif; 
      margin: 0; 
      background-color: rgb(221, 221, 221);      
    }
    
      h1 { color: #333; }
      #header{
        font-size:30px;
        padding:20px;
        text-align:center;
      }
      details{
          margin:10px 0;
      }
      .directory{
        display: flex;
        flex-wrap: wrap;
        padding: 5px;
        gap: 5px;
        place-content: flex-start center;
        box-sizing: border-box;
      }
      details.level-1{
        margin-left:1rem;
        margin-top:1rem;

      }
      details.level-2{
        margin-left:1rem;
      }
      details.level-3{
        margin-left:3rem;
      }
      details.level-4{
        margin-left:4rem;
      }

      summary.level-1{
        font-size:36px;
      }
      summary.level-2{
        font-size:30px;
      }
      summary.level-3{
        font-size:24px;
      }
      summary.level-4{
        font-size:20px;
      }
      .card{
        height: 284px;
        margin: 2px;
        background-color: white;
        box-sizing: border-box;
        flex: 0 0 200px;
        border-radius: 8px;      
        text-align: center;
        cursor:pointer;
        overflow:auto
      }  
      .short-card{
        height: 250px;
        margin: 2px;
        background-color: white;
        box-sizing: border-box;
        flex: 0 0 200px;
        border-radius: 8px;      
        text-align: center;
        cursor:pointer;
        overflow:auto
      }  
      .photo{
        height: 200px; 
        overflow: hidden;
      }  
      .photo img{
        width: 200px;
        border-radius: 7px 7px 0 0;
      }    
      .name-container{
        display: table;      
        height:49px;
        width:100%;
      }  
      .calling-container{
        background-color:#333;
        color:#eee;
        font-size:14px;
        display: table;      
        height:35px;
        width:100%;
      }  
      .name, .calling{
        display: table-cell;
        vertical-align: middle;
        text-align:center;
      }  
      .data-label{
        margin-top:10px;
        font-weight:bold;
        font-size:12px;
      }  
      .data-item{
        color:#333;
        max-with:200px;
        font-size:12px;
      }  

        #burger{
        height:20px;
        padding: 5px;
        position: absolute;
        left: 0;
        top: 0;
        }
        #menu{
        color:#333;
        background-color:#eee;
        max-height:100vh;
        position:fixed;
        width: 200px;
        top: 0;
        padding: 5px;
        z-index:10;
        overflow:auto;
        }
        .selected{
        background-color:lightblue;
        color:darkblue;
        }
        .menu-item{
        cursor:pointer;
        color:#333;
        padding:6px 10px;
        }
        .menu-item:hover{
        background-color:lightblue;
        color:darkblue;
        }
        .menu-item a{
        text-decoration:none;
        color:#333;
        }
        .menu-item a:hover{
        }
        .slide {
        transition: .5s;
        left: 0;
        }
        .hang {
        text-indent: -1em;
        margin-left: 1em;
        }

` 
}

async function fetchAllUrls(urls) {
  try {
    // 1. Map URLs to an array of fetch Promises
    const requests = urls.map(url => fetch(url));

    // 2. Wait for all initial responses to be received
    const responses = await Promise.all(requests);

    // 3. Check if responses are OK and map to array of JSON Promises
    const jsonPromises = responses.map(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} for URL: ${response.url}`);
      }
      return response.json();
    });

    // 4. Wait for all JSON parsing to complete
    const data = await Promise.all(jsonPromises);

    // 5. "Do something" with the data
    //console.log("All data fetched and processed:", data);
    return data;

  } catch (error) {
    console.error("An error occurred during one of the fetches:", error);
    // You can handle errors here, e.g., display a message to the user
    throw error; // Re-throw if you want calling code to handle it
  }
}


