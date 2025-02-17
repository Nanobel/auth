import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './entities/user.entity';
import { RegisterDto, LoginDto, RequestVerificationDto, VerifyPhoneDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  // SMS 인증 코드 생성
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // SMS 인증 코드 발송 (실제 구현은 SMS 서비스 연동 후)
  async sendVerificationCode(dto: RequestVerificationDto) {
    const verificationCode = this.generateVerificationCode();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 3); // 3분 유효

    await this.userModel.updateOne(
      { phoneNumber: dto.phoneNumber },
      { 
        verificationCode,
        verificationExpires: expires,
      },
      { upsert: true }
    );

    // TODO: 실제 SMS 발송 로직 구현
    console.log(`Verification code for ${dto.phoneNumber}: ${verificationCode}`);

    return { message: '인증 코드가 발송되었습니다.' };
  }

  // SMS 인증 코드 확인
  async verifyPhone(dto: VerifyPhoneDto) {
    const user = await this.userModel.findOne({ 
      phoneNumber: dto.phoneNumber,
      verificationCode: dto.verificationCode,
      verificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new BadRequestException('유효하지 않은 인증 코드입니다.');
    }

    await this.userModel.updateOne(
      { _id: user._id },
      { 
        isVerified: true,
        verificationCode: null,
        verificationExpires: null
      }
    );

    return { message: '전화번호 인증이 완료되었습니다.' };
  }

  // 회원가입
  async register(dto: RegisterDto) {
    const existingUser = await this.userModel.findOne({ 
      phoneNumber: dto.phoneNumber,
      isVerified: true
    });

    if (existingUser) {
      throw new BadRequestException('이미 등록된 전화번호입니다.');
    }

    const user = await this.userModel.findOne({ 
      phoneNumber: dto.phoneNumber,
      isVerified: false
    });

    if (!user) {
      throw new BadRequestException('전화번호 인증이 필요합니다.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    
    await this.userModel.updateOne(
      { _id: user._id },
      { password: hashedPassword }
    );

    return { message: '회원가입이 완료되었습니다.' };
  }

  // 로그인
  async login(dto: LoginDto) {
    const user = await this.userModel.findOne({ 
      phoneNumber: dto.phoneNumber,
      isVerified: true
    });

    if (!user) {
      throw new UnauthorizedException('등록되지 않은 사용자입니다.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('비밀번호가 일치하지 않습니다.');
    }

    const payload = { sub: user._id, phoneNumber: user.phoneNumber };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '1h' }),
      this.jwtService.signAsync(payload, { expiresIn: '7d' })
    ]);

    await this.userModel.updateOne(
      { _id: user._id },
      { 
        refreshToken,
        lastLoginAt: new Date()
      }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  // 토큰 갱신
  async refreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);
      const user = await this.userModel.findOne({
        _id: payload.sub,
        refreshToken
      });

      if (!user) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      }

      const newPayload = { sub: user._id, phoneNumber: user.phoneNumber };
      const newAccessToken = await this.jwtService.signAsync(newPayload, { expiresIn: '1h' });

      return {
        accessToken: newAccessToken
      };
    } catch {
      throw new UnauthorizedException('유효하지 않은 토큰입니다.');
    }
  }
} 
