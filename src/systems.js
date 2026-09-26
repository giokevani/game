// Registers all gameplay systems in order.
import { HouseSystem } from './house/system.js';

export function registerSystems(game) {
  game.addSystem(new HouseSystem());
}
