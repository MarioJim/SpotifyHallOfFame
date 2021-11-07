import * as THREE from 'three';
import { SpotifyTrack } from './spotify';
import TextGenerator from './text';
import WallpaperManager from './wallpaper';

const HALL_WIDTH = 5;
const HALL_LENGTH = 16;
const HALL_HEIGHT = 4;
const CENTER_APOTHEM = HALL_WIDTH / (2 * Math.sqrt(3));
const HALL_WALL_LENGTH = HALL_LENGTH - CENTER_APOTHEM;
const ALBUM_COVER_SIZE = 1.8;

export default class Hall {
  root: THREE.Group;
  leftWall: THREE.Mesh;
  rightWall: THREE.Mesh;
  endWall: THREE.Mesh;
  endGroup: THREE.Group;
  trackGroups: THREE.Group[];
  albumCoverMaterials: THREE.MeshPhongMaterial[];
  textGenerator: TextGenerator;
  wallpaperMgr: WallpaperManager;

  constructor(
    parent: THREE.Object3D,
    rotation: number,
    title: string,
    textGenerator: TextGenerator,
    wallpaperMgr: WallpaperManager,
  ) {
    this.root = new THREE.Group();
    this.root.rotateY(rotation);
    parent.add(this.root);

    const tempMaterial = new THREE.MeshNormalMaterial();

    const floorGeometry = new THREE.PlaneGeometry(HALL_WIDTH, HALL_LENGTH);
    const floor = new THREE.Mesh(floorGeometry, tempMaterial);
    floor.position.setZ(HALL_LENGTH / 2);
    floor.rotateX(-Math.PI / 2);
    this.root.add(floor);

    const wallGeometry = new THREE.PlaneGeometry(HALL_WALL_LENGTH, HALL_HEIGHT);

    this.leftWall = new THREE.Mesh(wallGeometry, tempMaterial);
    this.leftWall.position.setX(HALL_WIDTH / 2);
    this.leftWall.position.setY(HALL_HEIGHT / 2);
    this.leftWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.leftWall.rotateY(-Math.PI / 2);
    this.root.add(this.leftWall);

    this.rightWall = new THREE.Mesh(wallGeometry, tempMaterial);
    this.rightWall.position.setX(-HALL_WIDTH / 2);
    this.rightWall.position.setY(HALL_HEIGHT / 2);
    this.rightWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.rightWall.rotateY(Math.PI / 2);
    this.root.add(this.rightWall);

    this.endGroup = new THREE.Group();
    this.endGroup.position.setY(HALL_HEIGHT / 2);
    this.endGroup.position.setZ(HALL_LENGTH);

    const endWallGeometry = new THREE.PlaneGeometry(HALL_WIDTH, HALL_HEIGHT);
    this.endWall = new THREE.Mesh(endWallGeometry, tempMaterial);
    this.endWall.rotateY(Math.PI);
    this.endGroup.add(this.endWall);

    const endWallTop10Text = textGenerator.createText(
      "Top 10",
      "regular",
      0.4,
      "white",
      "center",
      HALL_WIDTH,
    );
    endWallTop10Text.rotateY(Math.PI);
    endWallTop10Text.translateY(0.4);
    endWallTop10Text.translateZ(0.01);
    this.endGroup.add(endWallTop10Text);

    const endWallTitleText = textGenerator.createText(
      title,
      "semibold",
      0.4,
      "normal",
      "center",
      HALL_WIDTH,
    );
    endWallTitleText.rotateY(Math.PI);
    endWallTitleText.translateY(-0.2);
    endWallTitleText.translateZ(0.01);
    this.endGroup.add(endWallTitleText);

    this.root.add(this.endGroup);

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

    this.trackGroups.forEach((trackGroup) => this.root.add(trackGroup));

    this.albumCoverMaterials = [];
    this.textGenerator = textGenerator;
    this.wallpaperMgr = wallpaperMgr;
  }

  async setWallpaper(wallpaperIdx: 0 | 1 | 2) {
    const { sides, end } = await this.wallpaperMgr.getWallpaper(
      wallpaperIdx,
      HALL_WIDTH,
      HALL_HEIGHT,
      HALL_WALL_LENGTH,
    );

    this.leftWall.material = sides;
    this.rightWall.material = sides;
    this.endWall.material = end;
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
        "normal",
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
        "white",
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
        "white",
        'center',
        ALBUM_COVER_SIZE,
      );
      artistNameText.translateY(songTextBBox.min.y - 0.15);
      this.trackGroups[idx].add(artistNameText);
    });
  }
}
