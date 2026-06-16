# GEDI App — Progress Document

> Last updated: 2026-06-15  
> Branch: `main`  
> Use this doc to resume work in a new Claude Code session. It captures what's built, what's broken, what to do next, and the exact technical context needed to continue without re-reading every file.

---

## What Is This App

**GEDI** ("tera sheher, teri gedi") is a Delhi-focused nightlife/social discovery app built in React Native + Expo. Think TikTok-style feed of places (restaurants, bars, clubs, galleries, parks) and events (Eventbrite + SerpAPI) near Hauz Khas Village. Users swipe right to save, left to skip, up to see full detail. Saved places live in a tab. There's a profile with a privacy mode (Ghost/Friends/Public) and a check-in/points system.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + **Expo SDK 56**, Expo Router v3 |
| Navigation | Expo Router (file-based), tab layout at `app/(tabs)/` |
| Gestures | React Native Gesture Handler **v2.31** (New Architecture / Fabric) |
| Animations | React Native Reanimated **v4** (Metro transformer — no Babel plugin) |
| Backend | **Supabase** (Postgres + Auth + Realtime) |
| Auth | Supabase phone OTP (`+91` prefix), anonymous dev sign-in |
| Places | Google Places API (Nearby Search + Place Details) |
| Events | Eventbrite API v3 + SerpAPI (Google Events engine) |
| Image caching | Expo Image (implicit) |
| Push notifications | Expo Notifications (hook: `useNotifications`) |
| Fonts | Bebas Neue (headline), Inter 400/600/700 (body) |
| Platform target | iOS (primary), Android (secondary) |

**Key Reanimated v4 note:** There is no `reanimated` Babel plugin. The Metro transformer handles worklets. `SharedValue<T>` is the import from `react-native-reanimated`. Do not add the Babel plugin — it will break the build.

---

## File Structure (relevant files only)

```
app/
  _layout.tsx              ← Root: GestureHandlerRootView wraps everything
  index.tsx                ← Auth redirect (to /auth or /(tabs))
  (tabs)/
    _layout.tsx            ← Tab bar (Feed, Saved, Profile)
    index.tsx              ← FEED SCREEN — main screen
    saved.tsx              ← SAVED tab — 2-col grid, long-press to remove
    profile.tsx            ← PROFILE tab — stats, privacy, notifications
  auth/
    phone.tsx              ← Phone entry + dev skip-auth button
    otp.tsx                ← OTP verification
    location.tsx           ← Location permission
    privacy.tsx            ← Privacy mode onboarding
  place/[id].tsx           ← Place detail modal (slide_from_bottom)
  event/[id].tsx           ← Event detail modal (slide_from_bottom)

components/
  CardStack.tsx            ← TikTok FlatList feed — THE main component
  PlaceCardView.tsx        ← Visual card for a place (full-screen)
  EventCardView.tsx        ← Visual card for an event (full-screen)
  PlaceCard.tsx            ← Re-export shim (PlaceCardView as PlaceCard)
  SkeletonStack.tsx        ← Loading skeleton (3 shimmer cards)
  StampOverlay.tsx         ← GOING / NAH stamp during swipe
  GlowBackground.tsx       ← Ambient orange glow behind feed
  SwipeTutorial.tsx        ← First-launch gesture hint overlay
  WarningToast.tsx         ← "Some sources unavailable" banner
  GlassCard.tsx            ← Generic frosted-glass container
  PrimaryButton.tsx        ← Orange CTA button
  CheckinFeedback.tsx      ← Post check-in animation
  CheckinSuccess.tsx       ← Check-in success modal

lib/
  feedMixer.ts             ← Orchestrates all data sources → FeedCard[]
  places.ts                ← Google Places Nearby Search + Place Details
  events.ts                ← SerpAPI (two parallel queries)
  eventbrite.ts            ← Eventbrite API (two parallel queries)
  eventCache.ts            ← In-memory feed cache
  supabase.ts              ← Supabase client
  deeplink.ts              ← Deep link parsing + pending-link storage

hooks/
  useFeed.ts               ← Calls buildFeed(), exposes cards/loading/error
  useSaved.ts              ← Supabase saves table CRUD
  useAuth.ts               ← Supabase auth session
  useCheckin.ts            ← Check-in logic + points
  usePrivacy.ts            ← Ghost/Friends/Public mode
  useNotifications.ts      ← Expo push notification registration

constants/
  theme.ts                 ← Colors, Fonts, Spacing, Radius tokens
```

---

## Supabase Tables

