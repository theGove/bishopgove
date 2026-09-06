const TARGET_URL = 'https://lcr.churchofjesuschrist.org/mlt/records/member-list';
const CALLINGS_URL = 'https://lcr.churchofjesuschrist.org/mlt/report/member-callings?lang=eng';

// @feature:start stop-button
let stopRequested = false;

document.getElementById('btn-stop').addEventListener('click', () => {
  stopRequested = true;
  document.getElementById('btn-stop').style.display = 'none';
  showToast('Stopping after current member...', 3000);
});
// @feature:end stop-button

function showToast(message, durationMs = 3000) {
  const toast = document.getElementById('toast');
  clearTimeout(toast._timer);
  toast.className = '';
  void toast.offsetWidth;
  toast.innerHTML = message;
  toast.style.animationDuration = `0.2s, 0.4s`;
  toast.style.animationDelay = `0s, ${(durationMs - 400) / 1000}s`;
  toast.className = 'show';
  toast._timer = setTimeout(() => { toast.className = ''; }, durationMs);
  toast.onclick = () => { clearTimeout(toast._timer); toast.className = ''; };
}

function showLoadingToast(message) {
  const toast = document.getElementById('toast');
  clearTimeout(toast._timer);
  toast.className = '';
  void toast.offsetWidth;
  toast.innerHTML = `<div class="toast-spinner"></div><span>${message}</span>`;
  toast.className = 'loading';
  toast.onclick = null;
}

// Load saved settings
chrome.storage.sync.get('deploymentId', ({ deploymentId }) => {
  if (deploymentId) document.getElementById('input-deployment-id').value = deploymentId;
});

// @feature:start notes
chrome.storage.sync.get('notesMode', ({ notesMode }) => {
  document.getElementById('toggle-notes-mode').checked = !!notesMode;
});

document.getElementById('toggle-notes-mode').addEventListener('change', (e) => {
  chrome.storage.sync.set({ notesMode: e.target.checked });
});
// @feature:end notes

// Hamburger menu toggle
const dropdown = document.getElementById('dropdown');
document.getElementById('btn-menu').addEventListener('click', (e) => {
  e.stopPropagation();
  dropdown.classList.toggle('open');
});
document.addEventListener('click', () => dropdown.classList.remove('open'));

// @feature:start record-note
document.getElementById('btn-close-form').addEventListener('click', () => {
  document.getElementById('form-overlay').classList.remove('open');
  document.getElementById('note-form-frame').src = '';
});
// @feature:end record-note

// Menu: Settings
document.getElementById('btn-settings').addEventListener('click', () => {
  dropdown.classList.remove('open');
  const panel = document.getElementById('settings-panel');
  panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
  document.getElementById('settings-saved').textContent = '';
});

document.getElementById('btn-save-settings').addEventListener('click', () => {
  const deploymentId = document.getElementById('input-deployment-id').value.trim();
  chrome.storage.sync.set({ deploymentId }, () => {
    document.getElementById('settings-panel').style.display = 'none';
    showToast('Settings saved.', 2000);
  });
});

// @feature:start download-contacts
// Menu: Download Contacts
document.getElementById('btn-download-contacts').addEventListener('click', () => {
  dropdown.classList.remove('open');
  chrome.storage.sync.get('deploymentId', ({ deploymentId }) => {
    if (!deploymentId) {
      showToast('A Deployment ID is required. Click ☰ → Settings to set it.', 5000);
      return;
    }
    startDownload();
  });
});

function startDownload() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const go = (tabId) => {
      document.getElementById('message').textContent = 'Waiting for page to load...';
      waitForTableThenRun(tabId, downloadContacts);
    };
    if (tab.url === TARGET_URL) {
      go(tab.id);
    } else {
      document.getElementById('message').textContent = 'Navigating to member list...';
      chrome.tabs.update(tab.id, { url: TARGET_URL }, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            go(tab.id);
          }
        });
      });
    }
  });
}

function downloadContacts(results) {
  const result = results?.[0]?.result;
  if (!result || typeof result === 'string') {
    document.getElementById('message').textContent = result ?? '(no result)';
    return;
  }
  const members = result.members;
  const fields = ['firstName', 'lastName', 'phoneNumber', 'eMail', 'gender', 'birthDate', 'address', 'uuid'];
  const escape = v => `"${(v ?? '').toString().replace(/"/g, '""')}"`;
  const rows = [fields.join(',')];
  for (const m of members) {
    rows.push(fields.map(f => escape(m[f])).join(','));
  }
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts.csv';
  a.click();
  URL.revokeObjectURL(url);
  document.getElementById('message').textContent = `Downloaded ${members.length} contacts`;
}
// @feature:end download-contacts

// @feature:start get-contacts
let loadedContacts = [];

// Menu: Get Contacts
document.getElementById('btn-get-contacts').addEventListener('click', async () => {
  dropdown.classList.remove('open');
  showLoadingToast('Loading contacts...');
  loadedContacts = await getContacts();
  if (!loadedContacts) return;
  loadedContacts.sort((a, b) => {
    const an = a.names?.find(n => n.metadata?.primary) ?? a.names?.[0];
    const bn = b.names?.find(n => n.metadata?.primary) ?? b.names?.[0];
    const last = (an?.familyName ?? '').localeCompare(bn?.familyName ?? '');
    if (last !== 0) return last;
    return (an?.givenName ?? '').localeCompare(bn?.givenName ?? '');
  });
  renderContactCards(loadedContacts);
  showToast(`${loadedContacts.length} contacts loaded`, 4000);
});
// @feature:end get-contacts

async function getContacts() {
  const { deploymentId } = await chrome.storage.sync.get('deploymentId');
  if (!deploymentId) {
    showToast('A Deployment ID is required. Click ☰ → Settings to set it.', 5000);
    return null;
  }
  const response = await fetch(`https://script.google.com/macros/s/${deploymentId}/exec?mode=get-contacts`);
  return response.json();
}

// Menu: Full Update
document.getElementById('btn-full-update').addEventListener('click', () => {
  dropdown.classList.remove('open');
  startFullUpdate();
});

