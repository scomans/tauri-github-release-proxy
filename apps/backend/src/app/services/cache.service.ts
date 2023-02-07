import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { request } from '@octokit/request';
import type { RequestInterface } from '@octokit/types';
import type { Release } from '../types/release';
import type { SafeAny } from '../types/safe-any';
import { isNil } from '@nestjs/common/utils/shared.utils';
import { ensureEndsWith } from '../helpers/string.helper';

interface RequestParams {
  owner: string;
  repo: string;
  headers?: Record<string, string>;
}

const decoder = new TextDecoder('utf-8');

@Injectable()
export class CacheService {
  private latestRelease: Release;
  private readonly releases: Record<string, Release> = {};
  private readonly updateInterval: number;

  private readonly request: RequestInterface;
  private lastUpdate = 0;

  constructor() {
    this.updateInterval = (process.env.INTERVAL ? parseInt(process.env.INTERVAL, 10) : 15) * 60 * 1000;

    if (!process.env.ACCOUNT || !process.env.REPOSITORY) {
      throw new InternalServerErrorException('Neither ACCOUNT, nor REPOSITORY are defined');
    }

    const defaults: RequestParams = {
      owner: process.env.ACCOUNT,
      repo: process.env.REPOSITORY,
    };
    if (process.env.TOKEN && process.env.TOKEN.length > 0) {
      defaults.headers = {
        authorization: `token ${process.env.TOKEN}`,
      };
    }

    this.request = request.defaults(defaults as SafeAny);
  }

  private async refreshCache(version?: string) {
    const updateLatest = !version;
    if (updateLatest) {
      this.lastUpdate = Date.now();
    }

    let { data: releases } = await this.request('GET /repos/{owner}/{repo}/releases');
    releases = releases.filter(release => !release.draft);
    if (process.env.VERSION_PREFIX) {
      releases = releases.filter(release => release.tag_name.startsWith(process.env.VERSION_PREFIX));
    }

    const release = version
      ? releases.find(release => release.tag_name === process.env.VERSION_PREFIX + version)
      : releases.find(release => !release.prerelease);

    if (release) {
      version = version ?? release.tag_name.replace(process.env.VERSION_PREFIX, '');
      if (this.releases[version]) {
        return this.releases[version];
      }

      const platforms: Record<string, { signature: string; url: string }> = {};

      const signatureFiles = release.assets.filter(asset => asset.name.endsWith(`.sig`));
      for (const signatureFile of signatureFiles) {
        const filename = signatureFile.name.substring(0, signatureFile.name.length - 4);
        const platformFile = release.assets.find(asset => asset.name === filename)?.name;
        if (!platformFile) {
          continue;
        }
        const platform = this.getPlatform(filename);
        if (isNil(platform)) {
          continue;
        }

        // get signature content
        const result = (await this.request('GET /repos/{owner}/{repo}/releases/assets/{asset_id}', {
          asset_id: signatureFile.id,
          headers: {
            Accept: 'application/octet-stream',
          },
        } as SafeAny)) as unknown as { data: string | BufferSource };
        const signature = typeof result.data === 'string' ? result.data : decoder.decode(result.data);

        platforms[platform] = {
          signature,
          url: process.env.BASE_URL
            ? `${ensureEndsWith(process.env.BASE_URL, '/')}update/releases/${version}/${platformFile}`
            : signatureFile.browser_download_url,
        };
      }

      const releaseData = {
        version,
        prerelease: false,
        data: release,
        platforms,
      };
      if (updateLatest) {
        this.latestRelease = releaseData;
      }
      this.releases[version] = releaseData;
      return releaseData;
    }

    throw new NotFoundException('Release not found');
  }

  private getPlatform(fileName: string) {
    if (fileName.match(/_x64(_[a-z]{2}-[A-Z]{2})?\.msi\.zip(\.sig)?/gm)) {
      return 'windows-x86_64';
    }
    return undefined;
  }

  async getLatestRelease() {
    if (Date.now() - this.lastUpdate > this.updateInterval) {
      await this.refreshCache();
    }
    if (this.latestRelease) {
      return this.latestRelease;
    }
    throw new NotFoundException('No release found');
  }

  async getRelease(version: string) {
    if (this.releases[version]) {
      return this.releases[version];
    }
    return await this.refreshCache(version);
  }
}
