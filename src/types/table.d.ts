declare module 'ascii-table' {
    export default class Table {
        constructor(title: string);
        public addRow(...arr: any[]): this;
        public setHeading(...arr: string[]): this;
        public setAlignCenter(idx: number): this;
    }
}