| Table | Key columns |
|---|---|
| `users` | `id` (auth UID), `phone`, `points`, `checkins_count`, `saves_count`, `privacy_mode`, `expo_push_token` |
| `saves` | `id`, `user_id`, `place_id`, `place_type` (`place`\|`event`), `place_data` (JSONB full card snapshot), `saved_at` |
| `checkins` | `id`, `user_id`, `place_id`, `place_data` (JSONB), `checked_in_at` |

---

## Environment Variables

All in `.env` (never committed). `.env.example` is committed with empty values.

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_PLACES_KEY=
EXPO_PUBLIC_SERPAPI_KEY=
EXPO_PUBLIC_EVENTBRITE_TOKEN=
```

---

## Commit History (this work)

### `67ce415` — Gesture/touch system QA fix
**Problem:** Feed card buttons (→ going, ✗ nah, ↑ details, View Details) did not respond to taps in iOS simulator.

**Root causes found and fixed:**
1. **Nested GestureDetector conflict** — `index.tsx` had an outer `GestureDetector` for pull-to-refresh that wrapped all of `CardStack`. In RNGH v2.31 + New Architecture, the outer gesture stole all touches. Fixed by removing the outer GestureDetector entirely; pull-to-refresh was moved into the card gesture's `onEnd` logic.
2. **No activeOffset on pan gesture** — Pan gesture activated on any movement, blocking Pressables underneath. Fixed by adding `.activeOffsetX([-20, 20]).activeOffsetY([-20, 30])` — taps (< 10 px drift) now fail the gesture.
3. **Overlay View intercepting touches** — `pointerEvents="box-none"` applied to any overlay containers so the container passes touches through but Pressable children still receive taps.
4. **TouchableOpacity → Pressable** — All interactive elements on feed cards replaced with Pressable.

---

### `2203c83` — TikTok-style vertical scroll feed
**Replaced** Tinder card-stack with TikTok vertical snap scroll.

**What changed:**
- `components/CardStack.tsx` — complete rewrite
  - `FlatList` with `pagingEnabled` — each card fills the viewport and snaps
  - `ScrollCard` component: per-card with `Gesture.Pan()` using `.failOffsetY([-20, 20])` so vertical finger movement fails the gesture and passes to FlatList scroll
  - Horizontal swipe right → GOING (saves + scrolls to next), left → NAH (skips + scrolls to next)
  - `withTiming` callback fires `onGoing`/`onNah` AFTER the fly-off animation so the new card always starts at `translateX = 0`
  - Tap overlay (`Animated.View` with `pointerEvents="box-none"`) sits above `GestureDetector`; its `Pressable` children handle taps for going/nah/details without conflicting with the pan gesture
  - `onViewableItemsChanged` tracks current card index → calls `onIndexChange(idx)` → drives the `X / N` counter in the parent
  - `ListFooterComponent` shows "You've seen it all!" + Start Over button
  - No card stack visible behind current card (single card at a time)

- `app/(tabs)/index.tsx` — cleaned up
  - Removed: outer `GestureDetector`, `pullGesture`, `pullY`, pull indicator `Animated.View`, `PULL_THRESHOLD`, `allSwiped`, `GlowBackground` (from showStack area)
  - `handleSwipeRight` now only calls `save(card)` — no `setTopIndex` (CardStack owns scroll position)
  - `handleSwipeLeft` is now a no-op callback
  - `showStack` condition: `!loading && !error && !isEmpty`
  - `CardStack` receives `onIndexChange={(idx) => setTopIndex(idx)}`

- `components/SkeletonStack.tsx` — removed import of `CARD_WIDTH`/`CARD_HEIGHT` from CardStack (those constants were deleted in the rewrite); now uses local `Dimensions.get('window')` values
- `components/PlaceCard.tsx` — removed broken re-export of `CARD_WIDTH`/`CARD_HEIGHT`

---

### `713f510` — Feed expansion (4 changes)
**1. More place types** (`lib/places.ts`)
- Was: `['restaurant', 'bar', 'cafe']` (3 parallel API calls)
- Now: `['restaurant', 'bar', 'cafe', 'night_club', 'art_gallery', 'tourist_attraction', 'museum', 'park']` (8 parallel calls)
- All merged and deduped by `place_id` before returning
- Sorted by rating desc, then distance from HKV

**2. Eventbrite expansion** (`lib/eventbrite.ts`)
- Added `page_size=50` to the existing HKV location search (was default ~10)
- Added a second call: keyword `nightlife` search centred on Delhi (`28.6139, 77.2090`, 20 km radius)
- Both calls run via `Promise.allSettled` — if one fails, the other still returns
- Raw events deduped by Eventbrite event ID before mapping to prevent the same event appearing from both calls

**3. Second SerpAPI query** (`lib/events.ts`)
- Was: single query `'events in Hauz Khas Village Delhi this week'`
- Now: two parallel queries via `Promise.allSettled`:
  - `'events in Hauz Khas Village Delhi this week'` (original)
  - `'things to do Hauz Khas Village Delhi this weekend'` (new)
- IDs prefixed `serp-1-*` and `serp-2-*` to keep React keys unique
- If both fail, throws; if one fails, returns the other's results

**4. Feed mixing ratio + better dedup** (`lib/feedMixer.ts`)
- `dedupeEvents`: upgraded from exact-prefix key match to **Jaccard word-set similarity ≥ 0.7** — e.g. `"DJ Night at HKV"` and `"DJ Night Hauz Khas"` now collapse into one card
- `interleave`: changed from 2-places-then-1-event pattern to **3:2 (place:event)** = 60% places, 40% events

---

## Current State — What's Working

| Feature | Status |
|---|---|
| Auth (phone OTP) | Working |
| Dev skip-auth button | Working (DEV only, shown in `__DEV__`) |
| Feed loads (places + events) | Working |
| TikTok vertical scroll | Working |
| Swipe right → GOING (save) | Working (animates off, scrolls to next) |
| Swipe left → NAH (skip) | Working (animates off, scrolls to next) |
| Swipe up → detail view | Working (opens modal) |
| Tap buttons on card | Working (pointerEvents fix) |
| GOING / NAH stamps during swipe | Working |
| X / N counter | Working (driven by onViewableItemsChanged) |
| End of feed footer | Working (Start Over triggers refresh) |
| Loading skeleton | Working (3 shimmer cards) |
| Error state | Working (with retry button) |
| Empty state | Working |
| Saved tab — grid view | Working |
| Saved tab — filter (All/Places/Events) | Working |
| Saved tab — long-press to remove | Working (animated removal) |
| Saved tab — tap to open detail | Working |
| Profile — stats (points, check-ins, saves) | Working |
| Profile — privacy mode | Working |
| Profile — sign out | Working |
| Profile — delete account | Working |
| Place detail modal | Working (Google Places Details API) |
| Event detail modal | Working |
| Check-in system | Built (`useCheckin`, `CheckinFeedback`, `CheckinSuccess`) |
| Push notifications | Built (`useNotifications` registers token) |
| Privacy ghost mode | Built (shows 👻 badge in feed header) |
| Deep links | Built (`lib/deeplink.ts`) |
| Feed cache | 5 min TTL (places), 15 min TTL (events/Eventbrite/SerpAPI) |

---

## Known Issues / Things to Verify

### 1. Save function — `place_id` field on places
In `useSaved.ts`:
```ts
const placeId = card.type === 'place' ? (card as any).place_id : card.id;
```
`PlaceCard` has both `id` and `place_id` set to the same value (both `p.place_id`), so this works. But worth double-checking saves are actually landing in Supabase for real users — the dev anonymous auth may have RLS differences.

### 2. Eventbrite token scope
If `EXPO_PUBLIC_EVENTBRITE_TOKEN` is a public/private key that requires specific OAuth scopes, the `nightlife Delhi` keyword search may return differently structured errors than the geo search. Check the Eventbrite API dashboard if the second call returns 0 results.

### 3. SerpAPI quota
Two queries per load instead of one. Each SerpAPI call costs 1 credit. Watch quota burn on the free tier.

### 4. Skeleton is still a Tinder-stack style
`SkeletonStack` still renders 3 overlapping cards at different scales (old Tinder visual). Now that the real feed is full-screen TikTok cards, the loading state looks visually inconsistent. Should be updated to a single full-screen shimmer card.

### 5. `notifEnabled` state in Profile is disconnected
`profile.tsx` has a `notifEnabled` Switch that is controlled local state only — it doesn't write to Supabase or the OS notification settings. It's purely cosmetic right now.

### 6. `saves_count` counter is approximate
In `useSaved.ts`, `save()` does:
```ts
await supabase.from('users').update({ saves_count: saved.length + 1 }).eq('id', userId);
```
This is a client-side count and will drift if the user saves from multiple devices. Should use a Postgres function / trigger or `saves_count = saves_count + 1` instead.

### 7. Feed deduplication for places by name
Places are deduped by `place_id` but not by name similarity. If the same bar appears as both a `bar` and a `night_club` in Google's taxonomy with different `place_id`s, it could show twice. Not currently filtered.

---

## What to Build Next (Prioritised)

### High priority — core UX

**A. Fix skeleton to match TikTok layout**
- `components/SkeletonStack.tsx` — replace 3-card Tinder stack with a single full-screen shimmer card
- Remove `SkeletonSingle scale/ty/opacity` stacking pattern
- New layout: full `width`/`height` card with shimmer image area (top ~65%), content area below

**B. Places name-similarity dedup**
- In `lib/places.ts` `fetchNearbyPlaces()`, after merging all 8 type batches, add a second dedup pass using Levenshtein or Jaccard on place names (same as `dedupeEvents` in feedMixer)
- Threshold: ≥ 0.8 Jaccard similarity on name words
- Keep the one with the higher rating

**C. Fix saves_count in Supabase**
- Add a Postgres trigger or use `rpc` call with `saves_count = saves_count + 1` instead of client-counting
- Or query `count(*)` from saves table on profile load

**D. Wire notifications toggle to OS**
- On `notifEnabled` toggle ON: call `Notifications.requestPermissionsAsync()` and store token
- On toggle OFF: update `expo_push_token = null` in `users` table

---

### Medium priority — features

**E. Feed dedup by place name similarity**
- As above — would reduce duplicates in expanded feed (now 8 place types)

**F. Distance label on cards**
- Both `PlaceCard` and `EventCard` have `lat`/`lng`
- Use device location (already requested in `auth/location.tsx`) to show "0.3 km away" on the card detail bar
- Store user location in a context/hook

**G. Filter/sort feed**
- Add a filter button to the feed header
- Filter options: Places only / Events only / Open now / Free events
- "Open now" uses `PlaceCard.opening_hours.open_now`
- "Free" uses `EventbriteCard.is_free` or absence of ticket price

**H. Check-in flow (partially built)**
- `useCheckin.ts` and `CheckinFeedback`/`CheckinSuccess` components exist but are not wired to the UI
- Add a "Check In" button on the Place detail modal
- On check-in: write to `checkins` table, increment `points` and `checkins_count`, show `CheckinFeedback` animation

**I. Map view tab**
- Add a 4th tab "Map" using `react-native-maps`
- Show pins for all cards in current feed
- Tap a pin → open detail modal

**J. Share a place**
- Add share button on place/event detail
- Use `expo-sharing` to share a deep link: `gedi://place/{id}` or `gedi://event/{id}`
- Deep link parsing is already built in `lib/deeplink.ts`

