import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { writeFile } from 'fs/promises';

dotenv.config();

const client_id = '78d27efbc5e84665b852ca8dd63ea33f';
const client_secret = process.env.CLIENT_SECRET;
if (!client_secret) {
  throw new Error('Client secret not set');
}

const buf_encoded_params = Buffer.from(client_id + ':' + client_secret);
const encoded_params = buf_encoded_params.toString('base64');

const fetchToken = (): Promise<any> =>
  fetch(
    'https://accounts.spotify.com/api/token?grant_type=client_credentials',
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded_params}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
    },
  ).then((res) => res.json());

const PLAYLIST_GLOBAL_TOP = '37i9dQZEVXbMDoHDwVN2tF';
const PLAYLIST_MEXICO_TOP = '37i9dQZEVXbO3qyFxbkOE1';

const fetchPlaylist = (
  accessToken: string,
  playlist_id: string,
): Promise<any> =>
  fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?limit=10`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
    .then((response) => response.json())
    .then((response) => response.items.map((i: any) => i.track))
    .then((tracks) =>
      tracks.map((track: any) => {
        delete track.album.artists;
        delete track.album.available_markets;
        delete track.available_markets;
        return track;
      }),
    );

(async () => {
  const token = await fetchToken();
  if (token.error) {
    console.error(token);
    return;
  }

  const { access_token } = token;
  const globalTop = await fetchPlaylist(access_token, PLAYLIST_GLOBAL_TOP);
  await writeFile('../public/global.json', JSON.stringify(globalTop));
  const mexicoTop = await fetchPlaylist(access_token, PLAYLIST_MEXICO_TOP);
  await writeFile('../public/mexico.json', JSON.stringify(mexicoTop));
})();
