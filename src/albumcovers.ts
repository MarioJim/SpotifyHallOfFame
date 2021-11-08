import * as THREE from 'three';

type WrapEntryType = (
  entry: [string, Promise<THREE.Texture>],
) => Promise<[string, THREE.Texture]>;

export default class AlbumCoverManager {
  loader: THREE.TextureLoader;
  materials: { [key: string]: THREE.MeshPhongMaterial };

  constructor() {
    this.loader = new THREE.TextureLoader();
    this.materials = {};
  }

  async fetchAlbums(imageUrls: string[]): Promise<THREE.MeshPhongMaterial[]> {
    const promises: { [key: string]: Promise<THREE.Texture> } = {};

    imageUrls.forEach((url) => {
      if (!this.materials[url]) promises[url] = this.loader.loadAsync(url);
    });

    const wrapEntry: WrapEntryType = ([url, prom]) =>
      new Promise(async (resolve) => resolve([url, await prom]));

    const texturesList = await Promise.all(
      Object.entries(promises).map(wrapEntry),
    );
    texturesList.forEach(([url, texture]) => {
      this.materials[url] = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
      });
    });

    return imageUrls.map((url) => this.materials[url]);
  }
}
