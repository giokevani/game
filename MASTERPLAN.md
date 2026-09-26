# Blossom Bay — Masterplan

A cozy 3D life-sim for an 11-year-old, built to run in Safari on an iPhone 11 Pro from a single link. Hosting is free (GitHub Pages) and the build has to fit inside a $100 cloud-credit budget.

---

## 1. Which games to copy (research result)

**Answer:** the two games that best match "most popular with 11-year-old girls" *and* "build and organize a house" are:

| # | Game | Why it ranks | Core loop we take from it |
|---|------|--------------|---------------------------|
| 1 | **Brookhaven RP** | Most-played roleplay game on Roblox: ~513k concurrent players and 83.7B+ visits (June 2026, per MaxLevelGG chart summary). Parent guides call it a "digital dollhouse"; houses, cars and jobs are all free to use. | A town to explore, your own house, vehicles, NPC roleplay, day/night |
| 2 | **Adopt Me!** | Second only to Brookhaven by total visits in the same chart; its studio Uplift Games states 425M+ players. ~315k concurrent, 43.8B+ visits (June 2026, same chart summary). | Hatch eggs, raise pets through growth stages by caring for their needs, decorate your house, collect rarities |
| + | *Welcome to Bloxburg* (mechanic reference only) | The best-known Roblox house-building game | The grid build mode: paint floors, walls appear, place/rotate furniture, jobs that pay for it |

**How confident is this?** Medium. The data shows:
- 69% of Australian 10–11-year-olds play Roblox (Roy Morgan Young Australians Survey, Dec 2025).
- Roblox overall is 39% female / 52% male, but one analysis of 100 popular Roblox games found roleplay titles around **70% female**, with Adopt Me! pulling that number up (Matthew Warneford, LinkedIn, Sept 2024).
- Brookhaven and Adopt Me! are the two biggest roleplay games by visits and concurrent players in every 2026 chart I found.

What I **could not** find: a public dataset that ranks games by *age and gender together*. The top-2 pick is therefore an inference from (a) overall popularity, (b) the genre's gender skew, (c) your daughter's stated interest in houses. *Dress to Impress* is also very popular with tween girls, but it's a fashion runway game, not house building, so it's #3 and only borrowed from for the avatar/outfit shop.

Primary sources (roblox.com charts, Wikipedia) were blocked by this environment's network proxy, so the player counts above come from search-result summaries of secondary chart sites, not from Roblox directly. Treat them as approximate.

**Legal line:** we copy *mechanics* (genre conventions nobody owns), not names, logos, characters, artwork, sounds or UI of those games. Every model, texture, sound and piece of music in Blossom Bay is generated in code, so there are no asset licences to worry about.

---

## 2. The game: Blossom Bay

A pastel seaside town. She moves into a little cottage, adopts a pet from an egg, takes jobs around town to earn coins, and turns her cottage into her dream home.

### 2.1 Core loops

```
 Jobs & pet care ──► Coins + XP ──► Furniture, eggs, outfits, vehicles, bigger plot
        ▲                                        │
        └──── new areas, new jobs, new quests ◄──┘
```

### 2.2 Content targets (what "everything" means for the 10 hours)

| System | Content | Borrowed from |
|--------|---------|---------------|
| Town | 5 zones: Home Street, Town Square, Park & Gardens, Beach & Pier, Crystal Cove; plus an unlockable Sky Island | Brookhaven |
| House building | Paint floor tiles → walls build themselves; tap edges for interior walls, doors, windows; wallpaper & floor styles; 4 land sizes | Bloxburg |
| Furniture | 120+ items in 10 categories (living, bedroom, kitchen, bath, kids, pets, garden, lights, decor, special), most in several colours; sit/sleep/use interactions | Bloxburg / Adopt Me! |
| Home Rating | 1–5 stars from room count, furniture variety and decor; rewards at each star | Adopt Me! house |
| Pets | 30 species from 6 eggs (Common → Legendary odds); 5 growth stages (Baby, Kid, Teen, Grown, Sparkle); needs: hungry, thirsty, sleepy, dirty, bored, plus "wants to visit" a place; naming, tricks, accessories | Adopt Me! |
| Jobs (mini-games) | Bakery (cake orders), Florist (bouquets), Gardening (plant → water → harvest), Fishing (timing), Delivery (scooter run). Each levels up | Bloxburg |
| Avatar | Skin, hair styles/colours, tops, bottoms, dresses, shoes, hats, bows, glasses, wings; emotes | Roblox / Dress to Impress |
| Vehicles | Scooter, bike, golf cart, car | Brookhaven |
| Story | ~30 quests in 5 chapters from town NPCs, ending in the Blossom Festival with fireworks and a house contest | — |
| Collections | 40 hidden sparkle shells, 16 fish, 10 plants, 30 pets, 60 stickers (achievements) | — |
| World | Day/night cycle (1 day = 20 min), rain showers with a rainbow afterwards, fireflies at night | — |

