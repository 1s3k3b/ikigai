import { Client } from 'aurora-djs';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { CommandHelp, Help } from '../src/types';
import constants from '../src/util/constants';
import Table from 'ascii-table';

export default (c: Client) => {
    readme(c);
    website(c.util.loadCommands(c));
};

const resolveHyperlink = (s: string) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/, '<a href="$2">$1</a>');
const mkdir = (p: string) => !existsSync(p) && mkdirSync(p);

const website = ({ categories, categoryDescriptions, categoryCases, categoryPriorities, commands }: Commands) => {
    mkdir('./website');
    mkdir('./website/categories')
    for (const css of ['main', 'command', 'category']) writeFileSync(`./website/${css}.css`, readFileSync(`./generators/static/${css}.css`));
    writeFileSync('./website/index.html', `<html prefix="og: https://ogp.me/ns#">
    <head>
        <title>Ikigai</title>
        <link rel="stylesheet" href="./main.css">
        <meta property="og:title" content="Ikigai"/>
        <meta property="og:description" content="A Discord bot focused on weeb, util, and fun commands."/>
    </head>
    <body>
        <div class="header">
            <h1>Ikigai</h1>
            <p>A Discord bot mainly focused on weeb, util, and fun commands.</p>
            <button><a href="https://discord.com/api/oauth2/authorize?client_id=${constants.CONFIG.CLIENT}&permissions=0&scope=bot">Invite Ikigai</a></button>
            <button><a href="https://discord.gg/${constants.CONFIG.SERVER_INVITE}">Support server</a></button>
            <button><a href="${constants.REST.GITHUB.HTML_BASE}/${constants.REST.GITHUB.BOT_REPO}">Source code</a></button>
        </div>
        <h2>Categories</h2>
${
    Object
        .keys(categories)
        .sort((a, b) => categoryPriorities[a] - categoryPriorities[b])
        .map(c => `     <h3><a href="./categories/${c}">${categoryCases[c]}</a></h3>
        <div class="category">
            <p>${resolveHyperlink(categoryDescriptions[c])}</p>
            ${
            commands
                .filter(x => x.category === c)
                .map(x => `<code><a href="./categories/${x.category}/${x.name}">${x.prefix}${x.name}</a></code>`)
                .join(' ')
        }</div><br>`)
        .join('\n')
    }
    </body>
</html>`);
    for (const c of Object.keys(categories)) {
        const cmds = commands.filter(x => x.category === c);
        mkdir(`./website/categories/${c}`);
        writeFileSync(`./website/categories/${c}/index.html`, `<html prefix="og: https://ogp.me/ns#">
    <head>
        <title>${categoryCases[c]} Commands | Ikigai</title>
        <link rel="stylesheet" href="../../category.css">
        <meta property="og:title" content="${categoryCases[c]} Commands"/>
        <meta property="og:description" content="${categoryDescriptions[c]}"/>
    </head>
    <body>
        <h1>${categoryCases[c]} Commands</h1>
        <p>${categoryDescriptions[c]}</p>
        <h2>Commands</h2>
        ${cmds.map(c => `<h3><a href="./${c.name}">${c.prefix}${c.name}</a></h3><p>${c.desc}</p>`).join('\n')}
    </body>
</html>`);
        for (const cmd of cmds) {
            const imgPath = cmd.prefix?.endsWith(cmd.category + ' ') ? `${cmd.category} ${cmd.name}` : cmd.name;
            writeFileSync(`./website/categories/${c}/${cmd.name}.html`, `<html prefix="og: https://ogp.me/ns#">
    <head>
        <title>${cmd.name} Command | ${categoryCases[c]} | Ikigai</title>
        <link rel="stylesheet" href="../../command.css">
        <meta property="og:title" content="${cmd.name} Command"/>
        <meta property="og:description" content="${cmd.desc}"/>
    </head>
    <body>
        <h1>${cmd.prefix}${cmd.name}</h1>
        <h3>Category: ${categoryCases[c]}</h3>
        <p>${cmd.desc}</p>
        ${cmd.nsfw ? '<h3>NSFW</h3>' : ''}
        ${cmd.examples ? `<h3>Examples</h3>${cmd.examples.map(s => `<p><code>${cmd.prefix}${cmd.name} ${s}</code></p>`).join('\n')}` : ''}
        ${cmd.aliases.length > 1 ? `<h3>Aliases</h3>${cmd.aliases.slice(0, -1).join(', ')}` : ''}
        ${cmd.args ? `<h3>Args</h3>${Object.entries(cmd.args).map(([k, v]) => `<p>${k.replace(/</g, '&lt;').replace(/>/g, '&gt;')}: ${v}</p>`).join('\n')}` : ''}
        ${cmd.flags ? `<h3>Flags</h3>${Object.entries(cmd.flags).map(([k, v]) => `<p>${
            k
                .split(', ')
                .map(x => `${x.length === 1 ? '-' : '--'}${x}`)
                .join(', ')
        }: ${v}</p>`).join('\n')}` : ''}
        ${existsSync(`./generators/pics/${imgPath}.png`) ? `<img src="${constants.REST.GITHUB.BOT_REPO_RAW}generators/pics/${imgPath}.png">` : ''}
    </body>
</html>`);
        }
    }
};

const readme = (c: Client) => {
    const names = c.commands
        .array()
        .flatMap(c =>
            c.help.type === 2
                ? {
                    name: c.name,
                    examples: c.help.examples || [],
                    readme: c.help.readme,
                }
                : c.help.type
                    ? c.help.subcommands.map(x => ({
                        name: `${(<Help & { type: 1 }>c.help).name} ${x.name}`,
                        examples: x.examples || [],
                        readme: x.readme,
                    }))
                    : []
        )
        .filter(x => x.readme)
        .sort((a, b) => a.readme! - b.readme!);
    const existing = readdirSync('./generators/pics');
    const t = new Table('TODO Command Showcases').setHeading('Command', 'Priority', 'Example');
    for (
        const n of names
            .filter(x => !existing.includes(x.name + '.png'))
            .flatMap(x => x ? [[x.name, x.readme, x.examples.map(y => `${constants.CONFIG.PREFIX}${x.name} ${y}`).join(', ')]] : [])
    ) t.addRow(...n);
    console.log(t.toString());
    writeFileSync(
        './README.md',
        `${
            readFileSync('./generators/static/static.md', 'utf8')
                .replace(
                    /\{([^}.]+)\.([^}.]+)(?:\.([^}.]+))?\}/g,
                    (_, a, b, c) => {
                        const prop = Object.getOwnPropertyDescriptor(
                            Object.getOwnPropertyDescriptor(constants, a)!.value,
                            b,
                        )!.value;
                        return c ? Object.getOwnPropertyDescriptor(prop, c)!.value : prop;
                    },
                )
        }\n## Showcase\n${
            existing
                .sort((a, b) => names.find(x => x.name + '.png' === a)!.readme! - names.find(x => x.name + '.png' === b)!.readme!)
                .map(x => `<img src="${constants.REST.GITHUB.BOT_REPO_RAW}generators/pics/${x}">`)
                .join('\n')
        }`
    );
};

interface Commands {
    commands: (CommandHelp & {
        name: string;
        aliases: string[];
    })[];
    categories: Record<string, string>;
    categoryDescriptions: Record<string, string>;
    categoryCases: Record<string, string>;
    categoryPriorities: Record<string, number>;
}