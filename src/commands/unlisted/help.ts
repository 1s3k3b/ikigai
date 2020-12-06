import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import { CommandHelp } from '../../types';
import constants from '../../util/constants';

type StrDict = Record<string, string>;

module.exports = class extends Command {
    public help = {
        type: 0,
        unlisted: true,
    };
    constructor() {
        super({
            name: 'help',
            aliases: ['h'],
        });
    }

    public category(
        msg: Message,
        emoji: string,
        categoryDescriptions: StrDict,
        categoryCases: StrDict,
        commands: (CommandHelp & { name: string; aliases: string[]; })[],
        x: string
    ) {
        const o = {
            embed: msg.client.util
                .embed()
                .setColor('RANDOM')
                .setTitle(`${emoji} ${categoryCases[x]} Commands`)
                .setDescription(categoryDescriptions[x])
                .setFooter(`Use the ${constants.CONFIG.PREFIX}help <command|category> command to get info about a command or a category.\n[optional], <required>`)
                .addFields(
                    commands
                        .filter(y => y.category === x)
                        .map(x => ({
                            name: `${x.prefix}${x.name}`,
                            value: x.desc,
                            inline: true,
                        }))
                ),
        };
        return msg.edit(o).catch(() => msg.channel.send(o));
    }

    public async fn(msg: Message, { args: [x, sub] }: CommandInfo) {
        const { commands, categories, categoryDescriptions, categoryCases, categoryPriorities } = msg.client.util.loadCommands(msg.client);
        x = x?.toLowerCase();
        const category = categories[x];
        let cmd = commands.find(y => y.aliases!.includes(x));
        if (category) {
            if (!(cmd = commands.find(y => y.aliases.includes(sub) && y.category === x))) return this.category(msg, category, categoryDescriptions, categoryCases, commands, x);
        }
        if (cmd) return msg.channel.send({
            embed: msg.client.util
                .embed()
                .setColor('RANDOM')
                .setTitle(`${categories[cmd.category]} ${msg.client.util.capitalize(cmd.name)} Command`)
                .setFooter(`Use the ${constants.CONFIG.PREFIX}help <command|category> command to get info about a command or a category.\n\[optional], <required>`)
                .setDescription('`' + `${cmd.prefix}${cmd.name} ${
                    Object
                        .keys(cmd.args || {})
                        .join(' ')
                } ${
                    Object
                        .keys(cmd.flags || {})
                        .flatMap(x => x.split(', '))
                        .map(x => `[${x.length === 1 ? '-' : '--'}${x}]`)
                        .join(' ')
                }`.trim() + '`')
                .addField(
                    'Aliases',
                    cmd.aliases.length > 1
                        ? '`' + cmd.aliases
                            .filter(x => x !== cmd!.name)
                            .join('\`\n\`') + '`'
                        : 'None'
                )
                .addField('Category', `${categories[cmd.category]} ${categoryCases[cmd.category]}`)
                .addField(!!cmd.nsfw && 'NSFW')
                .addField(
                    'Args',
                    Object
                        .entries(cmd.args || {})
                        .map(([x, y]) => `\`${x}\`: ${y}`)
                        .join('\n')
                )
                .addField(
                    'Flags',
                    Object
                        .entries(cmd.flags || {})
                        .map(([x, y]) => `\`${
                            x
                                .split(', ')
                                .map(x => `${x.length === 1 ? '-' : '--'}${x}`)
                                .join(', ')
                        }\`: ${y}`)
                        .join('\n')
                    || 'None'
                )
                .addField('Examples', cmd.examples?.map(x => '`' + `${cmd?.prefix}${cmd?.name} ${x}`.trim() + '`').join('\n') || 'None'),
        });
        const sent = await msg.channel.send({
            embed: msg.client.util
                .embed()
                .setColor('RANDOM')
                .setFooter(`Use the ${constants.CONFIG.PREFIX}help <command|category> command to get info about a command or a category.\n[optional], <required>`)
                .addFields(
                    ...Object
                        .entries(categories)
                        .sort(([a], [b]) => categoryPriorities[a] - categoryPriorities[b])
                        .map(([name, emoji]) => ({
                            name: `${emoji} ${categoryCases[name]} (${commands.filter(x => x.category === name).length})`,
                            value: categoryDescriptions[name],
                        }))
                ),
        });
        const emojis: StrDict = Object.fromEntries(Object.entries(categories).map(x => x.reverse()));
        sent
            .createReactionCollector((r, u) => !!emojis[r.emoji.name] && u.id === msg.author.id)
            .on('collect', async (r, u) => r.users.remove(u).catch(() => {}) && this.category(sent, r.emoji.name, categoryDescriptions, categoryCases, commands, emojis[r.emoji.name]));
        for (const em of Object.keys(emojis)) await sent.react(em);
    }
};