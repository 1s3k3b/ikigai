import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Conversions between utf8 and base64.',
        args: {
            '<type>': 'Whether to `encode` or `decode`.',
            '<text>': 'The text to encode or decode.',
        },
        examples: ['enc test', 'dec dGVzdA=='],
    };
    constructor() {
        super({
            name: 'base64',
        });
    }

    public async fn(msg: Message, { args: [type, ...text] }: CommandInfo) {
        msg.client.util.hasteMessage(
            msg,
            msg.client.util.padZws(
                Buffer
                    .from(text.join(' '), type.startsWith('de') ? 'base64' : 'utf-8')
                    .toString(type.startsWith('de') ? 'utf-8' : 'base64')
            ),
            true
        );
    }
};