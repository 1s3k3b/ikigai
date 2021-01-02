import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { textSync, Fonts, fontsSync } from 'figlet';
import { findBestMatch } from 'string-similarity';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'text',
        desc: 'Convert text to ASCII art.',
        readme: 20,
        args: {
            '[text]': 'The text to convert.',
        },
        flags: {
            fonts: 'Whether to get a list of available fonts.',
            font: 'Allows you to specify a custom font to be used.',
        },
        examples: ['--fonts', 'hello --font=blood'],
    };
    constructor() {
        super({
            name: 'asciitext',
            aliases: ['ascii', 'asciiart'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const fonts = fontsSync();
        if (flags.fonts === true) return msg.client.util.paginate(
            msg,
            false,
            msg.client.util.split(fonts, 25),
            x => [{
                embed: msg.client.util
                    .embed()
                    .setTitle('Fonts')
                    .setColor('RANDOM')
                    .addFields(x.map(k => ({
                        name: k,
                        value: '```\n' + textSync('hi', <Fonts>k).slice(0, 1016) + '```',
                    }))),
            }],
        );
        msg.client.util.srcbinMessage(
            msg,
            textSync(
                text,
                flags.font
                    ? <Fonts>findBestMatch(`${flags.font}`, fonts).bestMatch.target
                    : undefined
            ),
            true
        );
    }
};