### 2.3 Pacing to ~10 hours

| Chapter | Hours | What she unlocks |
|---------|-------|------------------|
| 1. Moving In | 0 – 1 | Tutorial, starter cottage, first egg hatches, Bakery job, first furniture |
| 2. Settling Down | 1 – 3 | Garden + Florist jobs, room expansion, 2nd egg, park/beach pet needs |
| 3. Making Friends | 3 – 5 | Fishing, scooter, pets reach Teen, boutique outfits, 3-star home |
| 4. Growing Up | 5 – 7.5 | Delivery job, car, Crystal Cove + legendary egg, bigger plot |
| 5. Festival | 7.5 – 10 | Hot-air balloon to Sky Island, festival, 5-star home, finish collections |

These hours are a design target. Before release I run an economy simulation (coins earned per minute vs. total cost of everything) and adjust prices so the total lands between 9 and 11 hours for a player who does roughly one job, then some pet care, then some decorating in turn. Real play time will vary; kids who love decorating will spend longer.

---

## 3. Technical plan

| Decision | Choice | Why |
|----------|--------|-----|
| Engine | Three.js (WebGL 2) + Vite | Runs in iPhone Safari with no app install, full control over the look |
| Art | 100% procedural: rounded low-poly models, PBR materials, generated textures | No downloads to license, tiny page (< 3 MB), consistent pastel style |
| Look | ACES tone mapping, soft sun shadows, sky dome with gradient + clouds, animated water, swaying instanced grass/flowers, image-based reflections, sparkle particles, glassy rounded UI with Fredoka font | "Beautiful" on a mobile GPU without post-processing cost |
| Controls | Left thumb joystick, right-side drag to orbit, pinch to zoom, big Jump / Action buttons; build mode uses tap + drag | Same layout as Roblox mobile, which she already knows |
| Save | Autosave to the phone (localStorage) every 10 s and on app switch; backup code export/import in Settings | No accounts, no server, nothing to pay for |
| Offline | Service worker caches the game after first load | Plays without Wi-Fi once opened |
| Hosting | GitHub Pages from this repo, deployed by GitHub Actions | Free, public HTTPS link |
| Safety | Single-player, no chat, no ads, no purchases, no data leaves the phone | Appropriate for an 11-year-old |

### iPhone 11 Pro performance budget

A13 GPU, 4 GB RAM, 2436×1125 screen.

- Render at pixel ratio ≤ 2 (not the native 3), with automatic drop to 1.5 if FPS falls below 45.
- Under 150 draw calls and under 250k triangles per frame (checked in automated tests via `renderer.info`).
- One shadow-casting light; shadow map follows the player.
- Instanced meshes for grass, flowers, trees, fences.
- Audio unlocked on the first tap (iOS rule). Note: the iPhone's silent switch mutes web audio.

### What we deliberately leave out

- **Multiplayer.** It needs a paid server and moderation, which breaks both the budget and the safety goal. NPC townsfolk fill the town instead.
- **Multi-storey houses.** One large floor with four land sizes keeps touch building simple.

---

## 4. Budget plan ($100 cloud credit)

The only thing that costs money is my own work in this session. Hosting, tools and assets are free.

Price basis: Claude Opus 5.5 at $4 per million input tokens, $20 per million output tokens, $0.20 per million cached-input tokens (Anthropic model table, cached 2026-06-24). Most of the cost in a long coding session is re-reading the growing conversation, not writing code.

