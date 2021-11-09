import * as THREE from 'three';
import { GLTFLoader } from '@three/loaders/GLTFLoader';
import AlbumCoverManager from './albumcovers';
import AudioPlayer from './audio';
import MusicNoteParticleSystem from './particles';
import { SpotifyTrack } from './spotify';

const RECORD_PLAYER_MODEL_URL = 'models/record_player/scene.gltf';
const RECORD_PLAYER_X_ROTATION = -0.4 * Math.PI;

export default class RecordPlayer {
  root: THREE.Group;
  light: THREE.DirectionalLight;
  model: THREE.Object3D;
  album: THREE.Mesh;
  playingTrackId: string | null;
  particlesGroup: THREE.Group;
  particles: MusicNoteParticleSystem;

  camera: THREE.Camera;
  coversManager: AlbumCoverManager;

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    coversManager: AlbumCoverManager,
    audioPlayer: AudioPlayer,
  ) {
    // Initial setup
    this.camera = camera;
    this.root = new THREE.Group();
    scene.add(this.root);
    this.coversManager = coversManager;
    audioPlayer.setOnSongEnd(() => this.changeTrack());

    // Add light above the record player
    this.light = new THREE.DirectionalLight(0xffffff, 0.2);
    this.light.translateY(1);
    this.root.add(this.light);

    /// Create the album model
    const albumGeometry = new THREE.RingGeometry(0.1, 0.75, 32, 2);
    this.album = new THREE.Mesh(albumGeometry, new THREE.MeshNormalMaterial());
    this.album.rotateX(RECORD_PLAYER_X_ROTATION);
    this.album.translateX(-0.2);
    this.album.translateZ(0.47);
    this.playingTrackId = null;

    // Create the music note particles
    this.particlesGroup = new THREE.Group();
    this.particles = new MusicNoteParticleSystem(this.particlesGroup, 9);
    this.particlesGroup.translateY(0.7);
    this.particlesGroup.scale.set(0.6, 0.6, 0.6);
    this.root.add(this.particlesGroup);
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

    await this.particles.load();
  }

  async changeTrack(track?: SpotifyTrack) {
    if (!this.playingTrackId && !track) {
      return;
    }

    if (!track || this.playingTrackId === track.id) {
      this.playingTrackId = null;
      this.particles.playPause('pause');
      this.root.remove(this.album);
      return;
    }

    const firstTimePlaying = !this.playingTrackId && track;
    this.playingTrackId = track.id;
    const albumUrl = track.album.images[0].url;
    const coverMaterial = await this.coversManager.fetchAlbums([albumUrl]);
    this.album.material = coverMaterial[0];
    if (firstTimePlaying) {
      this.particles.playPause('play');
      this.root.add(this.album);
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

    this.particles.update(deltat);
  }
}
