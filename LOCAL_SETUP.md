# Blossom Bay on your own computer

## 1. Get the game
1. Install **Node.js** (version 22 or newer, from nodejs.org) and **Git** (git-scm.com).
2. Open a terminal and run:
   ```
   git clone https://github.com/giokevani/game.git
   cd game
   git checkout claude/nice-fermi-a6eund
   npm install
   npm run dev
   ```
3. The terminal shows two addresses:
   - Open `http://localhost:5173` on the computer.
   - Her iPhone can use the "Network" address (`http://192.168.x.x:5173`) if it is on the same Wi-Fi.

If you'd rather not use the terminal: on the GitHub page, switch to the branch `claude/nice-fermi-a6eund`, then **Code → Download ZIP**. You still need Node.js and `npm install` / `npm run dev` to run it.

## 2. Keep building it with Claude Code
1. Install Claude Code on your computer (setup guide: code.claude.com/docs).
2. In the terminal, go into the `game` folder and run `claude`.
3. Paste the brief below. Do it **one part at a time**, in this order, and test on her phone after each part.

Note: Claude Code on your computer uses your own Claude plan, so the work still costs credit or plan usage. Only the hosting is free.

## 3. Brief to paste

> Blossom Bay (Three.js + Vite, procedural art, iPhone Safari). Free play: no levels, only clothes cost coins. Add, one at a time:
> 1. **Fly up to the sky:** a unicorn she can ride that flies up and down, plus a helicopter, an airship and the hot-air balloon. Flying goes in `src/vehicles/system.js`.
> 2. **Sky city:** 3 cloud levels above the town, each with ground she can walk on.
> 3. **Build anywhere:** put buildings on any level: houses, shops, castles, towers. She can choose ready-made houses (different styles, already furnished, 1–3 floors) or build from scratch. Reuse `src/house/`.
> 4. **No world edge:** an endless world that generates new land in chunks as she walks, so she can go in any direction forever.
> 5. **Magic doors** that teleport to other worlds, all in English: Space, Heaven, Hell (as a friendly lava world), and more (for example Candy Land, Underwater Kingdom, Ice Kingdom). Each world is its own scene with a door back home.
>
> Keep everything free, keep it smooth on an iPhone 11 Pro, and add tests for each part like `test/e2e/run.mjs`.

## 4. Useful commands
| Command | What it does |
|---|---|
| `npm run dev` | Start the game locally |
| `npm test` | Logic tests |
| `npm run build` | Build the version that goes online |
| `npm run test:e2e` | Browser tests for the town |
| `npm run test:e2e:cafe` | Browser tests for the café |

The online version is at https://giokevani.github.io/game/. It updates automatically when changes are pushed to the branch above (see the repo's **Actions** tab).
