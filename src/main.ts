import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import AudioPlayer from './audio';
import Hall from './hall';
import MusicNoteParticleSystem from './particles';
import loadSpotifyData from './spotify';
import TextGenerator from './text';
import WallpaperManager from './wallpaper';

const audioPlayer = new AudioPlayer();
const halls: Hall[] = [];
const textGenerator = new TextGenerator();
const wallpaperMgr = new WallpaperManager();

const displayTableOfSongs = (title: string, songs: any[]) =>
  `<h3>${title}</h3><ul>` +
  songs.map((s) => `<li>${s.name} by ${s.artists[0].name}</li>`).join('') +
  '</ul>';

let renderer: THREE.WebGLRenderer | null = null,
  scene: THREE.Scene | null = null,
  camera: THREE.PerspectiveCamera | null = null,
  root: THREE.Object3D | null = null,
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

  const ambientLight = new THREE.AmbientLight(0xdddddd);
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

  controls = new OrbitControls(camera, renderer.domElement);

  root = new THREE.Object3D();

  // particleSystem = new MusicNoteParticleSystem(scene, 9);
  // await particleSystem.loadAsync();

  halls.push(new Hall(scene, (0 * Math.PI) / 3, "México", textGenerator, wallpaperMgr));
  halls.push(new Hall(scene, (2 * Math.PI) / 3, "Global", textGenerator, wallpaperMgr));
  halls.push(new Hall(scene, (4 * Math.PI) / 3, "Personal", textGenerator, wallpaperMgr));

  await halls[0].setWallpaper(1);
  await halls[1].setWallpaper(1);
  await halls[2].setWallpaper(1);
};

// main
(async () => {
  await textGenerator.loadAsync();
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  await createScene(canvas);
  animate();

  const data = await loadSpotifyData();
  if (data.status === 'ok') {
    const { mexico, global, personal } = data.data;
    await halls[0].setTracks(mexico);
    await halls[1].setTracks(global);
    await halls[2].setTracks(personal);
  } else {
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
