import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import nh from 'nhentai-js';
import constants from '../../util/constants';
import { Help, NhentaiListing } from '../../types';
import { findBestMatch } from 'string-similarity';

module.exports = class extends Command {
    public help: Help = {
        type: 1,
        name: 'nhentai',
        desc: 'Commands to interact with nhentai.net.',
        case: 'Nhentai',
        emoji: '🇳',
        priority: 5,
        subcommands: [{
            name: 'sauce',
            aliases: ['doujin', 'doujinshi', 'image', 'manga'],
            desc: 'Get info and images of a specified or random doujinshi.',
            nsfw: true,
            readme: 6,
            args: {
                '[id]': 'The optional ID of the doujin. If not provided, a random one is picked.',
            },
            flags: {
                'noembed, noem': 'Whether to omit the embed from messages.',
                noimg: 'Whether to omit images from messages.',
            },
            examples: ['', '301232'],
        }, {
            name: 'search',
            aliases: ['find'],
            desc: 'Search doujinshi.',
            nsfw: true,
            args: {
                '<term>': 'The term to search for.',
            },
            examples: ['ane naru mono', '-tag:"big breasts"'],
        }, {
            name: 'homepage',
            aliases: ['main'],
            desc: 'Get doujinshi listed on the main page.',
            nsfw: true,
        }, ...[
            ['tag', 'tags'],
            <[string, string, boolean]>['artist', 'artists', true],
            ['character', 'characters'],
            ['parody', 'parodies'],
            ['group', 'groups'],
        ].map(([x, y, n]) => ({
            name: x,
            aliases: [y],
            desc: `Find a${n ? 'n' : ''} ${x} or get a list of ${y}.`,
            nsfw: true,
            args: {
                '[name]': `The name of the ${x} to get.`,
            },
        }))],
    };
    constructor() {
        super({
            name: 'nhentai',
            aliases: ['doujin', 'doujinshi', 'sauce'],
        });
    }

    public async fn(msg: Message, { args: [type, ...args], flags }: CommandInfo) {
        if (!(<TextChannel>msg.channel).nsfw && msg.channel.type !== 'dm') return msg.channel.send('You must be in an NSFW channel or DM to use this command.');
        let resType = (<Help & { type: 1 }>this.help).subcommands.find(x =>
            [x.name, ...x.aliases || []].includes(`${type}`.toLowerCase())
        )?.name;
        if (!resType) {
            args.unshift(type);
            resType = 'sauce';
        }
        switch (resType) {
            case 'sauce': {
                const vid = await msg.client.nhentai.doujin(
                    await nh.exists(`${args[0]}`)
                        ? args[0]
                        : await msg.client.nhentai.random()
                );
                const embed = msg.client.util
                    .embed()
                    .setTitle(vid.link.match(/\d+/)![0])
                    .setDescription(`[${vid.title}](${vid.link})\n\n[${vid.nativeTitle}](${vid.link})`)
                    .addField('Tags', vid.details.tags.join('\n'))
                    .addField('Pages', vid.details.pages[0])
                    .addField('Uploaded', vid.details.uploaded[0])
                    .setThumbnail(vid.pages[0])
                    .setColor('RANDOM');
                if (!flags.noimg) return msg.client.util.paginate(
                    msg,
                    !!flags.noem || !!flags.noembed,
                    vid.pages,
                    x => [{
                        embed: flags.noem || flags.noembed ? undefined : embed.setImage(x),
                        files: flags.noem || flags.noembed ? [x] : undefined,
                    }],
                );
                return msg.channel.send({ embed });
            }
            case 'search': {
                const res = await msg.client.nhentai.search(args.join(' '));
                return msg.client.util.paginate(
                    msg,
                    false,
                    res,
                    x => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Doujinshi Search')
                            .setColor('RANDOM')
                            .setURL(`${constants.REST.NHENTAI.SEARCH}${encodeURIComponent(args.join(' '))}`)
                            .setDescription(x.id)
                            .addFields(
                                msg.client.util
                                    .split(
                                        res.map(y => `${y.id === x.id ? '> ' : ''}[${y.name}](${constants.REST.NHENTAI.BASE}/g/${y.id})`),
                                        0,
                                        (a, b) => [...a, b].join('\n').length > 1024,
                                    )
                                    .map(s => ({
                                        name: '\u200b',
                                        value: s,
                                        inline: true,
                                    }))
                            )
                            .setImage(x.img)
                    }],
                    ['No results found.'],
                );
            }
            case 'homepage': {
                const res = await msg.client.nhentai.homepage();
                return msg.client.util.paginate(
                    msg,
                    false,
                    res,
                    x => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle('Homepage')
                            .setColor('RANDOM')
                            .setURL(constants.REST.NHENTAI.BASE)
                            .setDescription(x.id)
                            .addFields(
                                msg.client.util
                                    .split(
                                        res.map(y => `${y.id === x.id ? '> ' : ''}[${y.name}](${constants.REST.NHENTAI.BASE}/g/${y.id})`),
                                        0,
                                        (a, b) => a.length === 5 || [...a, b].join('\n').length > 1024,
                                    )
                                    .map((s, i) => ({
                                        name: i === 1 ? 'Recently Uploaded' : i ? '\u200b' : 'Popular',
                                        value: s,
                                        inline: true,
                                    }))
                            )
                            .setImage(x.img)
                    }],
                );
            }
            case 'tag':
            case 'artist':
            case 'character':
            case 'parody':
            case 'group':
                const name = msg.client.util.capitalize(resType).replace(/y$/, 'ie') + 's';
                const res = await (<Record<string, () => Promise<NhentaiListing[]>>><unknown>msg.client.nhentai)
                    [`all${name}`]();
                const match = findBestMatch(args.join(' '), res.map(x => x.name)).bestMatch;
                if (match.rating > 0.5) {
                    const mData = res.find(x => x.name === match.target)!;
                    const ds = await mData.fetch();
                    return msg.client.util.paginate(
                        msg,
                        false,
                        ds,
                        x => [{
                            embed: msg.client.util
                                .embed()
                                .setTitle(mData.name)
                                .setColor('RANDOM')
                                .setURL(`${constants.REST.NHENTAI.BASE}${mData.href}`)
                                .setDescription(x.id)
                                .addFields(
                                    msg.client.util
                                        .split(
                                            ds.map(y => `${y.id === x.id ? '> ' : ''}[${y.name}](${constants.REST.NHENTAI.BASE}/g/${y.id})`),
                                            0,
                                            (a, b) => [...a, b].join('\n').length > 1024,
                                        )
                                        .map(s => ({
                                            name: '\u200b',
                                            value: s,
                                            inline: true,
                                        }))
                                )
                                .setImage(x.img)
                        }],
                    );
                }
                return msg.client.util.paginate(
                    msg,
                    false,
                    msg.client.util.split(res.sort((a, b) => b.count - a.count), 35),
                    x => [{
                        embed: msg.client.util
                            .embed()
                            .setTitle(name)
                            .setURL(`${constants.REST.NHENTAI.BASE}/${name.toLowerCase()}`)
                            .setColor('RANDOM')
                            .addFields(
                                msg.client.util
                                    .split(
                                        x.map(x => `[${x.name}](${constants.REST.NHENTAI.BASE}${x.href}) (${x.count.toLocaleString('en')})`),
                                        0,
                                        (a, b) => [...a, b].join('\n').length > 1024
                                    )
                                    .map(x => ({
                                        name: '\u200b',
                                        value: x.join('\n'),
                                    }))
                            ),
                    }]
                );
        }
    }
};