// @feature:start get-contacts
async function processContact(uuid) {
  const tile = document.getElementById(`m-${uuid}`);
  if (tile) {
    tile.style.backgroundColor = 'lightgreen';
    tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  const newTab = await chrome.tabs.create({
    url: `https://lcr.churchofjesuschrist.org/mlt/records/member-profile/${uuid}`,
    active: false,
  });
  const tabId = newTab.id;
  await new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === tabId && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
  await waitForPageIdle(tabId);

  const memberInfo = {
    resourceName: tile?.dataset.resourceName ?? null,
    etag: tile?.dataset.etag ?? null,
  };

  // Click the "Callings/Classes" link and wait for the page to update
  const [{ result: clicked }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const btn = document.getElementById('tab-callings-classes');
      if (btn) { btn.click(); return true; }
      return false;
    }
  });
  console.log('Callings/Classes link clicked:', clicked);
  if (clicked) {
    await waitForCondition(tabId, () => {
      const h2 = Array.from(document.querySelectorAll('h2'))
        .find(el => el.textContent.trim() === 'Class Assignments');
      if (!h2) return false;
      const container = h2.closest('div');
      if (!container) return false;
      return Array.from(container.querySelectorAll('th'))
        .some(th => th.innerText.trim() === 'Class');
    });
    console.log('Callings/Classes page settled');

    const [{ result: classes }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const table = Array.from(document.querySelectorAll('table'))
          .find(t => Array.from(t.querySelectorAll('th'))
            .some(th => th.innerText.trim() === 'Class'));
        if (!table) return null;
        const headers = Array.from(table.querySelectorAll('th'));
        const classIndex = headers.findIndex(th => th.innerText.trim() === 'Class');
        if (classIndex === -1) return null;
        return Array.from(table.querySelectorAll('tbody tr'))
          .map(row => row.querySelectorAll('td')[classIndex]?.innerText.trim())
          .filter(Boolean);
      }
    });
    const existingUserDefined = JSON.parse(decodeURIComponent(escape(atob(tile.dataset.userDefined))));
    console.log("existingUserDefined",existingUserDefined)
    console.log("classes",classes)
    if (classes?.length) memberInfo.labels = classes;
  }

  // Click the "Individual" tab and get the phone number
  await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const btn = document.getElementById('tab-individual');
      if (btn) btn.click();
    }
  });
  await waitForCondition(tabId, () => {
    return Array.from(document.querySelectorAll('label, dt, div'))
      .some(el => el.innerText?.trim() === 'Individual Phone');
  });
  const [{ result: individualData }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const getValue = (labelText) => {
        const label = Array.from(document.querySelectorAll('label, dt, div'))
          .find(el => el.innerText?.trim() === labelText);
        return label?.nextElementSibling?.innerText?.trim() ?? null;
      };
      return {
        phone:   getValue('Individual Phone'),
        email:   getValue('Individual E-mail'),
        address: getValue('Residential Address'),
      };
    }
  });
  const contact = loadedContacts.find(c =>
    c.userDefined?.find(d => d.key === 'uuid')?.value === uuid
  );
  const cardPhone   = contact?.phoneNumbers?.find(p => p.metadata?.primary)?.value ?? null;
  const cardEmail   = contact?.emailAddresses?.find(e => e.metadata?.primary)?.value ?? null;
  const cardAddress = contact?.addresses?.find(a => a.metadata?.primary)?.formattedValue ?? null;

  const digits = s => (s ?? '').replace(/\D/g, '');
  if (digits(individualData.phone) !== digits(cardPhone)) memberInfo.phone = individualData.phone;
  if (individualData.email   !== cardEmail)   memberInfo.email   = individualData.email;
  const normalize = s => (s ?? '').replace(/[\s\W]/g, '').replace(/US$/i, '');
  if (normalize(individualData.address) !== normalize(cardAddress)) memberInfo.address = individualData.address;

  // Get member photo from the profile page
  const [{ result: imageBase64 }] = await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      try {
        const h1 = document.querySelector('h1');
        if (!h1) return null;
        let el = h1.parentElement;
        let img = null;
        while (el) {
          img = el.querySelector('img');
          if (img) break;
          el = el.parentElement;
        }
        if (!img) return null;
        const res = await fetch(img.src);
        const blob = await res.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) { console.log('image error:', e.message); return null; }
    }
  });
  if (imageBase64) {
    const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
    const hashBuffer = await crypto.subtle.digest('SHA-256', bytes);
    memberInfo.imageHash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('');
    const storedHash = tile?.dataset.imageHash ?? 'none';
    if (memberInfo.imageHash !== storedHash) {
      memberInfo.image = imageBase64;
    }
  }

  // Compare memberInfo with the contact card data
  if (contact) {

    const cardPhotoUrl = contact.photos?.find(p => p.metadata?.source?.type === 'CONTACT' && !p.default)?.url ?? null;
    let cardImageBase64 = null;
    if (cardPhotoUrl) {
      const res = await fetch(cardPhotoUrl);
      const blob = await res.blob();
      cardImageBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result.split(',')[1]);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }

    const phoneMatch   = memberInfo.phone   === cardPhone;
    const emailMatch   = memberInfo.email   === cardEmail;
    const addressMatch = memberInfo.address === cardAddress;
    const imageMatch   = memberInfo.image   === cardImageBase64;

    if (phoneMatch && emailMatch && addressMatch && imageMatch) {
      console.log(`${uuid}: No need to update`);
    } else {
      if (!phoneMatch)   console.log(`${uuid} phone   — LCR: "${memberInfo.phone}"   | Contact: "${cardPhone}"`);
      if (!emailMatch)   console.log(`${uuid} email   — LCR: "${memberInfo.email}"   | Contact: "${cardEmail}"`);
      if (!addressMatch) console.log(`${uuid} address — LCR: "${normalize(individualData.address)}" | Contact: "${normalize(cardAddress)}"`);
      if (!imageMatch)   console.log(`${uuid} image   — differs (LCR: ${memberInfo.image?.length ?? 0} bytes | Contact: ${cardImageBase64?.length ?? 0} bytes)`);
    }
  }

  console.log('memberInfo:', memberInfo);

  const payload = { mode: 'update-contact2', ...memberInfo };
  console.log('update-contact2 payload:', payload);
  const appsScriptResult = await postToAppsScript(payload);
  console.log('update-contact2 response:', appsScriptResult);

  await chrome.tabs.remove(tabId);
  if (tile) tile.style.backgroundColor = 'lightblue';
}

function renderContactCards(contacts) {
  const grid = document.getElementById('members-grid');
  grid.innerHTML = '';
  document.getElementById('message').textContent = `${contacts.length} contacts`;

  for (const c of contacts) {
    const uuid = c.userDefined?.find(d => d.key === 'uuid')?.value;
    const tile = document.createElement('div');
    tile.className = 'member-tile';
    if (uuid) tile.id = `m-${uuid}`;
    if (c.etag) tile.dataset.etag = c.etag;
    if (c.resourceName) tile.dataset.resourceName = c.resourceName;
    tile.dataset.imageHash = c.userDefined?.find(d => d.key === 'imageHash')?.value ?? 'none';
    if (c.userDefined) tile.dataset.userDefined = btoa(unescape(encodeURIComponent(JSON.stringify(c.userDefined))));

    const primaryName = c.names?.find(n => n.metadata?.primary) ?? c.names?.[0];
    const displayName = primaryName?.displayName ?? '(no name)';

    const name = document.createElement('div');
    name.className = 'member-name';
    name.textContent = displayName;
    tile.appendChild(name);

    const primaryPhone = c.phoneNumbers?.find(p => p.metadata?.primary) ?? c.phoneNumbers?.[0];
    if (primaryPhone) {
      const phone = document.createElement('div');
      phone.className = 'member-detail';
      phone.textContent = `📞 ${primaryPhone.value}`;
      tile.appendChild(phone);
    }

    const primaryEmail = c.emailAddresses?.find(e => e.metadata?.primary) ?? c.emailAddresses?.[0];
    if (primaryEmail) {
      const email = document.createElement('div');
      email.className = 'member-detail';
      email.textContent = `✉ ${primaryEmail.value}`;
      tile.appendChild(email);
    }

    const primaryAddress = c.addresses?.find(a => a.metadata?.primary) ?? c.addresses?.[0];
    if (primaryAddress) {
      const address = document.createElement('div');
      address.className = 'member-detail';
      address.textContent = `📍 ${primaryAddress.formattedValue}`;
      tile.appendChild(address);
    }

    const contactPhoto = c.photos?.find(p => p.metadata?.source?.type === 'CONTACT' && !p.default);
    if (contactPhoto) {
      const img = document.createElement('img');
      img.src = contactPhoto.url;
      img.style.cssText = 'width:100%;border-radius:4px;margin-top:6px';
      tile.appendChild(img);
    }

    if (uuid) {
      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:6px;margin-top:8px;';

      const infoBtn = document.createElement('button');
      infoBtn.className = 'btn-member-info';
      infoBtn.textContent = 'Member Info';
      infoBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          chrome.tabs.update(tab.id, { url: `https://lcr.churchofjesuschrist.org/mlt/records/member-profile/${uuid}` });
        });
      });

      const updateBtn = document.createElement('button');
      updateBtn.className = 'btn-member-info';
      updateBtn.textContent = 'Update';
      updateBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        await processContact(uuid, tab.id);
      });

      btnRow.appendChild(infoBtn);
      btnRow.appendChild(updateBtn);
      tile.appendChild(btnRow);
    }

    grid.appendChild(tile);
  }
}
// @feature:end get-contacts

