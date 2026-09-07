// Member self-scheduling for bishop appointments.
// Availability comes from events titled "Open for Appointments" on the
// deploying user's (the bishop's) primary calendar; booking creates a new
// event that overlaps that block rather than editing/splitting it.

const DIRECTORY_SPREADSHEET_ID = "1hfmIAAvt0OXv_g2HgQLSuYz7N1RRdVEQ8ZiFX1fAqrU"
const DIRECTORY_SHEET_NAME = "Directory"
const OPEN_BLOCK_TITLE = "open for appointments"
const SLOT_STEP_MINUTES = 20
const MIN_LEAD_TIME_HOURS = 24
const BOOKING_WINDOW_DAYS = 60

const APPOINTMENT_TYPES = [
  { key: "endorsement", label: "Ecclesiastical Endorsement", minutes: 20 },
  { key: "temple_recommend", label: "Temple Recommend Interview", minutes: 20 },
  { key: "get_to_know", label: "Get to Know the Bishop", minutes: 20 },
  { key: "repentance", label: "Engage the Process of Repentance", minutes: 20 },
  { key: "sealed_monthly", label: "Monthly Meeting Preparing to be Sealed", minutes: 20 },
  { key: "temple_worker", label: "Request to Serve as a Temple Worker", minutes: 20 },
  { key: "endowment_prep", label: "Meeting to Prepare for Endowment", minutes: 20 },
  { key: "patriarchal_blessing_prep", label: "Meeting to Prepare for Patriarchal Blessing", minutes: 20 },
  { key: "sealing_initial", label: "Initial Meeting to Prepare for Temple Sealing", minutes: 40 },
  { key: "other", label: "Other / Prefer not to say", minutes: 20 },
]

function getAppointmentTypes() {
  return APPOINTMENT_TYPES
}

function getAppointmentType_(typeKey) {
  const type = APPOINTMENT_TYPES.find(t => t.key === typeKey)
  if (!type) throw new Error("Unrecognized appointment type: " + typeKey)
  return type
}

function bookingWindow_() {
  const now = new Date()
  const start = new Date(now.getTime() + MIN_LEAD_TIME_HOURS * 60 * 60 * 1000)
  const end = new Date(now.getTime() + BOOKING_WINDOW_DAYS * 24 * 60 * 60 * 1000)
  return { start, end }
}

// Returns free sub-intervals (as {start,end} Date pairs) inside "open for appointments"
// blocks, after subtracting every other overlapping event on the calendar.
function getFreeIntervals_(calendar, rangeStart, rangeEnd) {
  const events = calendar.getEvents(rangeStart, rangeEnd)
  const openBlocks = events.filter(e => e.getTitle().trim().toLowerCase() === OPEN_BLOCK_TITLE)
  const busyBlocks = events.filter(e => e.getTitle().trim().toLowerCase() !== OPEN_BLOCK_TITLE)

  const intervals = []
  for (const block of openBlocks) {
    let free = [{ start: block.getStartTime(), end: block.getEndTime() }]
    for (const busy of busyBlocks) {
      const busyStart = busy.getStartTime()
      const busyEnd = busy.getEndTime()
      const next = []
      for (const seg of free) {
        if (busyEnd <= seg.start || busyStart >= seg.end) {
          next.push(seg)
          continue
        }
        if (busyStart > seg.start) next.push({ start: seg.start, end: busyStart })
        if (busyEnd < seg.end) next.push({ start: busyEnd, end: seg.end })
      }
      free = next
    }
    intervals.push(...free)
  }
  return intervals
}

function getAvailableSlots(typeKey) {
  const type = getAppointmentType_(typeKey)
  const durationMs = type.minutes * 60 * 1000
  const stepMs = SLOT_STEP_MINUTES * 60 * 1000
  const { start: rangeStart, end: rangeEnd } = bookingWindow_()

  const calendar = CalendarApp.getDefaultCalendar()
  const intervals = getFreeIntervals_(calendar, rangeStart, rangeEnd)

  const slots = []
  for (const interval of intervals) {
    let slotStart = new Date(Math.ceil(interval.start.getTime() / stepMs) * stepMs)
    while (slotStart.getTime() + durationMs <= interval.end.getTime()) {
      if (slotStart.getTime() >= rangeStart.getTime()) {
        slots.push({
          startIso: slotStart.toISOString(),
          endIso: new Date(slotStart.getTime() + durationMs).toISOString(),
        })
      }
      slotStart = new Date(slotStart.getTime() + stepMs)
    }
  }
  slots.sort((a, b) => a.startIso.localeCompare(b.startIso))
  return slots
}

function normalizePhone_(input) {
  if (!input) return ""
  return String(input).replace(/\D/g, "").slice(-10)
}

