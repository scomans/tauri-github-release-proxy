import { Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { request } from '@octokit/request';
import { RequestInterface } from '@octokit/types';
import { PROXY_CONFIG } from '../app.const';
import { Release } from '../types/release';
import { SafeAny } from '../types/safe-any';

interface RequestParams {
  owner: string;
  repo: string;
  headers?: Record<string, string>;
}

@Injectable()
export class CacheService {

  private latestRelease: Release;
  private latestPrerelease: Release;

  private readonly account: string;
  private readonly repository: string;
  private readonly token: string;
  private readonly versionPrefix: string;
  private readonly updateInterval: number;

  private readonly request: RequestInterface;
  private lastUpdate = 0;

  constructor(
    @Inject(PROXY_CONFIG) private readonly config,
  ) {
    this.account = config.ACCOUNT;
    this.repository = config.REPOSITORY;
    this.token = config.TOKEN;
    this.versionPrefix = config.VERSION_PREFIX;
    this.updateInterval = (parseInt(config.INTERVAL ?? 15, 10)) * 60 * 1000;

    if (!this.account || !this.repository) {
      throw new InternalServerErrorException('Neither ACCOUNT, nor REPOSITORY are defined');
    }

    const defaults: RequestParams = {
      owner: this.account,
      repo: this.repository,
    };
    if (this.token && this.token.length > 0) {
      defaults.headers = {
        authorization: `token ${ this.token }`,
      };
    }

    this.request = request.defaults(defaults as SafeAny);
  }

  async refreshCache() {
    this.lastUpdate = Date.now();

    let { data: releases } = await this.request('GET /repos/{owner}/{repo}/releases');
    releases = releases.filter(release => !release.draft && release.tag_name.startsWith(this.versionPrefix));

    const latestRelease = releases.find(release => !release.prerelease);
    if (latestRelease) {
      const infoFileAsset = latestRelease.assets.find(asset => asset.name === 'latest.yml');
      if (infoFileAsset) {
        const result = await this.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
          asset_id: infoFileAsset.id,
          headers: {
            Accept: 'application/octet-stream',
          },
        } as SafeAny) as unknown as { data: string };

        console.log(result.data);

        this.latestRelease = {
          version: latestRelease.tag_name.replace(this.versionPrefix, ''),
          prerelease: false,
          data: latestRelease,
          info: result.data,
        };
      }
    }

    const latestPrerelease = releases.find(release => release.prerelease);
    if (latestPrerelease) {
      const infoFileAsset = latestPrerelease.assets.find(asset => asset.name === 'beta.yml');
      if (infoFileAsset) {
        const result = await this.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
          asset_id: infoFileAsset.id,
          headers: {
            Accept: 'application/octet-stream',
          },
        } as SafeAny) as unknown as { data: string };

        console.log(result.data);

        this.latestPrerelease = {
          version: latestPrerelease.tag_name.replace(this.versionPrefix, ''),
          prerelease: true,
          data: latestPrerelease,
          info: result.data,
        };
      }
    }

    return { latestPrerelease: this.latestPrerelease, latestRelease: this.latestRelease };
  }

  isOutdated() {
    return Date.now() - this.lastUpdate > this.updateInterval;
  }

  async getRelease(prerelease = false) {
    if (prerelease || this.isOutdated()) {
      await this.refreshCache();
    }
    const release = prerelease ? this.latestPrerelease : this.latestRelease;
    if (release) {
      return release;
    }
    throw new NotFoundException('No release found');
  }
}
