# Smart Campus domain contract

Load classic scripts in this order: `data.js`, `state.js`, `demo-ai.js`, then UI scripts. They expose `SCData`, `SCState`, `SCAssistant` on `globalThis` and export the same APIs via CommonJS. No packages, network, storage or ES modules; works from `file://`.

## Fixtures: SCData

- `demoDate`: `2026-10-07`; `dates`: `{value,label,shortLabel}` for 7–9 October 2026, in Spanish.
- `account`: `{id,name,matricula,level,semester,fictional}`; student is explicitly fictional, level `Profesional`, semester 5.
- `categories`: `{id,label,color}`. IDs: `library`, `classrooms`, `labs`, `computers`, `gyms`, `pool`, `esports`, `wellbeing`, `tec-services`.
- `spaces`: `{id,name,category,description,location:{label,zone,x,y},hours,capacity,resources:[],software:[],requirements:[],responsibleArea,procedure,source:{label,basis,updatedAt,fictional},reservable?}`. Map coordinates are conceptual percentages, not directions or a real campus map.
- Library IDs: `library-room-2`, `library-room-4`, `library-room-6`, `library-room-8`. All four are general-use rooms and `reservable:true`.
- Gym IDs: `gym-profesional`, `gym-prepatec`. Lab IDs: `lab-3d`, `lab-robotics`.
- Remaining IDs: `classroom-flex`, `computer-design`, `pool-main`, `esports-arena`, `wellbeing-center`, `tec-services-center`.
- `libraryOccupancy`: `{roomId,date,hour}` occupied fixtures.
- `gymOccupancy`: map `gymId -> date -> [{hour,endHour,status,occupancyPercent,estimated}]`. Starts 7–18, ends 8–19; status is `open`, `closed`, or `unknown`. Unknown/closed percentages are `null`.
- `trainingTypes`: `['pecho','pierna','tren superior','cardio','otro']`.
- `gymEntryCodes`: `{ 'gym-profesional': 'SC-QR-ENTRADA-GYM-PROFESIONAL', 'gym-prepatec': 'SC-QR-ENTRADA-GYM-PREPATEC' }` — fictional payloads of the QR printed at each gym entrance (scan is simulated).
- `gymRules`: `{ arrivalWindowMs: 600000, durations: [1, 1.5] }`.
- `campus`: `{name,width,height,regions:[{category,label,x,y,width,height}]}` for a conceptual SVG/map.

Every fixture is fictional. Pool “Tier 2” is a fictional sample label with no definition or access authorization. Display fixture source and update metadata where appropriate.

## State: SCState

`createState()` returns a fresh, independent mutable object:

```js
{
  account: { /* copy of SCData.account */ },
  explore: { query: '', mode: 'map', category: 'all', minCapacity: 0 },
  bookingDraft: { roomId: 'library-room-6', date: '2026-10-07', hour: 11, capacity: 6 },
  attendanceDraft: { gymId: 'gym-profesional', duration: 1, type: 'pecho' },
  gymView: { date: '2026-10-07' },          // occupancy chart date (UI only)
  arrival: null,                            // pending verified QR arrival or null
  reservations: [], attendance: [], favorites: [], history: [],
  assistant: { query: '', answer: null },
  nextIds: { reservation: 1, attendance: 1, consultation: 1, arrival: 1 }
}
```

UI may update `explore`, drafts and `assistant.query` directly. Convert form numbers to numbers before submission. Domain methods validate submissions and do not submit merely because a draft changes. `resetState(state)` restores every field in place and returns the same object; refresh also starts fresh. State persists only during this page session.

### Read methods

