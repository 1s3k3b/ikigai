import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class ActivitiesCommand extends Command {
    public help: Help = {
        type: 2,
        desc: 'View all activities of a user.',
        category: 'util',
        args: {
            '[user]': 'The user mention, ID, username, or token.',
        },
    };
    constructor() {
        super({
            name: 'activities',
            aliases: ['activity', 'status', 'statuses'],
        });
    }

    public async fn(msg: Message, { text }: CommandInfo) {
        const u = await msg.client.util.getUser(msg, text) || msg.author;
        msg.channel.send({
            embed: msg.client.util
                .embed()
                .setTitle('Activities')
                .setColor(constants.STATUS_COLORS[<Exclude<typeof u.presence.status, 'invisible'>>u.presence.status])
                .setAuthor(u.tag, u.displayAvatarURL())
                .setDescription(
                    Object
                        .entries(u.presence.clientStatus || { web: 'offline', mobile: 'offline', desktop: 'offline' })
                        .map(([k, v]) => `${k[0].toUpperCase()}${k.slice(1)}: ${v || 'offline'}`)
                        .join('\n'),
                )
                .addFields(
                    u.presence.activities.map(a => ({
                        name: '❯ ' + (a.type === 'CUSTOM_STATUS'
                            ? a.emoji
                                ? `${a.emoji.id ? `:${a.emoji.name}:` : a.emoji.name} ${a.state || ''}`
                                : a.state
                            : `${a.type === 'LISTENING' ? 'Listening to' : a.type[0] + a.type.slice(1).toLowerCase()} ${a.name}`),
                        value: a.type === 'CUSTOM_STATUS'
                            ? '\u200b'
                            : a.details || a.state ? `${a.details ? '• ' + a.details + '\n' : '\u200b'}${a.state ? '• ' + a.state : '\u200b'}` : '\u200b',
                    })),
                ),
        });
    }
};
