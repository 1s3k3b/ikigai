import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import constants from '../../util/constants';
import { Help } from '../../types';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get info about a bot listed on [DBL](https://discordbotlist.com/).',
        args: {
            '[bot]': 'The name of the bot displayed at the end of the URL. If not provided or invalid, Ikigai is used.',
        },
    };
    constructor() {
        super({
            name: 'dbl',
            aliases: ['discordbotlist'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const res = await msg.client.util
            .dbl(text.toLowerCase().replace(/\s+/g, '-'))
            .catch(() => msg.client.util.dbl('ikigai'));
        const owner = await msg.client.users.fetch(res.owner_id);
        return msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle(res.profile.username)
                .setURL(`${constants.REST.DBL.HTML}${res.slug}`)
                .setThumbnail(`https://cdn.discordapp.com/avatars/${res.id}/${res.profile.avatar}.png?size=2048`)
                .setColor('RANDOM')
                .setDescription(res.short_description)
                .addField('Stats', `${res.upvotes.toLocaleString('en')} upvotes\nRating: ${res.rating.toFixed(1)} (${res.ratings.toLocaleString('en')} ratings)`)
                .addField('Data', `Prefix: \`${res.prefix}\`\n${
                    [['website', 'Website'], ['oauth_url', 'Invite Link'], ['server_invite', 'Support Server']]
                        .map(([x, y]) => res[<keyof typeof res>x] && `[${y}](${res[<keyof typeof res>x]})`)
                        .filter(x => x)
                        .join('\n')
                }`)
                .addField('Owner', `${owner.tag}\nID: ${owner.id}`)
                .addField('Creation', `Created at ${new Date(res.created_at).toDateString()}\nLast updated at ${new Date(res.updated_at).toDateString()}`)
                .addField('Tags', res.tags.join('\n')),
        });
    }
};