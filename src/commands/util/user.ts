import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { Help } from '../../types';

const sizes = <const>[16, 32, 64, 128, 256, 512, 1024, 2048];

module.exports = class UserCommand extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get info about a user.',
        args: {
            '[user]': 'The user, username, user ID, or user token to get info about.',
        },
        flags: {
            'avatar, av': 'Whether to send the user\'s avatar.',
            format: 'The avatar\'s image format.',
            size: 'The avatar\'s size. (16-2048)',
        },
    };
    constructor() {
        super({
            name: 'user',
            aliases: ['whois', 'whoami', 'member'],
        });
    }

    public async fn(msg: Message, { text, flags }: CommandInfo) {
        const user = await msg.client.util.getUser(msg, text) || msg.author;
        if (flags.avatar || flags.av) return msg.channel.send({
            files: [user.displayAvatarURL({
                format: typeof flags.format === 'string' ? <'gif' | 'png' | 'webp' | 'jpg' | 'jpeg'>flags.format : user.avatar?.startsWith('a_') ? 'gif' : 'png',
                size: <(typeof sizes)[number]>+flags.size ? (<(typeof sizes)[number][]><unknown>sizes).sort((a, b) => a - +flags.size + b - +flags.size)[0] : 2048,
            })],
        });
        const embed = msg.client.util
            .embed()
            .setTitle(`Info about **${user.tag}** (${user.id})`)
            .setColor('RANDOM')
            .setThumbnail(user.displayAvatarURL())
            .setFooter(msg.author.tag, msg.author.displayAvatarURL())
            .addField(
                'User',
                `Username: ${user.username}\nDiscriminator: ${user.discriminator}\nCreated at: ${user.createdAt.toDateString()}\nStatus: ${user.presence.status}\n${
                    user.flags?.toArray().length
                        ? `Badges: \`${
                            user.flags
                                .toArray()
                                .map(s =>
                                    s
                                        .split('_')
                                        .map(p => msg.client.util.capitalize(p))
                                        .join(' '),
                                )
                                .join('`, `')
                        }\``
                        : 'No badges' + (user.flags ? '' : ' available')
                }${user.bot ? '\nBot account' : ''}`,
            );
        const member = msg.guild?.member(user);
        if (member) {
            embed
                .setColor(member.displayHexColor)
                .addField('Member', `${member.nickname ? 'Nickname: ' + member.nickname : 'No nickname'}\nJoined at: ${member.joinedAt?.toDateString() || 'unknown'}\n${
                    member.roles.cache.size > 1
                        ? 'Roles: `' + member.roles.cache
                            .filter(r => r.id !== msg.guild!.id)
                            .map(r => r.name)
                            .join('`, `') + '`'
                        : 'No roles'
                }`);
        }
        msg.channel.send({ embed });
    }
};
