import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import { Client, PartialVideo } from 'hanime-api';
import { OrderType, TagName } from 'hanime-api/typings/src/util/types';
import { findBestMatch } from 'string-similarity';
import { Help } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'hanime',
        case: 'Hanime',
        desc: 'Commands to interact with hanime.tv.',
        emoji: constants.EMOJIS.HANIME,
        priority: 0,
        subcommands: [{
            name: 'search',
            aliases: ['find'],
            desc: 'Search videos. All flags are optional.',
            nsfw: true,
            readme: 5,
            args: {
                '<term>': 'The term to search for.',
            },
            flags: {
                tags: 'The tags to search for, seperated by commas.',
                tagMode: 'The tag mode to search with (and/or).',
                brands: 'The brands to search for.',
                orderBy: 'What to order videos by. (created/views/likes/released/title)',
            },
            examples: ['aibeya', 'tenioha --orderby=likes', '--tags="blow job,boob job"'],
        }, {
            name: 'video',
            aliases: ['vid'],
            desc: 'Get information about a video.',
            nsfw: true,
            readme: 4,
            args: {
                '[data]': 'A video name. If not provided or found, a trending video is picked.',
            },
            flags: {
                storyboard: 'Whether to send the video\'s storyboard.',
                poster: 'Whether to attach the video\'s poster to the embed.',
            },
            examples: ['aikagi', 'aibeya --storyboard', 'tenioha --poster'],
        }, {
            name: 'tags',
            aliases: ['tag'],
            desc: 'Get information about a tag, or a list of tags.',
            nsfw: true,
            args: {
                '[name]': 'The name of the tag.',
            },
            examples: ['', 'boob job'],
        }, {
            name: 'brands',
            aliases: ['brand'],
            desc: 'Get videos of a brand, or a list of brands.',
            nsfw: true,
            args: {
                '[name]': 'The name of the brand.',
            },
            examples: ['', 'pink pineapple'],
        }, {
            name: 'trending',
            aliases: ['trend'],
            desc: 'Get the trending videos.',
            nsfw: true,
        }],
    };
    constructor() {
        super({
            name: 'hanime',
        });
    }

    private resolveOrderBy(s: string) {
        return <OrderType>findBestMatch(s, ['created_at_unix', 'views', 'likes', 'released_at_unix', 'title_sortable']).bestMatch.target;
    }

    private resolveVideo(client: Client, text: string) {
        return client
            .fetchVideo(text)
            .catch(() => client
                .search(text)
                .then(d => d.videos[0].fetch())
            )
            .catch(() => client
                .fetchTrending()
                .then(d => d[0].fetch())
            );
    }

    private formatSearch(msg: Message, x: PartialVideo) {
        const info = [
            `${f(x.likes)} 👍`,
            `${f(x.dislikes)} 👎`,
            `${f(x.views)} 👀`,
            `#${f(x.monthlyRank)} monthly`,
            x.censored ? 'Censored' : 'Uncensored',
        ].join(' | ');
        return {
            name: '\u200b',
            value: `[${x.name}](${x.url})\n${
                msg.client.util.slice(
                    x.description,
                    100,
                )
            }\n${info}`,
        };
    }

    public async fn(msg: Message, { args: [type, ...args], flags }: CommandInfo) {
        if (!(<TextChannel>msg.channel).nsfw && msg.channel.type !== 'dm') return msg.channel.send('You need to be in an NSFW channel or DM to use this command.');
        const text = args.join(' ');
        const { subcommands } = <Help & { type: 1 }>this.help;
        type = subcommands.find(x =>
            [x.name, ...x.aliases || []].includes(`${type}`.toLowerCase())
        )?.name!;
        switch (type) {
        case 'search': {
            const start = Date.now();
            const res = await msg.client.hanime.searchAll(text, {
                tags: typeof flags.tags === 'string' ? <TagName[]>flags.tags.split(',') : [],
                tagMode: typeof flags.tagMode === 'string' ? <'and' | 'or'>flags.tagMode : 'or',
                brands: typeof flags.brands === 'string' ? flags.brands.split(',') : [],
                orderBy: typeof flags.orderBy === 'string' ? this.resolveOrderBy(flags.orderBy) : 'likes',
                ordering: 'desc',
            });
            const end = Date.now();
            if (!res.length) return msg.channel.send('No results found.');
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(res, 20),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Search Results')
                        .setDescription(`${res.length} result${res.length > 1 ? 's' : ''} (${((end - start) / 1000).toFixed(2)} seconds)`)
                        .setColor('RANDOM')
                        .addFields(a.map(x => this.formatSearch(msg, x)))
                        .setFooter('hanime.tv'),
                }],
            );
        }
        case 'video': {
            const res = await this.resolveVideo(msg.client.hanime, text);
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle(res.data.name)
                    .setURL(res.data.url)
                    .setThumbnail(res.data.cover)
                    .setColor('RANDOM')
                    .addField('Rating', `${f(res.data.likes)} likes
${f(res.data.dislikes)} dislikes
${f(res.data.views)} views
#${f(res.data.monthlyRank)} monthly rank
${f(res.data.interests)} interests`)
                    .addField('Data', `Created at ${res.data.createdAt.toDateString()}
Released at ${res.data.releasedAt.toDateString()}
Banned in ${res.data.bannedIn.join(', ') || 'none'}
${res.data.censored ? 'Censored' : 'Uncensored'}`)
                    .addField(
                        'Tags',
                        res.tags
                            .map(x => `${x.name} (${f(x.videos)})`)
                            .join('\n'),
                    )
                    .addField('Brand', `[${res.brand.title}](${constants.REST.HANIME.BRANDS}${res.brand.slug}) (${f(res.brand.uploads)})
Website: ${res.brand.website || 'none'}`)
                    .addField('Franchise', `${res.franchise.title}
Videos:
${res.franchise.videos.map(x => `> ${x.name}`).join('\n')}`)
                    .addField('Titles', res.data.titles.map(x => `${x.title} (${x.lang})`).join('\n'))
                    [flags.poster ? 'setImage' : 'toJSON'](res.data.poster),
                files: flags.storyboard ? [res.storyboards[0].url] : [],
            });
        }
        case 'tags': {
            const tags = await msg.client.hanime.fetchTags();
            const { bestMatch } = findBestMatch(text, tags.map(x => x.name));
            if (bestMatch.rating > 0.5) {
                const tag = tags.find(x => x.name === bestMatch.target)!;
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(await tag.fetchVideos(), 20),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle(
                                tag.name
                                    .split(' ')
                                    .map(msg.client.util.capitalize)
                                    .join(' ')
                            )
                            .setURL(`${constants.REST.HANIME.TAGS}${encodeURIComponent(tag.name)}`)
                            .setColor('RANDOM')
                            .setDescription(`${f(tag.videos)} videos\n${tag.description}`)
                            .setThumbnail(tag.tallImage)
                            .setImage(tag.wideImage)
                            .addFields(a.map(x => this.formatSearch(msg, x))),
                    }]
                );
            }
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(tags.sort((a, b) => b.videos - a.videos), 25),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Tags')
                        .setColor('RANDOM')
                        .addFields(a.map(x => ({
                            name: x.name
                                .split(' ')
                                .map(msg.client.util.capitalize)
                                .join(' '),
                            value: `${x.description}\n[${f(x.videos)} videos](${constants.REST.HANIME.TAGS}${encodeURIComponent(x.name)})`,
                            inline: true,
                        }))),
                }],
            );
        }
        case 'brands': {
            const brands = await msg.client.hanime.fetchBrands();
            const { bestMatch } = findBestMatch(text, brands.map(x => x.title));
            if (bestMatch.rating > 0.5) {
                const brand = brands.find(x => x.title === bestMatch.target)!;
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(await brand.fetchUploads(), 20),
                    a => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle(brand.title)
                            .setURL(`${constants.REST.HANIME.BRANDS}${brand.slug}`)
                            .setDescription(`${f(brand.uploads)} uploads`)
                            .setColor('RANDOM')
                            .addFields(a.map(x => this.formatSearch(msg, x))),
                    }]
                );
            }
            return msg.client.util.paginate(
                msg,
                false,
                msg.client.util.split(brands.sort((a, b) => b.uploads - a.uploads), 25),
                a => [{
                    embed: msg.client.util
                        .embed()
                        .setTitle('Tags')
                        .setColor('RANDOM')
                        .addFields(a.map(x => ({
                            name: x.title,
                            value: `[${f(x.uploads)} videos](${constants.REST.HANIME.BRANDS}${x.slug})`,
                            inline: true,
                        }))),
                }],
            );
        }
        case 'trending': {
            const res = await msg.client.hanime
                .fetchTrending()
                .then(d => Promise.all(d.map(x => x.fetch())));
            return msg.channel.send({
                embed: msg.client.util
                    .embed()
                    .setTitle('Trending')
                    .setThumbnail(res[0].data.cover)
                    .setColor('RANDOM')
                    .addFields(
                        res
                            .slice(0, 20)
                            .map(x => this.formatSearch(msg, <PartialVideo><unknown>x.data))
                    ),
            });
        }
        default:
            msg.client.commands.get('help')!.fn(msg, <CommandInfo>{ args: [this.name] });
        }
    }
};