---

### Lower priority — polish

**K. Image pre-loading / blur placeholder**
- Place cards with multiple photos could cycle photos on the card
- Add a blur hash or low-res placeholder while images load

**L. Haptic patterns**
- Already have `hapticLight` on threshold cross, `hapticMedium` on swipe commit
- Add `hapticMedium` on save confirmation (GOING), distinct pattern for NAH

**M. Onboarding improvements**
- `SwipeTutorial` component exists but may need visual update for TikTok-style layout
- Tutorial should now show vertical scroll gesture in addition to horizontal swipe

**N. Saved tab → share / copy link**
- Long-press currently only removes. Could add a share action in the Alert

**O. Analytics / logging**
- No analytics instrumented yet
- Add basic events: feed_load, card_swipe_right, card_swipe_left, detail_open, save, checkin

---

## Key Technical Rules for This Codebase

1. **Never use the Reanimated Babel plugin** — Metro transformer only (SDK 56 / Reanimated v4)
2. **`GestureHandlerRootView` must be the outermost element** in `app/_layout.tsx` — already done, don't move it
3. **Never nest GestureDetectors around a FlatList** — the outer gesture will steal all touches in RNGH v2.31 + New Arch
4. **Always use `failOffsetY` on horizontal-only pan gestures** inside a vertical FlatList — `failOffsetY([-20, 20])` passes vertical movement to the FlatList
5. **Pressables that must co-exist with a GestureDetector must live OUTSIDE it** — use a sibling `Animated.View` with `pointerEvents="box-none"` rendered after (above) the GestureDetector
6. **`withTiming` callbacks must be worklets** — `(finished) => { 'worklet'; ... }` — use `runOnJS()` to call JS functions from inside them
7. **`.env` is never committed** — use `.env.example` with empty values

---

## How to Run

```bash
cd /Users/pingashvohra/code/gedi-app
npx expo start --ios
```

For a clean start (clears Metro cache):
```bash
npx expo start --ios --clear
```

TypeScript check:
```bash
npx tsc --noEmit
```
