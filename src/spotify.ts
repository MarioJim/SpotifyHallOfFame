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
  id: string;
  preview_url: string;
  duration_ms: number;
  popularity: number;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
}

interface SpotifyData {
  globalTracks: SpotifyTrack[];
  mexicoTracks: SpotifyTrack[];
  personalTracks?: SpotifyTrack[];
}

const getAccessToken = (): string | null => {
  const params = new URLSearchParams(window.location.hash.substr(1));
  if (params.has('access_token') && params.get('token_type') === 'Bearer')
    return params.get('access_token');
  return null;
};

const spotifyFetch = (accessToken: string, urlPath: string): Promise<any> =>
  fetch(`https://api.spotify.com/v1/${urlPath}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  }).then((response) => response.json());

export const loadSpotifyData = async (): Promise<SpotifyData> => {
  const token = getAccessToken();
  if (token) {
    const [globalTracks, mexicoTracks, personalTracks] = await Promise.all([
      spotifyFetch(token, URL_GLOBAL_TOP).then((res) =>
        res.items.map((i: any) => i.track),
      ),
      spotifyFetch(token, URL_MEXICO_TOP).then((res) =>
        res.items.map((i: any) => i.track),
      ),
      spotifyFetch(token, URL_PERSONAL_TOP).then((res) => res.items),
    ]);
    console.log(globalTracks, mexicoTracks);
    return { globalTracks, mexicoTracks, personalTracks };
  }

  const resGlobal = await fetch('global.json');
  const resMexico = await fetch('mexico.json');
  return {
    globalTracks: await resGlobal.json(),
    mexicoTracks: await resMexico.json(),
  };
};

export const redirectToSpotifyLogin = (): void => {
  const spotifyAuthParams = new URLSearchParams();
  spotifyAuthParams.set('client_id', '78d27efbc5e84665b852ca8dd63ea33f');
  spotifyAuthParams.set('response_type', 'token');
  spotifyAuthParams.set(
    'redirect_uri',
    window.location.origin + window.location.pathname,
  );
  spotifyAuthParams.set('scope', ['user-top-read'].join(' '));

  const params = spotifyAuthParams.toString();
  window.location.replace(`https://accounts.spotify.com/authorize?${params}`);
};
