# GEDI App — Progress Document

> Last updated: 2026-06-15  
> Latest commit: `75b57ea`  
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
| Maps | `react-native-maps` (Apple Maps dark mode on iOS) |
| Analytics | PostHog (`posthog-react-native`, singleton in `lib/analytics.ts`) |
| Push notifications | Expo Notifications |
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
    _layout.tsx            ← Tab bar (Feed, Saved, Map, Profile) — 4 tabs
    index.tsx              ← FEED SCREEN — TikTok scroll + filter pills
    saved.tsx              ← SAVED tab — 2-col grid, long-press to remove
    map.tsx                ← MAP tab — react-native-maps, orange pins
    profile.tsx            ← PROFILE tab — stats, privacy, notifications
  auth/
    phone.tsx              ← Phone entry + dev skip-auth button
    otp.tsx                ← OTP verification
    location.tsx           ← Location permission onboarding
    privacy.tsx            ← Privacy mode onboarding
  place/[id].tsx           ← Place detail modal (slide_from_bottom) — check-in, share
  event/[id].tsx           ← Event detail modal (slide_from_bottom) — share

components/
  CardStack.tsx            ← TikTok FlatList feed — THE main component
  PlaceCardView.tsx        ← Place card: photo cycling, distance label
  EventCardView.tsx        ← Visual card for an event (full-screen)
  PlaceCard.tsx            ← Re-export shim (PlaceCardView as PlaceCard)
  SkeletonStack.tsx        ← Loading skeleton (single full-screen shimmer card)
  StampOverlay.tsx         ← GOING / NAH stamp during swipe
  GlowBackground.tsx       ← Ambient orange glow behind feed
  SwipeTutorial.tsx        ← First-launch gesture hint overlay
  WarningToast.tsx         ← "Some sources unavailable" banner
  GlassCard.tsx            ← Generic frosted-glass container
  PrimaryButton.tsx        ← Orange CTA button
  CheckinFeedback.tsx      ← Post check-in animation (too far / already checked in)
  CheckinSuccess.tsx       ← Check-in success modal (+10 pts)

lib/
  feedMixer.ts             ← Orchestrates all data sources → FeedCard[]
  places.ts                ← Google Places: 8 type calls, deduped by place_id
  events.ts                ← SerpAPI: 2 parallel queries
  eventbrite.ts            ← Eventbrite: 2 calls (HKV geo + Delhi nightlife)
  eventCache.ts            ← In-memory feed cache (used by event detail screen)
  analytics.ts             ← PostHog singleton — call track() from anywhere
  supabase.ts              ← Supabase client
  deeplink.ts              ← Deep link parsing + pending-link storage

hooks/
  useFeed.ts               ← Calls buildFeed(), exposes cards/loading/error
  useSaved.ts              ← Supabase saves CRUD + accurate saves_count sync
  useAuth.ts               ← Supabase auth session
  useCheckin.ts            ← Check-in logic: location, radius check, points
  useLocation.ts           ← Device location (last-known + current)
  usePrivacy.ts            ← Ghost/Friends/Public mode
  useNotifications.ts      ← Push notification registration (after session 3)

constants/
  theme.ts                 ← Colors, Fonts, Spacing, Radius tokens
