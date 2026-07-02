# FIXES.md — bizbot-frontend

Every defect fixed in this refactor pass, with file paths + rationale.
Grouped by severity. See the paired `bizbot-backend/CLAUDE.md` for the
backend changes this frontend now consumes.

---

## Backend integration (2 breaking backend changes absorbed)

### FE-I1. JWT injection into every backend call
- **Files:** `src/lib/api.ts`, `src/lib/supabase.ts`
- **Why:** Backend added a `requireBusinessAuth` middleware that verifies
  the Supabase JWT on every gated route (`/api/dashboard/*`,
  `/api/analytics`, `/api/broadcast/*`, `/api/payments/*`). Without a
  JWT the backend returns 401.
- **Fix:** Added `getAccessToken()` helper in `supabase.ts` that reads
  the current Supabase session (or the localStorage mirror as a
  hydration fallback). Wired into the `call()` wrapper in `api.ts` so
  every backend request gets `Authorization: Bearer <jwt>` — one
  injection point, ~30 call sites covered. Also added friendly
  401/403/402 mapping ("Session expired", "You do not have access",
  "Trial expired").

### FE-I2. Paginated response-shape unwrapping
- **Files:** `src/lib/api.ts`
- **Why:** Backend switched three endpoints to
  `{ items, nextCursor }` from a flat array:
  `/api/dashboard/conversations`,
  `/api/dashboard/appointments`,
  `/api/dashboard/conversations/:cid/messages`.
  Every `.map()` / `.filter()` in 6 rendering components would have
  thrown "X is not a function".
- **Fix:** Added an `unwrap()` helper and applied it to
  `getAllAppointments`, `getConversations`, `getMessages`. Callers
  still receive plain arrays; `nextCursor` is discarded for now (drop-in
  when the UI adds "load more").

---

## Critical (5) — data corruption / auth-state pollution

### FE-C1. `pendingBizId` cache broken
- **File:** `src/lib/api.ts:8-33`
- **Bug:** The module-level `pendingBizId` promise cleared itself in
  `.finally`, so any second concurrent caller arriving after the first
  promise settled kicked off its own `/api/business/by-user` roundtrip.
  Dashboard mount was firing 3-5 parallel lookups.
- **Fix:** Only null the cache on failure/no-business. Successful
  lookups keep the promise alive, so subsequent callers hit the resolved
  value instantly. Once bizId is written to localStorage the whole thing
  short-circuits anyway.

### FE-C2. Appointment create in wrong timezone
- **File:** `src/app/dashboard/appointments/page.tsx:59-65`
- **Bug:** `new Date("2026-07-02T14:00:00")` (no offset) parses in the
  browser's timezone, then `.toISOString()` converts to UTC. For anyone
  outside IST, a "2:00 PM" appointment landed ±5:30h off. Even IST
  users got correct behaviour only by accident.
- **Fix:** Use `istDateTimeToUtcISO(date, time)` from the new
  `src/lib/dateTime.ts`. Always anchors to `+05:30` regardless of the
  browser's timezone.

### FE-C3. "Today" reminder count off by ±1 day
- **File:** `src/app/dashboard/appointments/page.tsx:24-28`
- **Bug:** `new Date().toISOString().split('T')[0]` gave a UTC
  day-stamp. Between 18:30 and 23:59 IST that stamp rolled to tomorrow,
  dropping today's confirmed appointments from the "Remind all" count.
- **Fix:** Use `istDateStr()` from `src/lib/dateTime.ts` and compare
  against each appointment's IST day via `utcToISTDateStr()`.

### FE-C4. Calendar cells assigned by browser TZ, not IST
- **File:** `src/app/dashboard/appointments/page.tsx:74-85`
- **Bug:** `buildCalendar()` compared `new Date(iso).getMonth() /
  .getDate()` — both browser-TZ operations. Appointments near IST
  midnight landed on the wrong calendar cell for non-IST users.
- **Fix:** `utcToISTParts(iso)` returns `{year, month, day}` in IST;
  calendar cells match against those.

### FE-C5. signOut leaked session state across accounts
- **File:** `src/lib/supabase.ts:129-141`
- **Bug:** `signOut()` cleared `bizbot-session` + `bizId` but NOT
  `onboarding-redirect` sessionStorage. User A signs out → User B
  logs in → inherits A's `onboarding-redirect=1` → dashboard layout
  never redirects them to onboarding even if genuinely new.
