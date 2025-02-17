import { IsString, IsPhoneNumber, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @IsPhoneNumber('KR')
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}

export class LoginDto {
  @IsPhoneNumber('KR')
  phoneNumber: string;

  @IsString()
  password: string;
}

export class RequestVerificationDto {
  @IsPhoneNumber('KR')
  phoneNumber: string;
}

export class VerifyPhoneDto {
  @IsPhoneNumber('KR')
  phoneNumber: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  verificationCode: string;
} 
