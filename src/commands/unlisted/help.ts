import { Command, CommandInfo } from 'aurora-djs';
import { Message, Collection } from 'discord.js';
import { CommandHelp, Help } from '../../types';
import constants from '../../util/constants';

type StrDict = Record<string, string>;

const constCategories: StrDict = {
    nsfw: '🔞',
    weeb: '🇯🇵',
    util: '🛠️',
    fun: '😄',
    text: '🇹',
    image: '🖼️',
    search: '🔍',
};
const constCategoryDescriptions: StrDict = {
    nsfw: 'Regular NSFW commands.',
    weeb: 'Weeb, and weeb NSFW commands.',
    util: 'Utility commands.',
    fun: 'Fun commands.',
    text: 'Text related commands.',
    image: 'Image manipulation commands.',
    search: 'Search commands.',
};

const constCategoryCases: StrDict = {
    nsfw: 'NSFW',
    weeb: 'Weeb',
    util: 'Util',
    fun: 'Fun',
    text: 'Text',
    image: 'Image',
    search: 'Search',
};

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
        const categories = constCategories;
        const categoryDescriptions = constCategoryDescriptions;
        const categoryCases = constCategoryCases;
        const commands = <(CommandHelp & { name: string; aliases: string[]; })[]><unknown>(
            <{
                commands: Collection<string, {
                    help: Help;
                    name: string;
                    aliases: string[];
                }>;
            }>msg.client
        ).commands
            .array()
            .flatMap(x => {
                if (!x.help.type) return [];
                if (x.help.type === 1) {
                    categories[x.name] = x.help.emoji;
                    categoryDescriptions[x.name] = x.help.desc;
                    categoryCases[x.name] = x.help.case;
                    return x.help.subcommands.map(y => <CommandHelp>({
                        ...y,
                        aliases: [...y.aliases || [], y.name],
                        type: 2,
                        category: x.name,
                        prefix: `${constants.CONFIG.PREFIX}${x.name} `,
                    }));
                }
                return {
                    ...x,
                    ...x.help,
                    prefix: constants.CONFIG.PREFIX,
                };
            });
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