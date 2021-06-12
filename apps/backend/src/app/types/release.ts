import { Endpoints } from '@octokit/types/dist-types/generated/Endpoints';
import { ArrayType } from './array';

export interface Release {
  version: string;
  prerelease: boolean;
  data: ArrayType<Endpoints['GET /repos/{owner}/{repo}/releases']['response']['data']>;
  info: string;
}
