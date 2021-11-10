import * as THREE from 'three';
import { FBXLoader } from '@three/loaders/FBXLoader';

type MusicState = 'play' | 'pause';

const CYCLE_TIME = 3215;

export default class MusicNoteParticleSystem {
  parent: THREE.Object3D;
  n: number;
  animation: boolean;
  particles: MusicNoteParticle[];
  timeouts: NodeJS.Timeout[];

  constructor(parent: THREE.Object3D, n: number) {
    this.parent = parent;
    this.n = n;
    this.animation = true;
    this.timeouts = [];
  }

  async load() {
    const [key1, key2] = await this.#loadModels();

    this.particles = Array.from(Array(this.n).keys()).map((idx) => {
      const model = Math.random() > 0.5 ? key1.clone() : key2.clone();
      model.position.set(0.3 * (idx - 4), 0, 0);
      this.parent.add(model);
      return new MusicNoteParticle(model);
    });
  }

  /**
   * Loads two music notes from the models/keys.obj file
   * @returns {Promise<THREE.Group[]>} both notes
   */
  async #loadModels(): Promise<THREE.Group[]> {
    const loader = new FBXLoader();
    const keys = await loader.loadAsync('models/keys.fbx');

    const key1 = keys.children[0];
    key1.scale.set(0.1, 0.1, 0.1);
    key1.position.set(0, 0.15, 0);
    key1.rotateX(Math.PI / 2);
    const key1Group = new THREE.Group();
    key1Group.add(key1);

    const key2 = keys.children[0];
    key2.scale.set(0.1, 0.1, 0.1);
    key2.position.set(0.1, 0.1, 0);
    key2.rotateX(Math.PI / 2);
    const key2Group = new THREE.Group();
    key2Group.add(key2);

    return [key1Group, key2Group];
  }

  playAnimation() {
    this.timeouts = this.particles
      .map((particle) => ({ particle, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ particle }, idx) =>
        setTimeout(() => {
          particle.startAnimation();
          if (idx + 1 === this.n) {
            this.timeouts = [];
          }
        }, (idx * CYCLE_TIME) / this.n),
      );
  }

  pauseAnimation() {
    if (this.timeouts.length > 0) {
      this.timeouts.forEach((timeout) => clearTimeout(timeout));
      this.timeouts = [];
    }
    this.particles.forEach((part) => part.stopNextAnimation());
  }

  update(deltat: number) {
    this.particles.forEach((p) => p.update(deltat));
  }
}

class MusicNoteParticle {
  model: THREE.Object3D;
  state: number;
  scale: number;
  delta: number;

  currMusicState: MusicState;
  nextMusicState: MusicState;
  axis: THREE.Vector3;

  constructor(model: THREE.Group) {
    this.model = model.children[0];
    this.#reset();
    this.scale = 0;
    this.model.scale.set(this.scale, this.scale, this.scale);

    this.currMusicState = 'pause';
    this.nextMusicState = 'pause';
    this.axis = new THREE.Vector3(0, 0, 0.5);
  }

  startAnimation() {
    this.currMusicState = 'play';
    this.nextMusicState = 'play';
  }

  stopNextAnimation() {
    this.nextMusicState = 'pause';
  }

  update(deltat: number) {
    if (this.scale <= 0) {
      this.#reset();
      this.currMusicState = this.nextMusicState;
    }
    if (this.currMusicState === 'play') {
      this.#updateScale(deltat);
      this.model.scale.set(this.scale, this.scale, this.scale);
      this.#updatePosition(deltat);
    }
  }

  #reset() {
    this.delta = 0;
    this.state = 1;
    this.model.position.set(0, 0, 0);
  }

  #updateScale(deltat: number) {
    if (this.state === 1) {
      this.delta += deltat;
      const x = 0.21 + this.delta / 1000;
      this.scale = 0.5 - Math.cos(5 * x) / (7 * x);
      this.scale *= 0.1;
      if (x >= 2.9) {
        this.state = 0;
      }
    }
    if (this.state === 0) {
      this.scale -= deltat / 10000;
    }
  }

  #updatePosition(deltat: number) {
    this.model.translateOnAxis(this.axis, deltat / 800);
  }
}
