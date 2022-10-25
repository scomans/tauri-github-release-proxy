import { HttpService } from '@nestjs/axios';
import { Controller, Get, Inject, NotFoundException, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { PROXY_CONFIG } from '../app.const';
import { CacheService } from '../services/cache.service';
import type { Release } from '../types/release';


@Controller('update')
export class UpdateController {

  constructor(
    private readonly cacheService: CacheService,
    private readonly httpService: HttpService,
    @Inject(PROXY_CONFIG) private readonly config,
  ) {
  }

  @Get('(:channel/)?*.yml')
  async latestPrerelease(
    @Param('channel') channel: string,
  ) {
    let release: Release;
    switch (channel?.toLowerCase()) {
      case 'alpha':
      case 'beta':
        release = await this.cacheService.getRelease(true);
        break;
      default:
        release = await this.cacheService.getRelease();
    }

    return release.info;
  }

  @Get('(:channel/)?(:file).(:ext)')
  async download(
    @Param('channel') channel: string,
    @Param('file') file: string,
    @Param('ext') ext: string,
    @Res() res: Response,
  ) {
    let release: Release;
    switch (channel?.toLowerCase()) {
      case 'alpha':
      case 'beta':
        release = await this.cacheService.getRelease(true);
        break;
      default:
        release = await this.cacheService.getRelease();
    }

    const headers: Record<string, string> = {
      Accept: 'application/octet-stream',
    };
    if (this.config.TOKEN && this.config.TOKEN.length > 0) {
      headers.Authorization = 'token ' + this.config.TOKEN;
    }

    const asset = release.data.assets.find(asset => asset.name.endsWith(`${ file }.${ ext }`));

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
