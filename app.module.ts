import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // 환경 변수 설정
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // MongoDB 연결
    MongooseModule.forRoot(process.env.MONGODB_URI),
    // 기능 모듈
    AuthModule,
  ],
})
export class AppModule {}
