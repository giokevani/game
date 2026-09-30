# 🌸 Blossom Bay + 🧁 Blossom Kitchen

Two games in one repository:

| Game | Link | What it is |
|---|---|---|
| 🌸 Blossom Bay | https://giokevani.github.io/game/ | Build and decorate a house, raise pets, explore a seaside town |
| 🧁 Blossom Kitchen | https://giokevani.github.io/game/cook/ | Cook dishes step by step, serve guests, earn money, buy dream houses, learn English |

Each game has its own save, so playing one never changes the other.

## 🌸 Blossom Bay

A cozy 3D life-sim for iPhone Safari: build and decorate your own house, hatch and raise pets, take jobs around a seaside town, and follow a 30-task story to the Blossom Festival. It's inspired by the Roblox games *Brookhaven RP*, *Adopt Me!* and *Welcome to Bloxburg*, but every model, sound and line of text is original and made in code. See [MASTERPLAN.md](MASTERPLAN.md) for the research and design.

**Play:** https://giokevani.github.io/game/ (once GitHub Pages is switched on, see below)

## For the parent

### 1. Switch on the website (one time, about 1 minute)
1. Open https://github.com/giokevani/game/settings/pages
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open the **Actions** tab, select **Deploy Blossom Bay**, and click **Run workflow**, or re-run the last failed run.
4. After about 2 minutes the game is live at https://giokevani.github.io/game/

### 2. Put it on her iPhone
1. Open the link in **Safari**.
2. Tap **Share → Add to Home Screen**.
3. Start the game from the new 🌸 icon. It then runs full screen, works offline, and Safari keeps the save safe. In a normal Safari tab, Safari may delete website data after 7 days without a visit.

### 3. Quick check on the real phone (10 minutes)
I tested the game in Chromium emulating an iPhone 11 Pro screen, but I couldn't test real Safari on a real iPhone. Please check:
- [ ] The game loads and the character creator appears.
- [ ] Walking with the left thumb and looking around with the right thumb feel smooth.
- [ ] Sound plays after the first tap (turn the silent switch off; it mutes web sounds).
- [ ] 🔨 Build: placing a sofa, painting a room, adding floor tiles.
- [ ] Bake a few cakes at Sweet Crumbs.
- [ ] ⚙️ Menu → Graphics shows about 45–60 frames per second. If not, choose Medium.

### Saving
The game saves on the phone automatically every 10 seconds and whenever the app is closed. For extra safety: ⚙️ Menu → **Copy backup code** and paste it into the Notes app. **Restore** brings everything back.

### Safety
Single player only. No chat, no ads, no in-app purchases, no accounts, and no data leaves the phone.

## What's in the game
| | |
|---|---|
| Town | 6 areas: Home Street, Town Square, Blossom Park, Sunny Beach, Crystal Cove, Sky Island |
| House | Tile-based building with automatic outside walls, inside walls, 9 door and window types, 19 floors, 23 wallpapers, 10 outside styles, 4 land sizes, cut-away walls |
| Furniture | 116 items in 10 categories, 12 colours each, with sit, sleep, cook, bath and TV interactions |
| Pets | 30 species from 6 eggs, 5 growth stages with tricks, 10 needs, accessories |
| Jobs | Bakery, florist, fishing, gardening, delivery, each with 5 levels |
| Story | 30 tasks in 5 chapters, 14 townsfolk |
| Collections | 60 stickers, 40 hidden shells, 16 fish, 10 plants |
| Extras | Outfits shop, 4 rides, balloon to Sky Island, day and night, rain and rainbows, music |

**Play time:** a simulation of a typical player (`npm run sim`) finishes the story in **9.9–10.9 hours** across random seeds. Owning every piece of furniture takes about 12–15 hours, and collecting all 30 pets takes longer still. These figures come from a model, not from watching a real child play; see the assumptions at the top of `test/sim/economy.mjs`.

## 🧁 Blossom Kitchen

Cook in five restaurants, get paid by your guests and buy ten Dream Homes. All tasks are in **English** (with 🔊 read-aloud) and there's a small **Russian help line** under each one, in Cyrillic or Latin letters. See [COOKING_PLAN.md](COOKING_PLAN.md) for the research and design.

| | |
|---|---|
| Cooking | 17 recipes, each 3–7 hands-on steps: add, stir, chop (swipe along the line), fry/grill/bake/boil (stop in the green zone, flip), pour (stop at the line), spread (rub), put toppings (tap), stack a burger or cake, roll, slice |
| Guests | Guests queue at the counter and say their order in a full English sentence, e.g. *"Hi! Can I have a burger with tomato and no cheese, please?"* Better cooking earns tips |
| Progress | 5 restaurants (Pancake Café → Burger Diner → Pizza Place → Sushi Bar → Sweet Bakery) × 8 levels, 1–3 stars each, and an endless **Busy Day** for each restaurant |
| Dream Homes | 10 houses from a Tiny Studio (150 🪙) to a Sky Palace (20,000 🪙). Each house you own adds +5% to your earnings |
| English | 97 words with pictures in the 📖 Word Book, tap to hear. A 3-question picture quiz after each level pays bonus coins |

**Play time:** the pacing simulation (`npm run sim:cook`) buys every house after **7.2–8.4 hours** across three player skill levels. All five restaurants are open after about 2.3 hours. This is a model, not a measurement of a real child playing.

**First start:** she chooses Russian help in Cyrillic or Latin letters, then Chef Lily explains the game (English with a Russian line) and the first café level starts. Each kind of step shows a one-time Russian tip on how to do it.

## For developers
```bash
npm install
npm run dev        # local server
npm test           # unit tests (logic, catalogues, reachability)
npm run build
npm run test:e2e   # end-to-end tests in headless Chromium (iPhone 11 Pro emulation)
npm run sim        # economy / pacing simulation
npm run test:e2e:cook  # Blossom Kitchen end-to-end test
npm run sim:cook       # Blossom Kitchen pacing simulation
```
Blossom Kitchen lives in `cook/` and reuses the Blossom Bay engine (`src/engine`, avatars, UI helpers). It is built as a second Vite page (`cook/index.html`).
Tech: Three.js (WebGL 2) + Vite. Everything is procedural: no image, model or sound files except the Fredoka font and the app icon.
