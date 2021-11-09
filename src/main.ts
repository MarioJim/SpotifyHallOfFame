import { OrbitControls } from '@three/controls/OrbitControls';

import AlbumCoverManager from './albumcovers';
import AudioPlayer from './audio';
import { animate, createScene } from './environment';
import Hall from './hall';
import MusicNoteParticleSystem from './particles';
import MousePointerControls from './pointer';
import RecordPlayer from './recordplayer';
import { loadSpotifyData, redirectToSpotifyLogin } from './spotify';
import TextGenerator from './text';
import WallpaperManager from './wallpaper';

(async () => {
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  const { renderer, scene, camera } = createScene(canvas);

  const audioPlayer = new AudioPlayer();
  const coversManager = new AlbumCoverManager();
  // TODO: Replace for walking controls
  const orbitControls = new OrbitControls(camera, renderer.domElement);
  const pointerControls = new MousePointerControls(camera);
  const textGenerator = new TextGenerator();
  const wallpaperMgr = new WallpaperManager();

  const recordPlayer = new RecordPlayer(camera, scene, coversManager);
  const particleSystem = new MusicNoteParticleSystem(scene, 9);
  const halls: Hall[] = ['México', 'Global', 'Personal'].map(
    (title, idx) =>
      new Hall(
        (2 * idx * Math.PI) / 3,
        title,
        coversManager,
        textGenerator,
        wallpaperMgr,
      ),
  );

  // Load fonts
  await textGenerator.load();

  // Load models and halls
  await Promise.all([
    recordPlayer.load(),
    // particleSystem.load(),
    ...halls.map((hall) =>
      (async () => {
        await Promise.all([hall.setWallpaper(1), hall.drawEndWall()]);
        hall.addTo(scene);
      })(),
    ),
  ]);

  // Load Spotify data
  const { globalTracks, mexicoTracks, personalTracks } =
    await loadSpotifyData();

  // Set Spotify data in halls
  await Promise.all(
    [mexicoTracks, globalTracks, personalTracks].map(async (tracks, idx) => {
      if (tracks) {
        const albums = await halls[idx].setTracks(tracks);
        albums.forEach((album, idx) =>
          pointerControls.addObjectAndHandler(album, () => {
            console.log(tracks[idx]);
          }),
        );
      } else {
        const loginButton = halls[idx].setLoginButton();
        pointerControls.addObjectAndHandler(loginButton, () =>
          redirectToSpotifyLogin(),
        );
      }
    }),
  );

  // Render the scene and animate it
  animate({ renderer, scene, camera }, [
    orbitControls,
    recordPlayer,
    // particleSystem,
  ]);
})();
