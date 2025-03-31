// src/viator-tag/dto/viator-tag.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ViatorTagDto {
  @ApiProperty({ example: 12026 })
  tagId: number;

  @ApiPropertyOptional({ type: [Number], example: [21725, 21913] })
  parentTagIds?: number[];

  @ApiProperty({ example: 'Helicopter Tours' })
  name: string;

  @ApiPropertyOptional({
    type: Object,
    example: { en: 'Helicopter Tours', fr: 'Tours en hélicoptère' },
  })
  allNamesByLocale?: Record<string, string>;
}