- **Fix:** Explicitly clear the sessionStorage flag on sign-out.

---

## High (7) — visible bugs, not corruption

### FE-H1. Layout `init()` fires setState after unmount
- **File:** `src/app/dashboard/layout.tsx`
- **Bug:** Two `await`s across `init()` without a cancellation flag.
  User hits Back before load completes → "setState on unmounted"
  warnings AND a spurious `router.replace('/onboarding')` could stampede
  someone who has just navigated away.
- **Fix:** `let cancelled = false` at effect start; cleanup returns
  `() => { cancelled = true }`. Every setState / router.replace path
  now checks the flag first.

### FE-H2. Optimistic "temp-" bubble locked in forever
- **File:** `src/app/dashboard/conversations/page.tsx`
- **Bug:** Polling compared `msgs.length > msgCountRef.current` to
  decide whether to replace state. After `sendReply()` appended an
  optimistic `temp-<Date.now()>` message, the server-truth response
  came back with the same length once the persisted message arrived —
  strict-greater failed and the temp bubble stayed forever. Also missed
  same-count reorders and deletions.
- **Fix:** Compare by id-set instead of length. If any incoming id
  isn't in the current set, or if the incoming list is shorter, or if a
  temp- id is still present, replace state.

### FE-H3. Notification toggle tore down the polling interval
- **File:** `src/app/dashboard/conversations/page.tsx`
- **Bug:** `refresh` was a `useCallback` with `[notifsOn]` in its deps.
  Every alert toggle rebuilt `refresh` → rebuilt the effect → cleared
  and re-created the interval. Also re-ran `init()` in the same effect
  → re-selected the first conversation and scrolled to bottom.
- **Fix:** Read `notifsOn` from a ref inside the polling function so
  `refresh` has empty deps. Split "initial load" and "polling" into two
  separate effects so re-mounts don't reboot conversation state.

### FE-H4. Wrong-chat messages could bleed into the current view
- **File:** `src/app/dashboard/conversations/page.tsx`
- **Bug:** Inside the polling `refresh()`, between
  `getConversations()` resolving and `getMessages()` starting, the user
  could click a different chat. The subsequent `getMessages()` response
  for the OLD chat then set `messages` state, showing wrong-customer
  messages in the current view.
- **Fix:** Capture `targetId = selectedRef.current.id` before the
  second `await`. After the fetch, verify `selectedRef.current?.id ===
  targetId` — drop the result if the user has switched.

### FE-H5. Settings POSTs the derived `planActive` flag
- **File:** `src/app/dashboard/settings/page.tsx`
- **Bug:** `api.updateBusiness(biz)` sent the whole state object,
  including the `planActive` flag the layout injects for the sidebar's
  own convenience. Backend's PATCH handler doesn't accept unknown
  columns and could reject the whole save.
- **Fix:** Destructure and drop client-only fields (`planActive`,
  `id`, `created_at`, `plan_expires_at`, `razorpay_sub_id`) before
  calling `api.updateBusiness(payload)`. Also coerces
  `payment_reminder_days` from string → positive integer.

### FE-H6. Payment `create()` accepted NaN amounts
- **File:** `src/app/dashboard/payments/page.tsx`
- **Bug:** `Number(form.amount)` returned `NaN` for non-numeric input,
  which serialised to `null` in JSON — silent bad data in the DB.
- **Fix:** `Number.isFinite(amount) && amount > 0` guard with a toast.

### FE-H7. `markPaid` race — paid row bounced back to pending
- **File:** `src/app/dashboard/payments/page.tsx`
- **Bug:** Optimistic filter + immediate `load()` — if the backend
  hadn't finished updating status when `load()` fired, the just-paid
  item reappeared in the pending list.
- **Fix:** Snapshot the row, do the optimistic filter, call the API,
  roll back to the snapshot on error. No load() — the optimistic state
  is already correct.

---

## Medium (10) — UX bugs / defensive misses

### FE-M1. Conversation search threw on null phone
- **File:** `src/app/dashboard/conversations/page.tsx`
- **Fix:** `(c.phone || '').includes(search)`.

