import { Command, CommandInfo } from 'aurora-djs';
import { Message, User } from 'discord.js';
import pms from 'pretty-ms';
import { Help, SpotifyPlaylist } from '../../types';
import constants from '../../util/constants';

const searchRegex = /\?.+=.+(&.+=.+)*$/;

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'spotify',
        case: 'Spotify',
        emoji: '🔊',
        desc: 'Commands to interact with Spotify.',
        priority: 10,
        subcommands: [{
            name: 'playlist',
            desc: 'Get info about a playlist.',
            readme: 23,
            args: {
                '<id>': 'The playlist ID.',
            },
            flags: {
                artists: 'Whether to get artist stats of the playlist.',
                albums: 'Whether to get album stats of the playlist.',
            },
            examples: ['6NwqUX4db2CuSgLUkKOFoG --artists'],
        }, {
            name: 'user',
            desc: 'Get info about a user.',
            args: {
                '<id>': 'The user ID.',
            },
            flags: {
                artists: 'Whether to get artist stats of the user.',
                albums: 'Whether to get album stats of the user.',
            },
        }, {
            name: 'song',
            aliases: ['track'],
            desc: 'Get info about a given song, or a song a user is listening to.',
            readme: 22,
            args: {
                '[id]': 'The song ID or user mention.',
            },
        }],
    };
    constructor() {
        super({
            name: 'spotify',
        });
    }

    private playlistArtists(d: SpotifyPlaylist['tracks']['items']) {
        return d
            .flatMap(x => x.track.artists.map((x, i) => <[boolean, SpotifyPlaylist['tracks']['items'][number]['track']['artists'][number]]>[!i, x]))
            .reduce(
                (a, [m, b]) => (
                    a[b.name] = {
                        url: b.external_urls.spotify,
                        songs: (a[b.name]?.songs || 0) + +m,
                        features: (a[b.name]?.features || 0) + +!m
                    },
                a),
                <Record<string, { url: string; songs: number; features: number; }>>{}
            );
    }
    private playlistAlbums(d: SpotifyPlaylist['tracks']['items']) {
        return d.reduce(
            (a, b) => (a[b.track.album.name] = [b.track.album.external_urls.spotify, (a[b.track.album.name]?.[1] || 0) + 1], a),
            <Record<string, [string, number]>>{}
        );
    }

    public async fn(msg: Message, { args: [type, arg], flags }: CommandInfo) {
        switch (type?.toLowerCase()) {
        case 'playlist': {
            const res = await msg.client.spotify
                .fetchPlaylist(
                    `${arg}`
                        .replace(/^spotify:playlist:/, '')
                        .replace(/^https?:\/\/open\.spotify\.com\/(embed\/)?playlist\//, '')
                        .replace(searchRegex, '')
                )
                .catch(() => undefined);
            if (!res) return msg.channel.send('Playlist not found.');
            const desc = `${res.name}\nBy [${res.owner.display_name}](${res.owner.external_urls.spotify})\n${res.tracks.items.length} songs\n${res.description}`;
            if (flags.artists) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(this.playlistArtists(res.tracks.items))
                            .sort(([, a], [, b]) => b.songs + b.features / 2 - (a.songs + a.features / 2))
                            .map(([k, v]) => `[${k}](${v.url}): ${[v.songs + ' songs', v.features + ' features'].filter(x => !x.startsWith('0')).join(', ')}`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024,
                    ), 3),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Spotify Playlist')
                            .setURL(res.external_urls.spotify)
                            .setColor('#1DB954')
                            .setDescription(desc)
                            .setThumbnail(res.images[0].url)
                            .addFields(a.map(x => ({
                                name: '\u200b',
                                value: x.join('\n'),
                            }))),
                    }],
                );
            }
            if (flags.albums) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(this.playlistAlbums(res.tracks.items))
                            .sort(([, a], [, b]) => b[1] - a[1])
                            .map(([k, v]) => `[${k}](${v[0]}): ${v[1]} songs`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024,
                    ), 3),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Spotify Playlist')
                            .setURL(res.external_urls.spotify)
                            .setColor('#1DB954')
                            .setDescription(desc)
                            .setThumbnail(res.images[0].url)
                            .addFields(a.map(x => ({
                                name: '\u200b',
                                value: x.join('\n'),
                            }))),
                    }],
                );
            }
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(res.tracks.items, 10),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Spotify Playlist')
                        .setURL(`${constants.REST.SPOTIFY}/playlist/${arg}`)
                        .setColor('#1DB954')
                        .setDescription(desc)
                        .setThumbnail(res.images[0].url)
                        .addFields(a.map(s => ({
                            name: '\u200b',
                            value: `[${s.track.name}](${s.track.external_urls.spotify})
By ${s.track.artists.map(x => `[${x.name}](${x.external_urls.spotify})`).join(', ')}
On [${s.track.album.name}](${s.track.album.external_urls.spotify})
Added at ${new Date(s.added_at).toDateString()}
Duration: ${pms(s.track.duration_ms, { secondsDecimalDigits: 0 })}`,
                            inline: true,
                        }))),
                }],
            );
        }
        case 'user': {
            const res = await msg.client.spotify
                .fetchUser(
                    `${arg}`
                        .replace(/^spotify:user:/, '')
                        .replace(/^https?:\/\/open\.spotify\.com\/user\//, '')
                        .replace(searchRegex, '')
                )
                .catch(() => undefined);
            if (!res) return msg.channel.send('User not found.');
            if (flags.artists) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(this.playlistArtists(
                                (await Promise
                                    .all(res[1].map(([, x]) =>
                                        msg.client.spotify.fetchPlaylist(x.split('/').slice(-1)[0])
                                    )))
                                    .reduce((a, b) => [...a, ...b.tracks.items], <SpotifyPlaylist['tracks']['items']>[]),
                            ))
                            .sort(([, a], [, b]) => b.songs + b.features / 2 - (a.songs + a.features / 2))
                            .map(([k, v]) => `[${k}](${v.url}): ${[v.songs + ' songs', v.features + ' features'].filter(x => !x.startsWith('0')).join(', ')}`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024,
                    ), 3),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Spotify User')
                            .setURL(`${constants.REST.SPOTIFY}/user/${arg}`)
                            .setColor('#1DB954')
                            .setDescription(`${res[0][0]}`)
                            .setThumbnail(res[0][1])
                            .addFields(a.map(x => ({
                                name: '\u200b',
                                value: x.join('\n'),
                            }))),
                    }],
                );
            }
            if (flags.albums) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(this.playlistAlbums(
                                (await Promise
                                    .all(res[1].map(([, x]) =>
                                        msg.client.spotify.fetchPlaylist(x.split('/').slice(-1)[0])
                                    )))
                                    .reduce((a, b) => [...a, ...b.tracks.items], <SpotifyPlaylist['tracks']['items']>[]),
                            ))
                            .sort(([, a], [, b]) => b[1] - a[1])
                            .map(([k, v]) => `[${k}](${v[0]}): ${v[1]} songs`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024,
                    ), 3),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Spotify User')
                            .setURL(`${constants.REST.SPOTIFY}/user/${arg}`)
                            .setColor('#1DB954')
                            .setDescription(`${res[0][0]}`)
                            .setThumbnail(res[0][1])
                            .addFields(a.map(x => ({
                                name: '\u200b',
                                value: x.join('\n'),
                            }))),
                    }],
                );
            }
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(
                    msg.client.util.split(
                        res[1].map(x => `[${x[0]}](${x[1]})`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024
                    ),
                    3
                ),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Spotify User')
                        .setURL(`${constants.REST.SPOTIFY}/user/${arg}`)
                        .setColor('#1DB954')
                        .setDescription(`${res[0][0]}`)
                        .setThumbnail(res[0][1])
                        .addFields(a.map(x => ({
                            name: '\u200b',
                            value: x.join('\n'),
                        }))),
                }],
            );
        }
        case 'track':
        case 'song':
            const getUser = (u: User) => (<{ syncID: string; } | undefined><unknown>u.presence.activities.find(x => x.type === 'LISTENING' && x.name === 'Spotify' && x.assets?.largeImage?.startsWith('spotify:')))?.syncID;
            const id = msg.mentions.users.first() ? getUser(msg.mentions.users.first()!) : arg || getUser(msg.author);
            const res = await msg.client.spotify
                .fetchTrack(
                    `${id}`
                        .replace(/^spotify:track:/, '')
                        .replace(/^https?:\/\/open\.spotify\.com\/track\//, '')
                        .replace(searchRegex, '')
                )
                .catch(() => undefined);
            if (!res) return msg.channel.send('Invalid track or user.');
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle('Spotify Track')
                    .setColor('#1DB954')
                    .addField('Track', `[${res.name}](${res.external_urls.spotify})\nDuration: ${pms(res.duration_ms, { secondsDecimalDigits: 0 })}`)
                    .addField('Artists', res.artists.map(x => `[${x.name}](${x.external_urls.spotify})`).join('\n'))
                    .addField('Album', `[${res.album.name}](${res.album.external_urls.spotify})
Artists: ${res.album.artists.map(x => `[${x.name}](${x.external_urls.spotify})`).join(', ')}
Released at: ${new Date(res.album.release_date).toDateString()}
Tracks: ${res.album.total_tracks}`),
            });
        default:
            msg.client.commands.get('help')!.fn(msg, <CommandInfo>{ args: [this.name] });
        }
    }
};