// @feature:start notes
async function fetchAndRenderNotes(memberId) {
  const { deploymentId } = await chrome.storage.sync.get('deploymentId');
  if (!deploymentId) { showToast('Deployment ID not set.', 4000); return; }
  showLoadingToast('Getting notes...');
  const response = await fetch(`https://script.google.com/macros/s/${deploymentId}/exec`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'notes', token: "16vzNcLEr4skBhkN93HhLj3AHpJNZykkrj39XKosgU-k", id: memberId })
  });
  const notes = await response.json();
  console.log('notes:', notes);
  const rows = notes.data ?? [];
  showToast(`${rows.length} notes loaded`, 3000);

  const grid = document.getElementById('members-grid');
  grid.innerHTML = '';
  for (const row of rows) {
    const entry = document.createElement('div');
    entry.className = 'member-tile';

    const dateEl = document.createElement('div');
    dateEl.className = 'member-name';
    dateEl.style.cssText = 'font-size:14px;color:#888;';
    const parsed = row[0] ? new Date(row[0]) : null;
    dateEl.textContent = parsed && !isNaN(parsed)
      ? parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : row[0] ?? '';
    entry.appendChild(dateEl);

    const noteEl = document.createElement('div');
    noteEl.className = 'member-detail';
    noteEl.style.cssText = 'margin-top:4px;font-size:24px;';
    noteEl.textContent = row[4] ?? '';
    entry.appendChild(noteEl);

    if (row[6]) {
      const sourceEl = document.createElement('div');
      sourceEl.className = 'member-detail';
      sourceEl.style.cssText = 'margin-top:4px;font-size:20px;color:#888;font-style:italic;text-align:right';
      sourceEl.textContent = row[6];
      entry.appendChild(sourceEl);
    }

    entry.style.cursor = 'pointer';
    entry.addEventListener('click', () => {
      const hidden = grid.dataset.hidden === 'true';
      grid.querySelectorAll('.member-tile').forEach(tile => {
        const bg = getComputedStyle(tile).backgroundColor;
        tile.querySelectorAll('div').forEach(el => {
          el.style.color = hidden ? '' : bg;
        });
      });
      grid.dataset.hidden = hidden ? 'false' : 'true';
    });

    grid.appendChild(entry);
  }
}

// Menu: Get Notes
document.getElementById('btn-get-notes').addEventListener('click', async () => {
  dropdown.classList.remove('open');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('/member-profile/')) {
    showToast('You must be on a member profile page to get notes.', 5000);
    return;
  }
  await fetchAndRenderNotes(tab.url.split('/').pop());
});

// Watch for tab navigation to a member profile and auto-load notes if Notes Mode is on
chrome.tabs.onUpdated.addListener((_tabId, info, tab) => {
  if (info.status !== 'complete') return;
  if (!tab.active) return;
  if (!tab.url?.includes('/member-profile/')) return;
  chrome.storage.sync.get('notesMode', ({ notesMode }) => {
    if (!notesMode) return;
    fetchAndRenderNotes(tab.url.split('/').pop());
  });
});
// @feature:end notes

// @feature:start record-note
// Menu: Record Note
document.getElementById('btn-record-note').addEventListener('click', async () => {
  dropdown.classList.remove('open');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab.url.includes('/member-profile/')) {
    showToast('You must be on a member profile page to record a note.', 5000);
    return;
  }
  const memberId = tab.url.split('/').pop();
  const [{ result: memberName }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => document.querySelector('h1')?.innerText.trim() ?? ''
  });
  const formUrl = `https://docs.google.com/forms/d/e/1FAIpQLSfR44r0pOTeFeKxgW32ukFWoxjK48l1LfA79OYEHb71ZecOig/viewform?usp=pp_url&entry.819867394=${encodeURIComponent(memberId)}&entry.1841079172=Interview&entry.1762260634=${encodeURIComponent(memberName)}&entry.177859810=LCR:+Bishop+Allen`;
  console.log('form url:', formUrl);
  const frame = document.getElementById('note-form-frame');
  frame.src = formUrl;
  frame.onload = () => frame.focus();
  document.getElementById('form-overlay').classList.add('open');
});
// @feature:end record-note

// @feature:start about
// Menu: About
document.getElementById('btn-about').addEventListener('click', () => {
  dropdown.classList.remove('open');
  document.getElementById('message').textContent = 'Flock pulls member data from lcr.churchofjesuschrist.org and syncs it to a Google Contacts account.';
});
// @feature:end about

// Menu: Add Photos to Table
document.getElementById('btn-add-photos').addEventListener('click', () => {
  dropdown.classList.remove('open');
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const GUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

        function findRowUuid(row) {
          const matches = [];
          for (const el of [row, ...row.querySelectorAll('*')]) {
            for (const attr of el.attributes) {
              const m = attr.value && attr.value.trim().match(GUID_RE);
              if (m) matches.push({ name: attr.name, uuid: m[0] });
            }
          }
          if (matches.length) {
            const preferred = matches.find(m => /member|person/i.test(m.name));
            return (preferred ?? matches[0]).uuid;
          }
          for (const el of row.querySelectorAll('*')) {
            const name = el.getAttribute('name') ?? '';
            if (!name.toLowerCase().includes('uuid')) continue;
            const val = el.value ?? el.textContent?.trim();
            const m = val && val.match(GUID_RE);
            if (m) return m[0];
          }
          return null;
        }

        for (const table of document.querySelectorAll('table')) {
          for (const row of table.querySelectorAll('tr')) {
            if (row.querySelector('td.flock-photo')) continue;

            const uuid = findRowUuid(row);
            if (!uuid) continue;

            const td = document.createElement('td');
            td.className = 'flock-photo';
            td.style.cssText = 'width:200px;padding:2px;vertical-align:middle;';
            const img = document.createElement('img');
            img.src = `https://directory.churchofjesuschrist.org/api/v4/photos/members/${uuid}?thumbnail=true`;
            img.style.cssText = 'width:200px;height:200px;object-fit:cover;';
            td.appendChild(img);
            row.insertBefore(td, row.firstChild);
          }
        }
      }
    });
  });
});

