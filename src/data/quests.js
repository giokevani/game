// Story quests (5 chapters) and stickers. Objectives are evaluated against the
// game state; "rel" objectives count from when the quest started.
import { jobLevel } from './jobs.js';
import { stageOf, SPECIES, SPEC } from './pets.js';
import { levelFromXP } from '../core/state.js';
import { FISH } from './jobs.js';
import { SEEDS } from './jobs.js';

export const CHAPTERS = ['Moving In', 'Settling Down', 'Making Friends', 'Growing Up', 'The Blossom Festival'];

const O = {
  talk: (npc, text) => ({ kind: 'talk', npc, text: text || `Talk to ${npc}` }),
  stat: (key, n, text) => ({ kind: 'stat', key, n, rel: true, text }),
  abs: (fn, n, text) => ({ kind: 'abs', fn, n, text }),
  zone: (z, text) => ({ kind: 'zone', zone: z, text }),
};

const tiles = (s) => Object.keys(s.house.tiles).length;
const inner = (s) => Object.keys(s.house.inner).length;
const maxStage = (s) => s.pets.reduce((m, p) => Math.max(m, stageOf(p.tasks)), -1);
const lvl = (s) => levelFromXP(s.player.xp).level;
const catCount = (cat) => (s, F) => s.house.furniture.filter((f) => F[f.id]?.cat === cat).length;