// Matches a submitted (firstName, lastName, phone, email) against the Directory
// tab: requires an exact email or phone match, AND a partial name match. Returns
// the row's UUID on exactly one match, otherwise null.
function findMemberMatch_(firstName, lastName, phone, email) {
  const ss = SpreadsheetApp.openById(DIRECTORY_SPREADSHEET_ID)
  const sheet = ss.getSheetByName(DIRECTORY_SHEET_NAME)
  const rows = sheet.getDataRange().getValues()

  const normalizedEmail = String(email || "").trim().toLowerCase()
  const normalizedPhone = normalizePhone_(phone)
  const nameNeedles = [firstName, lastName]
    .map(n => String(n || "").trim().toLowerCase())
    .filter(n => n.length > 0)

  const matches = []
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]
    const rowFullName = String(row[0] || "").toLowerCase()
    const rowPhone = normalizePhone_(row[3])
    const rowEmail = String(row[4] || "").trim().toLowerCase()
    const rowUuid = row[9]
    if (!rowUuid) continue

    const contactMatches = (normalizedEmail && rowEmail === normalizedEmail) ||
      (normalizedPhone && rowPhone === normalizedPhone)
    const nameMatches = nameNeedles.some(n => rowFullName.includes(n))

    if (contactMatches && nameMatches) matches.push(rowUuid)
  }

  return matches.length === 1 ? matches[0] : null
}

function appointmentEventTitle_(type, firstName, lastName) {
  return type.label + " - " + firstName + " " + lastName
}

function bookAppointment(payload) {
  const { typeKey, startIso, firstName, lastName, phone, email } = payload
  const type = getAppointmentType_(typeKey)
  const start = new Date(startIso)
  const end = new Date(start.getTime() + type.minutes * 60 * 1000)

  const lock = LockService.getScriptLock()
  lock.waitLock(30000)
  try {
    const calendar = CalendarApp.getDefaultCalendar()
    const stillFree = getFreeIntervals_(calendar, start, end)
      .some(seg => seg.start.getTime() <= start.getTime() && seg.end.getTime() >= end.getTime())

    if (!stillFree) {
      return { status: "conflict", message: "That time was just taken. Please pick another." }
    }

    const uuid = findMemberMatch_(firstName, lastName, phone, email)
    const descriptionLines = [
      "Name: " + firstName + " " + lastName,
      "Phone: " + phone,
      "Email: " + email,
    ]
    if (uuid) {
      descriptionLines.push("LCR Record: https://lcr.churchofjesuschrist.org/mlt/records/member-profile/" + uuid)
    }

    const event = calendar.createEvent(
      appointmentEventTitle_(type, firstName, lastName),
      start,
      end,
      { description: descriptionLines.join("\n") }
    )

    sendConfirmationEmail_(event, type, firstName, lastName, email, start, end)

    return { status: "success", startIso: start.toISOString(), endIso: end.toISOString() }
  } finally {
    lock.releaseLock()
  }
}

function sendConfirmationEmail_(event, type, firstName, lastName, email, start, end) {
  if (!email) return
  const cancelUrl = ScriptApp.getService().getUrl() + "?page=cancel&id=" + encodeURIComponent(event.getId())
  const timeZone = Session.getScriptTimeZone()
  const formatted = Utilities.formatDate(start, timeZone, "EEEE, MMMM d 'at' h:mm a")

  const body = "Hi " + firstName + ",\n\n" +
    "Your appointment has been scheduled:\n\n" +
    type.label + "\n" +
    formatted + "\n\n" +
    "Need to cancel? " + cancelUrl + "\n"

  MailApp.sendEmail(email, "Appointment Confirmed: " + type.label, body)
}

function getAppointmentForCancel(eventId) {
  const calendar = CalendarApp.getDefaultCalendar()
  const event = calendar.getEventById(eventId)
  if (!event || !isCancelableAppointment_(event)) {
    return { status: "not_found" }
  }
  const timeZone = Session.getScriptTimeZone()
  return {
    status: "found",
    title: event.getTitle(),
    when: Utilities.formatDate(event.getStartTime(), timeZone, "EEEE, MMMM d 'at' h:mm a"),
  }
}

function cancelAppointment(eventId) {
  const calendar = CalendarApp.getDefaultCalendar()
  const event = calendar.getEventById(eventId)
  if (!event || !isCancelableAppointment_(event)) {
    return { status: "not_found" }
  }
  event.deleteEvent()
  return { status: "canceled" }
}

// Only allow canceling events this system itself created (never the "open for
// appointments" blocks or the bishop's other personal calendar events).
function isCancelableAppointment_(event) {
  const title = event.getTitle()
  return APPOINTMENT_TYPES.some(type => title.indexOf(type.label + " - ") === 0)
}
