import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get info about Discord bots listed on top.gg',
        args: {
            '[bot]': 'The bot\'s ID or name.',
        },
    };
    constructor() {
        super({
            name: 'topgg',
            aliases: ['top.gg', 'top-gg'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const res = (await msg.client.topgg
            .info(text)
            .then(d =>
                d || msg.client.topgg
                    .search(text)
                    .then(d => msg.client.topgg.info(d.results?.[0]?.id || constants.CONFIG.CLIENT))
            ))!;
        const user = await msg.client.users.fetch(res.clientid);
        const stats = await msg.client.topgg.stats(res.id);
        return msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle(user.username)
                .setColor('RANDOM')
                .setURL(`${constants.REST.TOP_GG.HTML_BOT}${res.id}`)
                .setThumbnail(user.displayAvatarURL({ size: 2048 }))
                .setDescription(res.shortdesc)
                .addField('Stats', `Votes: ${stats[0]}\nServers: ${f(stats[1].server_count || 0)}\nShards: ${f(stats[1].shard_count || 0)}\nPoints: ${f(res.points)} (monthly: ${f(res.monthlyPoints)})`)
                .addField('Data', `ID: ${res.id}\nClient ID: ${res.clientid}\nPrefix: \`${res.prefix}\`\nApproved at ${new Date(res.date).toDateString()}`)
                .addField(
                    'Sites',
                    (<[keyof typeof res, string][]>[
                        ['invite', 'Invite'],
                        ['website', 'Website'],
                        ['support', 'Support Server'],
                        ['github', 'GitHub Repository'],
                    ])
                        .filter(([k]) => res[k])
                        .map(([k, n]) => `[${n}](${k === 'support' ? `https://discord.gg/${res[k]}` : res[k]})`)
                        .join('\n')
                )
                .addField(
                    'Owners',
                    (await Promise.all(res.owners.map(id => msg.client.users.fetch(id))))
                        .map(x => `${x.tag} (${x.id})`)
                        .join('\n')
                )
                .addField(!!res.tags.length && 'Tags', res.tags.join('\n')),
        });
    }
};