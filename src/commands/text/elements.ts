import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Element } from 'elementry';
import { Help } from '../../types';

// @ts-ignore
const all: Element[] = Element.ALL;

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Build text up from elements of the periodic table.',
        readme: 16,
        args: {
            '<text>': 'The text to use.',
        },
        flags: {
            'operator, sign, op': 'The operator to insert between elements. Defaults to " + "',
            'char, c, symbol, s': 'Whether to use each element\'s symbol.',
            'number, num, n': 'Whether to show each element\'s number.',
        },
    };
    constructor() {
        super({
            name: 'elements',
            aliases: ['elementtext'],
        });
    }

    private alignElements(a: [Element, number][], op: string, t: 'number' | 'symbol') {
        return a
            .map(([x]) =>
                x[t]
                    .toString()
                    .padStart(Math.ceil(x.name.length / 2), ' ')
                    .padEnd(x.name.length, ' ')
            )
            .join(op);
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const op = <string>Object.entries(flags).find(([k, v]) => ['operator', 'sign', 'op'].includes(k) && typeof v === 'string')?.[1] || ' + ';
        const arr: [Element, number][] = [];
        for (const el of all.sort((a, b) => b.symbol.length - a.symbol.length))
            text = text.replace(new RegExp(el.symbol, 'gi'), (_, x) => {
                arr.push([el, x + arr.some(([, y]) => x === y)]);
                return ' ';
            });
        const sorted = arr.sort(([, a], [, b]) => a - b);
        const res = `${
            sorted
                .map(([x]) => x.name)
                .join(op)
        }${
            flags.char || flags.c || flags.symbol || flags.sy
                ? '\n' + this.alignElements(sorted, op, 'symbol')
                : ''
        }${
            flags.number || flags.num || flags.n
                ? '\n' + this.alignElements(sorted, op, 'number')
                : ''
        }`;
        msg.client.util.srcbinMessage(msg, msg.client.util.padZws(res), true);
    }
};