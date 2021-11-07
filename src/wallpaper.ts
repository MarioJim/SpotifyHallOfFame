import * as THREE from 'three';

interface WallpaperData {
  url: string;
  width: number;
  height: number;
  scale: number;
}

interface Wallpaper {
  sides: THREE.MeshPhongMaterial;
  end: THREE.MeshPhongMaterial;
}

export default class WallpaperManager {
  loader: THREE.TextureLoader;
  wallpapers: Wallpaper[];
  wallpaperData: WallpaperData[];

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.wallpapers = [null, null, null];
    this.wallpaperData = [
      {
        url: './images/wall1.png',
        width: 300,
        height: 325,
        scale: 2,
      },
      {
        url: './images/wall2.png',
        width: 240,
        height: 458,
        scale: 2,
      },
      {
        url: './images/wall3.png',
        width: 400,
        height: 400,
        scale: 1,
      },
    ];
  }

  async getWallpaper(
    idx: 0 | 1 | 2,
    hallWidth: number,
    hallHeight: number,
    hallDepth: number,
  ): Promise<Wallpaper> {
    const { url, width, height, scale } = this.wallpaperData[idx];

    if (this.wallpapers[idx] === null) {
      const texture = await this.loader.loadAsync(url);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;

      const textureSides = texture.clone();
      textureSides.needsUpdate = true;
      textureSides.repeat.set(
        scale * hallDepth,
        scale * ((hallHeight * width) / height),
      );
      const sides = new THREE.MeshPhongMaterial({
        map: textureSides,
        side: THREE.DoubleSide,
      });

      const textureEnd = texture;
      textureEnd.repeat.set(
        scale * hallWidth,
        scale * ((hallHeight * width) / height),
      );
      const end = new THREE.MeshPhongMaterial({
        map: textureEnd,
        side: THREE.DoubleSide,
      });

      this.wallpapers[idx] = { sides, end };
    }

    return this.wallpapers[idx];
  }
}