| Phase | Deliverable | Est. cost |
|-------|-------------|-----------|
| 0 | Research + this masterplan | $3 |
| 1 | Engine: renderer, world, sky/water/nature, avatar, controls, UI shell, save/load | $12 |
| 2 | Build mode, 120+ furniture items, Home Rating | $14 |
| 3 | Pets: eggs, hatching, needs, growth, collection | $9 |
| 4 | Jobs/mini-games, economy, quests & NPCs | $12 |
| 5 | Avatar shop, vehicles, collectibles, day/night, weather, audio | $9 |
| 6 | Tests, visual polish, performance, GitHub Pages deploy | $11 |
| | **Planned build** | **≈ $70** |
| | **Reserve** for fixes after she plays | **≈ $30** |

**What I can't do:** I can't see your credit balance from inside this session, so these are estimates, not meter readings. Check the real number under claude.ai → Settings → Usage between phases. Every phase ends with a commit that runs on its own, so if the credit runs out early she still has a working, if smaller, game.

---

## 5. Test plan ("well tested and fully functional")

1. **Logic unit tests** (Node test runner): economy, pet growth, egg odds, needs timers, build-grid rules (walls, doors, overlaps), Home Rating, quests, save/load and save-version upgrades.
2. **Reachability test:** an automated check that every pet, furniture item, outfit, quest, fish, plant, sticker and area can actually be unlocked. Nothing is left impossible to get.
3. **Economy simulation:** checks that total play time to 100% lands at 9–11 hours.
4. **Browser end-to-end tests** (Playwright + Chromium emulating an iPhone 11 Pro screen with touch): boot without console errors, tutorial, walk, build a room, place and rotate furniture, hatch an egg, finish every job mini-game, drive, save → reload → state intact. Performance budget (draw calls, triangles) asserted.
5. **Visual review:** screenshots of every zone at day and night, build mode and each job, reviewed and polished.
6. **Real-device check (your part, ~10 minutes):** only real Safari on the real phone can confirm feel and FPS. I can't run Safari or iOS here, so I'll give you a short checklist.

---

## 6. Delivery

1. You enable GitHub Pages once: repo **Settings → Pages → Source: GitHub Actions** (one click; I can't change repo settings from here).
2. Link: `https://giokevani.github.io/game/`
3. On her iPhone: open the link in Safari → Share → **Add to Home Screen**. The game then opens full-screen like an app, works offline, and Safari won't clear her save.

---

## 7. Status at the end of the build session

| Item | Plan | Result |
|------|------|--------|
| Zones | 5 + Sky Island | Done (6) |
| Furniture | 120+ | 116 items, 12 colours each |
| Pets | 30 species, 6 eggs, 5 stages | Done |
| Jobs | 5 mini-games with levels | Done (bakery, florist, fishing, garden, delivery) |
| Story | ~30 quests, 5 chapters | 30 quests, 14 townsfolk |
| Collections | 40 shells, 16 fish, 10 plants, 60 stickers | Done |
| Avatar, rides, weather, music | As planned | Done |
| Unit tests | Logic, catalogues, reachability | 24 tests, all passing |
| End-to-end tests | Boot, build, pets, jobs, save/reload... | 21 tests in Chromium with iPhone 11 Pro emulation, all passing |
| Pacing | 9–11 h to finish | Simulation: 9.9–10.9 h to finish the story (3 seeds); every furniture item 11.6–14.6 h |
| Performance | < 150 draw calls, < 250k triangles | Town Square: 142 draw calls, about 466k triangles including the shadow pass. That's over the triangle target. Graphics drop to Medium or Low automatically if frame rate falls below 40 fps. Only the real-phone check can confirm how smooth it feels |
| Real iPhone test | Your 10-minute check | Still open; see README |

**Found and fixed by the tests:** a backup restore was overwritten by the auto-save during reload; after the balloon ride or fast travel to Sky Island, the player landed on the ground far below the island.

**Budget:** I can't read the credit meter from this session. My rough estimate for this whole session is $25–35 of the $100, based on Opus 5.5 token prices. That leaves most of the credit for fixes after she has played. Check the real figure under claude.ai → Settings → Usage.
