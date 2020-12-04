import { Command } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'weeb',
        desc: 'Get a random meme from r/animemes.',
        readme: 9,
    };
    constructor() {
        super({
            name: 'animeme',
            aliases: ['animememe', 'animemes'],
        });
    }

    public async fn(msg: Message) {
        const { data } = msg.client.util.random((await msg.client.reddit.sub('animemes')).data.children.filter(x => x.data.post_hint === 'image'));
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setColor('RANDOM')
                .setTitle(data.title)
                .setURL(`${constants.REST.REDDIT}${data.permalink}`)
                .setImage(data.url)
                .setFooter(`r/animemes | ${data.ups} 👍 (${data.upvote_ratio * 100}%)`),
        });
    }
};