// Menu: Convert Table to Cards
document.getElementById('btn-table-to-cards').addEventListener('click', async () => {
  dropdown.classList.remove('open');
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  showLoadingToast('Reading tables...');
  const [{ result: pages }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
        const GUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

        function findUuid(row) {
          const matches = [];
          for (const el of [row, ...row.querySelectorAll('*')]) {
            for (const attr of el.attributes) {
              const m = attr.value && attr.value.trim().match(GUID_RE);
              if (m) matches.push({ name: attr.name, uuid: m[0] });
            }
          }
          if (matches.length) {
            const preferred = matches.find(m => /member|person/i.test(m.name));
            return (preferred ?? matches[0]).uuid;
          }
          for (const el of row.querySelectorAll('*')) {
            const name = el.getAttribute('name') ?? '';
            if (!name.toLowerCase().includes('uuid')) continue;
            const val = el.value ?? el.textContent?.trim();
            const m = val && val.match(GUID_RE);
            if (m) return m[0];
          }
          return null;
        }

        function headerText(th) {
          const direct = Array.from((th.querySelector('button')?.childNodes || th.childNodes))
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent.trim())
            .find(t => t.length > 0);
          return direct || th.textContent.trim();
        }

        function cellText(cell) {
          const printable = cell.querySelector('[data-printable-text]');
          if (printable) return printable.getAttribute('data-printable-text');
          const nameBtn = cell.querySelector('button.member-card__styled-ghost');
          if (nameBtn) return nameBtn.textContent.trim();
          const link = cell.querySelector('a');
          if (link) return link.textContent.trim();
          const clonedHeader = cell.querySelector('.eden-table-card-view__cloned-column-header');
          const fullText = cell.textContent.trim();
          return clonedHeader ? fullText.replace(clonedHeader.textContent.trim(), '').trim() : fullText;
        }

        function getTableTitle(table, index) {
          const panel = table.closest('[role="tabpanel"]');
          if (panel) {
            if (panel.dataset.label) return panel.dataset.label;
            const labelledBy = panel.getAttribute('aria-labelledby');
            const labelEl = labelledBy && document.getElementById(labelledBy);
            if (labelEl?.textContent.trim()) return labelEl.textContent.trim();
            if (panel.getAttribute('aria-label')) return panel.getAttribute('aria-label');
          }
          const caption = table.querySelector('caption');
          if (caption?.textContent.trim()) return caption.textContent.trim();
          let el = table;
          while (el) {
            let sib = el.previousElementSibling;
            while (sib) {
              const heading = /^H[1-6]$/.test(sib.tagName) ? sib : sib.querySelector('h1, h2, h3, h4, h5, h6');
              if (heading?.textContent.trim()) return heading.textContent.trim();
              sib = sib.previousElementSibling;
            }
            el = el.parentElement;
          }
          return `Table ${index + 1}`;
        }

        function isVisible(el) {
          while (el && el !== document.body) {
            if (el.hidden) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            el = el.parentElement;
          }
          return true;
        }

        const tables = Array.from(document.querySelectorAll('table')).filter(isVisible);
        const pages = [];

        tables.forEach((table, index) => {
          const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
          const headers = headerRow ? Array.from(headerRow.querySelectorAll('th, td')).map(headerText) : [];

          const cards = [];
          for (const row of table.querySelectorAll('tr')) {
            if (row.closest('thead') || row.closest('tfoot') || row === headerRow) continue;
            const cells = Array.from(row.querySelectorAll('td')).filter(td => !td.classList.contains('flock-photo'));
            if (!cells.length) continue;

            const uuid = findUuid(row);
            const fields = [];
            cells.forEach((cell, i) => {
              const label = (headers[i] ?? '').trim();
              const value = cellText(cell);
              if (label && value) fields.push({ label, value });
            });
            if (!fields.length) continue;

            const nameField = fields.find(f => /name/i.test(f.label)) ?? fields[0];
            cards.push({ uuid, name: nameField.value, fields });
          }

          if (!cards.length) return;

          pages.push({ title: getTableTitle(table, index), cards });
        });

        return pages;
      }
  });

  if (!pages?.length) {
    showToast('No table rows found to convert.', 4000);
    return;
  }

  showLoadingToast('Opening card page...');
  const cardTab = await chrome.tabs.create({ url: 'https://directory.churchofjesuschrist.org/', active: true });
  await new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === cardTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
  await chrome.scripting.executeScript({
    target: { tabId: cardTab.id },
    func: renderCardPage,
    args: [pages],
  });
  showToast(`Opened ${pages.length} table${pages.length === 1 ? '' : 's'} as cards.`, 3000);
});

// Menu: Import Callings
let importedCallings = [];

document.getElementById('btn-import-callings').addEventListener('click', () => {
  dropdown.classList.remove('open');
  startImportCallings();
});

function startImportCallings() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    const go = (tabId) => {
      showLoadingToast('Loading member callings...');
      waitForCallingsTableThenRun(tabId, handleCallingsResult);
    };
    if (tab.url === CALLINGS_URL) {
      go(tab.id);
    } else {
      document.getElementById('message').textContent = 'Navigating to member callings...';
      chrome.tabs.update(tab.id, { url: CALLINGS_URL }, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            go(tabId);
          }
        });
      });
    }
  });
}

function waitForCallingsTableThenRun(tabId, callback) {
  chrome.scripting.executeScript(
    { target: { tabId }, func: () => !!document.querySelector('table tbody tr') },
    (results) => {
      if (results?.[0]?.result) {
        chrome.scripting.executeScript({ target: { tabId }, func: getCallings }, callback);
      } else {
        setTimeout(() => waitForCallingsTableThenRun(tabId, callback), 500);
      }
    }
  );
}

function handleCallingsResult(results) {
  const result = results?.[0]?.result;
  if (!result || typeof result === 'string') {
    document.getElementById('message').textContent = result ?? '(no result)';
    return;
  }
  importedCallings = result;
  console.log('importedCallings:', importedCallings);
  document.getElementById('message').textContent = `Imported callings for ${result.length} members`;
  showToast(`Imported callings for ${result.length} members`, 4000);
}

// Menu: Save Report
document.getElementById('btn-save-report').addEventListener('click', () => {
  dropdown.classList.remove('open');
  chrome.storage.sync.get('deploymentId', ({ deploymentId }) => {
    if (!deploymentId) {
      showToast('A Deployment ID is required. Click ☰ → Settings to set it.', 5000);
      return;
    }
    saveCurrentReport();
  });
});

async function saveCurrentReport() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  showLoadingToast('Reading report...');
  const [{ result }] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: scrapeCurrentReport,
  });
  if (!result || typeof result === 'string') {
    showToast(result ?? 'Could not read a report on this page.', 5000);
    return;
  }
  const totalRows = result.pages.reduce((sum, p) => sum + p.rows.length, 0);
  const sheetCount = result.pages.length > 1 ? `${result.pages.length} sheets, ` : '';
  showLoadingToast(`Saving "${result.title}" (${sheetCount}${totalRows} rows)...`);
  const response = await postToAppsScript({
    mode: 'save-report',
    title: result.title,
    pages: result.pages,
  });
  if (response?.status === 'success') {
    showToast(`Saved <a href="${response.url}" target="_blank" style="color:#8ab4f8">${response.fileName}</a>`, 8000);
  } else {
    showToast(`Save failed: ${response?.message ?? 'unknown error'}`, 6000);
  }
}

