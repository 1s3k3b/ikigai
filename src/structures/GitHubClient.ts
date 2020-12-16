import RequestHandler from 'aghpb-api/dist/src/RequestHandler';
import constants from '../util/constants';
import { GitHubRepo } from '../types';

export default class extends RequestHandler {
    public repos = new Map<string, GitHubRepo>();
    public async fetchRepo(s: string) {
        return this.repos.get(s) || this
            .request<GitHubRepo>(`${constants.REST.GITHUB.REPO}${s}`)
            .then(d => this.repos.set(s, d) && d);
    }
}