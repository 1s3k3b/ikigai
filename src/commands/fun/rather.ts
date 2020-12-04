import { Command } from 'aurora-djs';
import { User, Message, MessageReaction } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

const emojis = ['1️⃣', '2️⃣'];

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Get would you rather questions from either.io.',
        readme: 12,
    };
    constructor() {
        super({
            name: 'wouldyourather',
            aliases: ['rather', 'either'],
        });
    }

    private async run(msg: Message, m?: Message) {
        const d = await msg.client.util.eitherio();
        const max = +d.option1_total + +d.option2_total;
        const em = {
            embed: msg.client.util
                .embed(true, false)
                .setTitle(`${d.prefix ? `${d.prefix}, w` : 'W'}ould you rather...`)
                .setColor('RANDOM')
                .addField(
                    msg.client.util.capitalize(d.option_1),
                    `${~~(+d.option1_total / max * 100)}% (${(+d.option1_total).toLocaleString('en')})`
                )
                .addField('OR')
                .addField(
                    msg.client.util.capitalize(d.option_2),
                    `${~~(+d.option2_total / max * 100)}% (${(+d.option2_total).toLocaleString('en')})`
                )
                .setFooter(constants.REST.EITHER),
        };
        if (!m?.edit(em)) {
            const sent = await msg.channel.send(em);
            for (const em of emojis) await sent.react(em);
            sent
                .createReactionCollector((e: MessageReaction, u: User) => u.id === msg.author.id && emojis.includes(e.emoji.name))
                .on('collect', (r, u) => r.users.remove(u) && this.run(msg, sent));
        }
    }

    public async fn(msg: Message) {
        this.run(msg);
    }
};