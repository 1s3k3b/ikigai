import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

const types = <const>['uppercase', 'lowercase', 'append', 'prepend', 'surround'];

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Highlight a text from another with the given method.',
        flags: {
            method: `The method to highlight with: \`${types.join('`, `')}\``,
            append: 'The character to append highlighted characters with.',
            prepend: 'The character to prepend highlighted characters with.',
        },
    };
    constructor() {
        super({
            name: 'highlight',
        });
    }

    public async fn(msg: Message, { flags }: CommandInfo) {
        const getMsg = (s: string) => msg.channel.send(s) && msg.channel
            .awaitMessages(x => x.author.id === msg.author.id, { max: 1 })
            .then(d => d.first()!.content);
        const method = types.find(x => x === `${flags.method}`.toLowerCase()) || 'uppercase';
        const append = typeof flags.append === 'string' ? flags.append : ']';
        const prepend = typeof flags.prepend === 'string' ? flags.prepend : '[';
        const modify = (x: string) => method === 'uppercase'
            ? x.toUpperCase()
            : method === 'lowercase'
                ? x.toLowerCase()
                : method === 'append'
                    ? `${x}${append}`
                    : method === 'prepend'
                        ? `${prepend}${x}`
                        : `${prepend}${x}${append}`;
        let b = await getMsg('Please send the text to highlight from.');
        const a = await getMsg('Please send the text to highlight.');
        let lastI = -1;
        for (
            const c of a
                .split('')
                .filter(x => x.toLowerCase() !== x.toUpperCase())
        ) {
            const i = b
                .split('')
                .findIndex((x, y) => y > lastI + (+['append', 'prepend', 'enclose'].includes(method)) && x.toLowerCase() === c.toLowerCase());
            if (i === -1) break;
            b = b
                .split('')
                .map((x, y) => y === i ? modify(x) : x)
                .join('');
            lastI = i;
        }
        msg.channel.send(b);
    }
};
