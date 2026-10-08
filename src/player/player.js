import * as THREE from 'three';
import { WATER_Y } from '../world/terrain.js';
import { WORLD } from '../data/map.js';

const UP = new THREE.Vector3(0, 1, 0);

export class Player {
  constructor(world, avatar) {
    this.world = world;
    this.avatar = avatar;
    this.pos = new THREE.Vector3(-66, 0, -58);
    this.vel = new THREE.Vector3();
    this.facing = Math.PI;
    this.radius = 0.42;
    this.grounded = true;
    this.speed = 7.2;
    this.jumpV = 10.5;
    this.frozen = false;
    this.seat = null; // {pos, facing, pose}
    this.vehicle = null;
    this.moveAmt = 0;
    this.lastSafe = this.pos.clone();
    this.onLand = null;
    this.distance = 0;
    this.swimming = false;
  }

  get object() { return this.avatar.root; }

  teleport(x, y, z, facing) {
    this.pos.set(x, y ?? this.world.groundAt(x, z, 50), z);
    this.vel.set(0, 0, 0);
    if (facing !== undefined) this.facing = facing;
    this.lastSafe.copy(this.pos);
    this.sync();
  }

  sit(seat) {
    this.seat = seat;
    this.avatar.pose = seat.pose || 'sit';
    this.pos.copy(seat.pos);
    this.facing = seat.facing;
    this.vel.set(0, 0, 0);
    this.sync();
  }

  stand() {
    if (!this.seat) return;
    const s = this.seat;
    this.seat = null;
    this.avatar.pose = 'stand';
    if (s.exit) this.pos.copy(s.exit);
    this.pos.y = this.world.groundAt(this.pos.x, this.pos.z, this.pos.y + 1);
    this.sync();
  }

  update(dt, input, camYaw) {
    const av = this.avatar;
    if (this.seat) {
      av.update(dt, 0, false);
      if (input.getMove().x || input.getMove().y || input.consumeJump()) this.stand();
      this.sync();
      return;
    }
    const m = this.frozen ? { x: 0, y: 0 } : input.getMove();
    const amt = Math.min(1, Math.hypot(m.x, m.y));
    const fwdX = -Math.sin(camYaw), fwdZ = -Math.cos(camYaw);
    const rgtX = Math.cos(camYaw), rgtZ = -Math.sin(camYaw);
    let dx = fwdX * -m.y + rgtX * m.x;
    let dz = fwdZ * -m.y + rgtZ * m.x;
    const vmax = this.vehicle ? this.vehicle.speed : this.swimming ? 4.2 : this.speed;
    const accel = this.grounded ? 14 : 5;
    const tx = dx * vmax, tz = dz * vmax;
    this.vel.x += (tx - this.vel.x) * Math.min(1, accel * dt);
    this.vel.z += (tz - this.vel.z) * Math.min(1, accel * dt);
    if (amt > 0.05) {
      const target = Math.atan2(dx, dz);
      let diff = target - this.facing;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.facing += diff * Math.min(1, (this.vehicle ? 6 : 12) * dt);
    }
    if (!this.frozen && input.consumeJump() && this.grounded && !this.vehicle && !this.swimming) {
      this.vel.y = this.jumpV;
      this.grounded = false;
      this.onJump?.();
    }
    this.vel.y -= 30 * dt;

    const prevX = this.pos.x, prevZ = this.pos.z;
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    this.world.resolve(this.pos, this.vehicle ? (this.vehicle.water ? 1.2 : 0.9) : this.radius, this.pos.y);
    // water: on foot she swims, boats stay on water, cars and bikes stay on land
    const depth = WATER_Y - this.world.groundAt(this.pos.x, this.pos.z, this.pos.y + 1);
    const boat = this.vehicle?.water;
    if ((boat && depth < 0.6) || (this.vehicle && !boat && depth > 0.5)) { this.pos.x = prevX; this.pos.z = prevZ; this.vel.x *= -0.2; this.vel.z *= -0.2; }
    this.pos.x = Math.max(WORLD.minX, Math.min(WORLD.maxX, this.pos.x));
    this.pos.z = Math.max(WORLD.minZ, Math.min(WORLD.maxZ, this.pos.z));
    const deepNow = WATER_Y - this.world.groundAt(this.pos.x, this.pos.z, this.pos.y + 1);
    this.swimming = !this.vehicle && !this.seat && deepNow > 1.0 && this.pos.y < WATER_Y + 1.5;
    if (boat || this.swimming) {
      // float at the surface (swimmers are mostly under water, head above)
      const ty = boat ? WATER_Y : WATER_Y - 1.15;
      this.pos.y += (ty - this.pos.y) * Math.min(1, dt * 8);
      this.vel.y = 0;
      this.grounded = true;
      if (this.swimming && av.pose !== 'swim') av.pose = 'swim';
      const hs = Math.hypot(this.vel.x, this.vel.z);
      this.distance += hs * dt;
      this.moveAmt = hs / this.speed;
      av.update(dt, this.vehicle ? 0 : Math.min(1, hs / 4.2), false);
      this.sync();
      return;
    }
    if (av.pose === 'swim') av.pose = 'stand';

    this.pos.y += this.vel.y * dt;
    const g = this.world.groundAt(this.pos.x, this.pos.z, this.pos.y);
    const wasAir = !this.grounded;
    if (this.pos.y <= g + 0.001) {
      this.pos.y = g;
      if (this.vel.y < 0) this.vel.y = 0;
      this.grounded = true;
      if (wasAir) this.onLand?.();
      this.lastSafe.copy(this.pos);
    } else if (this.pos.y - g < 0.3 && this.vel.y <= 0) {
      // stick to slopes / small steps down
      this.pos.y = g;
      this.vel.y = 0;
      this.grounded = true;
    } else this.grounded = false;
    if (this.pos.y < -20) this.teleport(this.lastSafe.x, undefined, this.lastSafe.z);

    const hs = Math.hypot(this.vel.x, this.vel.z);
    this.distance += hs * dt;
    this.moveAmt = hs / this.speed;
    av.update(dt, this.vehicle ? 0 : Math.min(1, this.moveAmt), !this.grounded);
    this.sync();
  }

