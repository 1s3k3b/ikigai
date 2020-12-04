import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import nh from 'nhentai-js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        desc: 'Get info and images of a doujin on nhentai.net',
        category: 'weeb',
        nsfw: true,
        readme: 6,
        args: {
            '[id]': 'The optional ID of the doujin. If not provided, a random one is picked.',
        },
        flags: {
            noembed: 'Whether to omit the embed from messages.',
            noimg: 'Whether to omit images from messages.',
        },
        examples: ['', '329224'],
    };
    constructor() {
        super({
            name: 'doujin',
            aliases: ['nhentai', 'doujinshi', 'sauce'],
        });
    }

    public async fn(msg: Message, { args: [id], flags }: CommandInfo) {
        if (!(<TextChannel>msg.channel).nsfw && msg.channel.type !== 'dm') return msg.channel.send('You must be in an NSFW channel or DM to use this command.');
        const vid = await nh.getDoujin(
            await nh.exists(`${id}`)
                ? id
                : await msg.client.util.randomDoujin()
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
        if (!flags.noimg) msg.client.util.paginate(
            msg,
            true,
            vid.pages,
            x => [{
                embed: flags.noembed ? undefined : embed,
                files: [x],
            }],
        );
        else msg.channel.send({ embed });
    }
};