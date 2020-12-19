import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get the link to vote on top.gg, and find out whether an user has voted.',
        args: {
            '[user]': 'The user mention, ID, or username. Defaults to the author.',
        },
    };
    constructor() {
        super({
            name: 'vote',
            aliases: ['upvote', 'voted', 'upvoted'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const u = await msg.client.util.getUser(msg, text) || msg.author;
        const res = await msg.client.topgg.info(constants.CONFIG.CLIENT);
        const voted = await msg.client.topgg.voted(u.id);
        return msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle('Vote')
                .setURL(`${constants.REST.TOP_GG.HTML_BOT}${constants.CONFIG.CLIENT}/vote`)
                .setColor(voted ? 'GREEN' : 'RED')
                .setDescription(`Please consider voting.`)
                .addField('Votes', `${res!.points.toLocaleString('en')} overall\n${res!.monthlyPoints.toLocaleString('en')} monthly`)
                .addField(u.tag, `${u.id === msg.author.id ? 'You have' : `${u.tag} has`}${voted ? '' : ' not'} voted.`)
        });
    }
}