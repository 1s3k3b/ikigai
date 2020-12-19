import { Command } from 'aurora-djs';
import { Message, User } from 'discord.js';
import * as moment from 'moment';
import 'moment-duration-format';
import { Help } from '../../types';
import constants from '../../util/constants';

const f = (n: number) => n.toLocaleString('en');

module.exports = class InfoCommand extends Command {
    public help: Help = {
        type: 2,
        desc: 'Get information about the bot.',
        category: 'util',
    };
    constructor() {
        super({
            name: 'info',
            aliases: ['information', 'stats', 'data', 'ping'],
        });
    }

    public async fn(msg: Message) {
        const dbl = await msg.client.util.dbl('ikigai');
        const topgg = await msg.client.topgg.stats('607498384718430208');
        msg.channel.send({
            embed: msg.client.util
                .embed(true)
                .setTitle('Info')
                .setColor('RANDOM')
                .addField('Prefix', `\`${constants.CONFIG.PREFIX}\``)
                .addField('Ping', `${f(msg.client.ws.ping)}ms`)
                .addField('Servers', msg.client.guilds.cache.size)
                .addField('Users', msg.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0))
                .addField('Channels', msg.client.channels.cache.size)
                .addField('Commands', msg.client.commands.size)
                .addField('Uptime', moment.duration(msg.client.uptime || 0).format('d[d ]h[h ]m[m ]s[s]'))
                .addField('Memory Usage', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)
                .addField('Owner', (<User>(await msg.client.fetchApplication()).owner).tag)
                .addField('Invite', `[Click here](${await msg.client.generateInvite()})`)
                .addField('Discord Server', '[Click here](https://discord.gg/47H5v7v65R)')
                .addField('Website', '[Click here](https://1s3k3b.github.io/discord/ikigai)')
                .addField('Bot Lists', `[top.gg](https://top.gg/bot/607498384718430208)\n> ${topgg[0]} upvotes\n[DiscordBotList](https://discord.ly/ikigai)\n> ${f(dbl.metrics.invites)} invites\n> ${f(dbl.upvotes)} upvotes`)
                .addField(
                    'Source Code',
                    `[${await msg.client.github.fetchRepo(constants.REST.GITHUB.BOT_REPO).then(d => f(d.stargazers_count))} stars](${constants.REST.GITHUB.HTML_BASE}/${constants.REST.GITHUB.BOT_REPO})`
                ),
        });
    }
};