// Injected into the currently displayed LCR report page (canned or custom). Returns
// { title, pages } where pages is [{ title, headers, rows }, ...] — one page per tab for a
// tabbed report (e.g. "Out-of-Unit Callings"), or a single page otherwise — or an error string.
// Reads the same eden-table markup that "Convert Table to Cards" and "Import Callings"
// already parse elsewhere in this file (data-printable-text / member-card buttons / cloned
// column headers) — kept as a separate, self-contained copy since chrome.scripting.executeScript
// injects this function body alone, with no access to the rest of this script's closures.
function scrapeCurrentReport() {
  try {
    function headerText(th) {
      const direct = Array.from((th.querySelector('button')?.childNodes || th.childNodes))
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .find(t => t.length > 0);
      return direct || th.textContent.trim();
    }

    function cellText(cell) {
      const printable = cell.querySelector('[data-printable-text]');
      if (printable) return printable.getAttribute('data-printable-text');
      const nameBtn = cell.querySelector('button.member-card__styled-ghost');
      if (nameBtn) return nameBtn.textContent.trim();
      const link = cell.querySelector('a');
      if (link) return link.textContent.trim();
      const clonedHeader = cell.querySelector('.eden-table-card-view__cloned-column-header');
      const fullText = cell.textContent.trim();
      return clonedHeader ? fullText.replace(clonedHeader.textContent.trim(), '').trim() : fullText;
    }

    function isVisible(el) {
      while (el && el !== document.body) {
        if (el.hidden) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        el = el.parentElement;
      }
      return true;
    }

    // Largest (by data rows) table among the given candidates — filters out things like
    // stray nested/utility tables sharing the same container as the real report table.
    function biggestTable(tables) {
      return tables.reduce((best, t) =>
        t.querySelectorAll('tbody tr').length > best.querySelectorAll('tbody tr').length ? t : best
      );
    }

    function scrapeTable(table) {
      const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
      const headers = headerRow ? Array.from(headerRow.querySelectorAll('th, td')).map(headerText) : [];
      if (!headers.length) return null;
      const rows = [];
      for (const row of table.querySelectorAll('tbody tr')) {
        const cells = Array.from(row.querySelectorAll('td'));
        if (!cells.length) continue;
        rows.push(headers.map((_, i) => cells[i] ? cellText(cells[i]) : ''));
      }
      return { headers, rows };
    }

    function tabLabel(panel, index) {
      if (panel.dataset.label) return panel.dataset.label;
      const labelledBy = panel.getAttribute('aria-labelledby');
      const labelEl = labelledBy && document.getElementById(labelledBy);
      if (labelEl?.textContent.trim()) return labelEl.textContent.trim();
      return panel.getAttribute('aria-label') || `Sheet ${index + 1}`;
    }

    // '.editable__title-text' is the custom-report title; canned reports fall back to
    // the page's <h1> (or finally document.title).
    const titleEl = document.querySelector('.editable__title-text') || document.querySelector('h1');
    const title = (titleEl?.textContent.trim() || document.title || 'Report').replace(/\s+/g, ' ');

    // Tabbed canned reports (e.g. "Out-of-Unit Callings") render one <table> per tab inside a
    // [role="tabpanel"], with every tab but the active one hidden — not removed — from the DOM,
    // so each tab's data is readable without having to click through them. Each tab becomes its
    // own sheet. Untabbed report pages only ever have one tabpanel (or none), so they fall
    // through to the single-table path below unchanged.
    const tabpanels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
    const pages = [];

    if (tabpanels.length > 1) {
      tabpanels.forEach((panel, i) => {
        const tables = Array.from(panel.querySelectorAll('table'));
        if (!tables.length) return;
        const scraped = scrapeTable(biggestTable(tables));
        if (scraped) pages.push({ title: tabLabel(panel, i), ...scraped });
      });
    }

    if (!pages.length) {
      const tables = Array.from(document.querySelectorAll('table')).filter(isVisible);
      if (!tables.length) return 'No report table found on this page.';
      const scraped = scrapeTable(biggestTable(tables));
      if (!scraped) return 'No report columns found on this page.';
      pages.push({ title, ...scraped });
    }

    if (!pages.some(p => p.rows.length)) return 'Report has no data rows.';

    return { title, pages };
  } catch (e) {
    return 'ERROR: ' + e.message;
  }
}

// Injected into the member-callings report page. Returns an array of arrays, each
// shaped [uuid, ...callings] — one entry per member, one calling per report row.
function getCallings() {
  try {
    const GUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

    function findRowUuid(row) {
      const matches = [];
      for (const el of [row, ...row.querySelectorAll('*')]) {
        for (const attr of el.attributes) {
          const m = attr.value && attr.value.trim().match(GUID_RE);
          if (m) matches.push({ name: attr.name, uuid: m[0] });
        }
      }
      if (matches.length) {
        const preferred = matches.find(m => /member|person/i.test(m.name));
        return (preferred ?? matches[0]).uuid;
      }
      for (const el of row.querySelectorAll('*')) {
        const name = el.getAttribute('name') ?? '';
        if (!name.toLowerCase().includes('uuid')) continue;
        const val = el.value ?? el.textContent?.trim();
        const m = val && val.match(GUID_RE);
        if (m) return m[0];
      }
      return null;
    }

    function headerText(th) {
      const direct = Array.from((th.querySelector('button')?.childNodes || th.childNodes))
        .filter(n => n.nodeType === Node.TEXT_NODE)
        .map(n => n.textContent.trim())
        .find(t => t.length > 0);
      return direct || th.textContent.trim();
    }

    function cellText(cell) {
      const printable = cell.querySelector('[data-printable-text]');
      if (printable) return printable.getAttribute('data-printable-text');
      const nameBtn = cell.querySelector('button.member-card__styled-ghost');
      if (nameBtn) return nameBtn.textContent.trim();
      const link = cell.querySelector('a');
      if (link) return link.textContent.trim();
      const clonedHeader = cell.querySelector('.eden-table-card-view__cloned-column-header');
      const fullText = cell.textContent.trim();
      return clonedHeader ? fullText.replace(clonedHeader.textContent.trim(), '').trim() : fullText;
    }

    function isVisible(el) {
      while (el && el !== document.body) {
        if (el.hidden) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        el = el.parentElement;
      }
      return true;
    }

    const table = Array.from(document.querySelectorAll('table'))
      .filter(isVisible)
      .find(t => Array.from(t.querySelectorAll('th')).some(th => /calling/i.test(headerText(th))));
    if (!table) return 'No callings table found.';

    const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
    const headers = headerRow ? Array.from(headerRow.querySelectorAll('th, td')).map(headerText) : [];
    const callingIndex = headers.findIndex(h => /calling|position/i.test(h));
    if (callingIndex === -1) return 'No Calling column found.';

    const byUuid = new Map();
    for (const row of table.querySelectorAll('tbody tr')) {
      const uuid = findRowUuid(row);
      if (!uuid) continue;

      const cells = Array.from(row.querySelectorAll('td'));
      const calling = cellText(cells[callingIndex]);
      if (!calling) continue;

      if (!byUuid.has(uuid)) byUuid.set(uuid, [uuid]);
      byUuid.get(uuid).push(calling);
    }

    return Array.from(byUuid.values());
  } catch (e) {
    return 'ERROR: ' + e.message;
  }
}

