import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, ValidateBy, ValidationOptions } from 'class-validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from '../../utils/transformers/lower-case.transformer';

function IsEmailOrUsername(validationOptions?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isEmailOrUsername',
      validator: {
        validate: (value: any) => {
          if (typeof value !== 'string') return false;
          // Check if it's an email (contains @ and valid email pattern)
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          // Check if it's a username (alphanumeric, underscores, dots, hyphens, 3-20 chars)
          const usernameRegex = /^[a-zA-Z0-9._-]{3,20}$/;
          return emailRegex.test(value) || usernameRegex.test(value);
        },
        defaultMessage: () => 'Login must be a valid email or username',
      },
    },
    validationOptions,
  );
}

export class AuthLoginDto {
  @ApiProperty({
    example: 'test1@example.com or johndoe',
    type: String,
    description: 'Email address or username',
  })
  @Transform(lowerCaseTransformer)
  @IsEmailOrUsername()
  @IsNotEmpty()
  login: string;

  @ApiProperty()
  @IsNotEmpty()
  password: string;
}
