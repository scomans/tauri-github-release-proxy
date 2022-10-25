import type { Endpoints } from '@octokit/types';
import type { IterableElement } from 'type-fest';


export interface Release {
  version: string;
  prerelease: boolean;
  data: IterableElement<Endpoints['GET /repos/{owner}/{repo}/releases']['response']['data']>;
  info: string;
}
