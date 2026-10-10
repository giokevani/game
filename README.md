# 🌸 Blossom Bay

Play: https://giokevani.github.io/game/

Blossom Bay is one game with a café inside it. In town she can walk into the 🍳 Blossom Kitchen café on Main Street, cook dishes step by step for guests (in English, with Russian help), then walk back out with the money and build and decorate her own house.

The old link https://giokevani.github.io/game/cook/ now opens Blossom Bay straight at the café. Money and stars from the earlier stand-alone version move over automatically the first time.

## 🌸 Blossom Bay

A cozy 3D life-sim for iPhone Safari: build and decorate your own house, hatch and raise pets, take jobs around a seaside town, and follow a 30-task story to the Blossom Festival. It's inspired by the Roblox games *Brookhaven RP*, *Adopt Me!* and *Welcome to Bloxburg*, but every model, sound and line of text is original and made in code. See [MASTERPLAN.md](MASTERPLAN.md) for the research and design.

Play: https://giokevani.github.io/game/ (once GitHub Pages is switched on, see below)

## For the parent

### 1. Switch on the website (one time, about 1 minute)
1. Open https://github.com/giokevani/game/settings/pages
2. Under Build and deployment → Source, choose GitHub Actions.
3. Open the Actions tab, select Deploy Blossom Bay, and click Run workflow, or re-run the last failed run.
4. After about 2 minutes the game is live at https://giokevani.github.io/game/

### 2. Put it on her iPhone
1. Open the link in Safari.
2. Tap Share → Add to Home Screen.
3. Start the game from the new 🌸 icon. It then runs full screen, works offline, and Safari keeps the save safe. In a normal Safari tab, Safari may delete website data after 7 days without a visit.

### 3. Quick check on the real phone (10 minutes)
I tested the game in Chromium emulating an iPhone 11 Pro screen, but I couldn't test real Safari on a real iPhone. Please check:
- [ ] The game loads and the character creator appears.
- [ ] Walking with the left thumb and looking around with the right thumb feel smooth.
- [ ] Sound plays after the first tap (turn the silent switch off; it mutes web sounds).
- [ ] 🔨 Build: placing a sofa, painting a room, adding floor tiles.
- [ ] Bake a few cakes at Sweet Crumbs.
- [ ] ⚙️ Menu → Graphics shows about 45–60 frames per second. If not, choose Medium.

### Flying, building and exploring

All rides, buildings and furniture are free; clothes use coins. On a keyboard, Space or R flies up, and Shift or F flies down. On a phone, hold ▲ or ▼. The Sky Lift takes you to each cloud level.

Tap 🔨 near home to edit it, near another building to choose a floor, or elsewhere to choose a new building. Walk until the footprint turns green, then tap Build here. Use Add floor for up to three floors. New buildings keep a 16 × 16 metre plot.

The six magic doors are on the beach east of the pier. Follow Back to Blossom Bay to return. If you close the game while visiting another world, your next session starts beside its beach door. Your buildings stay saved in their own worlds.

### Saving
The game saves on the phone automatically every 10 seconds and whenever the app is closed. For extra safety: ⚙️ Menu → Copy backup code and paste it into the Notes app. Restore brings everything back.

### Safety
Single player only. No chat, no ads, no in-app purchases, no accounts, and no data leaves the phone.

## What's in the game
| | |
|---|---|
| Town and sky | The seaside town, Sky Island, plus Cloud Meadow, Rainbow Town and Star Castle. Use the Sky Lift near Town Square or fly there yourself. |
| Buildings | Build at a clear spot on land or clouds. Choose furnished cottages, family houses, townhouses, shops, castles or towers with 1–3 floors, or start from scratch. Each floor has its own editor and stair access. |
| Furniture | 116 items in 10 categories, 12 colours each, with sit, sleep, cook, bath and TV interactions |
| Pets | 30 species from 6 eggs, 5 growth stages with tricks, 10 needs, accessories |
| Jobs | Blossom Kitchen café (see below), bakery, florist, fishing, gardening, delivery |
| Adventures | Six world keepers with connected stories, 18 discoveries, a saved journal, camera-aware clue compass, three hidden cloud postcards and a friendship constellation finale. Town tasks remain available in the journal. |
| Town story | 30 tasks in 5 chapters, 14 townsfolk |
| Collections | 60 stickers, 40 hidden shells, 16 fish, 10 plants |
| Rides | 14 free rides, including a flying unicorn, helicopter, airship and hot-air balloon. Hold ▲ / ▼ to climb or descend. Tap 🚶 to land and get off. |
| Exploration | Endless terrain loads around you, with offshore islands. Six beach doors lead to Space, Heaven, Hell, Candy Land, Underwater Kingdom and Ice Kingdom. Each has a door home. |
| Extras | Outfits shop, balloon trip to Sky Island, day and night, rain and rainbows, music |

Explore at your own pace. The world adventures have no timer, and their progress stays in the same browser save as her house and pets.

## 🍳 The Blossom Kitchen café

The pink café on Main Street (🗺️ Map → 🍳 Blossom Kitchen takes her there). Walk up to the door and tap Cook at the Café; tap 🚪 Leave café to go back into town. All tasks are in English (with 🔊 read-aloud) and there's a small Russian help line under each one, in Cyrillic or Latin letters. See [COOKING_PLAN.md](COOKING_PLAN.md) for the research and design.

| | |
|---|---|
| Cooking | 17 recipes, each 3–7 hands-on steps: add, stir, chop (swipe along the line), fry/grill/bake/boil (stop in the green zone, flip), pour (stop at the line), spread (rub), put toppings (tap), stack a burger or cake, roll, slice |
| Guests | Guests queue at the counter and say their order in a full English sentence, e.g. *"Hi! Can I have a burger with tomato and no cheese, please?"* Better cooking earns tips |
| Menus | 5 menus (Pancake Café → Burger Diner → Pizza Place → Sushi Bar → Sweet Bakery) × 8 levels, 1–3 stars each, and an endless Busy Day for each. New menus open with stars |
| Money | A dish pays about 50–145 Blossom Bay coins plus tips, about as much per minute as the other jobs in town, plus XP towards her Blossom Bay level |
| English | 97 words with pictures in the 📖 Word Book, tap to hear. A 3-question picture quiz after each level pays bonus coins |

First visit: she chooses Russian help in Cyrillic or Latin letters, then Chef Lily explains the café (English with a Russian line) and the first level starts. Each kind of step shows a one-time Russian tip on how to do it.

## For developers
```bash
npm install
npm run dev        # local server
npm test           # unit tests (logic, catalogues, reachability)
npm run build
npm run test:e2e:features # flying, clouds, building, terrain and worlds
npm run test:e2e:adventures # six stories, discoveries, postcards and saved progress
npm run test:e2e   # end-to-end tests in headless Chromium (iPhone 11 Pro emulation)
npm run sim        # economy / pacing simulation
npm run test:e2e:cafe # café end-to-end test (walk in, cook by touch, walk out)
```
The café code lives in `cook/src` and is loaded the first time she walks in (`src/cafe/system.js`), so the town starts as fast as before. Café progress is saved inside the Blossom Bay save (`state.cafe`).
Tech: Three.js (WebGL 2) + Vite. Everything is procedural: no image, model or sound files except the Fredoka font and the app icon.
