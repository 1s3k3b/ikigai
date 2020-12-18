import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import pms from 'pretty-ms';
import { Playlist } from 'soundcloud-scraper';
import { Help } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'soundcloud',
        case: 'SoundCloud',
        emoji: '☁️',
        desc: `Commands to interact with [SoundCloud](${constants.REST.SOUNDCLOUD})`,
        priority: 10,
        subcommands: [{
            name: 'song',
            aliases: ['track'],
            desc: 'Get info about a song.',
            args: {
                '<song>': 'The song\'s URL or name.',
            },
        }, {
            name: 'search',
            desc: 'Search songs, playlists, and artists.',
            args: {
                '<term>': 'The term to search for.',
            },
        }, {
            name: 'playlist',
            desc: 'Get info, and the songs of a playlist.',
            args: {
                '<playlist>': 'The playlist\'s URL or name.',
            },
            flags: {
                stats: 'Whether to display artist occurences on the playlist.',
            },
        }, {
            name: 'user',
            aliases: ['profile', 'artist'],
            desc: 'Get info, and tracks of an user.',
            args: {
                '<user>': 'The user\'s URL or name.',
            },
        }],
    };
    constructor() {
        super({
            name: 'soundcloud',
            aliases: ['sc'],
        });
    }

    private playlistArtists(p: Playlist) {
        return p.tracks
            .filter(x => x.title)
            .reduce(
                (a, b) => (a[b.user.username] = [b.user.permalink_url, (a[b.user.username]?.[1] || 0) + 1], a),
                <Record<string, [string, number]>>{}
            );
    }

    public async fn(msg: Message, { args: [type, ...args], flags }: CommandInfo) {
        const text = args.join(' ');
        switch (type?.toLowerCase()) {
        case 'song':
        case 'track': {
            const res = await msg.client.soundcloud
                .getSongInfo(text)
                .catch(() =>
                    msg.client.soundcloud
                        .search(text)
                        .then(d => d.find(x => x.type === 'track'))
                        .then(d => d && msg.client.soundcloud.getSongInfo(d.url))
                        .catch(() => undefined)
                );
            if (!res) return msg.channel.send('Invalid song URL provided or no search results.');
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle('SoundCloud Song')
                    .setColor('RANDOM')
                    .setThumbnail(res.thumbnail)
                    .setDescription(res.description.slice(0, 2048))
                    .setAuthor('', res.author.avatarURL)
                    .addField('Song', `[${res.title}](${res.url})\nDuration: ${pms(res.duration)}\nGenre: ${res.genre}\nLikes: ${f(+res.likes)}\nPlays: ${f(+res.playCount)}\nPublished at ${res.publishedAt.toDateString()}`)
                    .addField('Author', `[${res.author.name}](${res.author.url})\nFollowers: ${f(res.author.followers)}`),
            });
        }
        case 'search': {
            const res = await msg.client.soundcloud.search(text);
            if (!res.length) return msg.channel.send('No search results.');
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle('SoundCloud Search')
                    .setColor('RANDOM')
                    .addFields(
                        [...new Set(res.map(x => x.type))]
                            .map(t => ({
                                name: `❯ ${msg.client.util.capitalize(t)}s`,
                                value: res
                                    .filter(x => x.type === t)
                                    .map(x => `• [${x.name}](${x.url})${x.artist ? ` - ${x.artist}` : ''}`)
                                    .join('\n'),
                            }))
                            .flatMap(f => {
                                const split = f.value.split('\n');
                                const i = split.findIndex((_, i, a) => a.slice(0, i).join('\n').length <= 1024 && a.slice(0, i + 1).join('\n').length > 1024);
                                return f.value.length > 1024
                                    ? [{
                                        ...f,
                                        value: split
                                            .slice(0, i)
                                            .join('\n'),
                                    }, {
                                        ...f,
                                        value: split
                                            .slice(i)
                                            .join('\n'),
                                    }]
                                    : f;
                            })
                    ),
            });
        }
        case 'playlist': {
            const res = await msg.client.soundcloud
                .getPlaylist(text)
                .catch(() =>
                    msg.client.soundcloud
                        .search(text)
                        .then(d => d.find(x => x.type === 'playlist'))
                        .then(d => d && msg.client.soundcloud.getPlaylist(d.url))
                        .catch(() => undefined)
                );
            if (!res) return msg.channel.send('Invalid playlist URL provided or no search results.');
            if (flags.stats) {
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(msg.client.util.split(
                        Object
                            .entries(this.playlistArtists(res))
                            .sort(([, [, a]], [, [, b]]) => b - a)
                            .map(([k, v]) => `[${k}](${v[0]}): ${v[1]} songs`),
                        0,
                        (a, b) => [...a, b].join('\n').length > 1024,
                    ), 3),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('SoundCloud Playlist')
                            .setColor('RANDOM')
                            .setDescription(`[${res.title}](${res.url})\nBy [${res.author.name}](${res.author.profile})\n${res.description}`)
                            .setThumbnail(res.thumbnail)
                            .addFields(
                                a
                                    .map(x => ({
                                        name: '\u200b',
                                        value: x.join('\n'),
                                    }))
                                    .filter(x => x.value)
                            ),
                    }],
                );
            }
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(res.tracks.filter(x => x.title), 10),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('SoundCloud Playlist')
                        .setColor('RANDOM')
                        .setThumbnail(res.thumbnail)
                        .setDescription(`[${res.title}](${res.url})\nBy [${res.author.name}](${res.author.profile})\n${res.description}`)
                        .addFields(a.map(s => ({
                            name: '\u200b',
                            value: `[${s.title}](${s.permalink_url})\nBy [${s.user.username}](${s.user.permalink_url})`,
                            inline: true,
                        }))),
                }],
            );
        }
        case 'user':
        case 'profile':
        case 'artist': {
            const res = await msg.client.soundcloud
                .getUser(text)
                .catch(() =>
                    msg.client.soundcloud
                        .search(text)
                        .then(d => d.find(x => x.type === 'artist'))
                        .then(d => d && msg.client.soundcloud.getUser(d.url))
                        .catch(() => undefined)
                );
            if (!res) return msg.channel.send('Invalid user URL provided or no search results.');
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle('SoundCloud User')
                    .setColor('RANDOM')
                    .setThumbnail(res.avatarURL)
                    .setDescription(`[${res.name}](${res.profile})`)
                    .addField('Stats', `Created at ${res.createdAt.toDateString()}\nFollowers: ${f(res.followers)}\nFollowing: ${f(res.following)}\nLikes: ${f(res.likesCount)}\nTracks: ${f(res.tracksCount)}${res.verified ? '\nVerified' : ''}`)
                    .addFields(
                        msg.client.util
                            .split(
                                res.tracks.map(x => `[${x.title}](${x.url}) (${x.genre}, ${x.publishedAt.toDateString()}, ${pms(x.duration)})`),
                                0,
                                (a, b) => [...a, b].join('\n').length > 1024,
                            )
                            .map((x, i) => ({
                                name: i ? '\u200b' : 'Tracks',
                                value: x.join('\n'),
                            }))
                    ),
            });
        }
        default:
            return msg.client.commands.get('help')!.fn(msg, <CommandInfo>{ args: [this.name] });
        }
    }
};