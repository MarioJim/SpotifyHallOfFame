import * as THREE from 'three';
import { PointerLockControls } from '@three/controls/PointerLockControls';
import MousePointerControls from './pointer';

interface MovementState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export default class MovementControls {
  pointerLockControls: PointerLockControls;
  pointer: THREE.Mesh;
  movement: MovementState;
  direction: THREE.Vector3;
  collisionRaycaster: THREE.Raycaster;
  walls: THREE.Mesh[];
  rotationAxis: THREE.Vector3;

  constructor(
    camera: THREE.Camera,
    scene: THREE.Scene,
    pointerControls: MousePointerControls,
  ) {
    this.pointerLockControls = new PointerLockControls(camera, document.body);

    // Create a pointer so that the user knows where is the center of the screen
    const pointerGeometry = new THREE.SphereGeometry(0.01, 16, 8);
    const pointerMaterial = new THREE.MeshBasicMaterial({ color: 'white' });
    this.pointer = new THREE.Mesh(pointerGeometry, pointerMaterial);
    scene.add(this.pointer);

    const instructionsDiv = document.getElementById('instructions');

    document.addEventListener('pointerdown', (e) => {
      if (instructionsDiv.style.display === 'none') {
        pointerControls.onClick(e);
      } else {
        this.pointerLockControls.lock();
      }
    });

    this.pointerLockControls.addEventListener(
      'lock',
      () => (instructionsDiv.style.display = 'none'),
    );
    this.pointerLockControls.addEventListener(
      'unlock',
      () => (instructionsDiv.style.display = 'flex'),
    );

    this.movement = { up: false, down: false, left: false, right: false };
    document.addEventListener(
      'keydown',
      (e) => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
            this.movement.up = true;
            break;
          case 'ArrowLeft':
          case 'a':
            this.movement.left = true;
            break;
          case 'ArrowDown':
          case 's':
            this.movement.down = true;
            break;
          case 'ArrowRight':
          case 'd':
            this.movement.right = true;
            break;
          case 'Escape':
            this.pointerLockControls.unlock();
            break;
        }
      },
      false,
    );
    document.addEventListener(
      'keyup',
      (e) => {
        switch (e.key) {
          case 'ArrowUp':
          case 'w':
            this.movement.up = false;
            break;
          case 'ArrowLeft':
          case 'a':
            this.movement.left = false;
            break;
          case 'ArrowDown':
          case 's':
            this.movement.down = false;
            break;
          case 'ArrowRight':
          case 'd':
            this.movement.right = false;
            break;
          case 'Escape':
            this.pointerLockControls.unlock();
            break;
        }
      },
      false,
    );

    this.direction = new THREE.Vector3();

    this.collisionRaycaster = new THREE.Raycaster();
    this.walls = [];
    this.rotationAxis = new THREE.Vector3(0, 1, 0);
  }

  addWalls(walls: THREE.Mesh[]) {
    this.walls.push(...walls);
  }

  update(deltat: number) {
    const camera =
      this.pointerLockControls.getObject() as THREE.PerspectiveCamera;

    this.direction.z = Number(this.movement.up) - Number(this.movement.down);
    this.direction.x = Number(this.movement.right) - Number(this.movement.left);
    this.direction.normalize();

    this.collisionRaycaster.ray.origin.copy(camera.position);
    camera.getWorldDirection(this.collisionRaycaster.ray.direction);
    this.collisionRaycaster.ray.direction.setY(0);

    const frontWall = this.collisionRaycaster.intersectObjects(this.walls)[0];
    if (frontWall && frontWall.distance < 2 && this.direction.z > 0) {
      this.direction.setZ(0);
    }

    this.collisionRaycaster.ray.direction.applyAxisAngle(
      this.rotationAxis,
      Math.PI / 2,
    );
    const leftWall = this.collisionRaycaster.intersectObjects(this.walls)[0];
    if (leftWall && leftWall.distance < 2 && this.direction.x < 0) {
      this.direction.setX(0);
    }

    this.collisionRaycaster.ray.direction.applyAxisAngle(
      this.rotationAxis,
      Math.PI / 2,
    );
    const backWall = this.collisionRaycaster.intersectObjects(this.walls)[0];
    if (backWall && backWall.distance < 2 && this.direction.z < 0) {
      this.direction.setZ(0);
    }

    this.collisionRaycaster.ray.direction.applyAxisAngle(
      this.rotationAxis,
      Math.PI / 2,
    );
    const rightWall = this.collisionRaycaster.intersectObjects(this.walls)[0];
    if (rightWall && rightWall.distance < 2 && this.direction.x > 0) {
      this.direction.setX(0);
    }

    const rightMov = (this.direction.x * deltat) / 100;
    const forwardMov = (this.direction.z * deltat) / 100;
    this.pointerLockControls.moveRight(rightMov);
    this.pointerLockControls.moveForward(forwardMov);

    this.pointer.position.copy(camera.position);
    this.pointer.rotation.copy(camera.rotation);
    this.pointer.translateZ(-1.5);
    this.pointer.updateMatrix();
  }
}
