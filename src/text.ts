import * as THREE from 'three';
import { FontLoader, Font } from '@three/loaders/FontLoader';
import { TextGeometry } from '@three/geometries/TextGeometry';

const REGULAR_FONT_URL = 'Poppins_Regular.json';
const SEMIBOLD_FONT_URL = 'Poppins_SemiBold_Regular.json';

type MaterialType = 'normal' | 'white';
type Anchor = 'left' | 'center' | 'right';
type Axis = 'x' | 'y' | 'z';

interface TextParams {
  size: number;
  materialType: MaterialType;
  horizAnchor: Anchor;
  maxWidth: number;
}

export default class TextGenerator {
  regularFont: Font;
  semiboldFont: Font;
  normalMaterial: THREE.MeshNormalMaterial;
  whiteMaterial: THREE.MeshPhongMaterial;

  constructor() {
    this.normalMaterial = new THREE.MeshNormalMaterial();
    this.whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
  }

  async load() {
    const fontLoader = new FontLoader();
    const [regularFont, semiboldFont] = await Promise.all([
      fontLoader.loadAsync(REGULAR_FONT_URL),
      fontLoader.loadAsync(SEMIBOLD_FONT_URL),
    ]);

    this.regularFont = regularFont;
    this.semiboldFont = semiboldFont;
  }

  newRegular(text: string, params: Partial<TextParams>): THREE.Group {
    const size = params.size || 0.1;
    const materialType = params.materialType || 'white';
    const horizAnchor = params.horizAnchor || 'left';
    const maxWidth = params.maxWidth || Infinity;

    return this.#renderText(
      text,
      this.regularFont,
      size,
      this.#getMaterialForType(materialType),
      horizAnchor,
      maxWidth,
    );
  }

  newBold(text: string, params: Partial<TextParams>): THREE.Group {
    const size = params.size || 0.1;
    const materialType = params.materialType || 'white';
    const horizAnchor = params.horizAnchor || 'left';
    const maxWidth = params.maxWidth || Infinity;

    return this.#renderText(
      text,
      this.semiboldFont,
      size,
      this.#getMaterialForType(materialType),
      horizAnchor,
      maxWidth,
    );
  }

  #renderText(
    text: string,
    font: Font,
    size: number,
    material: THREE.Material,
    horizAnchor: Anchor,
    maxWidth: number,
  ): THREE.Group {
    const params = {
      font,
      size,
      height: 0.01,
      curveSegments: 4,
    };

    const geometries = [];

    while (true) {
      const textGeometry = new TextGeometry(text, params);
      textGeometry.computeBoundingBox();
      const bBox = textGeometry.boundingBox;
      if (bBox.max.x - bBox.min.x > maxWidth) {
        const words = text.split(' ');
        let current = words[0];

        let nextIdx = 1;
        let next = current + ' ' + words[nextIdx];
        let nextGeom = new TextGeometry(next, params);
        nextGeom.computeBoundingBox();
        let bBox = nextGeom.boundingBox;

        while (bBox.max.x - bBox.min.x <= maxWidth) {
          current = next;
          ++nextIdx;
          next += ' ' + words[nextIdx];
          nextGeom = new TextGeometry(next, params);
          nextGeom.computeBoundingBox();
          bBox = nextGeom.boundingBox;
        }

        text = words.slice(nextIdx).join(' ');
        const currentTextGeom = new TextGeometry(current, params);
        currentTextGeom.computeBoundingBox();
        geometries.push(currentTextGeom);
      } else {
        geometries.push(textGeometry);
        break;
      }
    }

    const group = new THREE.Group();

    geometries.forEach((geometry, idx) => {
      const mesh = new THREE.Mesh(geometry, material);
      const bBox = geometry.boundingBox;
      mesh.position.setX(this.#getPosForAnchor(horizAnchor, bBox, 'x'));
      mesh.position.setY(-1.3 * idx * size);
      mesh.rotateY(Math.PI * 2);
      group.add(mesh);
    });

    return group;
  }

  #getMaterialForType(type: MaterialType): THREE.Material {
    if (type === 'normal') {
      return this.normalMaterial;
    } else if (type === 'white') {
      return this.whiteMaterial;
    }
  }

  #getPosForAnchor(anchor: Anchor, bBox: THREE.Box3, axis: Axis): number {
    const { max, min } = bBox;
    if (anchor === 'left') {
      return -min[axis];
    } else if (anchor === 'center') {
      return -0.5 * (max[axis] + min[axis]);
    } else if (anchor === 'right') {
      return -max[axis];
    }
  }
}
