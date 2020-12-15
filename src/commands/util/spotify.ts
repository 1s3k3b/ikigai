import { Command, CommandInfo } from 'aurora-djs';
import { Message, User } from 'discord.js';
import ms from 'ms';
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
        priority: 9,
        subcommands: [{
            name: 'playlist',
            desc: 'Get info about a playlist.',
            readme: 23,
            args: {
                '<id>': 'The playlist ID.',
            },
            flags: {
                stats: 'Whether to get artist stats of the playlist.',
            },
        }, {
            name: 'user',
            desc: 'Get info about a user.',
            args: {
                '<id>': 'The user ID.',
            },
            flags: {
                stats: 'Whether to get artist stats of the user.',
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

    private playlistArtists([, d]: [any, SpotifyPlaylist[1]]) {
        return d
            .flatMap(([, x]) => x)
            .reduce(
                (a, b) => (a[b[0]] = [(a[b[0]]?.[0] || 0) + 1, b[1]], a),
                <Record<string, [number, string]>>{},
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
            if (flags.stats) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(this.playlistArtists(res))
                            .sort(([, [a]], [, [b]]) => b - a)
                            .map(([k, v]) => `[${k}](${v[1]}): ${v[0]} songs`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024,
                    ), 3),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Spotify Playlist')
                            .setURL(`${constants.REST.SPOTIFY}/playlist/${arg}`)
                            .setColor('#1DB954')
                            .setDescription(`${res[0][0]}\nBy [${res[0][1][0]}](${res[0][1][1]})\n${res[0][3]}\n${res[0][2]}`)
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
                msg.client.util.split(res[1], 10),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Spotify Playlist')
                        .setURL(`${constants.REST.SPOTIFY}/playlist/${arg}`)
                        .setColor('#1DB954')
                        .setDescription(`${res[0][0]}\nBy [${res[0][1][0]}](${res[0][1][1]})\n${res[0][3]}\n${res[0][2]}`)
                        .addFields(a.map(s => ({
                            name: '\u200b',
                            value: `${s[0]}\nBy ${s[1].map(x => `[${x[0]}](${x[1]})`).join(', ')}\nOn [${s[2][0]}](${s[2][1]})`,
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
            if (flags.stats) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(
                                this.playlistArtists(
                                    [, (await Promise
                                        .all(res[1].map(([, x]) =>
                                            msg.client.spotify.fetchPlaylist(x.split('/').slice(-1)[0])
                                        )))
                                        .reduce((a, b) => [...a, ...b[1]], <SpotifyPlaylist[1]>[]),
                                    ])
                            )
                            .sort(([, [a]], [, [b]]) => b - a)
                            .map(([k, v]) => `[${k}](${v[1]}): ${v[0]} songs`),
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
                    .addField('Track', `[${res.name}](${res.external_urls.spotify})\nDuration: ${ms(res.duration_ms)}`)
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