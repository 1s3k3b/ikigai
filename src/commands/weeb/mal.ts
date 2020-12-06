import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import JikanClient from '../../structures/JikanClient';
import { Help, JikanAnimeList, JikanMangaList, SearchJikanManga } from '../../types';
import constants from '../../util/constants';

const statuses = (x: 'Watch' | 'Read' = 'Watch') => [`Currently ${x}ing`, 'Completed', 'On Hold', 'Dropped', '', `Plan to ${x}`];

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'mal',
        desc: `Commands to interact with [MyAnimeList](${constants.REST.MAL})`,
        case: 'MyAnimeList',
        emoji: '📰',
        priority: 1,
        subcommands: [{
            name: 'anime',
            desc: 'Get information about an anime.',
            readme: 1,
            args: {
                '[data]': 'The anime search term or ID. If not found or provided, a seasonal anime is picked.',
            },
            flags: {
                'characters, chars, char': 'Whether to send a paginateable embed ',
            },
            examples: ['koe no katachi', '40839 --characters', ''],
        }, {
            name: 'search',
            aliases: ['find'],
            desc: 'Search anime or manga.',
            readme: 3,
            args: {
                '[type]': 'The type of data to search for. Defaults to anime.',
                '[term]': 'The term to search for.',
            },
            flags: {
                genre: 'The optional genre to find.',
                rated: `The optional rating to find: \`${constants.JIKAN.RATINGS.join('`, `')}\``,
            },
            examples: ['kitsune', 'kimi --rated=Rx', '--genre=isekai'],
        }, {
            name: 'user',
            aliases: ['profile'],
            desc: 'Get info about an user\'s profile.',
            readme: 2,
            args: {
                '<username>': 'The user\'s username.',
                '[type]': 'The type of data to get info about: anime (anime list), manga (manga list), favorite (favorites)',
            },
            flags: {
                rating: 'In case of the anime option, the ratings to filter anime by, seperated by commas (,)',
            },
            examples: ['someweeb', 'someotherweeb anime', 'someotherweeb favorite'],
        }, {
            name: 'season',
            aliases: ['seasonal'],
            desc: 'Get seasonal anime.',
            args: {
                '[year]': 'The year to get seasonal anime from.',
                '[month]': 'The month of the year to get seasonal anime from.',
            },
        }],
    };
    constructor() {
        super({
            name: 'mal',
            aliases: ['myanimelist'],
        });
    }

    private resolveAnime(client: JikanClient, text: string) {
        return client
            .fetchAnime(text)
            .catch(() => client
                .search('anime', 1, text)
                .then(d => d.results?.[0] && client.fetchAnime(d.results[0].mal_id))
            )
            .then(d => d || client
                .fetchSeason()
                .then(d => client.fetchAnime(d[2].anime[~~(Math.random() * d[2].anime.length)].mal_id))
            );
    }

    private formatNumDict(msg: Message, x: Record<string, number>) {
        return Object
            .entries(x)
            .map(([k, v]) => `${
                k
                    .split('_')
                    .map(msg.client.util.capitalize)
                    .join(' ')
            }: ${v.toLocaleString('en')}`
            )
            .join('\n');
    }

    public async fn(msg: Message, { args: [type, ...args], flags }: CommandInfo) {
        const text = args.join(' ');
        const { subcommands } = <Help & { type: 1 }>this.help;
        type = subcommands.find(x =>
            [x.name, ...x.aliases || []].includes(`${type}`.toLowerCase())
        )?.name!;
        switch (type) {
        case 'anime': {
            const res = await this.resolveAnime(msg.client.jikan, text);
            if (flags.characters || flags.chars || flags.char) {
                const { characters } = await msg.client.jikan.fetchAnimeCharacters(res.mal_id);
                return msg.client.util.paginate(
                    msg,
                    false,
                    characters,
                    x => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle(x.name)
                            .setURL(x.url)
                            .setColor('RANDOM')
                            .setThumbnail(x.image_url)
                            .addField('Role', x.role)
                            .addField('Anime', `[${res.title}](${res.url})\n${res.score} score\n#${res.rank.toLocaleString('en')} rank\n${res.episodes} episodes\n${res.duration} duration\nRated ${res.rating}\n${res.status}`)
                            .addField('Voice Actors', x.voice_actors.map(x => `[${x.name} (${x.language})](${x.url})`).join('\n')),
                    }],
                );
            }
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle(res.title)
                    .setColor('RANDOM')
                    .setDescription(`[${res.title_english || res.title}](${res.url})\n[${res.title_japanese || res.title}](${res.url})\n[Trailer](${res.trailer_url})\n${res.synopsis}`)
                    .setThumbnail(res.image_url)
                    .addField('Stats', `${res.score || 0} score\n#${res.rank.toLocaleString('en')} rank\n${res.episodes} episodes\n${res.duration} duration\nRated ${res.rating}`)
                    .addField('Genres', res.genres.map(x => `[${x.name}](${x.url})`).join('\n'))
                    .addField('Status', `${res.status}\n${res.aired.string}`),
            });
        }
        case 'search': {
            const options = {
                genre: typeof flags.genre === 'string' ? flags.genre : undefined,
                rated: typeof flags.rated === 'string' ? flags.rated : undefined,
            };
            const sType = <'anime' | 'manga'>args.shift()?.toLowerCase() || 'anime';
            const start = Date.now();
            const res = await msg.client.jikan
                .search(sType, 1, args.join(' '), options)
                .catch(() => msg.client.jikan.search('anime', 1, [sType, ...args].join(' '), options));
            const end = Date.now();
            if (!res.results.length) return msg.channel.send('No results found.');
            const split = msg.client.util.split(res.results, 15);
            const desc = `${res.results.length} result${res.results.length > 1 ? 's' : ''} (${((end - start) / 1000).toFixed(2)} seconds)`;
            if (res.results[0].episodes) return msg.client.util.paginate(
                msg,
                false,
                split,
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Anime Results')
                        .setDescription(desc)
                        .setColor('RANDOM')
                        .addFields(a.map(x => ({
                            name: '\u200b',
                            value: `[${x.title}](${x.url})\n${x.episodes} episode${x.episodes === 1 ? '' : 's'}, ${x.score} score, ${x.rated || 'Unknown'} rating\n${x.synopsis}`,
                        }))),
                }],
            );
            return msg.client.util.paginate(
                msg,
                false,
                <SearchJikanManga[][]><unknown>split,
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Manga Results')
                        .setDescription(desc)
                        .setColor('RANDOM')
                        .addFields(a.map(x => ({
                            name: '\u200b',
                            value: `[${x.title}](${x.url})\n${x.chapters} chapter${x.chapters === 1 ? '' : 's'}, ${x.score} score\n${x.synopsis}`,
                        }))),
                }],
            );
        }
        case 'user': {
            const res = await msg.client.jikan.fetchUser(args[0]).catch(() => undefined);
            if (!res) return msg.channel.send('User not found.');
            switch (args[1]?.toLowerCase()) {
            case 'anime': {
                const arr = await msg.client.jikan.fetchUserAnime(args[0]);
                return msg.client.util.paginate(
                    msg,
                    false,
                        <[string, string[][]][]>Object
                            .entries(
                                arr.anime
                                    .filter(x =>
                                        typeof flags.rating === 'string'
                                            ? flags.rating
                                                .toLowerCase()
                                                .split(',')
                                                .includes(x.rating.toLowerCase())
                                            : true
                                    )
                                    .reduce(
                                        (a, b) => (((a[b.watching_status] || (a[b.watching_status] = [])).push(b)), a),
                                        <Record<number, JikanAnimeList['anime'][number][]>>{}
                                    )
                            )
                            .map(([k, v]): [string, string[][]] => [
                                k,
                                msg.client.util.split(
                                    v.map(x => `[${x.title}](${x.url}) ${x.watched_episodes}/${x.total_episodes}, ${x.score} score`),
                                    0,
                                    (x, y) => [...x, y].join('\n').length > 1024
                                ),
                            ])
                            .flatMap(([k, v]) => msg.client.util.split(v, 5).map(x => [k, x]))
                            .filter(([, x]) => x.length),
                        ([x, d]) => [{
                            embed: msg.client.util
                                .embed()
                                .setTitle(`${statuses()[+x - 1]} Anime`)
                                .setColor('RANDOM')
                                .setDescription(`[${res.username}](${res.url})`)
                                .addFields(
                                    d.map(s => ({
                                        name: '\u200b',
                                        value: s.join('\n'),
                                    })),
                                ),
                        }],
                        ['No anime found.'],
                );
            }
            case 'manga': {
                const arr = await msg.client.jikan.fetchUserManga(args[0]);
                return msg.client.util.paginate(
                    msg,
                    false,
                        <[string, string[][]][]>Object
                            .entries(
                                arr.manga.reduce(
                                    (a, b) => (((a[b.reading_status] || (a[b.reading_status] = [])).push(b)), a),
                                    <Record<number, JikanMangaList['manga'][number][]>>{}
                                )
                            )
                            .map(([k, v]): [string, string[][]] => [
                                k,
                                msg.client.util.split(
                                    v.map(x => `[${x.title}](${x.url}) ${x.read_chapters}/${x.total_chapters}, ${x.score} score`),
                                    0,
                                    (x, y) => [...x, y].join('\n').length > 1024
                                ),
                            ])
                            .flatMap(([k, v]) => msg.client.util.split(v, 5).map(x => [k, x]))
                            .filter(([, x]) => x.length),
                        ([x, d]) => [{
                            embed: msg.client.util
                                .embed()
                                .setTitle(`${statuses('Read')[+x - 1]} Manga`)
                                .setColor('RANDOM')
                                .setDescription(`[${res.username}](${res.url})`)
                                .addFields(
                                    d.map(s => ({
                                        name: '\u200b',
                                        value: s.join('\n'),
                                    })),
                                ),
                        }],
                        ['No manga found.'],
                );
            }
            case 'fav':
            case 'favorites':
                return msg.client.util.paginate(
                    msg,
                    false,
                    Object.entries(res.favorites),
                    ([n, a]) => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle(`${msg.client.util.capitalize(n)} Favorites`)
                            .setColor('RANDOM')
                            .setDescription(`[${res.username}](${res.url})`)
                            .addFields(
                                msg.client.util
                                    .split(
                                        a.map(x => `[${x.name}](${x.url})`),
                                        0,
                                        x => x.join('\n').length > 1000
                                    )
                                    .map(s => ({ name: '\u200b', value: s }))
                            ),
                    }]
                );
            default:
                return msg.channel.send({
                    embed: msg.client.util
                        .embed(true)
                        .setTitle('User Info')
                        .setURL(res.url)
                        .setDescription(`${res.username}\n${res.about || ''}`)
                        .setThumbnail(res.image_url)
                        .setColor('RANDOM')
                        .addField('Stats', `Joined at ${new Date(res.joined).toDateString()}\nLast online at ${new Date(res.last_online).toDateString()}\nGender: ${res.gender || 'Unknown'}\nBirthday: ${res.birthday || 'Unknown'}\nLocation: ${res.location || 'Unknown'}`)
                        .addField('Anime Stats', this.formatNumDict(msg, res.anime_stats))
                        .addField('Manga Stats', this.formatNumDict(msg, res.manga_stats)),
                });
            }
        }
        case 'season': {
            const [y, m, { anime: res }] = await msg.client.jikan
                .fetchSeason(+args[0] || undefined, args[1])
                .catch(() => msg.client.jikan.fetchSeason());
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(res, 15),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Seasonal Anime')
                        .setColor('RANDOM')
                        .setDescription(`${y} ${msg.client.util.capitalize(m)}`)
                        .addFields(a.map(x => ({
                            name: '\u200b',
                            value: `[${x.title}](${x.url})\n${x.episodes} episode${x.episodes === 1 ? '' : 's'}, ${x.score} score\n${msg.client.util.slice(x.synopsis, 100)}`,
                        }))),
                }]
            );
        }
        default:
            msg.client.commands.get('help')!.fn(msg, <CommandInfo>{ args: [this.name] });
        }
    }
};