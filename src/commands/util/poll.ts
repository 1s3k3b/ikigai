import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import regex from 'emoji-regex';
import { Help } from '../../types';

const emojiRegex = new RegExp(`^(${regex.toString().slice(1, -2)}) (.+)`);
const baseText = 'Please send an option in the format `:emoji: text`.\nSend `stop` to send the embed with the given options.';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Create a poll.',
        readme: 17,
        args: {
            '<title>': 'The poll\'s title.',
        },
        flags: {
            text: 'Whether to send the poll in a text form. (if not provided, an embed is sent)',
        },
    };
    constructor() {
        super({
            name: 'poll',
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const awaitMsg = (s: string) => msg.channel.send(s) && msg.channel
            .awaitMessages((x: Message) => x.author.id === msg.author.id, { max: 1 })
            .then(d => d.first()!);
        const options: string[][] = [];
        let res;
        let q = baseText;
        while ((res = await awaitMsg(q)).content.toLowerCase() !== 'stop' && options.length < 25) {
            const em = res.content.match(emojiRegex);
            if (!em) {
                q = 'Invalid format. ' + baseText;
                continue;
            }
            if (options.some(([x]) => x === em[1])) {
                q = 'Emoji already exists. ' + baseText;
                continue;
            }
            q = baseText;
            options.push([em[1], em[3]]);
        }
        const sent = await msg.channel.send(
            flags.text
                ? `\`\`\`${text}\`\`\`\n${options.map(x => x.join(' ')).join('\n')}`
                : {
                    embed: msg.client.util
                        .embed()
                        .setAuthor(msg.author.tag, msg.author.displayAvatarURL({ format: 'png', size: 2048 }))
                        .setTitle(msg.client.util.padZws(text))
                        .setColor(typeof flags.color === 'string' ? flags.color.toUpperCase() : 'RANDOM')
                        .addFields(options.map(([e, t]) => ({
                            name: e,
                            value: t,
                            inline: true,
                        }))),
                }
        );
        for (const [em] of options) await sent.react(em);
    }
};