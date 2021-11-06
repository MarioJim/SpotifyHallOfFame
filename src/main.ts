import * as THREE from 'three';

import AudioPlayer from './audio';
import MusicNoteParticleSystem from './particles';

const audioPlayer = new AudioPlayer();

const getAccessToken = () => {
  const params = new URLSearchParams(window.location.hash.substr(1));
  if (params.has('access_token') && params.get('token_type') == 'Bearer')
    return params.get('access_token');
  return null;
};

const accessToken = getAccessToken();
const spotifyFetch = (urlPath: string) =>
  fetch(`https://api.spotify.com/v1/${urlPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((response) => response.json());

if (accessToken) {
  document.getElementById('stats-page')!.style.display = 'block';
  console.log('Your access token is', accessToken);
  spotifyFetch('me/top/tracks?limit=10&time_range=long_term').then((res) => {
    document.getElementById('top-10-user')!.innerHTML =
      displayTableOfSongs("Top 10 songs you've listened the most", res.items) +
      `<img id="albumuser" src="${res.items[0].album.images[0].url}"></img>`;
    document.getElementById('albumuser')!.addEventListener('click', () => {
      audioPlayer.playPause(res.items[0].preview_url);
    });
  });
  spotifyFetch('playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=10').then(
    (res) => {
      document.getElementById('top-10-global')!.innerHTML =
        displayTableOfSongs(
          'Top 10 Global',
          res.items.map((i: any) => i.track),
        ) +
        `<img id="albumglobal" src="${res.items[0].track.album.images[0].url}"></img>`;
      document.getElementById('albumglobal')!.addEventListener('click', () => {
        audioPlayer.playPause(res.items[0].track.preview_url);
      });
    },
  );
  spotifyFetch('playlists/37i9dQZEVXbO3qyFxbkOE1/tracks?limit=10').then(
    (res) => {
      document.getElementById('top-10-mex')!.innerHTML =
        displayTableOfSongs(
          'Top 10 México',
          res.items.map((i: any) => i.track),
        ) +
        `<img id="albummexico" src="${res.items[0].track.album.images[0].url}"></img>`;
      document.getElementById('albummexico')!.addEventListener('click', () => {
        audioPlayer.playPause(res.items[0].track.preview_url);
      });
    },
  );
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
    window.location.replace(`https://accounts.spotify.com/authorize?${params}`);
  });
}

const displayTableOfSongs = (title: string, songs: any[]) =>
  `<h3>${title}</h3><ul>` +
  songs.map((s) => `<li>${s.name} by ${s.artists[0].name}</li>`).join('') +
  '</ul>';

let renderer: THREE.WebGLRenderer | null = null,
  scene: THREE.Scene | null = null,
  camera: THREE.PerspectiveCamera | null = null,
  root: THREE.Object3D | null = null;

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

  const directionalLight = new THREE.DirectionalLight(0x111111, 1);
  directionalLight.position.set(0, 5, 100);
  scene.add(directionalLight);

  // Add a camera so we can view the scene
  camera = new THREE.PerspectiveCamera(
    40,
    canvas.width / canvas.height,
    1,
    4000,
  );
  camera.position.z = 10;

  root = new THREE.Object3D();

  particleSystem = new MusicNoteParticleSystem(scene, 9);
  await particleSystem.loadAsync();
};

// main
(async () => {
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  // canvas.width = canvas.clientWidth;
  // canvas.height = canvas.clientHeight;
  await createScene(canvas);
  animate();
})();
