import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import regex from 'emoji-regex';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Build a triangle from text or emojis.',
        readme: 19,
        args: {
            '<text>': 'The text, emoji, or user to build a triangle of.',
        },
        flags: {
            n: 'The triangle\'s height.',
        },
        examples: ['😔 -n=12', 'testing'],
    };
    constructor() {
        super({
            name: 'triangle',
        });
    }
    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const em = text.match(regex())?.[0] || await msg.client.util.getEmoji(msg, text);
        const castEm = <{
            id: string;
            name: string;
            animated: boolean;
        }>em;
        if (castEm?.id && !msg.client.emojis.cache.has(castEm.id) || typeof castEm !== 'string' && !castEm?.id) {
            return msg.channel.send(
                '\u200b' + msg.client.util
                    .progress(msg.client.util.split(text.match(/\w/g) || [], 2))
                    .map((s, i, a) => `${' '.repeat((a.length - i) * 6 - 6)}${s.map(x => `:regional_indicator_${x}:`).join('')}`)
                    .join('\n')
            );
        }
        const s = castEm.id ? `<${castEm.animated ? 'a' : ''}:${castEm.name}:${castEm.id}>` : <string>em;
        const n = +flags.n || 7;
        msg.channel.send(
            '\u200b' + Array
                .from(
                    { length: n },
                    (_, i) => `${' '.repeat((n - i) * 6 - 6)}${s.repeat(i * 2 + 1)}`,
                )
                .join('\n')
        );
    }
};
