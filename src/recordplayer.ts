import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import AlbumCoverManager from './albumcovers';

const RECORD_PLAYER_MODEL_URL = 'models/record_player/scene.gltf';

export default class RecordPlayer {
  root: THREE.Group;
  model: THREE.Object3D;
  coversManager: AlbumCoverManager;

  constructor(coversManager: AlbumCoverManager) {
    this.root = new THREE.Group();
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.translateY(3);
    this.root.add(light);
  }

  async load() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(RECORD_PLAYER_MODEL_URL);
    this.model = gltf.scene.children[0].children[0].children[0];
    this.model.rotateX(-Math.PI / 2);
    this.root.add(this.model);
  }

  addToScene(scene: THREE.Scene) {
    // TODO: Remove method
    scene.add(this.root);
  }

  linkToCamera(camera: THREE.Camera) {
    // TODO: Fix
    camera.add(this.model);
    this.model.translateZ(-10);
  }

  async changeAlbum(imageUrl?: string) {
    if (imageUrl) {
      const coverMaterial = await this.coversManager.fetchAlbums([imageUrl]);
      // TODO: Change album
    } else {
      // TODO: Remove album
    }
  }
}
