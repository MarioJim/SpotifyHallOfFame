import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

import AudioPlayer from './audio';

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

class MusicNoteParticleSystem {
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

const animate = () => {
  // Call animate again on the next frame
  requestAnimationFrame(animate);

  // Calculate delta time
  const now = Date.now();
  const deltat = now - currentTime;
  currentTime = now;

  particleSystem.update(deltat);

  // Render the scene
  renderer.render(scene, camera);
};

/**
 * Loads two music notes from the models/keys.obj file
 * @returns {Promise<THREE.Group[]>} both notes
 */
const loadNoteKeysModels = async () => {
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

/**
 * Creates a basic scene with lights, a camera, and 3 objects
 * @param {HTMLCanvasElement} canvas The canvas element to render on
 */
const createScene = async (canvas: HTMLCanvasElement) => {
  // Create the Three.js renderer and attach it to our canvas
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(canvas.width, canvas.height);

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

const onDocumentPointerMove = (event: PointerEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(root.children);

  if (intersects.length > 0) {
    if (intersected != intersects[0].object) {
      if (intersected)
        intersected.material.emissive.set(intersected.currentHex);

      intersected = intersects[0].object as THREE.Mesh;
      intersected.currentHex = intersected.material.emissive.getHex();
      intersected.material.emissive.set(0xff0000);
    }
  } else {
    if (intersected) intersected.material.emissive.set(intersected.currentHex);

    intersected = null;
  }
};

const onDocumentPointerDown = (event: PointerEvent) => {
  event.preventDefault();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  let intersects = raycaster.intersectObjects(root.children);

  if (intersects.length > 0) {
    clicked = intersects[0].object;
    clicked.material.emissive.set(0x00ff00);
  } else {
    if (clicked) clicked.material.emissive.set(clicked.currentHex);

    clicked = null;
  }
};

// main
(async () => {
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  await createScene(canvas);
  document.addEventListener('pointermove', onDocumentPointerMove);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  animate();
})();
