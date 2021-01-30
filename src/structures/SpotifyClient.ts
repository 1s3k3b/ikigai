import fetch from 'node-fetch';
import { load } from 'cheerio';
import constants from '../util/constants';
import { SpotifyPlaylist, SpotifyTrack } from '../types';

export default class {
    public users = new Map<string, [string[], string[][]]>();
    public playlists = new Map<string, SpotifyPlaylist>();
    public tracks = new Map<string, SpotifyTrack>();
    private request<T>(s: string): Promise<[T, string]> {
        return fetch(`${constants.REST.SPOTIFY}/${s}`)
            .then(d => d.text())
            .then(d => [
                JSON.parse(
                    d
                        .match(/(?<=Spotify\.Entity = )(.+)/)![0]
                        .slice(0, -1)
                ),
                d,
            ]);
    }
    public async fetchUser(u: string) {
        return this.users.get(u) || this
            .request(`user/${u}`)
            .then(([, d]) => {
                const $ = load(d);
                const arr = <[string[], string[][]]>[
                    [$($('.view-header > span')[0]).text(), `https:${$('.bg.lazy-image')[0].attribs['data-src']}`],
                    $('li')
                        .toArray()
                        .map(x => [$(x).text(), `${constants.REST.SPOTIFY}${x.children[0].attribs?.href}`]),
                ];
                this.users.set(u, arr);
                return arr;
            });
    }
    public async fetchPlaylist(s: string) {
        return this.playlists.get(s) || this
            .request<SpotifyPlaylist>(`playlist/${s}`)
            .then(([d]) => this.playlists.set(s, d) && d);
    }
    public async fetchTrack(s: string): Promise<SpotifyTrack> {
        return this.tracks.get(s) || this
            .request<SpotifyTrack>(`track/${s}`)
            .then(([d]) => this.tracks.set(s, d) && d);
    }
}
