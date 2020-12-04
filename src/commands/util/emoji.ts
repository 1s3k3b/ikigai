import { Command, CommandInfo } from 'aurora-djs';
import { Message, SnowflakeUtil } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get info and the image of an emoji.',
        args: {
            '[emoji]': 'The emoji to get info about. In case of an user, the custom status emoji is used.',
        },
    };
    constructor() {
        super({
            name: 'emoji',
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const em = await msg.client.util.getEmoji(msg, text);
        if (!em?.id) return msg.channel.send('No valid emoji or user provided.');
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .addField('Name', em.name)
                .addField('ID', em.id)
                .addField('Created At', SnowflakeUtil.deconstruct(em.id).date.toDateString())
                .setDescription(em.animated ? 'Animated' : undefined),
            files: [msg.client.util.emojiURL(<{ id: string; animated: boolean; }>em)],
        });
    }
};