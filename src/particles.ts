import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

export default class MusicNoteParticleSystem {
  scene: THREE.Object3D;
  n: number;
  animation: boolean;
  particlePool: MusicNoteParticle[];

  constructor(scene: THREE.Object3D, n: number) {
    this.scene = scene;
    this.n = n;
    this.animation = true;
  }

  async loadAsync() {
    const [key1, key2] = await loadNoteKeysModels();
    this.particlePool = Array.from({ length: this.n }, (_, i) => {
      const model = Math.random() > 0.5 ? key1.clone() : key2.clone();
      model.position.set(i - 4, 0, 0);
      this.scene.add(model);
      return new MusicNoteParticle(model);
    });
  }

  update(deltat: number) {
    this.particlePool.forEach((p) => p.update(deltat));
  }
}

/**
 * Loads two music notes from the models/keys.obj file
 * @returns {Promise<THREE.Group[]>} both notes
 */
const loadNoteKeysModels = async (): Promise<THREE.Group[]> => {
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
};

class MusicNoteParticle {
  model: THREE.Object3D;
  state: number;
  scale: number;
  axis: THREE.Vector3;
  delta: number;

  constructor(model: THREE.Group) {
    this.model = model.children[0];
    this.state = 0;
    this.scale = 0;
    this.axis = new THREE.Vector3(0, 0, 0.5);
  }

  reset() {
    this.delta = 0;
    this.state = 1;
    this.model.position.set(0, 0, 0);
  }

  updateScale(deltat: number) {
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

  updatePosition(deltat: number) {
    this.model.translateOnAxis(this.axis, deltat / 1000);
  }

  update(deltat: number) {
    if (this.scale <= 0) {
      this.reset();
    }
    this.updateScale(deltat);
    this.model.scale.set(this.scale, this.scale, this.scale);
    this.updatePosition(deltat);
  }
}