### FE-M2. Imported customers labeled "Active" instead of "New"
- **File:** `src/app/dashboard/customers/page.tsx`
- **Bug:** `daysSince(null)` returned `NaN`; `NaN >= 21` and
  `NaN >= 14` are both false → churn tier fell through to "Active".
- **Fix:** `daysSince()` returns `Infinity` for null / invalid
  timestamps. `churn()` maps non-finite values to a new "New" badge.
  Display shows "Never" instead of "NaNd ago".

### FE-M3. Broadcast audience fetched on every keystroke
- **File:** `src/app/dashboard/broadcast/page.tsx`
- **Bug:** `useEffect([form.segment_value])` fired once per character
  typed in the "By service" input — 6 requests for "Facial".
- **Fix:** 350ms debounce timer with cleanup.

### FE-M4. Scheduled broadcast picked up in browser TZ
- **File:** `src/app/dashboard/broadcast/page.tsx`
- **Bug:** `<input type="datetime-local">` returns a naive
  `YYYY-MM-DDTHH:MM` string. Backend interpreted it as-is, so a user
  in a non-IST browser saw the campaign scheduled at a different real
  time than they picked.
- **Fix:** `scheduledLocalToUtcISO()` in `src/lib/dateTime.ts` anchors
  the picked local value to IST → UTC ISO before POST.

### FE-M5. Billing page 400'd on fresh OAuth land
- **File:** `src/app/dashboard/billing/page.tsx`
- **Bug:** Read `bizId` from localStorage on mount, but the layout's
  `by-user` resolver may not have populated it yet on a direct URL
  land (`/dashboard/billing?status=success`). All fetches went out
  with an empty `x-business-id` and 400'd.
- **Fix:** `waitForBizId()` polls localStorage for up to 3s before
  making the first request.

### FE-M6. Billing `pollStatus` had no unmount guard
- **File:** `src/app/dashboard/billing/page.tsx`
- **Bug:** 6-iteration polling loop (2.5s each = 15s total) fired
  toasts and `load()` even after the user navigated away.
- **Fix:** Cancelled flag threaded through the loop and every fetch.

### FE-M7. `payment_reminder_days` sent as string
- **File:** `src/app/dashboard/settings/page.tsx`
- **Bug:** `<input type="number">` returns a string; backend may
  reject or store `"3"` instead of `3`.
- **Fix:** Coerced to integer in the payload-cleanup step of `save()`.

### FE-M8. PlanBanner invisible for the first 60s
- **File:** `src/components/dashboard/PlanBanner.tsx`
- **Bug:** Read `bizId` from localStorage on mount. If missing,
  silently returned; only retried every 60s. First-load banner
  therefore lagged the layout's bizId resolution.
- **Fix:** Effect polls localStorage every 200ms for up to 6s waiting
  for bizId, then loads. Also listens to the `biz-updated` window
  event so it refreshes immediately after a settings save.

### FE-M9. Onboarding could double-submit
- **File:** `src/app/onboarding/page.tsx`
- **Bug:** No guard against a fast second click / Enter press while
  the first request was in flight. Also didn't clear stale `bizId`
  from a previous account before creating a new one.
- **Fix:** `if (saving) return` guard, remove `localStorage.bizId`
  before the POST, keep `saving=true` through the router.replace so
  the button stays disabled during the redirect.

### FE-M10. Customer page swallowed load errors
- **File:** `src/app/dashboard/customers/page.tsx`
- **Bug:** Silent load failure left the skeleton up. No way for the
  user to know they should refresh.
- **Fix:** Surface the error via toast on initial load only. Polling
  failures stay silent to avoid toast spam every 15s.

---

## Low (5) — cosmetic

### FE-L1. Login redirect could fire after unmount
- **File:** `src/app/login/page.tsx`
- **Fix:** Cancelled-flag guard on the `destinationForUser().then` path.

### FE-L2. Signup redirect could fire after unmount
- **File:** `src/app/signup/page.tsx`
- **Fix:** Same pattern as FE-L1.

### FE-L3. CSV export errors weren't friendly
- **File:** `src/lib/api.ts`
- **Fix:** `downloadAnalyticsCsv` maps 401 → "Session expired",
  402 → "Trial expired", 403 → "No access to this business" instead
  of "Export failed (HTTP 401)".

