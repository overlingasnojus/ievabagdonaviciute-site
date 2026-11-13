import { getNav } from './nav';

// Little hidden surprises in the room. Clicking the arm or the monstera sets a
// request; the scene component that owns the object picks it up next frame and plays
// its animation. Like the rover's hello,
// they never open a section and only run in the lab overview.

export type Egg = 'arm' | 'plant';

const requested: Record<Egg, boolean> = { arm: false, plant: false };

export function pokeEgg(id: Egg) {
  if (getNav().phase === 'overview') requested[id] = true;
}

/** Returns true once per request. */
export function takeEgg(id: Egg) {
  const r = requested[id];
  requested[id] = false;
  return r;
}

