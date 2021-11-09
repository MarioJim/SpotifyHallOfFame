import * as THREE from 'three';
import { OrbitControls } from '@three/controls/OrbitControls';

import AlbumCoverManager from './albumcovers';
import AudioPlayer from './audio';
import Hall from './hall';
import MusicNoteParticleSystem from './particles';
import RecordPlayer from './recordplayer';
import loadSpotifyData from './spotify';
import TextGenerator from './text';
import WallpaperManager from './wallpaper';

const coversManager = new AlbumCoverManager();
const audioPlayer = new AudioPlayer();
const textGenerator = new TextGenerator();
const wallpaperMgr = new WallpaperManager();

const halls: Hall[] = ['México', 'Global', 'Personal'].map(
  (title, idx) =>
    new Hall(
      (2 * idx * Math.PI) / 3,
      title,
      coversManager,
      textGenerator,
      wallpaperMgr,
    ),
);
const recordPlayer = new RecordPlayer(coversManager);

let renderer: THREE.WebGLRenderer | null = null,
  scene: THREE.Scene | null = null,
  camera: THREE.PerspectiveCamera | null = null,
  controls: OrbitControls | null = null;

let raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2(),
  intersected: THREE.Mesh | null = null,
  clicked: THREE.Object3D | null = null;

let currentTime = Date.now();
let particleSystem: MusicNoteParticleSystem | null = null;

const resizeRendererToDisplaySize = (renderer: THREE.WebGLRenderer) => {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = (canvas.clientWidth * pixelRatio) | 0;
  const height = (canvas.clientHeight * pixelRatio) | 0;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
};

const animate = () => {
  // Call animate again on the next frame
  requestAnimationFrame(animate);

  // Calculate delta time
  const now = Date.now();
  const deltat = now - currentTime;
  currentTime = now;

  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // Update camera's position
  controls.update();

  // particleSystem.update(deltat);

  // Render the scene
  renderer.render(scene, camera);
};

/**
 * Creates a basic scene with lights, a camera, and 3 objects
 * @param {HTMLCanvasElement} canvas The canvas element to render on
 */
const createScene = async (canvas: HTMLCanvasElement) => {
  // Create the Three.js renderer and attach it to our canvas
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

  // Create a new Three.js scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0.3, 0.3, 0.3);

  const ambientLight = new THREE.AmbientLight(0xdddddd, 1);
  scene.add(ambientLight);

  // Add a camera so we can view the scene
  camera = new THREE.PerspectiveCamera(
    40,
    canvas.width / canvas.height,
    1,
    4000,
  );
  camera.position.setY(10);
  camera.position.setZ(10);

  // TODO: Replace for walking controls
  controls = new OrbitControls(camera, renderer.domElement);

  // particleSystem = new MusicNoteParticleSystem(scene, 9);
  // await particleSystem.load();

  halls.forEach(async (hall) => {
    await Promise.all([hall.setWallpaper(1), hall.drawEndWall()]);
    hall.addTo(scene);
  });

  await recordPlayer.load();
  recordPlayer.addToScene(scene);
};

// main
(async () => {
  await textGenerator.load();
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  await createScene(canvas);
  animate();

  const { global, mexico, personal } = await loadSpotifyData();
  await halls[0].setTracks(mexico);
  await halls[1].setTracks(global);
  await halls[2].setTracks(personal);

  // TODO: Replace for login to Spotify button in scene
  if (!personal) {
    document.getElementById('login-page')!.style.display = 'block';
    document.getElementById('login-btn')!.addEventListener('click', () => {
      const spotifyAuthParams = new URLSearchParams();
      spotifyAuthParams.set('client_id', '78d27efbc5e84665b852ca8dd63ea33f');
      spotifyAuthParams.set('response_type', 'token');
      const original_url = window.location.origin + window.location.pathname;
      spotifyAuthParams.set('redirect_uri', original_url);
      spotifyAuthParams.set('scope', ['user-top-read'].join(' '));
      const params = spotifyAuthParams.toString();
      window.location.replace(
        `https://accounts.spotify.com/authorize?${params}`,
      );
    });
  }
})();