### FE-L4. ImportCustomersModal reopened on stale `'result'` step
- **File:** `src/components/dashboard/ImportCustomersModal.tsx`
- **Bug:** Backdrop-click close didn't reset state. Next open showed
  the previous import's numbers.
- **Fix:** `useEffect(() => { if (open) reset() }, [open])` — always
  boot from the `'input'` step.

### FE-L5. IST time formatting inline everywhere
- **File:** `src/app/dashboard/conversations/page.tsx`
- **Bug:** `new Date(m.created_at).toLocaleTimeString('en-IN', ...)`
  didn't pass `timeZone`, so message timestamps rendered in browser TZ.
- **Fix:** Switched to `formatISTDateTime()` helper (also anchors IST).

---

## Dismissed after re-reading (from the audit)

- **OAuth callback double-navigate.** The auth-state-change listener
  and `getCurrentUser().then` both call `route()`, which sets
  `done=true` synchronously before its first `await`. JS
  single-threading protects it. Not a bug.
- **`analytics/page.tsx` stale `range.label` during refetch.**
  Intentional shimmer while new data loads.
- **`supabase.ts` module-level `onAuthStateChange` not unsubscribed.**
  Dev-only HMR leak. Adding lifetime coupling to a page component
  isn't worth the fix.
- **`x-business-id` on `/api/business/by-user` calls.** Backend
  intentionally doesn't gate that endpoint (used pre-onboarding),
  so no fix needed on the frontend.

---

## Files touched (17)

**New**
- `src/lib/dateTime.ts` — IST-anchored date helpers (mirrors backend)

**Edited**
- `src/lib/api.ts` — JWT injection, pendingBizId fix, unwrap helpers,
  CSV auth-error mapping
- `src/lib/supabase.ts` — `getAccessToken`, signOut cleanup
- `src/app/dashboard/layout.tsx` — cancelled-flag pattern
- `src/app/dashboard/appointments/page.tsx` — IST across the board
- `src/app/dashboard/conversations/page.tsx` — polling rewrite +
  id-set dedupe + wrong-chat guard
- `src/app/dashboard/settings/page.tsx` — strip planActive, coerce
  numeric field
- `src/app/dashboard/payments/page.tsx` — NaN guard, optimistic-rollback
- `src/app/dashboard/customers/page.tsx` — null-safe daysSince, error toast
- `src/app/dashboard/broadcast/page.tsx` — debounce, IST scheduled_at
- `src/app/dashboard/billing/page.tsx` — waitForBizId + unmount guard
- `src/app/onboarding/page.tsx` — double-submit guard + bizId cleanup
- `src/app/login/page.tsx` — cancelled-flag guard
- `src/app/signup/page.tsx` — cancelled-flag guard
- `src/components/dashboard/PlanBanner.tsx` — early poll + biz-updated listener
- `src/components/dashboard/ImportCustomersModal.tsx` — reset on open

---

## Testing

**Automated verification run this session:**
- `npx tsc --noEmit` → exit 0 (types clean across all touched files).
- `npx next build` → all 18 pages compiled, no errors, bundle sizes
  slightly smaller (shared date helpers dedupe inline TZ code).

**Not verified end-to-end** (would need live services):
- Real JWT flow against a real Supabase session.
- Real dashboard interactions against a running backend.
- Concurrency behaviour (unmount guards, race conditions).
- The 3 paginated endpoints returning real `{items, nextCursor}`
  shapes from a live DB.

See `bizbot-backend/TESTING.md` for the full manual checklist that
covers both sides of the wire.

---

## Deploy order (with the backend fixes)

1. Apply `bizbot-backend/src/config/migration-v7.sql` in Supabase.
2. Deploy backend with `AUTH_REQUIRED=false` — everything works as
   today, all new fixes active except the auth gate.
3. Deploy this frontend. Safe with either backend mode.
4. Verify the dashboard loads end-to-end for a real logged-in user.
5. Set `AUTH_REQUIRED=true` in the backend env and redeploy.
6. Set `WHATSAPP_APP_SECRET`, `RAZORPAY_WEBHOOK_SECRET`,
   `FRONTEND_URL` on the backend and redeploy.

If any step fails, roll back is just an env-var toggle — no code
redeploy needed.
