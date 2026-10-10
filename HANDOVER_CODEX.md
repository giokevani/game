# Handover to Codex: Blossom Bay, Jeva's 5 new features

Status: 10.10.2026. Claude Code stopped here on Gio's request. The work is uncommitted and not pushed.

## 1. Goal

Build the 5 features from `LOCAL_SETUP.md` §3 into Blossom Bay (Three.js + Vite, procedural art, iPhone Safari):

1. **Fly up to the sky**: a unicorn she can ride that flies up and down, plus a helicopter, an airship and a hot-air balloon. Flying lives in `src/vehicles/system.js`.
2. **Sky city**: 3 cloud levels above the town. She can walk on each one.
3. **Build anywhere**: place buildings on any level: houses, shops, castles and towers. She can pick ready-made houses (different styles, already furnished, 1–3 floors) or build from scratch. Reuse `src/house/`.
4. **No world edge**: endless land that loads in chunks as she walks, in every direction.
5. **Magic doors** to other worlds, all in English: Space, Heaven, Hell (a friendly lava world), Candy Land, Underwater Kingdom and Ice Kingdom. Each world is its own scene with a door back home.

Constraints: everything free (only clothes cost coins), smooth on an iPhone 11 Pro, tests for each part in the style of `test/e2e/run.mjs`.

**Delivery requirement (Gio, 10.10.2026):** after the features are done, push to branch `claude/nice-fermi-a6eund`. The GitHub Actions workflow `.github/workflows/deploy.yml` then rebuilds https://giokevani.github.io/game/, so Jeva plays on the same link. The workflow runs `npm ci`, `npm test` and `npm run build`, so unit tests must pass before the deploy goes through.

## 2. Repo and setup

- Local clone: `~/Developer/game`, branch `claude/nice-fermi-a6eund`, base commit `b0a6903`.
- Remote: https://github.com/giokevani/game.git. Push credentials on this Mac are not checked yet. `gh` is not installed.
- Node 24.11 works (CI uses Node 22).
- Playwright is not a project dependency. I installed it with `npm install --no-save playwright@1.56.1` and `npx playwright install chromium`. After any `npm install` or `npm ci`, run it again. `test/e2e/lib.mjs` loads it from `node_modules`.
- E2E tests run against `vite preview`, so run `npm run build` first.

| Command | Purpose |
|---|---|
| `npm test` | Unit tests, 36/36 pass at baseline |
| `npm run build && npm run test:e2e` | Town E2E, 21/24 pass at baseline (see §5) |
| `npm run test:e2e:cafe` | Café E2E (not run in this session) |
| `node test/e2e/play.mjs steps.json` | New dev helper: opens the game, skips the intro, runs JSON steps `{js, keys, game, wait, shot}`, saves screenshots to `test/out/` |

## 3. Done so far (Part 1, uncommitted, not verified)

`git status` shows 7 modified files plus 1 new file:

- `src/engine/input.js`: `flyUpHeld`/`flyDownHeld` flags and `flyAxis()`. On a keyboard, Space or R goes up, Shift or F goes down.
- `src/player/player.js`: `MAX_FLY_Y = 320`, `this.bounds` (default `WORLD`, `null` means no edge, prepared for Part 4), `clampBounds()`, and a new `fly(dt, input)` branch with no gravity, ▲▼ climb, landing on ground, roofs, clouds or the water surface, and `vehicle.autoLand`.
- `src/vehicles/system.js`: 4 new `fly: true` rides (`unicorn`, `helicopter`, `airship`, `balloon`) with procedural models in `flyingModel()`. The unicorn has gallop legs, flapping wings and a rainbow mane; the helicopter and airship have spinning rotors and props. New in the file: a "In the sky" group in the ride picker with rendered thumbnails, `animateFlyer()` (legs, wings, rotors, banking, unicorn sparkle trail), ▲▼ hold buttons (`.fly-box`) that replace the jump and emote buttons while flying, and `dismount(now = true)`. The 🚶 button calls `dismount(false)`: high in the air the ride lands first, then she gets off. The old "rides stay on the ground above y 40" limit is gone.
- `src/player/avatar.js`: new `ride` pose (legs down, hands on the reins).
- `src/world/world.js`: town building colliders now have real `top` heights (shop 8, house 8.5, town hall 13, lighthouse 24), so flying rides can pass over roofs.
- `src/game.js`: camera distance uses `vehicles.riding.v.cam`.
- `src/style.css`: `.fly-box` and `.fly-btn`.
- `test/e2e/play.mjs`: the dev helper above.

**Open bug, found in the last run:** with the unicorn mounted, holding Space for 2 s of game time left `pos.y = 0`, so it did not climb. No console errors. The most likely cause is that the character-creator modal was still logically open in the helper (it removes `.modal-bg` from the DOM, but `UI.anyModalOpen()` may track its own state). In that case `game.frame` sets `input.enabled = false` and `player.frozen = true`, and `flyAxis()` returns 0. Check this first: finish the creator the way `run.mjs` does, then test again. If it still fails, debug `Player.fly()`. Screenshots from that run are in `test/out/p1-*.png`.

Still open for Part 1: fix the bug, check the visuals (models, seat heights, camera), and write the E2E test (climb, land, fly over a roof, auto-land on 🚶, picker shows 4 sky rides).

## 4. Plan for Parts 2–5 (design notes, not built)

These come from reading the code. Treat them as a proposal.