// Builds the card grid directly via DOM APIs and addEventListener, injected into a tab
// that's navigated to directory.churchofjesuschrist.org (so the photo <img> tags carry
// that origin's auth/referrer and load directly, no pre-fetching needed). Deliberately
// avoids an injected <script> tag or onclick="" attributes: those are inline script and
// get silently blocked by whatever CSP the page happens to send, which is what broke the
// card-flip interaction earlier. A function run via chrome.scripting.executeScript is not
// page script at all — it's exempt from the page's CSP the same way "Add Photos to Table"
// already reliably works on lcr.churchofjesuschrist.org's stricter CSP.
// `pages` is [{ title, cards }] — each table's cards are rendered as their own section,
// one after another, on this single tab.
function renderCardPage(pages) {
  document.title = pages.map(p => p.title).join(' / ') || 'Cards';
  document.head.innerHTML = '';
  document.body.innerHTML = '';

  const style = document.createElement('style');
  style.textContent = `
    body { font-family: sans-serif; margin: 0; background-color: #ddd; }
    .section-header { font-size: 24px; padding: 16px; text-align: center; }
    .directory { display: flex; flex-wrap: wrap; padding: 5px; gap: 5px; place-content: flex-start center; box-sizing: border-box; }
    .card { width: 200px; min-height: 250px; margin: 2px; background-color: white; box-sizing: border-box; border-radius: 8px; text-align: center; cursor: pointer; overflow: auto; }
    .photo { height: 200px; overflow: hidden; background-color: #bbb; display: flex; align-items: center; justify-content: center; }
    .photo img { width: 200px; border-radius: 7px 7px 0 0; }
    .no-image { color: #555; font-size: 13px; }
    .name-container { display: table; height: 49px; width: 100%; }
    .name { display: table-cell; vertical-align: middle; text-align: center; padding: 0 6px; }
    .data { padding: 6px; }
    .data-label { margin-top: 10px; font-weight: bold; font-size: 12px; }
    .data-item { color: #333; font-size: 12px; word-break: break-word; }
  `;
  document.head.appendChild(style);

  function showNoPhoto(photoEl) {
    photoEl.innerHTML = '';
    const noImage = document.createElement('div');
    noImage.className = 'no-image';
    noImage.innerHTML = 'No<br>Photo';
    photoEl.appendChild(noImage);
  }

  for (const page of pages) {
    const header = document.createElement('div');
    header.className = 'section-header';
    header.textContent = page.title;
    document.body.appendChild(header);

    const directory = document.createElement('div');
    directory.className = 'directory';
    document.body.appendChild(directory);

    function showMember(evt) {
      let card = evt.target;
      while (card && card.className !== 'card') card = card.parentElement;
      if (!card) return;
      if (evt.ctrlKey) { card.remove(); return; }
      if (evt.altKey) { directory.appendChild(card); return; }
      if (window.getSelection().toString().length) return;
      const photo = card.querySelector('.photo');
      const data = card.querySelector('.data');
      if (data.style.display === 'none') { photo.style.display = 'none'; data.style.display = ''; }
      else { photo.style.display = ''; data.style.display = 'none'; }
    }

    for (const c of page.cards) {
      const card = document.createElement('div');
      card.className = 'card';
      card.addEventListener('click', showMember);

      const photo = document.createElement('div');
      photo.className = 'photo';
      if (c.uuid) {
        const img = document.createElement('img');
        img.src = `https://directory.churchofjesuschrist.org/api/v4/photos/members/${c.uuid}?thumbnail=true`;
        img.addEventListener('error', () => showNoPhoto(photo));
        photo.appendChild(img);
      } else {
        showNoPhoto(photo);
      }
      card.appendChild(photo);

      const nameContainer = document.createElement('div');
      nameContainer.className = 'name-container';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = c.name;
      nameContainer.appendChild(name);
      card.appendChild(nameContainer);

      const data = document.createElement('div');
      data.className = 'data';
      data.style.display = 'none';
      for (const f of c.fields) {
        const label = document.createElement('div');
        label.className = 'data-label';
        label.textContent = f.label;
        const item = document.createElement('div');
        item.className = 'data-item';
        item.textContent = f.value;
        data.appendChild(label);
        data.appendChild(item);
      }
      card.appendChild(data);

      directory.appendChild(card);
    }
  }
}


// @feature:start update-contacts
// Menu: Update Contacts
document.getElementById('btn-contacts').addEventListener('click', () => {
  dropdown.classList.remove('open');
  chrome.storage.sync.get('deploymentId', ({ deploymentId }) => {
    if (!deploymentId) {
      showToast('A Deployment ID is required. Click ☰ → Settings to set it.', 5000);
      return;
    }
    startUpdate();
  });
});
// @feature:end update-contacts

async function startFullUpdate() {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
      await runFullUpdate(tabs[0]);
    } catch (err) {
      // Without this, an uncaught error (e.g. a non-retryable Apps Script failure) silently kills the
      // whole update mid-loop, leaving the pane looking stuck with no explanation.
      console.error('Full update failed:', err);
      showToast(`Full update failed: ${err.message}`, 8000);
    }
  });
}

