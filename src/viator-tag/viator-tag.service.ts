// src/viator-tag/viator-tag.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ViatorApiService } from '../viator-api/viator-api.service';
import { ViatorTagDto } from './dto/viator-tag.dto';
import {
  ViatorTagSchemaClass,
  ViatorTagSchemaDocument,
} from './viator-tag.schema';

@Injectable()
export class ViatorTagService {
  private readonly logger = new Logger(ViatorTagService.name);

  constructor(
    private readonly viatorApiService: ViatorApiService,
    @InjectModel(ViatorTagSchemaClass.name)
    private readonly tagModel: Model<ViatorTagSchemaDocument>,
  ) {}

  async fetchAllTags(): Promise<void> {
    try {
      this.logger.log('Fetching all tags from Viator API');

      let tags: any[] = []; // Added proper type annotation here
      try {
        const response = await this.viatorApiService.makeRequest<{
          tags?: any[]; // Made tags optional
        }>('/products/tags');

        this.logger.log(
          `Retrieved ${response?.tags?.length || 0} tags from Viator API`,
        );
        tags = response?.tags || [];
      } catch (apiError) {
        this.logger.error(
          `API error when fetching tags: ${apiError.message || apiError}`,
        );
        // Continue execution despite API error
      }

      // Process and save each tag
      let successCount = 0;
      let errorCount = 0;

      for (const tag of tags) {
        try {
          await this.saveTag(tag);
          successCount++;
        } catch (saveError) {
          errorCount++;
          this.logger.error(
            `Failed to save tag ${tag?.tagId}: ${
              saveError.message || saveError
            }`,
          );
          // Continue with next tag despite error
        }
      }

      this.logger.log(
        `Tags processed: ${successCount} saved, ${errorCount} failed`,
      );
    } catch (error) {
      this.logger.error(`Failed to fetch tags: ${error.message || error}`);
      // Don't rethrow - just log the error
    }
  }

  private async saveTag(tagData: any): Promise<void> {
    try {
      // Skip invalid tag data
      if (!tagData) {
        this.logger.warn('Skipping null tag data');
        return;
      }

      // Skip if no tag ID provided
      if (tagData.tagId === undefined || tagData.tagId === null) {
        this.logger.warn('Skipping tag with missing ID');
        return;
      }

      const existingTag = await this.tagModel.findOne({
        tagId: tagData.tagId,
      });

      if (existingTag) {
        // Update existing tag
        await this.tagModel.updateOne(
          { tagId: tagData.tagId },
          {
            $set: {
              parentTagIds: Array.isArray(tagData.parentTagIds)
                ? tagData.parentTagIds
                : [],
              allNamesByLocale: tagData.allNamesByLocale || {},
              lastRefreshed: new Date(),
              // Store raw data to prevent data loss
              additionalData: tagData, // Changed from rawData to additionalData
            },
          },
        );
      } else {
        // Create new tag
        const newTag = new this.tagModel({
          tagId: tagData.tagId,
          parentTagIds: Array.isArray(tagData.parentTagIds)
            ? tagData.parentTagIds
            : [],
          allNamesByLocale: tagData.allNamesByLocale || {},
          lastRefreshed: new Date(),
          // Store raw data to prevent data loss
          additionalData: tagData, // Changed from rawData to additionalData
        });

        await newTag.save({ validateBeforeSave: false }); // Skip validation
      }
    } catch (error) {
      this.logger.error(
        `Failed to save tag ${tagData?.tagId}: ${error.message || error}`,
      );
      // Don't rethrow - just log the error
    }
  }

  async findAll(): Promise<ViatorTagDto[]> {
    try {
      const tags = await this.tagModel.find().lean();
      return tags.map((tag) => this.transformToDto(tag));
    } catch (error) {
      this.logger.error(`Error finding all tags: ${error.message || error}`);
      return []; // Return empty array instead of throwing
    }
  }

  async findById(tagId: number): Promise<ViatorTagDto> {
    try {
      const tag = await this.tagModel.findOne({ tagId }).lean();

      if (!tag) {
        this.logger.warn(`Tag with ID ${tagId} not found`);

        // Return placeholder instead of throwing
        return {
          tagId: tagId,
          name: `Unknown Tag ${tagId}`,
          parentTagIds: [],
        } as ViatorTagDto;
      }

      return this.transformToDto(tag);
    } catch (error) {
      this.logger.error(`Error finding tag by ID: ${error.message || error}`);

      // Return placeholder instead of throwing
      return {
        tagId: tagId,
        name: `Error Finding Tag ${tagId}`,
        parentTagIds: [],
      } as ViatorTagDto;
    }
  }

  async findByParentId(parentId: number): Promise<ViatorTagDto[]> {
    try {
      const tags = await this.tagModel.find({ parentTagIds: parentId }).lean();
      return tags.map((tag) => this.transformToDto(tag));
    } catch (error) {
      this.logger.error(
        `Error finding tags by parent ID: ${error.message || error}`,
      );
      return []; // Return empty array instead of throwing
    }
  }

  private transformToDto(tag: any): ViatorTagDto {
    try {
      return {
        tagId: tag.tagId,
        parentTagIds: Array.isArray(tag.parentTagIds) ? tag.parentTagIds : [],
        name: this.getLocalizedTagName(tag.allNamesByLocale || {}),
        allNamesByLocale: tag.allNamesByLocale || {},
      };
    } catch (error) {
      this.logger.error(
        `Error transforming tag to DTO: ${error.message || error}`,
      );

      // Return minimal object instead of throwing
      return {
        tagId: tag.tagId || 0,
        name: 'Error Processing Tag',
        parentTagIds: [],
      };
    }
  }

  private getLocalizedTagName(
    allNamesByLocale: Record<string, string>,
    locale: string = 'en',
  ): string {
    try {
      // Try to find the exact locale match
      if (allNamesByLocale[locale]) {
        return allNamesByLocale[locale];
      }

      // Try to find a partial match (e.g., 'en' for 'en-US')
      const baseLocale = locale.split('-')[0];
      if (baseLocale !== locale && allNamesByLocale[baseLocale]) {
        return allNamesByLocale[baseLocale];
      }

      // Fall back to the first available name or empty string
      return (
        allNamesByLocale['en'] ||
        allNamesByLocale['en_UK'] ||
        allNamesByLocale['en_AU'] ||
        Object.values(allNamesByLocale)[0] ||
        'Unknown Tag'
      );
    } catch (error) {
      this.logger.error(
        `Error getting localized tag name: ${error.message || error}`,
      );
      return 'Error Processing Tag Name';
    }
  }
}