- `normalize(value)` → lower-case, accent-insensitive text.
- `getSpace(id)` → catalog object or `null`.
- `searchSpaces(state, overrides?)` → catalog objects. Uses `state.explore` merged with overrides `{query,category,minCapacity}`. `category:'all'` disables that filter. Searches name, capacity (`6 personas`), resources, software, requirements, description and location. No mutation.
- `getLibrarySlots(state,{roomId,date,capacity?})` → 9 one-hour slots `{spaceId,roomId,date,hour,endHour,available,status,reason}` for starts 9–17. Status `available` or `unavailable`; reason `null`, `occupied-fixture`, `reserved`, or `user-conflict`. Invalid room/date/capacity returns `[]`.
- `findRoomOptions(state,{date,hour,capacity})` → available library room options `{spaceId,roomId,name,capacity,date,hour,endHour}` sorted by fitting capacity then name. Invalid inputs return `[]`. Accounts cannot overlap confirmed bookings across rooms.
- `findRoomAlternatives(state,{roomId,date,hour,capacity})` → at most 3 available room options with the same shape as `findRoomOptions`, ranked by nearest hour distance, then smallest fitting capacity, then earliest hour. Validates library room, demo date, integer hour 9–17 and requested capacity 1..selected room capacity; invalid input returns `[]`. Pure query: no state mutation. `reserveRoom` uses this same query when returning conflict alternatives; UI must also use it.
- `getGymBlocks(gymId,date)` → copied blocks `{spaceId,gymId,name,date,hour,endHour,status,occupancyPercent,estimated}`. Invalid gym/date returns `[]`.
- `recommendGymBlocks(gymId,date)` → all open blocks with known sample occupancy sorted ascending percentage, ties earliest. Unknown/closed are excluded. Display and assistant must use these methods.

### Mutations

Failures use `{ok:false,code,message,alternatives?}`; no partial mutation. Success includes `ok:true`.

