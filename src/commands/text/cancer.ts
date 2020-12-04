import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import characters from '../../util/characters';

const translate = (t: string, i: string) => Object
    .entries(characters[i])
    .reduce(
        (s, [a, b]) => s.replace(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), b),
        t,
    );

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Build a text from fancy unicode characters.',
        readme: 24,
        args: {
            '[type]': `The type of alphabet to use: \`${Object.keys(characters).join('`, `')}\``,
            '<text>': 'The text to cancerify.',
        },
    };
    constructor() {
        super({
            name: 'cancer',
            aliases: ['cancerify', 'cancertext'],
        });
    }

    public async fn(msg: Message, { args: [type], text }: CommandInfo) {
        const typeR = characters[`${type}`.toLowerCase()]
            ? `${text = text.slice(`${type}`.length), type}`.toLowerCase()
            : msg.client.util.random(
                Object
                    .keys(characters)
                    .sort(() => 0.5 - Math.random())
            );
        msg.channel.send(msg.client.util.padZws(translate(text, typeR)));
    }
};
