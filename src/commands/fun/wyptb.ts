import { Command } from 'aurora-djs';
import { Message, MessageReaction, User } from 'discord.js';
import { AllHtmlEntities } from 'html-entities';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

const emojis = ['👍', '👎'];

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Get dilemmas from willyoupressthebutton.com',
        readme: 14,
    };
    constructor() {
        super({
            name: 'willyoupressthebutton',
            aliases: ['will-you-press-the-button', 'wyptb'],
        });
    }

    private async run(msg: Message, m?: Message) {
        const { dilemma }: {
            dilemma: {
                txt1: string;
                txt2: string;
                yes: number;
                no: number;
            };
        } = await fetch(constants.REST.WYPTB.GET, { method: 'POST' }).then(d => d.json());
        const max = dilemma.yes + dilemma.no;
        const em = {
            embed: msg.client.util
                .embed(true, false)
                .setTitle('Will you press the button?')
                .setColor('RANDOM')
                .setDescription(`${~~(dilemma.yes / max * 100)}% 👍\n${~~(dilemma.no / max * 100)}% 👎`)
                .addField(AllHtmlEntities.decode(dilemma.txt1))
                .addField('BUT')
                .addField(AllHtmlEntities.decode(dilemma.txt2))
                .setFooter(constants.REST.WYPTB.URL),
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