import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'A japanese dictionary via jisho.org',
        readme: 21,
        args: {
            '[term]': 'The term to search for. Can be english or japanese.',
        },
    };
    constructor() {
        super({
            name: 'jisho',
            aliases: ['dictionary'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const data = await msg.client.util.jisho(text);
        if (!data.length) return msg.channel.send('No results found.');
        msg.client.util.paginate(
            msg,
            false,
            data,
            x => [{
                embed: msg.client.util
                    .embed()
                    .setColor('RANDOM')
                    .setTitle(x.slug)
                    .addField(
                        'Meanings',
                        [...new Set(x.senses.flatMap(x => x.parts_of_speech))].reduce(
                            (a, b, i) =>
                                `${a}${b}:\n${
                                    x.senses
                                        .filter(x => x.parts_of_speech.includes(b))
                                        .flatMap(x => x.english_definitions)
                                        .map(x => `> ${x}`)
                                        .join('\n')
                                }${i < x.senses.length - 1 ? '\n' : ''}`,
                            ''
                        )
                    )
                    .addField(
                        'Japanese',
                        x.japanese
                            .map(x => x.word ? `${x.word} (${x.reading})` : x.reading)
                            .join('\n')
                    ),
            }],
        );
    }
};