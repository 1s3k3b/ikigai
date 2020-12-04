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

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        try {
            msg.channel.send(
                evaluate(
                    text,
                    Object.fromEntries(
                        Object
                            .entries(flags)
                            .map(([k, v]) => [k, isNaN(+v) ? 0 : +v])
                    )
                ),
                { code: true }
            );
        } catch (e) {
            msg.channel.send(e.message, { code: true });
        }
    }
};