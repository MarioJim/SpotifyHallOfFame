import * as THREE from 'three';
import { GLTFLoader } from '@three/loaders/GLTFLoader';
import AlbumCoverManager from './albumcovers';

const RECORD_PLAYER_MODEL_URL = 'models/record_player/scene.gltf';
const RECORD_PLAYER_X_ROTATION = -0.4 * Math.PI;

export default class RecordPlayer {
  root: THREE.Group;
  light: THREE.DirectionalLight;
  model: THREE.Object3D;
  album: THREE.Mesh;

  camera: THREE.Camera;
  coversManager: AlbumCoverManager;

  constructor(coversManager: AlbumCoverManager) {
    this.root = new THREE.Group();
    this.light = new THREE.DirectionalLight(0xffffff, 0.2);
    this.light.translateY(1);
    this.root.add(this.light);

    const albumGeometry = new THREE.RingGeometry(0.1, 0.75, 32, 2);
    this.album = new THREE.Mesh(albumGeometry, new THREE.MeshNormalMaterial());
    this.album.rotateX(RECORD_PLAYER_X_ROTATION);
    this.album.translateX(-0.2);
    this.album.translateZ(0.47);

    this.coversManager = coversManager;
  }

  async load() {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(RECORD_PLAYER_MODEL_URL);

    this.model = gltf.scene.children[0].children[0].children[0];
    this.model.rotateX(RECORD_PLAYER_X_ROTATION);
    this.model.translateX(0.2);
    const bodyMesh = this.model.children[1].children[0] as THREE.Mesh;
    bodyMesh.material = new THREE.MeshNormalMaterial();

    this.light.target = this.model;
    this.root.add(this.model);
  }

  linkToCamera(camera: THREE.Camera, scene: THREE.Scene) {
    this.camera = camera;
    scene.add(this.root);

    // TODO: Remove, only for demo
    this.changeAlbum(
      'https://i.scdn.co/image/ab67616d0000b273be82673b5f79d9658ec0a9fd',
    );
  }

  async changeAlbum(imageUrl?: string) {
    if (imageUrl) {
      const coverMaterial = await this.coversManager.fetchAlbums([imageUrl]);
      this.album.material = coverMaterial[0];
      if (this.album?.parent === null) {
        this.root.add(this.album);
      }
    } else if (this.album?.parent !== null) {
      this.root.remove(this.album);
    }
  }

  update(deltat: number) {
    this.root.position.copy(this.camera.position);
    this.root.rotation.copy(this.camera.rotation);
    this.root.updateMatrix();
    this.root.translateY(-1.2);
    this.root.translateZ(-4);

    if (this.album?.parent !== null) {
      this.album.rotateZ(-0.0005 * deltat);
    }
  }
}
