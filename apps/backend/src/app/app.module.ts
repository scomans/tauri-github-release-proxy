import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PROXY_CONFIG } from './app.const';
import { AppController } from './controllers/app.controller';
import { UpdateController } from './controllers/update.controller';
import { CacheService } from './services/cache.service';


@Module({
  imports: [
    HttpModule,
  ],
  controllers: [
    AppController,
    UpdateController,
  ],
  providers: [
    CacheService,
    {
      provide: PROXY_CONFIG,
      useValue: process.env,
    },
  ],
})
export class AppModule {
}
