import fetch from 'node-fetch';
import { UDResult } from '../types';
import constants from '../util/constants';

export default class {
    private request<T>(s: string): Promise<T> {
        return fetch(s).then(d => d.json());
    }
    public search(term: string) {
        return this.request<UDResult>(`${constants.REST.URBAN.SEARCH}${encodeURIComponent(term)}`);
    }
    public random() {
        return this.request<UDResult>(constants.REST.URBAN.RAND);
    }
}