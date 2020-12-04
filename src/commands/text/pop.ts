import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Send a text in spoilers multiple times.',
        args: {
            '[text]': 'The text to put in spoilers.',
        },
        flags: {
            n: 'The amount of spoilers to send.',
        },
    };
    constructor() {
        super({
            name: 'pop',
            aliases: ['spoiler', 'spoilers'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        msg.channel.send(`||${text || '\u200b \u200b'}|| `.repeat(+flags.n || 10));
    }
};