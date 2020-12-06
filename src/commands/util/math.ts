import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { evaluate } from 'mathjs';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Calculate a mathematical expression.',
        args: {
            '<expr>': 'The expression to calculate.',
        },
        flags: {
            '<name>': '<value>',
        },
        examples: ['sqrt(92)', '3x + sqrt(x^2) --x=13', '32 deg to rad'],
    };
    constructor() {
        super({
            name: 'math',
        });
    }

    private resolveValue(x: any, depth = 0): number | string {
        return x && (typeof x === 'number'
            ? x
            : typeof x === 'string'
                ? `'${x}'`
                : typeof x === 'boolean'
                    ? `[boolean] ${x}`
                    : x instanceof Array
                        ? depth
                            ? `[${x.map(x => this.resolveValue(x, 1)).join(', ')}]`
                            : x
                                .map(x => this.resolveValue(x, 1))
                                .join('\n')
                        : x.constructor.name === 'ResultSet'
                            ? this.resolveValue(x.entries, depth)
                            : x.constructor.name === 'Matrix'
                                ? this.resolveValue(x._data, depth)
                                : typeof x === 'function'
                                    ? x.syntax
                                    : depth
                                        ? `{ ${Object.entries(x).map(([k, v]) => `[${k}: ${this.resolveValue(v, 1)}]`)
                                            .join(', ')} }`
                                        : Object
                                            .entries(x)
                                            .map(([k, v]) => `${k}: ${this.resolveValue(v, 1)}`));
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        try {
            msg.channel.send(this.resolveValue(evaluate(
                text,
                Object.fromEntries(
                    Object
                        .entries(flags)
                        .map(([k, v]) => [k, isNaN(+v) ? 0 : +v])
                )
            )), { code: true });
        } catch (e) {
            msg.channel.send(e.message, { code: true });
        }
    }
};