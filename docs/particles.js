import * as THREE from 'https://threejs.org/build/three.module.js';
import { FBXLoader } from 'https://threejs.org/examples/jsm/loaders/FBXLoader.js';

let renderer = null,
  scene = null,
  camera = null,
  root = null;

let raycaster = new THREE.Raycaster(),
  mouse = new THREE.Vector2(),
  intersected,
  clicked;

let currentTime = Date.now();
let particleSystem = null;

class MusicNoteParticleSystem {
  constructor(scene, n) {
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

  update(deltat) {
    this.particlePool.forEach((p) => p.update(deltat));
  }
}

class MusicNoteParticle {
  constructor(model) {
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

  updateScale(deltat) {
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

  updatePosition(deltat) {
    this.model.translateOnAxis(this.axis, deltat / 1000);
  }

  update(deltat) {
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
const createScene = async (canvas) => {
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

const onDocumentPointerMove = (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(root.children);

  if (intersects.length > 0) {
    if (intersected != intersects[0].object) {
      if (intersected)
        intersected.material.emissive.set(intersected.currentHex);

      intersected = intersects[0].object;
      intersected.currentHex = intersected.material.emissive.getHex();
      intersected.material.emissive.set(0xff0000);
    }
  } else {
    if (intersected) intersected.material.emissive.set(intersected.currentHex);

    intersected = null;
  }
};

const onDocumentPointerDown = (event) => {
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
  const canvas = document.getElementById('webglcanvas');
  await createScene(canvas);
  document.addEventListener('pointermove', onDocumentPointerMove);
  document.addEventListener('pointerdown', onDocumentPointerDown);
  animate();
})();
