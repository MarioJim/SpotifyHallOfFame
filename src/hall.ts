import * as THREE from 'three';

const HALL_WIDTH = 5;
const HALL_LENGTH = 20;
const HALL_HEIGHT = 4;
const CENTER_APOTHEM = HALL_WIDTH / (2 * Math.sqrt(3));
const WALLPAPER = {
  // url: './images/wall1.png',
  // width: 300,
  // height: 325,
  url: './images/wall2.png',
  width: 240,
  height: 458,
  scale: 2,
  // url: './images/wall3.png',
  // width: 400,
  // height: 400,
  // scale: 1,
};

export default class Hall {
  hallGroup: THREE.Group;
  leftWall: THREE.Mesh;
  rightWall: THREE.Mesh;

  constructor(parent: THREE.Object3D, rotation: number) {
    this.hallGroup = new THREE.Group();
    this.hallGroup.rotateY(rotation);
    parent.add(this.hallGroup);

    const tempMaterial = new THREE.MeshNormalMaterial();

    const floorGeometry = new THREE.PlaneGeometry(HALL_WIDTH, HALL_LENGTH);
    const floor = new THREE.Mesh(floorGeometry, tempMaterial);
    floor.position.setZ(HALL_LENGTH / 2);
    floor.rotateX(-Math.PI / 2);
    this.hallGroup.add(floor);

    const wallGeometry = new THREE.PlaneGeometry(
      HALL_LENGTH - CENTER_APOTHEM,
      HALL_HEIGHT,
    );

    this.leftWall = new THREE.Mesh(wallGeometry, tempMaterial);
    this.leftWall.position.setX(HALL_WIDTH / 2);
    this.leftWall.position.setY(HALL_HEIGHT / 2);
    this.leftWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.leftWall.rotateY(-Math.PI / 2);
    this.hallGroup.add(this.leftWall);

    this.rightWall = new THREE.Mesh(wallGeometry, tempMaterial);
    this.rightWall.position.setX(-HALL_WIDTH / 2);
    this.rightWall.position.setY(HALL_HEIGHT / 2);
    this.rightWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.rightWall.rotateY(Math.PI / 2);
    this.hallGroup.add(this.rightWall);
  }

  async loadAsync() {
    const wallpaperTextureLoader = new THREE.TextureLoader();
    const wallpaperTexture = await wallpaperTextureLoader.loadAsync(
      WALLPAPER.url,
    );
    wallpaperTexture.wrapS = THREE.RepeatWrapping;
    wallpaperTexture.wrapT = THREE.RepeatWrapping;
    wallpaperTexture.repeat.set(
      WALLPAPER.scale * (HALL_LENGTH - CENTER_APOTHEM),
      WALLPAPER.scale * ((HALL_HEIGHT * WALLPAPER.width) / WALLPAPER.height),
    );

    const wallpaperMaterial = new THREE.MeshPhongMaterial({
      map: wallpaperTexture,
      side: THREE.DoubleSide,
    });
    this.leftWall.material = wallpaperMaterial;
    this.rightWall.material = wallpaperMaterial;
  }
}
