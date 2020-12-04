import fetch from 'node-fetch';
import { load } from 'cheerio';
import constants from '../util/constants';
import { SpotifyPlaylist, SpotifyTrack } from '../types';

export default class {
    public users = new Map<string, [string[], string[][]]>();
    public playlists = new Map<string, SpotifyPlaylist>();
    public tracks = new Map<string, SpotifyTrack>();
    private request(u: string) {
        return fetch(u).then(d => d.text());
    }
    public async fetchUser(u: string) {
        return this.users.get(u) || this
            .request(`${constants.REST.SPOTIFY}/user/${u}`)
            .then(d => {
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
            .request(`${constants.REST.SPOTIFY}/playlist/${s}`)
            .then(d => {
                const $ = load(d);
                const arr = <SpotifyPlaylist>[
                    $('.media-bd')[0].children
                        .slice(0, 4)
                        .map((x, i) =>
                            i === 1
                                ? [$(x.children[1]).text(), `${constants.REST.SPOTIFY}${x.children[1].attribs.href}`]
                                : $(x).text()
                        ),
                    $('.track-name')
                        .toArray()
                        .map(x => [
                            $(x).text(),
                            x.next.children
                                .filter(x => x.attribs?.href.startsWith('/artist/'))
                                .map(x => [$(x).text(), `${constants.REST.SPOTIFY}${x.attribs.href}`]),
                            x.next.children
                                .filter(x => x.attribs?.href.startsWith('/album/'))
                                .map(x => [$(x).text(), `${constants.REST.SPOTIFY}${x.attribs.href}`])[0],
                        ]),
                ];
                this.playlists.set(s, arr);
                return arr;
            });
    }
    public async fetchTrack(s: string): Promise<SpotifyTrack> {
        return this.tracks.get(s) || this
            .request(`${constants.REST.SPOTIFY}/track/${s}`)
            .then(d => JSON.parse(
                d
                    .match(/(?<=Spotify\.Entity = )(.+)/)![0]
                    .slice(0, -1)
            ));
    }
}
