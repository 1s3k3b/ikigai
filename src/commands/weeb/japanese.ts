import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import hepburn from 'hepburn';
import { Help } from '../../types';

const getMethod = (a: string, b: string): ((x: string) => string) | undefined => a === 'hiragana'
    ? b === 'romaji'
        ? hepburn.fromKana
        : b === 'katakana'
            ? (s => hepburn.toKatakana(hepburn.fromKana(s)))
            : undefined
    : a === 'katakana'
        ? b === 'romaji'
            ? hepburn.fromKana
            : b === 'hiragana'
                ? (s => hepburn.toHiragana(hepburn.fromKana(s)))
                : undefined
        : a === 'romaji'
            ? b === 'hiragana'
                ? hepburn.toHiragana
                : hepburn.toKatakana
            : undefined;

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Conversions between hiragana, katakana and romaji.',
        args: {
            '[from]': 'The writing system to convert from: hiragana, katakana, romaji',
            '[to]': 'The writing system to convert to: hiragana, katakana, romaji',
            '<text>': 'The text to convert.',
        },
        flags: {
            from: 'An alternative to the `from` argument.',
            to: 'An alternative to the `to` argument.',
        },
        examples: ['romaji katakana arigato', 'hiragana katakana へんたい'],
    };
    constructor() {
        super({
            name: 'japanese',
            aliases: ['hiragana', 'katakana', 'romaji'],
        });
    }

    public async fn(msg: Message, { flags, args }: CommandInfo) {
        const from = flags.from || args.shift();
        const to = flags.to || args.shift();
        const text = args.join(' ');
        const method = getMethod(`${from}`.toLowerCase(), `${to}`.toLowerCase());
        if (!method) return msg.channel.send('Invalid options provided.');
        return msg.channel.send(msg.client.util.padZws(method(text)));
    }
};