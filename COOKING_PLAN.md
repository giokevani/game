# Blossom Kitchen: plan for game #2

## 1. What already exists (research)

| Game | What it does well | What we take |
|------|-------------------|--------------|
| **Cooking Mama** | Every recipe step is a small hands-on game: chop, stir, fry, plate | Hands-on step mini-games |
| **Papa's games** (Burgeria, Pizzeria…) | Take an order, prepare it at stations, get scored on accuracy | Orders with variations, accuracy score |
| **Cooking Fever** | Restaurants with many levels; earn money to unlock new ones | Restaurants → levels → stars |
| **Roblox: Generic Cooking Game, Cook & Sell** | Cook, sell, grow your business | Money loop |

None of them combine cooking with **buying dream houses** and **learning English**. That's what we add, and it's the part that makes ours better.

## 2. The game
- **Cook:** 17 recipes. Each is 4–8 hands-on steps: *add, stir, chop, cook/flip, pour, spread, place, stack, roll, slice*. All done by touch on a 3D kitchen counter.
- **Serve:** customers (the same cute characters as in Blossom Bay) queue at the counter and order dishes with variations, for example a burger with cheese but no onion. You earn money for accuracy, plus a tip.
- **Progress:** 5 restaurants × 8 levels (Pancake Café → Burger Diner → Pizza Place → Sushi Bar → Sweet Bakery). New restaurants unlock with stars. Each restaurant also has an endless "Busy Day" mode.
- **Dream Homes:** 10 houses from a Tiny Studio (150) to a Sky Palace (25,000). Each is shown in 3D; buy it, move in, and every house you own adds +5% to your earnings.
- **English:** every instruction is in English (big) with Russian help (small). Tap 🔊 to hear the English word. A Word Book collects every food word, and a 3-question picture quiz after each level pays bonus coins.
- **Russian explanations** (tutorials, hints) in Cyrillic or Latin letters: she chooses on the first screen.

## 3. Tech and budget
Same engine as Blossom Bay (Three.js, procedural art, no downloads), at `giokevani.github.io/game/cook/`. It has its own save, so it can't touch the Blossom Bay save. Estimated cost: about $40–55 of the remaining credit, with tests included.

## 4. Sources for the research
- Best cooking games overview: https://www.eneba.com/hub/games/best-cooking-games/
- Cooking games for kids and families: https://parentingpatch.com/the-best-cooking-games-for-kids-and-families/
- Cooking Fever restaurants and levels: https://cookingfever.fandom.com/wiki/Restaurants
- Games like Cooking Fever: https://tummygames.com/blog/games-like-cooking-fever
- Roblox *Generic Cooking Game*: https://generic-cooking-game.fandom.com/wiki/Generic_Cooking_Game
- Roblox *Cook & Sell*: https://earnaldo.com/blog/cook-and-sell
- Roblox *Run a Restaurant*: https://runarestaurant.wiki/

These are secondary sources (fan wikis, review sites). I used them only to confirm which mechanics are common in the genre, not for any numbers.

## 5. What was built

| Item | Plan | Result |
|------|------|--------|
| Recipes | 17 | 17, with 1–8 variants each (for example a burger with or without cheese and one of three vegetables) |
| Step types | 10 | 10: add, stir, chop, cook (with flip), pour, spread, place, stack, roll, slice |
| Restaurants × levels | 5 × 8 + Busy Day | Done. Unlock at 0 / 6 / 15 / 26 / 38 stars |
| Dream Homes | 10, +5% each | Done: Tiny Studio 150 → Sky Palace 20,000 coins |
| English | English tasks, 🔊, Word Book, quiz | 97 words; phone voice reads tasks and orders aloud; 3-question quiz after each level |
| Russian help | Cyrillic or Latin | Chosen on first start, changeable in Settings; can be switched off to practise English only |
| Pacing | — | Simulation: all houses after 7.2–8.4 h; all restaurants open after about 2.3 h |
