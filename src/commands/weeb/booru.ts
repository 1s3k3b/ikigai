import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import { search } from 'kaori';
import { sites } from 'kaori/dist/sites';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Get booru images.',
        nsfw: true,
        args: {
            '[site]': `The site to use: \`${
                Object
                    .entries(sites)
                    .flatMap(([k, { aliases }]) => [k, ...aliases])
                    .join('`, `')
            }\``,
        },
        flags: {
            'noembed, noem': 'Whether to omit embeds from messages.',
            tags: 'A list of tags to search for, seperated by commas.',
            exclude: 'A list of tags to exclude, seperated by commas.',
        },
        examples: ['', 'danbooru'],
    };
    constructor() {
        super({
            name: 'booru',
            aliases: ['danbooru'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const site = sites[text.toLowerCase()] || Object.entries(sites).find(([, { aliases }]) => aliases.includes(text.toLowerCase()))?.[0] || msg.client.util.random(Object.values(sites).filter(x => ((<TextChannel>msg.channel).nsfw || msg.channel.type === 'dm') ? true : !x.nsfw));
        if (site.nsfw && !(<TextChannel>msg.channel).nsfw && msg.channel.type !== 'dm') return msg.channel.send('You can\'t use an NSFW site in a non-nsfw channel.');
        const [img] = await search(site.aliases[0], {
            tags: typeof flags.tags === 'string' ? flags.tags.split(',') : [],
            exclude: typeof flags.exclude === 'string' ? flags.exclude.split(',') : [],
        });
        if (!img) return msg.channel.send('No image found.');
        msg.channel.send({
            embed: flags.noem || flags.noembed ? undefined : msg.client.util
                .embed()
                .setTitle('Booru')
                .setColor('RANDOM')
                .addField(
                    'Tags',
                    img.tags
                        .map(x =>
                            x
                                .split('_')
                                .map(msg.client.util.capitalize)
                                .join(' ')
                        )
                        .join('\n')
                )
                .addField('Created At', img.createdAt?.toDateString() || 'Unknown')
                .addField('Rating', img.rating.toUpperCase()),
            files: [img.fileURL],
        });
    }
};