import { Command, CommandInfo } from 'aurora-djs';
import { Message } from 'discord.js';
import fetch from 'node-fetch';
import { Help } from '../../types';
import constants from '../../util/constants';

module.exports = class extends Command {
    public help: Help = {
        type: 2,
        category: 'util',
        desc: 'Get worldwide or country-based COVID-19 stats.',
        readme: 8,
        args: {
            '[country]': 'The country to get stats of. If not provided, worldwide stats are shown.',
        },
    };
    constructor() {
        super({
            name: 'covid',
            aliases: ['covid-19', 'covid19', 'corona', 'coronavirus'],
        });
    }

    public async fn(msg: Message, { args: [country] }: CommandInfo) {
        const f = (n: number) => n.toLocaleString('en');
        const res: Record<
            | 'updated' | 'cases' | 'todayCases'
            | 'deaths' | 'todayDeaths' | 'recovered'
            | 'todayRecovered' | 'active' | 'critical'
            | 'casesPerOneMillion' | 'deathsPerOneMillion' | 'tests'
            | 'testsPerOneMillion' | 'population' | 'oneCasePerPeople'
            | 'oneDeathPerPeople' | 'oneTestPerPeople' | 'activePerOneMillion'
            | 'recoveredPerOneMillion' | 'criticalPerOneMillion',
            number
        > & {
            country?: string;
            countryInfo?: { flag: string; };
        } = await fetch(`${constants.REST.COVID}${country ? `countries/${country}` : 'all'}`)
            .then(d => d.json())
            .then(d =>
                d.updated
                    ? d
                    : fetch(`${constants.REST.COVID}all`).then(d => d.json())
            );
        msg.channel.send({
            embed: msg.client.util
                .embed(true)
                .setTitle(`COVID Cases${res.country ? ` in ${res.country}` : ''}`)
                .setURL(`https://www.worldometers.info/coronavirus/${res.country ? `country/${res.country}` : ''}`)
                .setThumbnail(res.countryInfo?.flag)
                .setColor('RANDOM')
                .addField('Population', f(res.population))
                .addField('Cases', `Total: ${f(res.cases)}\nToday: ${f(res.todayCases)}`)
                .addField('Deaths', `Total: ${f(res.deaths)}\nToday: ${f(res.todayDeaths)}`)
                .addField('Recoveries', `Total: ${f(res.recovered)}\nToday: ${f(res.todayRecovered)}`)
                .addField('Active', f(res.active))
                .addField('Critical', f(res.critical))
                .addField('Tests', f(res.tests))
                .setFooter('Last updated')
                .setTimestamp(res.updated),
        });
    }
};