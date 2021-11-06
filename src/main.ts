import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import AudioPlayer from './audio';
import Hall from './hall';
import MusicNoteParticleSystem from './particles';
import loadSpotifyData from './spotify';

const audioPlayer = new AudioPlayer();

loadSpotifyData().then((data) => {
  if (data.status === 'ok') {
    document.getElementById('stats-page')!.style.display = 'block';
    const { mexico, global, personal } = data.data;

    document.getElementById('top-10-user')!.innerHTML =
      displayTableOfSongs("Top 10 songs you've listened the most", personal) +
      `<img id="albumuser" src="${personal[0].album.images[0].url}"></img>`;
    document.getElementById('albumuser')!.addEventListener('click', () => {
      audioPlayer.playPause(personal[0].preview_url);
    });

    document.getElementById('top-10-global')!.innerHTML =
      displayTableOfSongs('Top 10 Global', global) +
      `<img id="albumglobal" src="${global[0].album.images[0].url}"></img>`;
    document.getElementById('albumglobal')!.addEventListener('click', () => {
      audioPlayer.playPause(global[0].preview_url);
    });

    document.getElementById('top-10-mex')!.innerHTML =
      displayTableOfSongs('Top 10 México', mexico) +
      `<img id="albummexico" src="${mexico[0].album.images[0].url}"></img>`;
    document.getElementById('albummexico')!.addEventListener('click', () => {
      audioPlayer.playPause(mexico[0].preview_url);
    });
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
});

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

  particleSystem.update(deltat);

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

  particleSystem = new MusicNoteParticleSystem(scene, 9);
  await particleSystem.loadAsync();

  const halls = [
    new Hall(scene, (0 * Math.PI) / 3),
    new Hall(scene, (2 * Math.PI) / 3),
    new Hall(scene, (4 * Math.PI) / 3),
  ];
  await halls[0].loadAsync();
  await halls[1].loadAsync();
  await halls[2].loadAsync();
};

// main
(async () => {
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  // canvas.width = canvas.clientWidth;
  // canvas.height = canvas.clientHeight;
  await createScene(canvas);
  animate();
})();
