import { HttpService } from '@nestjs/axios';
import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { CacheService } from '../services/cache.service';
import * as process from 'process';

@Controller('update')
export class UpdateController {
  constructor(private readonly cacheService: CacheService, private readonly httpService: HttpService) {}

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

    const asset = release.data.assets.find(asset => asset.name === filename);
    if (!asset) {
      throw new NotFoundException('File not found!');
    }

    const stream = await lastValueFrom(
      this.httpService.get(asset.url, {
        headers,
        responseType: 'stream',
      }),
    );
    res.setHeader('Content-Length', stream.headers['content-length']);
    res.setHeader('Content-Type', stream.headers['content-type']);

    return stream.data.pipe(res);
  }
}
