// Registers all gameplay systems in order.
import { MagicDoors } from './world/realms.js';
import { Adventures } from './adventures/system.js';
import './adventures/style.css';
import { EndlessWorld } from './world/endless.js';
import { BuildingSystem } from './house/buildings.js';
import { SkyCity } from './world/skycity.js';
import { HouseSystem } from './house/system.js';
import { PetSystem } from './pets/system.js';
import { JobSystem } from './jobs/system.js';
import { NPCSystem } from './npc/system.js';
import { Shells } from './world/collectibles.js';
import { QuestSystem } from './quests/system.js';
import { VehicleSystem } from './vehicles/system.js';
import { Weather } from './world/weather.js';
import { CafeSystem } from './cafe/system.js';
import { setupAvatarUI } from './ui/avatarUI.js';
import { setupMenus } from './ui/menus.js';

export function registerSystems(game) {
  game.addSystem({ init: (g) => { setupAvatarUI(g); setupMenus(g); } });
  game.addSystem(Object.assign(new HouseSystem(),{homeOnly:true}));
  game.addSystem(new PetSystem());
  game.addSystem(Object.assign(new JobSystem(),{homeOnly:true}));
  game.addSystem(Object.assign(new NPCSystem(),{homeOnly:true}));
  game.addSystem(Object.assign(new Shells(),{homeOnly:true}));
  game.addSystem(new VehicleSystem());
  game.addSystem(Object.assign(new SkyCity(),{homeOnly:true}));
  game.addSystem(new BuildingSystem());
  game.addSystem(new EndlessWorld());
  game.addSystem(new MagicDoors());
  game.addSystem(Object.assign(new QuestSystem(),{homeOnly:true}));
  game.addSystem(Object.assign(new Weather(),{homeOnly:true}));
  game.addSystem(Object.assign(new CafeSystem(),{homeOnly:true}));
  game.addSystem(new Adventures());
}
