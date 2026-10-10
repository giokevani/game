# Blossom Bay handover

Status: 10 October 2026. Development continued in this Codex session after the companion task failed before starting.

## Exploration upgrade

Gio selected a richer world with beautiful places, secrets, characters and adventures. The new Journal contains six character stories, eighteen discoveries, a clue compass that follows the camera, three cloud postcards and a six-friend constellation at Star Castle. Progress is saved and rewards are paid once. Town tasks remain accessible from the Journal.

Every magic world now has a furnished meeting place, an animated keeper and companion, a lit beacon after completion, clearer paths and themed landmarks. Space has a rocket and observatory with a ringed planet; Heaven has a rainbow and cloud garden; Hell has a dragon bakery and volcano; Candy Land has a gingerbread cottage and biscuit bridge; Underwater has a shipwreck and coral garden; Ice has a snow hut, waterfall and aurora ribbons. Story locations and static landmarks are protected from building placement. Return doors sit beside the arrival path so they do not obscure the camera. The old town tracker is hidden while exploring other worlds.

Verification: 53 unit tests, all six adventure stories, 18 finds, three postcards, completion/reload persistence, 24 town checks and all five original feature groups passed. Logs are permanent in `validation/2026-10-10-adventures/`. Player-copy scan: 0 BLOCK, 0 HIGH, 1 MED (short sentences reviewed for young readers).

Run `npm run test:e2e:adventures` for the new end-to-end coverage. The test helper continues to mute speech in all browser contexts. This is Chromium touch emulation; physical iPhone Safari remains unverified.

## Implemented

1. Four flying rides: unicorn, helicopter, airship and hot-air balloon. Keyboard and hold buttons control height. The walk button lands before dismounting. Roof landing surfaces and a height limit are included.
2. Three cloud levels: Cloud Meadow (46 m), Rainbow Town (96 m), Star Castle (150 m), each reachable by Sky Lift and flying. Height checks keep their walls and interactions separate from town.
3. Free building placement on dry, flat land and clouds. Furnished prefabs have 1–3 independently editable floors, stairs, distinct styles, castles and towers. A blank building starts from scratch. New buildings reserve a 16 × 16 metre plot; the original home retains its plot upgrades.
4. Endless 80 m terrain chunks with deterministic scenery, offshore islands and collider cleanup. Town movement has no boundary clamp.
5. Six separate scenes: Space, Heaven, Hell, Candy Land, Underwater Kingdom and Ice Kingdom. Return doors, low gravity in Space, friendly lava bounce-back, carried avatar/pet/ride and safe home-door saving are included.

## Verification

- Unit suite: 53 passed.
- Feature browser tests: flying, clouds, floor editing, cloud placement, stairs, save reload, endless movement and all six worlds passed.
- Endless view: 44 draw calls and 90,084 triangles in the recorded test (budget 260 / 1,100,000).
- Café regression suite: 21/21 passed, including all 17 recipes. Town regression suite: 24/24 passed. Results are recorded in `validation/2026-10-10/town-results.json`.
- Audio and system speech are muted in every browser context created by the test helper. The normal game sound settings are unchanged.
- Deployment succeeded for commit `bce3fdf` after GitHub CLI authentication. Build and deploy: https://github.com/giokevani/game/actions/runs/38052614539.
- Live checks passed at https://giokevani.github.io/game/: released systems, Star Castle travel, Space gravity, return home and no console errors. Evidence: `validation/2026-10-10/deployment.json` and `live.txt`.
- Physical iPhone Safari testing remains open; Chromium uses an iPhone 11 Pro touch viewport.

## Useful commands

```bash
npm test
npm run build
npm run test:e2e:features
npm run test:e2e
npm run test:e2e:cafe
```

Playwright is installed locally without saving a dependency. After reinstalling dependencies, run `npm install --no-save playwright@1.56.1` and `npx playwright install chromium`.

## Branch and delivery

Work stays on `claude/nice-fermi-a6eund`. Gio approved a normal push to that branch after tests pass. The existing GitHub Actions workflow deploys https://giokevani.github.io/game/. No force push or other branch is authorized.

## Fixes found during verification

- The old play helper removed the creator modal DOM while leaving it registered as open. It now completes the creator normally.
- Default ground teleport searched up to 50 m and could select the lowest cloud. Ground travel now chooses the ground; cloud travel passes an explicit height.
- The HUD test expected a hidden level badge. It now checks the visible free-play HUD.
- Synthetic touch events attempted pointer capture without a native pointer. Capture is used for trusted events.
- Café service randomly chooses breakfast recipes. Its pancake touch test now pins its recipe to pancakes.

Permanent verification logs are kept in `validation/2026-10-10/`. Screenshots and the original handover remain in `test/out/` locally. Feature commits are recorded separately in Git.
