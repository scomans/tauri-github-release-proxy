import { Module } from '@nestjs/common';
import { HttpClientModule } from '@nestjs/http-client';
import { AppController } from './controllers/app.controller';
import { UpdateController } from './controllers/update.controller';
import { CacheService } from './services/cache.service';

@Module({
  imports: [HttpClientModule.register()],
  controllers: [AppController, UpdateController],
  providers: [CacheService],
})
export class AppModule {}
