import * as THREE from 'three';
import { SpotifyTrack } from './spotify';
import TextGenerator from './text';

const HALL_WIDTH = 5;
const HALL_LENGTH = 16;
const HALL_HEIGHT = 4;
const CENTER_APOTHEM = HALL_WIDTH / (2 * Math.sqrt(3));
const HALL_WALL_LENGTH = HALL_LENGTH - CENTER_APOTHEM;
const ALBUM_COVER_SIZE = 1.8;
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
  trackGroups: THREE.Group[];
  albumCoverMaterials: THREE.MeshPhongMaterial[];
  textGenerator: TextGenerator;

  constructor(
    parent: THREE.Object3D,
    rotation: number,
    textGenerator: TextGenerator,
  ) {
    this.hallGroup = new THREE.Group();
    this.hallGroup.rotateY(rotation);
    parent.add(this.hallGroup);

    const tempMaterial = new THREE.MeshNormalMaterial();

    const floorGeometry = new THREE.PlaneGeometry(HALL_WIDTH, HALL_LENGTH);
    const floor = new THREE.Mesh(floorGeometry, tempMaterial);
    floor.position.setZ(HALL_LENGTH / 2);
    floor.rotateX(-Math.PI / 2);
    this.hallGroup.add(floor);

    const wallGeometry = new THREE.PlaneGeometry(HALL_WALL_LENGTH, HALL_HEIGHT);

    this.leftWall = new THREE.Mesh(wallGeometry, tempMaterial);
    this.leftWall.position.setX(HALL_WIDTH / 2);
    this.leftWall.position.setY(HALL_HEIGHT / 2);
    this.leftWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.leftWall.rotateY(Math.PI / 2);
    this.hallGroup.add(this.leftWall);

    this.rightWall = new THREE.Mesh(wallGeometry, tempMaterial);
    this.rightWall.position.setX(-HALL_WIDTH / 2);
    this.rightWall.position.setY(HALL_HEIGHT / 2);
    this.rightWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.rightWall.rotateY(-Math.PI / 2);
    this.hallGroup.add(this.rightWall);

    this.trackGroups = Array.from(Array(10).keys()).map((idx) => {
      const trackGroup = new THREE.Group();
      if (idx % 2 === 0) {
        trackGroup.position.setX(HALL_WIDTH / 2 - 0.01);
        trackGroup.rotateY(-Math.PI / 2);
      } else {
        trackGroup.position.setX(-HALL_WIDTH / 2 + 0.01);
        trackGroup.rotateY(Math.PI / 2);
      }
      trackGroup.position.setY(0.3 + HALL_HEIGHT / 2);
      trackGroup.position.setZ(
        HALL_WALL_LENGTH * (0.97 - Math.floor(idx / 2) / 5.5),
      );
      return trackGroup;
    });

    this.trackGroups.forEach((trackGroup) => this.hallGroup.add(trackGroup));

    this.albumCoverMaterials = [];

    this.textGenerator = textGenerator;
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

  async setTracks(tracks: SpotifyTrack[]) {
    const textureUrls = tracks.map((track) => track.album.images[0].url);
    const textureLoader = new THREE.TextureLoader();
    const textures = await Promise.all(
      textureUrls.map((url) => textureLoader.loadAsync(url)),
    );

    this.albumCoverMaterials = textures.map(
      (texture) =>
        new THREE.MeshPhongMaterial({ map: texture, side: THREE.DoubleSide }),
    );

    const albumCoverGeometry = new THREE.PlaneGeometry(
      ALBUM_COVER_SIZE,
      ALBUM_COVER_SIZE,
    );

    tracks.forEach((track, idx) => {
      const albumCoverMaterial = this.albumCoverMaterials[idx];
      const albumCover = new THREE.Mesh(albumCoverGeometry, albumCoverMaterial);
      this.trackGroups[idx].add(albumCover);

      const idxText = this.textGenerator.createText(
        `${idx + 1}`,
        'semibold',
        0.5,
        'left',
        ALBUM_COVER_SIZE,
      );
      idxText.translateY(0.2 - ALBUM_COVER_SIZE / 2);
      idxText.translateX(0.2 - ALBUM_COVER_SIZE / 2);
      this.trackGroups[idx].add(idxText);

      const songNameText = this.textGenerator.createText(
        track.name,
        'semibold',
        0.1,
        'center',
        ALBUM_COVER_SIZE,
      );
      songNameText.translateY(-0.2 - ALBUM_COVER_SIZE / 2);
      const songTextBBox = new THREE.Box3().setFromObject(songNameText);
      this.trackGroups[idx].add(songNameText);

      const artistNameText = this.textGenerator.createText(
        track.artists[0].name,
        'regular',
        0.1,
        'center',
        ALBUM_COVER_SIZE,
      );
      artistNameText.translateY(songTextBBox.min.y - 0.15);
      this.trackGroups[idx].add(artistNameText);
    });
  }
}
