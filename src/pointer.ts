import * as THREE from 'three';

type ObjectsMapType = { [key: string]: THREE.Object3D };
type HandlersMapType = { [key: string]: () => void };

export default class MousePointerControls {
  camera: THREE.Camera;
  raycaster: THREE.Raycaster;
  mouse: THREE.Vector2;
  objectsMap: ObjectsMapType;
  handlersMap: HandlersMapType;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.objectsMap = {};
    this.handlersMap = {};

    document.addEventListener('pointerdown', (e) => this.onClick(e));
  }

  addObjectAndHandler(object: THREE.Object3D, handler: () => void) {
    const { uuid } = object;
    this.objectsMap[uuid] = object;
    this.handlersMap[uuid] = handler;
  }

  onClick(event: PointerEvent) {
    event.preventDefault();

    this.mouse.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1,
    );
    this.raycaster.setFromCamera(this.mouse, this.camera);

    const firstIntersection = this.raycaster.intersectObjects(
      Object.values(this.objectsMap),
      true,
    )[0];

    if (firstIntersection) {
      // Search for parent originally added
      let objIntersected = firstIntersection.object;
      while (!this.objectsMap[objIntersected.uuid]) {
        objIntersected = objIntersected.parent;
      }

      // Execute its handler
      const { uuid } = objIntersected;
      this.handlersMap[uuid]();
    }
  }
}
