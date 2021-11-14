import AlbumCoverManager from './albumcovers';
import AudioPlayer from './audio';
import { animate, createScene } from './environment';
import Hall from './hall';
import MovementControls from './movement';
import MousePointerControls from './pointer';
import RecordPlayer from './recordplayer';
import { loadSpotifyData, redirectToSpotifyLogin } from './spotify';
import TextGenerator from './text';
import WallpaperManager from './wallpaper';

(async () => {
  const canvas = document.getElementById('webglcanvas') as HTMLCanvasElement;
  const environment = createScene(canvas);
  const { scene, camera } = environment;

  const audioPlayer = new AudioPlayer();
  const coversManager = new AlbumCoverManager();
  const pointerControls = new MousePointerControls(camera);
  const textGenerator = new TextGenerator();
  const wallpaperMgr = new WallpaperManager();

  const movementControls = new MovementControls(camera, scene, pointerControls);
  const recordPlayer = new RecordPlayer(
    camera,
    scene,
    coversManager,
    audioPlayer,
  );
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

  movementControls.addWalls(halls.map((hall) => hall.getWalls()).flat());

  // Load fonts
  await textGenerator.load();

  // Load models and halls
  await Promise.all([
    recordPlayer.load(),
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
            if (tracks[idx].preview_url) {
              recordPlayer.changeTrack(tracks[idx]);
              audioPlayer.playPauseTrack(tracks[idx]);
            } else {
              console.error(
                `Preview url not available for ${tracks[idx].name}`,
              );
            }
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
  animate(environment, [movementControls, recordPlayer]);
})();
