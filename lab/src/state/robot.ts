import * as THREE from 'three';
import { getNav } from './nav';

// The little rover's "say hi" interaction, shared between the 3D robot (which plays
// it) and the DOM (a keyboard-reachable button that follows the robot on screen).

export const robot = {
  /** World position just above the robot's head; kept current by WheeledRobot. */
  anchor: new THREE.Vector3(-2.1, 1.2, 4.05),
  requested: false,
};

/** Ask the robot to say hi. Ignored unless the lab overview is showing. */
export function pokeRobot() {
  if (getNav().phase === 'overview') robot.requested = true;
}
