import AudioPlayer from './audio.js';

const audioPlayer = new AudioPlayer();

const getAccessToken = () => {
  const params = new URLSearchParams(window.location.hash.substr(1));
  if (params.has('access_token') && params.get('token_type') == 'Bearer')
    return params.get('access_token');
  return null;
};

const accessToken = getAccessToken();
const spotifyFetch = (urlPath) =>
  fetch(`https://api.spotify.com/v1/${urlPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((response) => response.json());

if (accessToken) {
  document.getElementById('stats-page').style.display = 'block';
  console.log('Your access token is', accessToken);
  spotifyFetch('me/top/tracks?limit=10&time_range=long_term').then((res) => {
    document.getElementById('top-10-user').innerHTML =
      displayTableOfSongs("Top 10 songs you've listened the most", res.items) +
      `<img id="albumuser" src="${res.items[0].album.images[0].url}"></img>`;
    document.getElementById('albumuser').addEventListener('click', () => {
      audioPlayer.playPause(res.items[0].preview_url);
    });
  });
  spotifyFetch('playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=10').then(
    (res) => {
      document.getElementById('top-10-global').innerHTML =
        displayTableOfSongs(
          'Top 10 Global',
          res.items.map((i) => i.track),
        ) +
        `<img id="albumglobal" src="${res.items[0].track.album.images[0].url}"></img>`;
      document.getElementById('albumglobal').addEventListener('click', () => {
        audioPlayer.playPause(res.items[0].track.preview_url);
      });
    },
  );
  spotifyFetch('playlists/37i9dQZEVXbO3qyFxbkOE1/tracks?limit=10').then(
    (res) => {
      document.getElementById('top-10-mex').innerHTML =
        displayTableOfSongs(
          'Top 10 México',
          res.items.map((i) => i.track),
        ) +
        `<img id="albummexico" src="${res.items[0].track.album.images[0].url}"></img>`;
      document.getElementById('albummexico').addEventListener('click', () => {
        audioPlayer.playPause(res.items[0].track.preview_url);
      });
    },
  );
} else {
  document.getElementById('login-page').style.display = 'block';
  document.getElementById('login-btn').addEventListener('click', () => {
    const spotifyAuthParams = new URLSearchParams();
    spotifyAuthParams.set('client_id', '78d27efbc5e84665b852ca8dd63ea33f');
    spotifyAuthParams.set('response_type', 'token');
    const original_url = window.location.origin + window.location.pathname;
    spotifyAuthParams.set('redirect_uri', original_url);
    spotifyAuthParams.set('scope', ['user-top-read'].join(' '));
    const params = spotifyAuthParams.toString();
    window.location.replace(`https://accounts.spotify.com/authorize?${params}`);
  });
}

const displayTableOfSongs = (title, songs) =>
  `<h3>${title}</h3><ul>` +
  songs.map((s) => `<li>${s.name} by ${s.artists[0].name}</li>`).join('') +
  '</ul>';
