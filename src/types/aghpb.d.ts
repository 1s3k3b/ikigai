declare module 'aghpb-api/dist/src/RequestHandler' {
    export default class {
        constructor(auth: string);
        public request<T>(s: string): Promise<T>;
    }
}