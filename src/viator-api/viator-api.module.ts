// src/viator-api/viator-api.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ViatorApiService } from './viator-api.service';

@Module({
  imports: [ConfigModule],
  providers: [ViatorApiService],
  exports: [ViatorApiService],
})
export class ViatorApiModule {}
