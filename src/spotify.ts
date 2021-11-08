const URL_PERSONAL_TOP = 'me/top/tracks?limit=10&time_range=long_term';
const URL_GLOBAL_TOP = 'playlists/37i9dQZEVXbMDoHDwVN2tF/tracks?limit=10';
const URL_MEXICO_TOP = 'playlists/37i9dQZEVXbO3qyFxbkOE1/tracks?limit=10';

interface SpotifyArtist {
  name: string;
}

interface SpotifyAlbum {
  name: string;
  images: {
    url: string;
    height: number;
    width: number;
  }[];
}

export interface SpotifyTrack {
  name: string;
  preview_url: string;
  duration_ms: number;
  popularity: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

interface SpotifyData {
  global: SpotifyTrack[];
  mexico: SpotifyTrack[];
  personal?: SpotifyTrack[];
}

const getAccessToken = () => {
  const params = new URLSearchParams(window.location.hash.substr(1));
  if (params.has('access_token') && params.get('token_type') == 'Bearer')
    return params.get('access_token');
  return null;
};

const spotifyFetch = (accessToken: string, urlPath: string): Promise<any> =>
  fetch(`https://api.spotify.com/v1/${urlPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((response) => response.json());

const fetchFromSpotify = async (accessToken: string): Promise<SpotifyData> => {
  const [personal, global, mexico] = await Promise.all([
    spotifyFetch(accessToken, URL_PERSONAL_TOP).then((res) => res.items),
    spotifyFetch(accessToken, URL_GLOBAL_TOP).then((res) =>
      res.items.map((i: any) => i.track),
    ),
    spotifyFetch(accessToken, URL_MEXICO_TOP).then((res) =>
      res.items.map((i: any) => i.track),
    ),
  ]);

  return { personal, global, mexico };
};

const loadSpotifyData = async (): Promise<SpotifyData> => {
  const token = getAccessToken();
  if (token) {
    return await fetchFromSpotify(token);
  }

  const resGlobal = await fetch('global.json');
  const resMexico = await fetch('mexico.json');
  return {
    global: await resGlobal.json(),
    mexico: await resMexico.json(),
  };
};

export default loadSpotifyData;