async function runFullUpdate(tab) {
    if (tab.url !== TARGET_URL) {
      document.getElementById('message').textContent = 'Navigating to member list...';
      await new Promise(resolve => {
        chrome.tabs.update(tab.id, { url: TARGET_URL }, () => {
          chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
            if (tabId === tab.id && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve();
            }
          });
        });
      });
    }
    showLoadingToast('Loading members and contacts...');
    const [[{ result: membersResult }], contacts] = await Promise.all([
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: getMembers }),
      getContacts(),
    ]);
    if (typeof membersResult === 'string') {
      showToast(membersResult, 5000);
      return;
    }
    const members = membersResult?.members ?? [];
    console.log("members",members)
    showLoadingToast('Updating ward list in Google Sheets...');
    const { deploymentId } = await chrome.storage.sync.get('deploymentId');
    const wardListResponse = await fetch(`https://script.google.com/macros/s/${deploymentId}/exec`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'update-local-ward-list', members }),
    });
    const wardListResult = await wardListResponse.json();
    if (wardListResult?.status === 'success') {
      showToast(`${wardListResult.updated ?? members.length} members updated in Google Sheets.`, 5000);
    } else {
      showToast('Updating Google Sheets ward list failed.', 5000);
    }
    showLoadingToast(`Hashing photos for ${members.length} members...`);
    const dirTab = await chrome.tabs.create({ url: 'https://directory.churchofjesuschrist.org/', active: false });
    await new Promise(resolve => {
      chrome.tabs.onUpdated.addListener(function listener(id, info) {
        if (id === dirTab.id && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
    const [{ result: imageHashes }] = await chrome.scripting.executeScript({
      target: { tabId: dirTab.id },
      func: async (uuids) => {
        const results = {};
        await Promise.all(uuids.map(async uuid => {
          try {
            const res = await fetch(`https://directory.churchofjesuschrist.org/api/v4/photos/members/${uuid}?thumbnail=true`);
            if (!res.ok) { results[uuid] = { hash: null, imageLength: null }; return; }
            const buffer = await res.arrayBuffer();
            const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
            const hash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
            results[uuid] = { hash, imageLength: buffer.byteLength };
          } catch {
            results[uuid] = { hash: null, imageLength: null };
          }
        }));
        return results;
      },
      args: [members.map(m => m.uuid)],
    });
    await chrome.tabs.remove(dirTab.id);
    for (const m of members) {
      m.imageHash = imageHashes?.[m.uuid]?.hash ?? null;
      m.imageLength = imageHashes?.[m.uuid]?.imageLength ?? null;
    }
    showToast(`Got ${members.length} members, ${contacts?.length ?? 0} contacts.`, 5000);
    const memberObj = Object.fromEntries(members.map(m => [m.uuid, m]));
    const contactObj = Object.fromEntries(
      (contacts ?? [])
        .map(c => [c.userDefined?.find(d => d.key === 'uuid')?.value, c])
        .filter(([uuid]) => uuid)
    );
    const allUuids = new Set([...Object.keys(memberObj), ...Object.keys(contactObj)]);
    const masterObj = Object.fromEntries(
      [...allUuids].map(uuid => [uuid, { member: memberObj[uuid] ?? null, contact: contactObj[uuid] ?? null }])
    );



    const grid = document.getElementById('members-grid');
    grid.innerHTML = '';
    document.getElementById('message').textContent = `${Object.keys(masterObj).length} records`;
    for (const [uuid, { member, contact }] of Object.entries(masterObj)) {
      const tile = document.createElement('div');
      tile.className = 'member-tile';
      tile.id = `m-${uuid}`;

      const name = document.createElement('div');
      name.className = 'member-name';
      if (member) {
        name.textContent = `${member.firstName} ${member.lastName}`.trim();
      } else {
        const primaryName = contact.names?.find(n => n.metadata?.primary) ?? contact.names?.[0];
        name.textContent = primaryName?.displayName ?? '(no name)';
      }
      tile.appendChild(name);

      const img = document.createElement('img');
      img.style.cssText = 'width:100%;border-radius:4px;margin-top:6px';
      if (member) {
        img.src = `https://directory.churchofjesuschrist.org/api/v4/photos/members/${uuid}?thumbnail=true`;
      } else {
        const contactPhoto = contact.photos?.find(p => p.metadata?.source?.type === 'CONTACT' && !p.default);
        if (contactPhoto) img.src = contactPhoto.url;
      }
      if (img.src) tile.appendChild(img);

      grid.appendChild(tile);
    }

    // Process members moving in before members moving out, so quota is spent on adds first.
    const masterEntries = Object.entries(masterObj);
    const orderedEntries = [
      ...masterEntries.filter(([, { member }]) => member),
      ...masterEntries.filter(([, { member, contact }]) => !member && contact),
    ];
    for (const [uuid, { member, contact }] of orderedEntries) {
      const tile = document.getElementById(`m-${uuid}`);
      if (tile) {
        tile.style.backgroundColor = 'lightgreen';
        tile.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }

      if (member && !contact){
        await addNewContact(member)
      }else if(!member && contact){
        await moveMemberOut(contact)
      }else{
        const contactPhone   = contact.phoneNumbers?.find(p => p.metadata?.primary)?.value ?? null;
        const contactEmail   = contact.emailAddresses?.find(e => e.metadata?.primary)?.value ?? null;
        const contactAddress = contact.addresses?.find(a => a.metadata?.primary)?.formattedValue ?? null;
        const contactImageHash = getImageHash(contact);

        const digits    = s => (s ?? '').replace(/\D/g, '');
        const normalize = s => (s ?? '').replace(/[\s\W]/g, '').replace(/US$/i, '');

        const payload = { mode: 'update-contact2', resourceName: contact.resourceName };
        if (digits(member.phoneNumber) !== digits(contactPhone))       payload.phone    = member.phoneNumber;
        if (member.eMail !== contactEmail)                             payload.email    = member.eMail;
        if (normalize(member.address) !== normalize(contactAddress))   payload.address  = member.address;

        if (member.imageHash !== contactImageHash) {
          payload.imageHash = member.imageHash;
          if (member.imageHash && member.imageLength > 0) {
            const dirTab = await chrome.tabs.create({ url: 'https://directory.churchofjesuschrist.org/', active: false });
            await new Promise(resolve => {
              chrome.tabs.onUpdated.addListener(function listener(id, info) {
                if (id === dirTab.id && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  resolve();
                }
              });
            });
            const [{ result: imageBase64 }] = await chrome.scripting.executeScript({
              target: { tabId: dirTab.id },
              func: async (uuid) => {
                try {
                  const res = await fetch(`https://directory.churchofjesuschrist.org/api/v4/photos/members/${uuid}`);
                  if (!res.ok) return null;
                  const blob = await res.blob();
                  return await new Promise(resolve => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror  = () => resolve(null);
                    reader.readAsDataURL(blob);
                  });
                } catch { return null; }
              },
              args: [uuid],
            });
            await chrome.tabs.remove(dirTab.id);
            if (imageBase64) payload.image = imageBase64.split(',')[1];
          }
        }

        const hasUpdates = Object.keys(payload).length > 2;
        if (hasUpdates) {
          console.log("updating",member, payload)
          const result = await postToAppsScript(payload);
          console.log('update-contact2 response', result);
        }




      }
      if (tile) tile.style.backgroundColor = 'lightblue';
    }
  function getImageHash(contact){
    if(contact.userDefined){
      for(const prop of contact.userDefined){
        if(prop.key==="imageHash"){return prop.value}
      }
    }
    return null
  }
}




// Google's Contacts/People API quota (used behind the Apps Script endpoint) is easy to exceed
// when adding/removing/updating many contacts in a row. Retry quota errors with backoff instead
// of failing the whole sync.
const QUOTA_ERROR_PATTERN = /quota|rate limit|resource_exhausted|too many requests/i;

async function postToAppsScript(payload, { maxRetries = 5, baseDelayMs = 30000 } = {}) {
  const { deploymentId } = await chrome.storage.sync.get('deploymentId');
  if (!deploymentId) { console.warn(`${payload.mode}: no deploymentId`); return null; }
  const url = `https://script.google.com/macros/s/${deploymentId}/exec`;

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const rawText = await response.text();
    let data;
    let parseFailed = false;
    try { data = JSON.parse(rawText); } catch { parseFailed = true; /* non-JSON response, likely an error page */ }

    // This endpoint always legitimately returns JSON (see webApp.js), so any non-JSON response
    // (e.g. an Apps Script/Google front-end HTML interstitial for "too many requests") can only mean
    // a transient infrastructure-level throttle that never even reached our doPost's own try/catch —
    // treat it the same as a quota error rather than failing outright.
    const isQuotaError = response.status === 429
      || parseFailed
      || QUOTA_ERROR_PATTERN.test(rawText)
      || (data?.status === 'error' && QUOTA_ERROR_PATTERN.test(data.message ?? ''));

    if (!isQuotaError || attempt >= maxRetries) {
      if (parseFailed) throw new Error(`${payload.mode}: non-JSON response from Apps Script: ${rawText.slice(0, 200)}`);
      return data;
    }

    const retryAfter = Number(response.headers.get('Retry-After'));
    const delayMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : baseDelayMs * 2 ** attempt;
    const delaySec = Math.round(delayMs / 1000);
    console.warn(`${payload.mode}: Google quota hit (attempt ${attempt + 1}/${maxRetries}), retrying in ${delaySec}s`);
    showToast(`Google Contacts quota reached, retrying in ${delaySec}s...`, Math.min(delayMs, 8000));
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}

async function moveMemberOut(contact) {
  const result = await postToAppsScript({ mode: 'move-member-out', resourceName: contact.resourceName });
  console.log('moveMemberOut response', result);
}




async function addNewContact(member) {
  const { deploymentId } = await chrome.storage.sync.get('deploymentId');
  if (!deploymentId) { console.warn('addNewContact: no deploymentId'); return; }

  const dirTab = await chrome.tabs.create({ url: 'https://directory.churchofjesuschrist.org/', active: false });
  await new Promise(resolve => {
    chrome.tabs.onUpdated.addListener(function listener(id, info) {
      if (id === dirTab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });

  const [{ result: imageBase64 }] = await chrome.scripting.executeScript({
    target: { tabId: dirTab.id },
    func: async (uuid) => {
      try {
        const photoRes = await fetch(`https://directory.churchofjesuschrist.org/api/v4/photos/members/${uuid}`);
        const blob = await photoRes.blob();
        return await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.log('image fetch error:', e.message);
        return null;
      }
    },
    args: [member.uuid],
  });
  await chrome.tabs.remove(dirTab.id);

  const image = imageBase64 ? imageBase64.split(',')[1] : null;
  const result = await postToAppsScript({ mode: 'make-new-contact', ...member, image });
  console.log('addNewContact response', result);
}



// @feature:start download-contacts,update-contacts
function waitForTableThenRun(tabId, callback = (results) => reportOnContacts(results, tabId)) {
  document.getElementById('message').textContent = 'Waiting for page to load...';
  chrome.scripting.executeScript(
    { target: { tabId }, func: () => !!document.querySelector('table tbody tr') },
    (results) => {
      if (results?.[0]?.result) {
        chrome.scripting.executeScript(
          { target: { tabId }, func: getMembers },
          callback
        );
      } else {
        setTimeout(() => waitForTableThenRun(tabId, callback), 500);
      }
    }
  );
}
// @feature:end download-contacts,update-contacts

// @feature:start update-contacts
function startUpdate() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (tab.url === TARGET_URL) {
      runScript(tab.id);
    } else {
      document.getElementById('message').textContent = 'Navigating to member list...';
      chrome.tabs.update(tab.id, { url: TARGET_URL }, () => {
        chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
          if (tabId === tab.id && info.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener);
            waitForTableThenRun(tab.id);
          }
        });
      });
    }
  });
}

