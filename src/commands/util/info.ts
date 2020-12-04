import { Command } from 'aurora-djs';
import { Message, User } from 'discord.js';
import * as moment from 'moment';
import 'moment-duration-format';
import { Help } from '../../types';
import constants from '../../util/constants';

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
        msg.channel.send({
            embed: msg.client.util
                .embed(true)
                .setTitle('Info')
                .setColor('RANDOM')
                .addField('Ping', msg.client.ws.ping)
                .addField('Invite', `[Click here](${await msg.client.generateInvite()})`)
                .addField('Discord Server', '[Click here](https://discord.gg/47H5v7v65R)')
                .addField('Prefix', `\`${constants.CONFIG.PREFIX}\``)
                .addField('Servers', msg.client.guilds.cache.size)
                .addField('Users', msg.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0))
                .addField('Channels', msg.client.channels.cache.size)
                .addField('Commands', msg.client.commands.size)
                .addField('Uptime', moment.duration(msg.client.uptime || 0).format('d[d ]h[h ]m[m ]s[s]'))
                .addField('Memory Usage', `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`)
                .addField('Owner', (<User>(await msg.client.fetchApplication()).owner).tag)
                .addField('Source Code', `[Click here](${constants.REST.REPO})`),
        });
    }
};