- `reserveRoom(state,{roomId,date,hour,capacity})` → `{ok:true,reservation}`. Library only; integer start 9–17; date one of the three; integer requested capacity 1..room capacity. Reservation `{id,userId,roomId,spaceId,name,date,hour,endHour,capacity,status:'confirmed'}`. Collision with fixture/room produces `code:'unavailable'`; same-account overlap `code:'user-conflict'`; both include at most 3 real alternatives `{spaceId,roomId,name,capacity,date,hour,endHour}` ranked by nearest hour distance, then smallest fitting capacity, then earliest hour. Other failures `invalid-room`, `invalid-date`, `invalid-hour`, `invalid-capacity`.
- `cancelReservation(state,id)` → `{ok:true,reservation}` with status changed to `cancelled`; only current account's confirmed reservation. Failure `not-found`, `not-owner`, `not-confirmed`. Cancelled record stays visible in history and no longer occupies the room.
- Gym attendance happens only on arrival (F7). Every time-dependent method takes `now` (epoch ms, default `Date.now()`); a non-finite `now` fails with `invalid-time`. Opening hours are not enforced on arrival (real clock varies during demos). Successful `verifyGymArrival`/`startGymSession` first run `syncGymSessions`.
- `verifyGymArrival(state,{gymId,code,now?})` → `{ok:true,arrival}`; arrival `{id,gymId,code,verifiedAt,expiresAt,method:'qr-simulated',status:'verified'}` stored in `state.arrival` (replaces any pending one). Failures in order: `invalid-gym`, `invalid-time`, `invalid-code` (unknown code, or the other gym's QR with an explicit message), `active-session`.
- `startGymSession(state,{gymId,duration,type,now?})` → `{ok:true,attendance}`. Requires a verified arrival for the same gym with `now < expiresAt`; consumes it. Failures in order: `invalid-gym`, `invalid-time`, `arrival-required`, `arrival-other-gym`, `arrival-expired`, `invalid-duration` (exactly 1 or 1.5), `invalid-type`, `active-session`. Record `{id,kind:'attendance',gymId,spaceId,name,date:demoDate,startedAt,plannedEndAt,endedAt:null,endReason:null,duration,type,account:{...snapshot},verification:{method,arrivalId,verifiedAt},status:'active',grantsAccess:false}`. Only one live session exists at a time, so sessions never overlap.
- `finishGymSession(state,id,{now?,reason?})` → `{ok:true,attendance}`; reason `manual` (default) or `timeout` (only when `now >= plannedEndAt`). Sets `status:'finished'`, `endedAt = min(now, plannedEndAt)`; a manual finish after the planned end is recorded as `timeout`. Failures `invalid-reason`, `invalid-time`, `not-found`, `not-owner`, `not-active`, `not-expired`.
- `syncGymSessions(state,now?)` → `{ok:true,finished:[...]}`; finishes expired sessions by timeout; idempotent.
- Reads: `getActiveGymSession(state,now?)` (copy or `null`; expired-unsynced is not active), `getSessionRemainingMs(session,now?)` (≥0), `getGymPresence(state,gymId,now?)` → `{gymId,activeSessions}`. Attendance records do not grant access to the gym.
- `toggleFavorite(state,spaceId)` → `{ok:true,favorite:boolean,spaceId}` or `invalid-space`. Favorites is an array of existing catalog IDs.
- `addConsultation(state,{question,scenario,title})` → `{ok:true,consultation}` where record is `{id,question,scenario,title,date}`. Trims text and rejects blank (`blank-question`). Use from submitted consultations only.
- `clearConsultations(state)` → `{ok:true}`; removes history, preserves account, reservations, attendance, favorites, drafts, filters and current assistant response.

## Scripted assistant: SCAssistant

- `suggestedPrompts`: 4 Spanish strings; the first is «Necesito una sala en la biblioteca el viernes 9 de octubre a las 11:00 para 4 personas», then six-person room, 3D lab and gym.
- `recognize(question)` → `library-booking`, `lab-3d`, `gym-quiet`, `unsupported`, or `blank`; case/accent insensitive.
- `answer(state,question,context?)` → answer without state mutation.
- `submit(state,question,context?)` → same answer; only nonblank submissions add history and save trimmed `state.assistant.query` and `state.assistant.answer`. Blank submission leaves state unchanged.
- `refreshAnswer(state)` → recomputes the stored answer from its `question`/`context` against current state, without touching history (UI calls it before rendering the assistant, so booked slots are never offered again).

`context` supports `{date,hour,capacity,gymId}` and overrides parsed values. Library requests parse date (7/8/9 de octubre, miércoles/jueves/viernes, hoy, mañana), hour (`a las 11`, `11:00`, `3 pm`…) and group size (digits or uno–ocho); missing values fall back to `bookingDraft` and are listed in `request.defaults`; values outside the demo (other dates, hours outside 09:00–18:00, more than 8 people) are listed in `request.outOfRange` and produce an explanation with no options. Gym falls back to `attendanceDraft.gymId` and `gymView.date`. Answer shape:

```js
{
  label: 'Respuesta de ejemplo', supported: true|false,
  scenario, title, body, options: [], actions: [],
  source: { label, updatedAt, fictional: true, spaceIds: [] },
  limitations: []
}
```

Every answer also carries `question` and `context`; library answers carry `request:{date,hour,capacity,defaults,outOfRange}`. Library `options` equals `findRoomOptions(state,{date,hour,capacity})` (smallest fitting room first); when the block has no room, up to 3 alternatives at other hours of the same date (nearest hour, smallest capacity, earliest). Actions `{type:'book-room',label:'Revisar reserva',spaceId,roomId,date,hour,capacity:<group size>}` open the booking draft and never reserve automatically.

Lab `options` contains `{spaceId,name,requirements,procedure,responsibleArea}` from `lab-3d`; action `{type:'view-space',label,spaceId}` directs the access/contact procedure and does not grant access.

Gym `options` equals `recommendGymBlocks(...).slice(0,3)`; action `{type:'view-gym',label:'Ver gimnasio',spaceId,gymId}` opens the gym page; attendance is registered only on arrival by scanning the entrance QR. Occupancy is explicitly estimated and fictional.

Blank/unsupported answers have `supported:false`, no options/actions, no invented operations. Unsupported nonblank submission is still a consultation history item. Always display “Respuesta de ejemplo”; there is no model or network behind these answers.

## Validation command

`node --test tests/state.test.cjs tests/assistant.test.cjs tests/views.test.cjs` from this directory. Built-in Node runner: 60 tests (state 41, assistant 14, UI helpers 5) including browser classic-script globals.
