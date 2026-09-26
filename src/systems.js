// Registers all gameplay systems in order.
import { HouseSystem } from './house/system.js';
import { PetSystem } from './pets/system.js';
import { JobSystem } from './jobs/system.js';
import { NPCSystem } from './npc/system.js';
import { Shells } from './world/collectibles.js';
import { QuestSystem } from './quests/system.js';
import { VehicleSystem } from './vehicles/system.js';
import { Weather } from './world/weather.js';
import { setupAvatarUI } from './ui/avatarUI.js';
import { setupMenus } from './ui/menus.js';

export function registerSystems(game) {
  game.addSystem({ init: (g) => { setupAvatarUI(g); setupMenus(g); } });
  game.addSystem(new HouseSystem());
  game.addSystem(new PetSystem());
  game.addSystem(new JobSystem());
  game.addSystem(new NPCSystem());
  game.addSystem(new Shells());
  game.addSystem(new VehicleSystem());
  game.addSystem(new QuestSystem());
  game.addSystem(new Weather());
}