function runScript(tabId) {
  chrome.scripting.executeScript(
    { target: { tabId }, func: getMembers },
    (results) => reportOnContacts(results, tabId)
  );
}
// @feature:end update-contacts

// @feature:start about
document.getElementById('btn-about').addEventListener('click', () => {
  document.getElementById('message').textContent = 'Flock is a tool that pulls informatoin from the member directory from lcr.chrucjofjesuschrist.org and sends it to the contacts of a google account.';
});
// @feature:end about


async function getMembers(){
  try {
    const tables = Array.from(document.querySelectorAll('table'));
    const table = tables.find(t => t.querySelectorAll('tr').length > 100);
    if (!table) return "Be sure all fields are showing";

    const headerRow = table.querySelector('thead tr');
    const fieldText = headerRow.innerText;
    for (const field of ["Name","Gender","Birth Date","Address","Phone Number","E-mail"]) {
      if (!fieldText.includes(field)) return "Be sure all fields are showing";
    }

    const toCamelCase = str => str
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, c => c.toLowerCase());

    const headers = Array.from(table.querySelectorAll('thead th'))
      .slice(1)
      .map(th => {
        const directText = Array.from((th.querySelector('button')?.childNodes || th.childNodes))
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent.trim())
          .find(t => t.length > 0);
        return toCamelCase(directText || th.textContent.trim());
      });

    const members = Array.from(table.querySelectorAll('tbody tr')).map(row => {
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

    return { members, count: members.length };
  } catch(e) {
    return "ERROR: " + e.message;
  }
}

// @feature:start update-contacts
async function reportOnContacts(results, tabId) {
  const result = results?.[0]?.result;
  if (!result || typeof result === 'string') {
    document.getElementById('message').textContent = result ?? '(no result)';
    return;
  }

  document.getElementById('message').textContent = `${result.count} members`;
  renderTiles(result.members);
  console.log("about to synch")
  await syncToAppsScript(result.members, tabId);
}

function renderTiles(members) {
  const grid = document.getElementById('members-grid');
  grid.innerHTML = '';
  for (const m of members) {
    const tile = document.createElement('div');
    tile.className = 'member-tile';
    tile.id = `m-${m.uuid}`;

    const name = document.createElement('div');
    name.className = 'member-name';
    name.textContent = `${m.firstName} ${m.lastName}`.trim();
    tile.appendChild(name);

    if (m.phoneNumber) {
      const phone = document.createElement('div');
      phone.className = 'member-detail';
      phone.textContent = `📞 ${m.phoneNumber}`;
      tile.appendChild(phone);
    }

    if (m.eMail) {
      const email = document.createElement('div');
      email.className = 'member-detail';
      email.textContent = `✉ ${m.eMail}`;
      tile.appendChild(email);
    }

    const photoDiv = document.createElement('div');
    photoDiv.className = 'member-photo';
    photoDiv.id = `photo-${m.uuid}`;
    tile.appendChild(photoDiv);

    grid.appendChild(tile);
  }
}

async function syncToAppsScript(members, tabId) {
  console.log("gas", members)

  const { deploymentId } = await chrome.storage.sync.get('deploymentId');
  if (!deploymentId) return;

  showLoadingToast('Syncing to Google Contacts...');
 // try {
    const data = await postToAppsScript({ mode: 'contacts', contacts: members });
    console.log("data", data)
    const uuids = data.membersAdded ?? [];
    const updated = uuids.length;
    showToast(updated > 0 ? `${updated} contacts to update.` : 'Contacts already up to date.', 5000);

    const grid = document.getElementById('members-grid');
    for (const uuid of uuids) {
      const tile = document.getElementById(`m-${uuid}`);
      if (!tile) continue;
      tile.style.backgroundColor = 'lemonchiffon';
      grid.prepend(tile);
    }

    // Navigate to directory once to establish auth, then process each member
    await navigateAndWait(tabId, 'https://directory.churchofjesuschrist.org/');
    for (const uuid of uuids) {
      // Step 1: fetch photo API to get tokenUrl, inject img into page, canvas to base64
      const [{ result: imageBase64 }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: async (uuid) => {
          try {
            const photoRes = await fetch(`https://directory.churchofjesuschrist.org/api/v4/photos/members/${uuid}`);
            const blob = await photoRes.blob();
            return await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result);
              reader.onerror = () => resolve(null);
              reader.readAsDataURL(blob);
            });
          } catch (e) {
            console.log('image fetch error:', e.message);
            return null;
          }
        },
        args: [uuid]
      });

      console.log(`member ${uuid} base64 is:`, imageBase64 ? `${imageBase64.substring(0, 50)}...` : 'NULL');
      const photoDiv = document.getElementById(`photo-${uuid}`);
      if (imageBase64 && photoDiv) {
        const img = document.createElement('img');
        img.src = imageBase64;
        img.style.cssText = 'width:100%;border-radius:4px;margin-top:6px';
        photoDiv.appendChild(img);
      }

      // Step 2: navigate to the member profile page
      await navigateAndWait(tabId, `https://lcr.churchofjesuschrist.org/mlt/records/member-profile/${uuid}`);

      // Step 3: send image to Apps Script
      const tile = document.getElementById(`m-${uuid}`);
      if (tile) tile.style.backgroundColor = 'lightgreen';

      const payload = {
        mode: 'update-contact',
        uuid,
        image: imageBase64 ? imageBase64.split(',')[1] : null
      };

      console.log("payload", payload)
      const data = await postToAppsScript(payload);
      console.log(`update-contact response for ${uuid}:`, data);
      if (tile) tile.style.backgroundColor = 'lightblue';
    }
  // } catch (e) {
  //   showToast('Sync failed: ' + e.message, 6000);
  // }
}

function navigateAndWait(tabId, url) {
  return new Promise((resolve) => {
    chrome.tabs.update(tabId, { url }, () => {
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (updatedTabId === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  });
}

function waitForElement(tabId, selector, text, maxWaitMs = 10000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = async () => {
      const [{ result: found }] = await chrome.scripting.executeScript({
        target: { tabId },
        func: (selector, text) => {
          return Array.from(document.querySelectorAll(selector))
            .some(el => el.textContent.trim() === text);
        },
        args: [selector, text]
      });
      if (found || Date.now() - start > maxWaitMs) {
        resolve(found);
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}
// @feature:end update-contacts

// @feature:start get-contacts
function waitForCondition(tabId, func, maxWaitMs = 20000) {
  const start = Date.now();
  return new Promise((resolve) => {
    const check = async () => {
      const [{ result: met }] = await chrome.scripting.executeScript({ target: { tabId }, func });
      if (met || Date.now() - start > maxWaitMs) {
        resolve(met);
      } else {
        setTimeout(check, 300);
      }
    };
    check();
  });
}

function waitForPageIdle(tabId, idleMs = 500, maxWaitMs = 8000) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func: (idleMs, maxWaitMs) => new Promise((resolve) => {
      let timer;
      const reset = () => {
        clearTimeout(timer);
        timer = setTimeout(() => { observer.disconnect(); resolve(); }, idleMs);
      };
      const observer = new MutationObserver(reset);
      observer.observe(document.body, { childList: true, subtree: true, attributes: true });
      setTimeout(() => { observer.disconnect(); resolve(); }, maxWaitMs);
      reset();
    }),
    args: [idleMs, maxWaitMs]
  });
}
// @feature:end get-contacts
