// Registers all gameplay systems in order.
import { HouseSystem } from './house/system.js';
import { PetSystem } from './pets/system.js';

export function registerSystems(game) {
  game.addSystem(new HouseSystem());
  game.addSystem(new PetSystem());
}
