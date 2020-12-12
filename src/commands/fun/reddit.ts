import { Command, CommandInfo } from 'aurora-djs';
import { Message, TextChannel } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'fun',
        desc: 'Get posts from a specified subreddit.',
        readme: 15,
        args: {
            '<sub>': 'The subreddit to get posts from.',
        },
    };
    constructor() {
        super({
            name: 'reddit',
            aliases: ['subreddit'],
        });
    }

    public async fn(msg: Message, { args: [sub = ''] }: CommandInfo) {
        const res = await msg.client.reddit.sub(sub = sub.replace(/^\/?r\//, ''));
        if (!sub || !res.data?.children.length) return msg.channel.send('Subreddit not found.');
        msg.client.util.paginate(
            msg,
            false,
            res.data.children
                .filter(x =>
                    x.data.post_hint === 'image'
                    && (!x.data.over_18 || (<TextChannel>msg.channel).nsfw || msg.channel.type === 'dm')
                )
                .sort(() => 0.5 - Math.random()),
            x => [{
                embed: msg.client.util
                    .embed()
                    .setTitle(x.data.title)
                    .setURL(`${constants.REST.REDDIT}${x.data.permalink}`)
                    .setDescription(`[r/${sub}](${constants.REST.REDDIT}/r/${sub})`)
                    .setImage(x.data.url)
                    .setFooter(`${x.data.ups} 👍 (${x.data.upvote_ratio * 100}%)`),
            }],
            0,
            ['Subreddit not found.'],
        );
    }
};