import { Client } from 'aurora-djs';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { Help } from '../src/types';
import constants from '../src/util/constants';
import Table from 'ascii-table';

export const readme = (c: Client) => {
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
    const existing = readdirSync('./readme/pics');
    const t = new Table('TODO Command Showcases').setHeading('Command', 'Priority', 'Example');
    for (
        const n of names
            .filter(x => !existing.includes(x.name + '.png'))
            .flatMap(x => x ? [[x.name, x.readme, x.examples.map(y => `${constants.CONFIG.PREFIX}${x.name} ${y}`).join(', ')]] : [])
    ) t.addRow(...n);
    console.log(t.toString());
    writeFileSync(
        './README.md',
        `${readFileSync('./readme/static.md')}\n## Showcase\n${
            existing
                .sort((a, b) => names.find(x => x.name + '.png' === a)!.readme! - names.find(x => x.name + '.png' === b)!.readme!)
                .map(x => `<img src="${constants.REST.REPO_RAW}readme/pics/${x}">`)
                .join('\n')
        }`
    );
};