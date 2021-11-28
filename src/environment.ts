import * as THREE from 'three';

const resizeRendererToDisplaySize = (
  renderer: THREE.WebGLRenderer,
): boolean => {
  const canvas = renderer.domElement;
  const pixelRatio = window.devicePixelRatio;
  const width = (canvas.clientWidth * pixelRatio) | 0;
  const height = (canvas.clientHeight * pixelRatio) | 0;
  if (canvas.width !== width || canvas.height !== height) {
    renderer.setSize(width, height, false);
    return true;
  }
  return false;
};

let currentTime = Date.now();

type AnimatedObj = { update: (deltat: number) => void };

export const animate = (
  environment: Environment,
  objects: AnimatedObj[],
): void => {
  const { renderer, scene, camera } = environment;

  // Check if renderer needs to be resized
  if (resizeRendererToDisplaySize(renderer)) {
    const canvas = renderer.domElement;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
  }

  // Calculate delta time
  const now = Date.now();
  const deltat = now - currentTime;
  currentTime = now;

  // Update the objects provided
  objects.forEach((object) => object.update(deltat));

  // Render the scene
  renderer.render(scene, camera);

  // Call animate again on the next frame
  requestAnimationFrame(() => animate(environment, objects));
};

interface Environment {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export const createScene = (canvas: HTMLCanvasElement): Environment => {
  // Create the Three.js renderer and attach it to our canvas
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

  // Create a new Three.js scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(30 / 256, 26 / 256, 22 / 256);

  const ambientLight = new THREE.AmbientLight(0xdddddd, 0.6);
  scene.add(ambientLight);

  // Add a camera so we can view the scene
  const camera = new THREE.PerspectiveCamera(
    45,
    canvas.width / canvas.height,
    1,
    4000,
  );
  camera.position.setY(2);
  camera.position.setZ(10);

  return { renderer, scene, camera };
};
