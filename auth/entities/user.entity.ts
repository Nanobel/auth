import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  phoneNumber: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop()
  lastLoginAt: Date;

  // 전화번호 인증 관련 필드
  @Prop()
  verificationCode?: string;

  @Prop()
  verificationExpires?: Date;

  // 리프레시 토큰
  @Prop()
  refreshToken?: string;
}

export const UserSchema = SchemaFactory.createForClass(User); 