```

---

## Supabase Tables

| Table | Key columns |
|---|---|
| `users` | `id` (auth UID), `phone`, `points`, `checkins_count`, `saves_count`, `privacy_mode`, `push_token` |
| `saves` | `id`, `user_id`, `place_id`, `place_type` (`place`\|`event`), `place_data` (JSONB full card snapshot), `saved_at` |
| `checkins` | `id`, `user_id`, `place_id`, `place_name`, `points_earned`, `checked_in_at` |

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

PostHog key is hardcoded in `lib/analytics.ts` (it's a public write-only ingest key, safe to commit):
`phc_AY527qs3cbe3cVgWD5LWkDEELZ9h7odw33s5EKdEiCLn`

---

## Commit History

### `67ce415` — Gesture/touch system QA fix
**Problem:** Feed card buttons (→ going, ✗ nah, ↑ details) did not respond to taps in iOS simulator.

**Root causes:**
1. **Nested GestureDetector** — outer pull-to-refresh `GestureDetector` in `index.tsx` wrapped `CardStack` and stole all touches in RNGH v2.31 + New Arch. Fixed: removed outer GestureDetector entirely.
2. **No activeOffset** — Pan activated on any movement. Fixed: `.activeOffsetX([-20, 20]).activeOffsetY([-20, 30])`.
3. **Overlay intercepting touches** — Fixed: `pointerEvents="box-none"` on overlay containers.
4. **TouchableOpacity → Pressable** on all interactive card elements.

---

### `2203c83` — TikTok-style vertical scroll feed
**Replaced** Tinder card-stack with TikTok vertical snap scroll.

- `CardStack.tsx` — complete rewrite: `FlatList` + `pagingEnabled`, `ScrollCard` per item with `.failOffsetY([-20, 20])` so vertical scroll passes to FlatList while horizontal swipe still fires going/nah. Tap overlay `Animated.View` with `pointerEvents="box-none"` sits above `GestureDetector` so Pressable taps always work. `withTiming` callback fires `onGoing`/`onNah` after fly-off animation so new card always starts at `translateX = 0`. `ListFooterComponent` = "You've seen it all" + Start Over.
- `index.tsx` — removed outer GestureDetector, pull gesture, `allSwiped`. `handleSwipeLeft` is now a no-op. Counter driven by `onIndexChange`.

---

### `713f510` — Feed expansion
1. **Places** — 8 type calls instead of 3: added `night_club`, `art_gallery`, `tourist_attraction`, `museum`, `park`
2. **Eventbrite** — `page_size=50` + second call for `nightlife Delhi` (Delhi center, 20 km radius); deduped by raw Eventbrite ID
3. **SerpAPI** — two parallel queries: `'events in HKV this week'` + `'things to do HKV this weekend'`
4. **Feed mixer** — `dedupeEvents` upgraded to Jaccard word-set similarity ≥ 0.7; `interleave` changed to 3:2 (60% places, 40% events)

---

### `75b57ea` — 10 features: skeleton, analytics, filters, map, photo cycling

**1. Skeleton fixed** (`components/SkeletonStack.tsx`)
Single full-screen shimmer card matching TikTok layout: open badge placeholder, name bar, meta row, vicinity, hint row, detail bar. Shimmer pulses on a 1s repeat. No more 3-card Tinder stack.

**2. saves_count fixed** (`hooks/useSaved.ts`)
After every `save()` and `unsave()`, queries `count: 'exact'` from the `saves` table and writes the result to `users.saves_count`. Accurate, covers unsave, no client-side arithmetic drift.

**3. Notifications toggle wired** (`app/(tabs)/profile.tsx`)
- On mount: reads actual OS permission status via `Notifications.getPermissionsAsync()` to initialise the switch correctly.
- Toggle ON: calls `requestPermissionsAsync`, gets push token, writes to `users.push_token`.
- Toggle OFF: sets `users.push_token = null`.
- If OS has blocked permissions: opens device Settings via `Linking.openSettings()`.

**4. Distance label on place cards** (`hooks/useLocation.ts`, `components/PlaceCardView.tsx`, `components/CardStack.tsx`)
- New `useLocation` hook: tries `getLastKnownPositionAsync` first (instant), then `getCurrentPositionAsync` (accurate). Only requests permission if already granted — doesn't prompt again.
- Threaded: `CardStack` (calls `useLocation`) → `ScrollCard` (props `userLat/userLng`) → `PlaceCardView` (haversine calc, renders "0.4 km away").
- Events don't have coordinates, so distance only shows on place cards.

**5. Check-in** — was already fully wired in `place/[id].tsx`. No changes needed.

**6. Share message updated** (`app/place/[id].tsx`, `app/event/[id].tsx`)
Message format: `"Check out [name] on Gedi — Tera sheher. Teri gedi.\ngedi://[type]/[id]"`. Uses native `Share` from react-native (correct for text/URL sharing — `expo-sharing` is for files). Both screens already had share buttons; only the message text changed.

**7. PostHog analytics** (`lib/analytics.ts`)
Lazy singleton: `new PostHog(key, { host: 'https://us.i.posthog.com' })` initialised on first call to `track()`. Exported `track(event, props)` and `identify(userId, traits)` functions. Events tracked:
- `feed_load` — in `index.tsx` on initial load and refresh
- `card_swipe_right / left / up` — in `CardStack.tsx` renderItem callbacks
- `detail_open` — in `place/[id].tsx` and `event/[id].tsx` on mount
- `save / unsave` — in `hooks/useSaved.ts`
- `checkin` — in `app/place/[id].tsx` handleCheckin
- `share` — in both detail screens after `Share.share()` resolves

**8. Feed filter pills** (`app/(tabs)/index.tsx`)
Horizontal row of pills below header: **All / Places / Events / Open Now / Free**. Active pill is solid orange. Filter applied via `useMemo` on `cards` — no re-fetch. Resets `topIndex` to 0 on change. Open Now: keeps places where `opening_hours.open_now === true` + all events. Free: keeps all places + Eventbrite events where `is_free === true` + all SerpAPI events (no price data).

**9. Map tab** (`app/(tabs)/map.tsx`, `app/(tabs)/_layout.tsx`)
4th tab (📍 Map). `react-native-maps` with `userInterfaceStyle="dark"` (Apple Maps dark mode on iOS). Custom orange pin marker (dot + stem). Only place cards shown (events have no coordinates). Calls `useFeed()` independently but hits module-level cache so instant after Feed tab loads. Tap a pin → `router.push('/place/[id]')`.

**10. Photo cycling** (`components/PlaceCardView.tsx`)
`setInterval` every 3 seconds triggers a `withTiming` crossfade: opacity → 0 (400ms) → update `photoIdx` via `runOnJS` → opacity → 1 (400ms). `Animated.Image` animates opacity. Small white dot indicators at top of card show current photo index (capped at 8 dots). Cycle only starts if `photos.length > 1`.

---

## Current State — What's Working

| Feature | Status |
|---|---|
| Auth (phone OTP) | Working |
| Dev skip-auth button | Working (`__DEV__` only) |
| Feed loads (places + events) | Working — 8 place types, 2 Eventbrite calls, 2 SerpAPI calls |
| TikTok vertical scroll | Working |
| Swipe right → GOING | Working (animates off, saves, scrolls to next) |
| Swipe left → NAH | Working (animates off, scrolls to next) |
| Swipe up → detail view | Working (opens modal) |
| Tap buttons on card | Working |
| GOING / NAH stamps during swipe | Working |
| X / N counter | Working |
| Feed filter pills (All/Places/Events/Open Now/Free) | Working |
| Photo cycling on place cards | Working (3s crossfade, dot indicators) |
| Distance label on place cards | Working (`useLocation` hook) |
| End of feed footer | Working |
| Loading skeleton | Working (single full-screen shimmer card) |
| Error + empty states | Working |
| Saved tab — grid view | Working |
| Saved tab — filter (All/Places/Events) | Working |
| Saved tab — long-press to remove (animated) | Working |
| Saved tab — tap to open detail | Working |
| saves_count accuracy | Working (counts from DB, covers unsave) |
| Profile — stats | Working |
| Profile — privacy mode | Working |
| Profile — notifications toggle | Working (real OS permissions + Supabase token) |
| Profile — sign out / delete account | Working |
| Place detail modal | Working (photos, hours, reviews, directions, check-in, share) |
| Event detail modal | Working (tickets, share) |
| Check-in (place detail) | Working (`useCheckin` + `CheckinSuccess` + `CheckinFeedback`) |
| Share on place + event | Working (native share sheet, correct message format) |
| Map tab | Working (dark map, orange pins, tap → detail) |
| PostHog analytics | Working (9 events tracked) |
| Push notifications | Working (`useNotifications` registers after session 3) |
| Privacy ghost mode | Working (👻 badge in feed header) |
| Deep links | Working (`lib/deeplink.ts`) |
| Feed cache | Working (5 min TTL places, 15 min TTL events) |

---

## Known Issues / Things to Verify

### 1. Map tab — events have no pins
Events (Eventbrite, SerpAPI) don't have lat/lng, so only place cards show on the map. The map could show 0 pins if the feed is events-only (unlikely but possible if Open Now or Free filter is active and no places qualify). Consider showing a "No pins for current filter" message.

### 2. SerpAPI quota
Two queries per load instead of one. Each call costs 1 credit. Watch the free-tier quota. Cache TTL is 15 min so repeated loads in the same session hit cache.

### 3. Eventbrite second call scope
The `nightlife Delhi` keyword search may return 0 results if the Eventbrite token lacks the right OAuth scope or if no nightlife events are live at query time. Check the Eventbrite dashboard if the second call consistently returns empty.

### 4. Feed deduplication for places by name
Places are deduped by `place_id` only. The same venue can appear as both `bar` and `night_club` in Google's taxonomy with the same `place_id` (handled), but if Google issues different place_ids for the same venue across types, it could show twice. Low frequency but possible.

### 5. `useLocation` in CardStack re-renders
`useLocation` is called inside `CardStack`. When location resolves (fast → accurate), the hook updates state, which re-renders `CardStack` and therefore all visible `ScrollCard` instances. Since `renderItem` is memoized with `userLocation` in the dep array, this is correct but triggers a `FlatList` re-render. In practice this is one re-render after mount — acceptable.

### 6. Photo cycling memory
Each visible `ScrollCard` → `PlaceCardView` runs its own `setInterval`. With `windowSize={3}` in FlatList, up to 3 intervals are active simultaneously. This is fine for 3 cards but worth watching on low-end Android devices.

### 7. `push_token` vs `expo_push_token` column name
`useNotifications.ts` writes to `users.push_token` (line 89). The Supabase table schema comment in this doc lists `expo_push_token`. Verify the actual column name in the Supabase dashboard — a mismatch would silently fail the update.

---

## What to Build Next

### High priority

**A. Places name-similarity dedup**
In `lib/places.ts` after merging 8 type batches, add a Jaccard dedup pass on place names (same pattern as `dedupeEvents` in `feedMixer.ts`). Threshold ≥ 0.8. Keep the entry with higher rating.

**B. SwipeTutorial update for TikTok layout**
`components/SwipeTutorial.tsx` was designed for the old Tinder stack. Should show vertical scroll gesture (swipe up to advance) in addition to horizontal swipe (right = going, left = nah).

**C. Map shows event venues**
Eventbrite events have `venue_address` (string) but no lat/lng. Could geocode the venue address via Google Places or Geocoding API and show event pins on the map with a different style (e.g. purple dot instead of orange).

---

### Medium priority

**D. Saved tab → share from long-press**
Long-press currently only shows "Remove". Add a share option to the Alert with the same message format as detail screens.

**E. Profile → identify user in PostHog**
After sign-in, call `identify(user.id, { phone: user.phone })` from `lib/analytics.ts` so PostHog links events to a user identity. Best place: inside `useAuth` when session resolves.

**F. Feed empty state per filter**
When a filter returns 0 cards (e.g. "Open Now" at 3am), the generic "Quiet night in HKV" empty state shows. Should show a filter-specific message: "Nothing open right now" / "No free events tonight".

**G. Onboarding → show distance permission rationale**
`auth/location.tsx` requests location but doesn't explain it's used for distance labels and check-in. Add a short explanation before the permission prompt.

**H. Place detail → save/unsave button**
There's no way to save a place from the detail modal. A heart icon in the top-right would let users save directly from the detail view without going back to the feed.

---

### Lower priority / polish

**I. Blur placeholder while photos load**
`PlaceCardView` cycles photos but there's no placeholder during load. Expo's `<Image>` supports `placeholder` prop with a blur hash — add one to avoid flash of empty space.

**J. Haptic on photo cycle**
Add a very light `ImpactFeedbackStyle.Light` haptic on each photo crossfade for tactile feedback.

**K. Counter hides behind filter pills**
The `X / N` counter is `position: absolute, top: headerTop + 44`. The filter pill row is now rendered below the header, which may overlap the counter depending on device. Verify layout on iPhone 14 Pro and iPhone SE.

**L. Android dark map style**
`userInterfaceStyle="dark"` only works on iOS Apple Maps. On Android, `react-native-maps` uses Google Maps and needs `customMapStyle` JSON for a dark theme. Use a standard dark JSON style if Android is ever a target.

---

## Key Technical Rules for This Codebase

1. **Never use the Reanimated Babel plugin** — Metro transformer only (Reanimated v4 / SDK 56)
2. **`GestureHandlerRootView` must be the outermost element** in `app/_layout.tsx` — do not move it
3. **Never nest a GestureDetector around a FlatList** — the outer gesture steals all touches in RNGH v2.31 + New Arch
4. **Always use `failOffsetY` on horizontal-only pan gestures** inside a vertical FlatList — `failOffsetY([-20, 20])` passes vertical movement through to FlatList scroll
5. **Pressables co-existing with a GestureDetector must live OUTSIDE it** — use a sibling `Animated.View` with `pointerEvents="box-none"` rendered after (above) the GestureDetector
6. **`withTiming` callbacks must be worklets** — `(finished) => { 'worklet'; runOnJS(fn)(); }` — never call JS functions directly from a worklet
7. **`.env` is never committed** — use `.env.example` with empty values. PostHog key is safe to commit (public ingest key).

---

## How to Run

```bash
cd /Users/pingashvohra/code/gedi-app
npx expo start --ios
```

Clean start (clears Metro cache):
```bash
npx expo start --ios --clear
```

TypeScript check:
```bash
npx tsc --noEmit
```
