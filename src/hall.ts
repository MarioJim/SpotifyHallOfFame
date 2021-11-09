import * as THREE from 'three';
import AlbumCoverManager from './albumcovers';
import { SpotifyTrack } from './spotify';
import TextGenerator from './text';
import WallpaperManager from './wallpaper';

const HALL_WIDTH = 5;
const HALL_LENGTH = 16;
const HALL_HEIGHT = 4;
const CENTER_APOTHEM = HALL_WIDTH / (2 * Math.sqrt(3));
const HALL_WALL_LENGTH = HALL_LENGTH - CENTER_APOTHEM;
const ALBUM_COVER_SIZE = 1.8;
const LOGIN_BUTTON_WIDTH = 2;
const LOGIN_BUTTON_TEXT_SIZE = 0.15;

export default class Hall {
  root: THREE.Group;
  leftWall: THREE.Mesh;
  rightWall: THREE.Mesh;
  endWall: THREE.Mesh;
  endTitles: THREE.Group;
  endGroup: THREE.Group;
  trackGroups: THREE.Group[];

  title: string;
  coversManager: AlbumCoverManager;
  textGenerator: TextGenerator;
  wallpaperMgr: WallpaperManager;

  constructor(
    rotation: number,
    title: string,
    coversManager: AlbumCoverManager,
    textGenerator: TextGenerator,
    wallpaperMgr: WallpaperManager,
  ) {
    this.root = new THREE.Group();
    this.root.rotateY(rotation);

    const tempMaterial = new THREE.MeshNormalMaterial();

    const floorGeometry = new THREE.PlaneGeometry(HALL_WIDTH, HALL_LENGTH);
    const floor = new THREE.Mesh(floorGeometry, tempMaterial);
    floor.position.setZ(HALL_LENGTH / 2);
    floor.rotateX(-Math.PI / 2);
    this.root.add(floor);

    const sideWallGeometry = new THREE.PlaneGeometry(
      HALL_WALL_LENGTH,
      HALL_HEIGHT,
    );

    this.leftWall = new THREE.Mesh(sideWallGeometry, tempMaterial);
    this.leftWall.position.setX(HALL_WIDTH / 2);
    this.leftWall.position.setY(HALL_HEIGHT / 2);
    this.leftWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.leftWall.rotateY(-Math.PI / 2);
    this.root.add(this.leftWall);

    this.rightWall = new THREE.Mesh(sideWallGeometry, tempMaterial);
    this.rightWall.position.setX(-HALL_WIDTH / 2);
    this.rightWall.position.setY(HALL_HEIGHT / 2);
    this.rightWall.position.setZ((HALL_LENGTH + CENTER_APOTHEM) / 2);
    this.rightWall.rotateY(Math.PI / 2);
    this.root.add(this.rightWall);

    this.endGroup = new THREE.Group();
    this.endGroup.position.setY(HALL_HEIGHT / 2);
    this.endGroup.position.setZ(HALL_LENGTH);
    this.endGroup.rotateY(Math.PI);
    this.root.add(this.endGroup);

    this.endTitles = new THREE.Group();
    this.endTitles.translateZ(0.01);
    this.endGroup.add(this.endTitles);

    const endWallGeometry = new THREE.PlaneGeometry(HALL_WIDTH, HALL_HEIGHT);
    this.endWall = new THREE.Mesh(endWallGeometry, tempMaterial);
    this.endGroup.add(this.endWall);

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

      this.root.add(trackGroup);
      return trackGroup;
    });

    this.title = title;
    this.coversManager = coversManager;
    this.textGenerator = textGenerator;
    this.wallpaperMgr = wallpaperMgr;
  }

  addTo(parent: THREE.Object3D) {
    parent.add(this.root);
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

  async drawEndWall() {
    const endWallTop10Text = this.textGenerator.newRegular('Top 10', {
      size: 0.4,
      horizAnchor: 'center',
      maxWidth: HALL_WIDTH,
    });
    endWallTop10Text.translateY(0.4);
    this.endTitles.add(endWallTop10Text);

    const endWallTitleText = this.textGenerator.newBold(this.title, {
      size: 0.4,
      materialType: 'normal',
      horizAnchor: 'center',
      maxWidth: HALL_WIDTH,
    });
    endWallTitleText.translateY(-0.2);
    this.endTitles.add(endWallTitleText);
  }

  setLoginButton(): THREE.Object3D {
    // Close path
    this.endGroup.position.z = CENTER_APOTHEM;
    // Move titles up
    this.endTitles.translateY(0.4);
    // Show button

    const loginButton = new THREE.Group();
    loginButton.translateY(-0.4);
    loginButton.translateZ(0.01);

    const loginButtonBodyGeom = new THREE.BoxGeometry(
      LOGIN_BUTTON_WIDTH,
      0.7,
      0.01,
    );
    const loginButtonBody = new THREE.Mesh(
      loginButtonBodyGeom,
      new THREE.MeshNormalMaterial(),
    );
    loginButton.add(loginButtonBody);

    const loginButtonText = this.textGenerator.newRegular('Login to Spotify', {
      size: LOGIN_BUTTON_TEXT_SIZE,
      horizAnchor: 'center',
      maxWidth: LOGIN_BUTTON_WIDTH,
    });
    loginButtonText.translateZ(0.01);
    loginButtonText.translateY(-LOGIN_BUTTON_TEXT_SIZE / 2);
    loginButton.add(loginButtonText);

    this.endGroup.add(loginButton);

    return loginButton;
  }

  async setTracks(tracks: SpotifyTrack[]): Promise<THREE.Object3D[]> {
    const textureUrls = tracks.map((track) => track.album.images[0].url);
    const albumCoverMaterials = await this.coversManager.fetchAlbums(
      textureUrls,
    );

    const albumCoverGeometry = new THREE.PlaneGeometry(
      ALBUM_COVER_SIZE,
      ALBUM_COVER_SIZE,
    );

    tracks.forEach((track, idx) => {
      const albumCoverMaterial = albumCoverMaterials[idx];
      const albumCover = new THREE.Mesh(albumCoverGeometry, albumCoverMaterial);
      this.trackGroups[idx].add(albumCover);

      const idxText = this.textGenerator.newBold(`${idx + 1}`, {
        size: 0.5,
        materialType: 'normal',
        maxWidth: ALBUM_COVER_SIZE,
      });
      idxText.translateY(0.2 - ALBUM_COVER_SIZE / 2);
      idxText.translateX(0.2 - ALBUM_COVER_SIZE / 2);
      this.trackGroups[idx].add(idxText);

      const songNameText = this.textGenerator.newBold(track.name, {
        horizAnchor: 'center',
        maxWidth: ALBUM_COVER_SIZE,
      });
      songNameText.translateY(-0.2 - ALBUM_COVER_SIZE / 2);
      const songTextBBox = new THREE.Box3().setFromObject(songNameText);
      this.trackGroups[idx].add(songNameText);

      const artistNameText = this.textGenerator.newRegular(
        track.artists[0].name,
        { horizAnchor: 'center', maxWidth: ALBUM_COVER_SIZE },
      );
      artistNameText.translateY(songTextBBox.min.y - 0.15);
      this.trackGroups[idx].add(artistNameText);
    });

    return this.trackGroups;
  }
}