  sync() {
    const r = this.avatar.root;
    r.position.copy(this.pos);
    if (this.vehicle) r.position.y += this.vehicle.seatY;
    r.rotation.y = this.facing;
  }
}

export class CameraRig {
  constructor(camera, world) {
    this.camera = camera;
    this.world = world;
    this.yaw = 0;
    this.pitch = 0.38;
    this.dist = 9;
    this.target = new THREE.Vector3();
    this.minDist = 3.2;
    this.maxDist = 22;
    this.override = null; // {pos, look} for cutscenes / build mode
    this.shake = 0;
  }

  snap(p) {
    this.target.copy(p).add(new THREE.Vector3(0, 1.6, 0));
  }

  update(dt, input, focus, o = {}) {
    const look = input.consumeLook();
    const z = input.consumeZoom();
    if (!this.override) {
      this.yaw -= look.dx * 0.0065;
      this.pitch = Math.max(-0.1, Math.min(1.35, this.pitch + look.dy * 0.0045));
      this.dist = Math.max(this.minDist, Math.min(this.maxDist, this.dist + z));
    }
    const tgt = new THREE.Vector3(focus.x, focus.y + (o.height ?? 1.6), focus.z);
    this.target.lerp(tgt, Math.min(1, dt * 12));
    if (this.override) {
      this.camera.position.lerp(this.override.pos, Math.min(1, dt * (this.override.speed || 4)));
      this.camera.lookAt(this.override.look);
      return;
    }
    const d = this.dist * (o.distMul || 1);
    const cp = this.pitch;
    const pos = new THREE.Vector3(
      this.target.x + Math.sin(this.yaw) * Math.cos(cp) * d,
      this.target.y + Math.sin(cp) * d,
      this.target.z + Math.cos(this.yaw) * Math.cos(cp) * d
    );
    // pull the camera in front of buildings so it never ends up inside one
    if (o.collide !== false) {
      const steps = 10;
      for (let i = 2; i <= steps; i++) {
        const t = i / steps;
        const x = this.target.x + (pos.x - this.target.x) * t;
        const y = this.target.y + (pos.y - this.target.y) * t;
        const z = this.target.z + (pos.z - this.target.z) * t;
        if (y < 6.5 && this.world.blockedAt(x, z, y)) {
          const k = Math.max(0.15, (i - 1.2) / steps);
          pos.set(this.target.x + (pos.x - this.target.x) * k, this.target.y + (pos.y - this.target.y) * k, this.target.z + (pos.z - this.target.z) * k);
          break;
        }
      }
    }
    const gy = Math.max(this.world.groundAt(pos.x, pos.z, pos.y) + 0.6, WATER_Y + 0.5);
    if (pos.y < gy) pos.y = gy;
    this.camera.position.copy(pos);
    this.camera.lookAt(this.target);
  }
}
