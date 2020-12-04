import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class OsuCommand extends Command {
    public help: Help = {
        type: 2,
        desc: 'Get data of an osu! account.',
        category: 'util',
        readme: 11,
        args: {
            '[username]': 'The account\'s username.',
        },
    };
    constructor() {
        super({
            name: 'osu',
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const u = await msg.client.osu.getUser(text || msg.author.username).catch(() => undefined);
        if (!u || (<{ error: string; }><unknown>u).error) return msg.channel.send('User not found.');
        msg.channel.send({
            embed: msg.client.util
                .embed(true)
                .setTitle(u.username)
                .setURL(`${constants.REST.OSU.USER}${u.id}`)
                .setThumbnail(u.avatar_url.startsWith('/') ? constants.REST.OSU.DEF_AVATAR : u.avatar_url)
                .setColor('RANDOM')
                .setDescription(`Account ID: ${u.id}`)
                .addField('Stats', `Rank: #${u.statistics.rank.global?.toLocaleString('en') || 'N/A'} global (#${u.statistics.rank.country?.toLocaleString('en') || 'N/A'} local)
Level: ${u.statistics.level.current} (progress: ${u.statistics.level.progress})
pp: ${u.statistics.pp} (pp rank: ${u.statistics.pp_rank.toLocaleString('en')})
Ranked Score: ${u.statistics.ranked_score.toLocaleString('en')}
Accuracy: ${u.statistics.hit_accuracy}%
Play Count: ${u.statistics.play_count}
Score: ${u.statistics.total_score.toLocaleString('en')}
Hits: ${u.statistics.total_hits.toLocaleString('en')}
Max Combo: ${u.statistics.maximum_combo}`)
                .addField('Joined At', `${new Date(u.join_date).toDateString()} (last visit: ${new Date(u.last_visit).toDateString()})`)
                .addField('Socials', `Country: ${u.country_code}\n${['Interests', 'Website', 'Discord', 'Skype', 'Twitter'].map(x => `${x}: ${u[<keyof typeof u>x.toLowerCase()] || 'None'}`).join('\n')}`)
                .addField('Data', `Playmode: ${u.playmode}\nPlaystyle: ${u.playstyle?.join(', ') || 'Not specified'}`),
        });
    }
};
