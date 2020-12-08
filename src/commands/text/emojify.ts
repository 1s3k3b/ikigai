import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

const numbers = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Replace letters and optionally numbers with emojis in a text.',
        args: {
            '<text>': 'The text to emojify.',
        },
        flags: {
            'num, number': 'Whether to replace numbers in the text.',
            filter: 'Whether to filter out non-emojified characters in the text.',
        },
        examples: ['test123 --num', 'aábcdeé --filter', 'testing'],
    };
    constructor() {
        super({
            name: 'emojify',
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const num = flags.num || flags.number;
        if (flags.filter) text = (text.match(new RegExp(`[a-z\\s${num ? '\\d' : ''}]`, 'gi')) || []).join('');
        msg.channel.send(msg.client.util.padZws(
            text
                .replace(/[a-z]/gi, s => `:regional_indicator_${s.toLowerCase()}:`)
                .replace(/\d/g, x => num ? `:${numbers[+x]}:` : x)
                .replace(/\s+/g, '     '),
        ));
    }
};