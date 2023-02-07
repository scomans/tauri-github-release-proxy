import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  status() {
    return { status: 'ok' };
  }

  @Get('check')
  check() {
    return { server: 'tauri-github-release-proxy' };
  }
}
