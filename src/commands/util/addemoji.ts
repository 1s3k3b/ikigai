import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Add an external emoji to the server.',
        args: {
            '<emoji>': 'The emoji to add.',
            '[name]': 'The name to give the emoji. Defaults to the original name.',
        },
    };
    constructor() {
        super({
            name: 'addemoji',
            aliases: ['addemote'],
        });
    }

    public async fn(msg: Message, { args: [em = '', name] }: CommandInfo) {
        if (!msg.guild) return msg.channel.send('You must be in a server to use this command.');
        if (!msg.member?.hasPermission('MANAGE_EMOJIS')) return msg.channel.send('You don\'t have permission to do that.');
        const emoji = await msg.client.util.getEmoji(msg, em);
        if (!emoji?.id) return msg.channel.send('Invalid emote.');
        name = name || emoji.name;
        msg.channel.send(
            await msg.guild.emojis
                .create(msg.client.util.emojiURL(<{ id: string; animated: boolean; }>emoji), name)
                .then(x => `Successfully added ${x}.`)
                .catch(e => e.message)
        );
    }
};