**Key facts about the code**
- `World` (`src/world/world.js`) holds collision boxes and circles in an 8 m grid (`top`, `tag`, `off`), platforms that are scanned linearly in `groundAt`, and interactables. `blockedAt` skips tags `house` and `furn`.
- Heights come from the global `terrainHeight()` in `src/world/terrain.js`. The ground is one 360×320 m mesh. Edge hills grow quadratically past |x| > 132 and z < −112. The sea is a 1400×700 plane at z = 380. `WORLD` bounds clamp the player.
- The house is a single instance: `ORIGIN`, `FLOOR_Y` and `houseUniforms` are module globals in `src/house/view.js`. Colliders use the global tags `house` and `furn`, so `removeTagged` would wipe every house. `BuildMode` reads `sys.house`, `sys.view` and `ORIGIN`.
- The sky lights, fog and dome are in `src/world/sky.js`. Fog runs from 90 to 330, and the camera far plane is 900.

**Part 2, sky city:** new `src/world/skycity.js`. Put 3 levels in `map.js`, for example Cloud Meadow at y 46 near (−20, −30), Rainbow Town at y 96 near (50, −30) and Star Castle at y 150 near (−10, −60). Keep them clear of Sky Island (0, 82, −112, r 24). Each level is a union of cloud discs used as a platform `test`, merged meshes with `cast: false` so the town stays in sunlight, and decor with collider tops. Add a Sky Lift pad in town (add it to `isBlocked`) with a level picker and a short cutscene like `balloonUse`. Add the levels to `ZONES` with a y range, generalise `zoneAt`, and add `TRAVEL` entries in `menus.js`.

**Part 3, build anywhere** (the biggest part):
- Make `HouseView` take an `origin {x, y, z}`, per-view materials and uniforms (three.js shares the GL program through `customProgramCacheKey`), per-view collider tags, and a `soft` flag for `blockedAt`.
- Give colliders a `bot` (bottom) so upper-floor walls do not block the ground floor. Give interactables a `dy` so upstairs items do not show from below.
- A building is `{id, realm, x, y, z, floors: [houseModel…], roofStyle, sign}`. Floor height = `WALL_H + FLOOR_Y` = 3.25. The home becomes floors `[state.house, …]`.
- Add a `stairs` furniture item with "Go upstairs / Go downstairs" teleport interactions.
- Add roof styles `hip` (the current one), `flat` with battlements for castles, and `spire` for towers.
- Prefab generators: houses with 1–3 floors, shops with a sign, castles and towers, all furnished. A unit test must check every furniture placement with `HM.checkPlace`.
- Placement mode: a footprint follows her; ✓ builds, ✕ cancels. Reject overlaps, water and bumpy ground (> 0.7 m). Hide nature instances inside the footprint.
- 🔨 Build button: near a placed building → edit it; near home → the current home build mode (keeps `run.mjs` passing); elsewhere → a catalogue modal.
- `BuildMode` gets a target building and floor, plus a floor switcher with "add floor" (max 3).
- Hide buildings beyond about 150 m and furniture beyond about 45 m to stay under the draw-call budget.

**Part 4, no edge:**
- Replace the quadratic edge hills with a smooth ridge and endless rolling noise. The sea continues south with deterministic islands.
- Load 80 m ground chunks around the player and skip the original town mesh rect. Use 2.5 m vertex spacing so the seams match, and analytic normals. Build about one chunk per frame.
- Add per-chunk merged trees, rocks and flowers by biome, plus rare landmarks. Remove colliders by reference on unload, not with `removeTagged`.
- The sea plane and far ring follow the player. Set `player.bounds = null`. The map shows "far away" outside the town.
- Float precision starts to drift after about 20 km. That is acceptable.

**Part 5, magic doors:**
- Put a row of 6 doors on the beach around x 58–118, z ≈ 40, and add the area to `isBlocked`.
- Each realm gets its own `THREE.Scene`, its own `World` (needs a height function and a `waterY` parameter), lights, fog, sky dome, decor, particles and a door home. Space gets low gravity, so add `player.gravity`. Hell gets lava that bounces her back with "Hot! 🔥" and no harm.
- Travel swaps `game.scene`, `game.world`, `player.world` and `rig.world`, then moves the avatar root, pet model, FX mesh and any mounted vehicle into the new scene.
- Mark home-only systems (Shells, NPC, Jobs delivery, Weather, the house door update) as `homeOnly` and skip them in `game.frame` when away. Otherwise shells can be collected at matching coordinates in other worlds.
- On save while away, store the position in front of that world's door in town.

**Tests to add:** `test/e2e/features.mjs` (one block per part, plus draw-call and triangle limits in the sky, endless land and each world), `test/unit/features.test.mjs` (terrain continuity, prefab validity, placement rules, realm definitions), and an npm script `test:e2e:features`.

## 5. Baseline test failures (before any change)

`npm run test:e2e` on the untouched `b0a6903` gave 21/24:
- "HUD fits the iPhone screen": the level pill is hidden in free play, so its rect is all zeros and the overlap check fails. Test bug.
- "build mode: a pinch never lays floor": headless Chromium throws `setPointerCapture … No active pointer`. Synthetic-event issue.
- "fishing is easy": a button selector returns undefined. Not investigated.

Town performance at baseline: 78 draw calls and 325k triangles (limit 260 and 1.1M).

## 6. Next steps

1. Fix the Part 1 bug, verify, add tests, commit.
2. Parts 2 → 5, one at a time. After each part: `npm test`, build, E2E, check the screenshots, commit.
3. Update `README.md` ("What's in the game") and `LOCAL_SETUP.md`.
4. Push to `claude/nice-fermi-a6eund`, check the Actions run, and open https://giokevani.github.io/game/ to confirm the live game.
