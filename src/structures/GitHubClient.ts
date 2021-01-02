import RequestHandler from 'aghpb-api/dist/src/RequestHandler';
import constants from '../util/constants';
import { GitHubRepo, GitHubUser } from '../types';

export default class extends RequestHandler {
    public repos = new Map<string, GitHubRepo>();
    public users = new Map<string, GitHubUser>();
    public userRepos = new Map<string, GitHubRepo[]>();
    public async fetchRepo(s: string) {
        return this.repos.get(s.toLowerCase()) || this
            .request<GitHubRepo>(constants.REST.GITHUB.REPO + s)
            .then(d => d.id ? this.repos.set(s.toLowerCase(), d) && d : undefined);
    }
    public async fetchUser(s: string) {
        return this.users.get(s.toLowerCase()) || this
            .request<GitHubUser>(constants.REST.GITHUB.USER + s)
            .then(d => d.id ? this.users.set(s.toLowerCase(), d) && d : undefined);
    }
    public async fetchRepos(s: string) {
        return this.userRepos.get(s.toLowerCase()) || this
            .request<GitHubRepo[]>(`${constants.REST.GITHUB.USER}${s}/repos`)
            .then(d => <GitHubRepo | undefined>d[0] && this.userRepos.set(s.toLowerCase(), d) && d);
    }
}