export const QUESTS = [
  // Chapter 1
  { id: 'welcome', ch: 0, npc: 'mayor', title: 'Welcome to Blossom Bay', lines: ['Hello and welcome to Blossom Bay! I\'m Mayor Maple. 🌸', 'This cozy cottage on Home Street is yours now!', 'Why don\'t you make it feel like home? Tap 🔨 Build and add something nice.'], objs: [O.stat('itemsPlaced', 1, 'Place any furniture in Build mode 🔨')], reward: { coins: 120, xp: 40 }, auto: true },
  { id: 'firstpet', ch: 0, npc: 'pip', title: 'A Furry Friend', lines: ['Hi hi! I\'m Pip from Paw Pals! 🐾', 'Every home needs a pet. Here\'s a Starter Egg, just for you!', 'Take good care of it — when it needs something, a bubble pops up. Care for it and it will hatch!'], give: { egg: 'starter' }, objs: [O.stat('eggsHatched', 1, 'Care for your egg until it hatches 🥚')], reward: { coins: 150, xp: 60 } },
  { id: 'firstjob', ch: 0, npc: 'bella', title: 'Sweet Job', lines: ['Oh hello, sweetie! I\'m Bella, the baker. 🧁', 'I\'m so busy! Could you help me decorate cakes? Just copy what the customer shows you.', 'Tap "Bake Cakes" at my door to start!'], objs: [O.abs((s) => s.jobs.bakery.xp, 3, 'Bake 3 cakes at Sweet Crumbs')], reward: { coins: 150, xp: 50 } },
  { id: 'cozy', ch: 0, npc: 'nana', title: 'Cozy Corner', lines: ['Hello dear, I\'m Nana Rose, your neighbour. 🌹', 'A home is cozier with a warm lamp and a soft rug. Try the 💡 Lights and 🛋️ Living shelves!'], objs: [O.abs(catCount('lights'), 2, 'Have 2 lights in your house 💡'), O.stat('itemsPlaced', 3, 'Place 3 more things')], reward: { coins: 180, xp: 60 } },
  { id: 'explore', ch: 0, npc: 'mayor', title: 'Around Town', lines: ['Our town has so much to see!', 'Visit the beach, the park and the town square. Look for the sparkly shells while you are out!'], objs: [O.zone('beach', 'Visit Sunny Beach 🏖️'), O.zone('park', 'Visit Blossom Park 🌳'), O.zone('square', 'Visit Town Square ⛲')], reward: { coins: 150, xp: 60 } },
  // Chapter 2
  { id: 'garden', ch: 1, npc: 'gus', title: 'Green Thumb', lvl: 2, lines: ['Howdy! Gus here. 🌻 These garden beds need a friend.', 'Plant a seed, give it water, and come back when it\'s grown. Easy peasy!'], objs: [O.stat('harvests', 2, 'Harvest 2 plants in the park 🧺')], reward: { coins: 200, xp: 70 } },
  { id: 'flowers', ch: 1, npc: 'flora', title: 'Flower Power', lvl: 2, lines: ['Welcome to the Petal Shop! I\'m Flora. 💐', 'My customers show me a bouquet and I have to remember it. Want to try?'], objs: [O.abs((s) => s.jobs.florist.xp, 3, 'Make 3 bouquets at Petal Shop')], reward: { coins: 200, xp: 70 } },
  { id: 'bigger', ch: 1, npc: 'nana', title: 'Room to Grow', lvl: 3, lines: ['Your cottage is sweet, but a little small, isn\'t it?', 'In Build mode, use 🟫 Floors to add tiles and 🧱 Walls to make a new room!'], objs: [O.abs(tiles, 18, 'Grow your house to 18 floor tiles'), O.abs(inner, 5, 'Have 5 inside walls')], reward: { coins: 300, xp: 90 } },
  { id: 'petpal', ch: 1, npc: 'pip', title: 'Best Friends', lvl: 3, lines: ['Your pet adores you! 💗', 'Keep looking after its needs — happy pets grow up!'], objs: [O.stat('petTasks', 8, 'Complete 8 pet care tasks')], reward: { coins: 250, xp: 90 } },
  { id: 'twostars', ch: 1, npc: 'mayor', title: 'Rising Star Home', lvl: 3, lines: ['Every year the town gives homes a star rating. ⭐', 'More rooms, furniture, lights and style = more stars. Can you reach 2 stars?'], objs: [O.abs((s) => s.stats.homeStars || 0, 2, 'Get a 2-star Home Rating')], reward: { coins: 300, xp: 100 } },
  { id: 'twoeggs', ch: 1, npc: 'pip', title: 'Egg Collector', lvl: 4, lines: ['Did you know there are 30 kinds of pets in Blossom Bay?', 'Buy another egg at my shop and hatch it!'], objs: [O.stat('eggsHatched', 1, 'Hatch another egg 🥚')], reward: { coins: 300, xp: 100 } },
  // Chapter 3
  { id: 'fishing', ch: 2, npc: 'coral', title: 'Gone Fishing', lvl: 4, lines: ['Ahoy! Captain Coral at your service. 🎣', 'The fish are biting at the end of the pier. Wait for a bite, then tap Reel! to pull it in.'], objs: [O.stat('fishCaught', 3, 'Catch 3 fish')], reward: { coins: 250, xp: 100 } },
  { id: 'style', ch: 2, npc: 'stella', title: 'Style Star', lvl: 4, lines: ['Darling! I\'m Stella from Sparkle Style. ✨', 'A new look for a new you! Pick something from my shop.'], objs: [O.abs((s) => s.owned.avatar.length, 1, 'Buy something at Sparkle Style 👗')], reward: { coins: 200, xp: 90 } },
  { id: 'scooter', ch: 2, npc: 'zoe', title: 'Wheels!', lvl: 5, lines: ['Zoom zoom! I\'m Zoe. 🛵', 'Walking is nice, but a scooter is faster! Come get one at Zoom Rides.'], objs: [O.abs((s) => s.owned.vehicles.length, 1, 'Get a ride at Zoom Rides 🛵')], reward: { coins: 300, xp: 100 } },
  { id: 'teen', ch: 2, npc: 'pip', title: 'Growing Up', lvl: 5, lines: ['Pets grow from Baby to Kid to Teen and beyond!', 'Help one of your pets become a Teen.'], objs: [O.abs(maxStage, 2, 'Raise a pet to Teen')], reward: { coins: 400, xp: 140 } },
  { id: 'shells', ch: 2, npc: 'coral', title: 'Shell Seeker', lvl: 5, lines: ['Legend says 40 sparkle shells are hidden all over town!', 'Find 10 of them. Look near the water, in the park, and in secret spots!'], objs: [O.abs((s) => s.collections.shells.length, 10, 'Find 10 sparkle shells 🐚')], reward: { coins: 400, xp: 140 } },
  { id: 'threestars', ch: 2, npc: 'mayor', title: 'Three Star Home', lvl: 6, lines: ['Your home is the talk of the town!', 'Can you make it a 3-star home?'], objs: [O.abs((s) => s.stats.homeStars || 0, 3, 'Get a 3-star Home Rating')], reward: { coins: 500, xp: 160 } },
  // Chapter 4
  { id: 'delivery', ch: 3, npc: 'paige', title: 'Special Delivery', lvl: 7, lines: ['Hiya, I\'m Paige from Bay Post! 📮', 'Packages need to get to houses around town — fast! Follow the arrow and beat the clock.'], objs: [O.abs((s) => s.jobs.delivery.xp, 5, 'Deliver 5 packages')], reward: { coins: 400, xp: 150 } },
  { id: 'cove', ch: 3, npc: 'quartz', title: 'The Crystal Cove', lvl: 9, lines: ['Oh! A visitor! I\'m Professor Quartz. 💎', 'Behind these rocks is Crystal Cove — full of glowing crystals and rare eggs!', 'Here, I\'ll move the boulders. Go and have a look!'], give: { unlock: 'cave' }, objs: [O.zone('cove', 'Explore Crystal Cove 💎')], reward: { coins: 500, xp: 180 } },
  { id: 'hatch4', ch: 3, npc: 'quartz', title: 'Rare Discoveries', lvl: 10, lines: ['Crystal Eggs can hatch unicorns and even dragons! 🐉', 'Hatch 4 eggs in total and tell me what you found!'], objs: [O.abs((s) => s.stats.eggsHatched, 4, 'Hatch 4 eggs in total')], reward: { coins: 600, xp: 200 } },
  { id: 'land', ch: 3, npc: 'nana', title: 'More Land', lvl: 9, lines: ['You could have a bigger garden, dear!', 'Buy more land in Build mode → 🏡 House.'], objs: [O.abs((s) => s.house.size, 10, 'Buy more land 🌳')], reward: { coins: 700, xp: 200 } },
  { id: 'chef', ch: 3, npc: 'bella', title: 'Master Baker', lvl: 10, lines: ['You\'re a natural! 🍰', 'Reach Baker level 3 and I\'ll teach you my secret recipes.'], objs: [O.abs((s) => jobLevel(s.jobs.bakery.xp), 3, 'Reach Baker level 3')], reward: { coins: 600, xp: 200 } },
  { id: 'fourstars', ch: 3, npc: 'mayor', title: 'Four Star Home', lvl: 12, lines: ['Only the finest homes get 4 stars. I believe in you!'], objs: [O.abs((s) => s.stats.homeStars || 0, 4, 'Get a 4-star Home Rating')], reward: { coins: 800, xp: 250 } },
  // Chapter 5
  { id: 'sky', ch: 4, npc: 'skye', title: 'Up, Up and Away', lvl: 13, lines: ['Hi! I\'m Skye, the balloon pilot. 🎈', 'Way up in the clouds there\'s a floating island with a castle!', 'Hop in my balloon anytime. I\'ll take you there!'], give: { unlock: 'sky' }, objs: [O.zone('sky', 'Fly to Sky Island ☁️')], reward: { coins: 800, xp: 250 } },
  { id: 'sparkle', ch: 4, npc: 'pip', title: 'Sparkle Pet', lvl: 14, lines: ['Pets who are loved the most become Sparkle pets! ✨', 'Raise a pet all the way to Sparkle.'], objs: [O.abs(maxStage, 4, 'Raise a pet to Sparkle stage ✨')], reward: { coins: 1200, xp: 350 } },
  { id: 'shells25', ch: 4, npc: 'coral', title: 'Treasure Hunter', lvl: 14, lines: ['You\'re a real treasure hunter now!', 'Find 25 sparkle shells for the festival decorations!'], objs: [O.abs((s) => s.collections.shells.length, 25, 'Find 25 sparkle shells 🐚')], reward: { coins: 900, xp: 300 } },
  { id: 'catch', ch: 4, npc: 'coral', title: 'Fish Fanatic', lvl: 15, lines: ['Some fish only come out at night, and some only in the day!', 'Catch 10 different kinds of fish.'], objs: [O.abs((s) => Object.keys(s.collections.fish).length, 10, 'Catch 10 kinds of fish')], reward: { coins: 900, xp: 300 } },
  { id: 'dream', ch: 4, npc: 'mayor', title: 'Dream Home', lvl: 16, lines: ['The Blossom Festival is coming, and there\'s a house contest!', 'Make your home a 5-star Dream Home to win!'], objs: [O.abs((s) => s.stats.homeStars || 0, 5, 'Get a 5-star Home Rating')], reward: { coins: 1500, xp: 400 } },
  { id: 'friends', ch: 4, npc: 'mayor', title: 'Friends Everywhere', lvl: 16, lines: ['Everyone in town loves you! Say hello to all your friends before the festival.'], objs: [O.abs((s) => (s.quests.metNpcs || []).length, 12, 'Talk to 12 different townsfolk')], reward: { coins: 800, xp: 300 } },
  { id: 'festival', ch: 4, npc: 'mayor', title: 'The Blossom Festival', lvl: 18, after: 'dream', lines: ['Tonight is the Blossom Festival! 🎆', 'Come to Town Square after dark for the fireworks!'], objs: [O.abs((s) => (s.quests.festival ? 1 : 0), 1, 'Be in Town Square at night 🌙')], reward: { coins: 3000, xp: 600, unlock: 'festival' }, final: true },
];
export const QUEST = Object.fromEntries(QUESTS.map((q) => [q.id, q]));

