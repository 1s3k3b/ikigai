import { MessageEmbed, MessageEmbedOptions } from 'discord.js';

export default class extends MessageEmbed {
    constructor(private inline: boolean, private bulletPoints: boolean, d?: MessageEmbedOptions) {
        super(d);
    }
    public addField(title: string | boolean, desc: string | number = '\u200b', inline = this.inline, bulletPoints = this.bulletPoints) {
        if (title) super.addField(
            typeof title === 'string' && title !== '\u200b' ? `${bulletPoints ? '❯ ' : ''}${title}` : '\u200b',
            `${desc}`
                .split('\n')
                .map(x => `${bulletPoints && !x.startsWith('>') && x.trim() && x !== '\u200b' ? '• ' : ''}${x}`)
                .join('\n'),
            inline,
        );
        return this;
    }
    public setAuthor(name?: string, icon?: string, url?: string) {
        if (name || icon || url) super.setAuthor(name, icon, url);
        return this;
    }
    public setDescription(s?: string | boolean) {
        if (s) super.setDescription(s);
        return this;
    }
    public setThumbnail(s?: string) {
        if (s) super.setThumbnail(s);
        return this;
    }
}