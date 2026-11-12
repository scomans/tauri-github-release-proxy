import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { HttpClient } from '@nestjs/http-client';
import type { Response } from 'express';
import { CacheService } from '../services/cache.service';
import * as process from 'process';

@Controller('update')
export class UpdateController {
  constructor(private readonly cacheService: CacheService, private readonly httpClient: HttpClient) {}

  @Get('check')
  async latestRelease() {
    const release = await this.cacheService.getLatestRelease();

    return {
      version: release.version,
      notes: `${process.env.ACCOUNT}/${process.env.REPOSITORY} v${release.version}`,
      pub_date: release.data.created_at,
      platforms: release.platforms,
    };
  }

  @Get('releases/:version/:filename')
  async download(
    @Param('version') version: string,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const release = await this.cacheService.getRelease(version);

    const headers: Record<string, string> = {
      Accept: 'application/octet-stream',
    };
    if (process.env.TOKEN && process.env.TOKEN.length > 0) {
      headers.Authorization = 'token ' + process.env.TOKEN;
    }

    // For `latest`, the version inside the filename isn't known by the client,
    // so `latest` may be used as a placeholder (e.g. `Landing_latest_x64_de-DE.msi`).
    const candidates =
      version === 'latest' ? [filename, filename.split('latest').join(release.version)] : [filename];
    const asset = release.data.assets.find(asset => candidates.includes(asset.name));
    if (!asset) {
      throw new NotFoundException('File not found!');
    }

    const stream = await this.httpClient.get(asset.url, {
      headers,
      responseType: 'stream',
    });
    const contentLength = stream.headers.get('content-length');
    const contentType = stream.headers.get('content-type');
    if (contentLength != null) {
      res.setHeader('Content-Length', String(contentLength));
    }
    if (contentType != null) {
      res.setHeader('Content-Type', String(contentType));
    }

    return stream.data.pipe(res);
  }
}