// ---------------- stickers ----------------
const S = (id, name, icon, test) => ({ id, name, icon, test });
const petCount = (s) => new Set(s.pets.map((p) => p.species)).size;
const rarOwned = (s, r) => s.pets.some((p) => SPEC[p.species]?.rar === r);
export const STICKERS = [
  S('coins1k', 'Pocket Money', '🪙', (s) => s.stats.coinsEarned >= 1000),
  S('coins10k', 'Piggy Bank', '🐷', (s) => s.stats.coinsEarned >= 10000),
  S('coins50k', 'Rich & Famous', '💎', (s) => s.stats.coinsEarned >= 50000),
  S('lvl5', 'Level 5', '5️⃣', (s) => lvl(s) >= 5),
  S('lvl10', 'Level 10', '🔟', (s) => lvl(s) >= 10),
  S('lvl15', 'Level 15', '🌟', (s) => lvl(s) >= 15),
  S('lvl20', 'Level 20', '🏅', (s) => lvl(s) >= 20),
  S('pet1', 'First Pet', '🐣', (s) => s.pets.length >= 1),
  S('pet5', 'Pet Family', '🐾', (s) => petCount(s) >= 5),
  S('pet10', 'Zoo Keeper', '🦁', (s) => petCount(s) >= 10),
  S('pet20', 'Pet Expert', '🎖️', (s) => petCount(s) >= 20),
  S('pet30', 'Every Pet!', '👑', (s) => petCount(s) >= SPECIES.length),
  S('rare', 'Rare Find', '💙', (s) => rarOwned(s, 'rare')),
  S('ultra', 'Ultra Rare', '💜', (s) => rarOwned(s, 'ultra')),
  S('legend', 'Legendary!', '🐉', (s) => rarOwned(s, 'legendary')),
  S('hatch5', 'Egg Hatcher', '🥚', (s) => s.stats.eggsHatched >= 5),
  S('hatch15', 'Egg Master', '🍳', (s) => s.stats.eggsHatched >= 15),
  S('teen', 'Teen Pet', '🧒', (s) => maxStage(s) >= 2),
  S('grown', 'Grown Pet', '🧑', (s) => maxStage(s) >= 3),
  S('sparkle', 'Sparkle Pet', '✨', (s) => maxStage(s) >= 4),
  S('care50', 'Caring Heart', '💗', (s) => s.stats.petTasks >= 50),
  S('care200', 'Pet Whisperer', '💞', (s) => s.stats.petTasks >= 200),
  S('place1', 'Decorator', '🛋️', (s) => s.stats.itemsPlaced >= 1),
  S('place25', 'Interior Designer', '🖼️', (s) => s.stats.itemsPlaced >= 25),
  S('place75', 'Home Stylist', '🏠', (s) => s.stats.itemsPlaced >= 75),
  S('star1', 'One Star', '⭐', (s) => (s.stats.homeStars || 0) >= 1),
  S('star3', 'Three Stars', '🌟', (s) => (s.stats.homeStars || 0) >= 3),
  S('star5', 'Dream Home', '🏰', (s) => (s.stats.homeStars || 0) >= 5),
  S('tiles30', 'Big House', '🏡', (s) => tiles(s) >= 30),
  S('tiles60', 'Mansion', '🏯', (s) => tiles(s) >= 60),
  S('land', 'Land Owner', '🌳', (s) => s.house.size >= 10),
  S('land14', 'Huge Estate', '🗺️', (s) => s.house.size >= 14),
  S('fish1', 'First Catch', '🐟', (s) => s.stats.fishCaught >= 1),
  S('fish30', 'Angler', '🎣', (s) => s.stats.fishCaught >= 30),
  S('fishall', 'Fish Encyclopedia', '📘', (s) => Object.keys(s.collections.fish).length >= FISH.length),
  S('legendfish', 'Golden Catch', '🏆', (s) => s.collections.fish.golden || s.collections.fish.rainbow),
  S('harvest1', 'First Harvest', '🥕', (s) => s.stats.harvests >= 1),
  S('harvest30', 'Farmer', '👩‍🌾', (s) => s.stats.harvests >= 30),
  S('plantsall', 'Every Plant', '🌻', (s) => Object.keys(s.collections.plants).length >= SEEDS.length),
  S('cakes25', 'Cake Artist', '🎂', (s) => s.jobs.bakery.xp >= 25),
  S('flowers25', 'Bouquet Pro', '💐', (s) => s.jobs.florist.xp >= 25),
  S('deliver20', 'Speedy Courier', '📦', (s) => s.jobs.delivery.xp >= 20),
  S('jobs5', 'Job Master', '🏆', (s) => ['bakery', 'florist', 'garden', 'fishing', 'delivery'].every((j) => jobLevel(s.jobs[j].xp) >= 3)),
  S('shell1', 'Shiny Shell', '🐚', (s) => s.collections.shells.length >= 1),
  S('shell20', 'Shell Collector', '🦪', (s) => s.collections.shells.length >= 20),
  S('shell40', 'All the Shells!', '🧜‍♀️', (s) => s.collections.shells.length >= 40),
  S('zones', 'World Traveller', '🧭', (s) => s.collections.zones.length >= 6),
  S('cove', 'Crystal Explorer', '💎', (s) => s.collections.zones.includes('cove')),
  S('skyland', 'Head in the Clouds', '☁️', (s) => s.collections.zones.includes('sky')),
  S('ride', 'On Wheels', '🛵', (s) => s.owned.vehicles.length >= 1),
  S('rideall', 'Garage Full', '🚗', (s) => s.owned.vehicles.length >= 4),
  S('outfit5', 'Fashionista', '👗', (s) => s.owned.avatar.length >= 5),
  S('outfit20', 'Style Icon', '💄', (s) => s.owned.avatar.length >= 20),
  S('emotes', 'Show Off', '💃', (s) => (s.stats.emotes || 0) >= 10),
  S('sleep', 'Sweet Dreams', '🌙', (s) => (s.stats.nightsSlept || 0) >= 1),
  S('hour1', 'One Hour', '⏰', (s) => s.stats.playTime >= 3600),
  S('hour5', 'Five Hours', '⌛', (s) => s.stats.playTime >= 5 * 3600),
  S('rainbow', 'Rainbow Watcher', '🌈', (s) => (s.stats.rainbows || 0) >= 1),
  S('chapter5', 'Festival Star', '🎆', (s) => s.quests.done.includes('festival')),
];
