import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { Redis } from 'ioredis';

import { PrismaService } from '../prisma/prisma.service.js';
import {
  ChangePasswordDto,
  DeviceDataDto,
  ForgotPasswordDto,
  JwtRefreshPayload,
  RequestMetaDto,
  ResetPasswordDto,
  UpdateUserDto,
  VerifyForgotPasswordPinDto,
} from './dto/auth.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { MailService } from '../resend/resend.service.js';

@Injectable()
export class AuthService {
  private readonly googleClient: OAuth2Client;
  private readonly redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
  ) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );

    this.googleClient = new OAuth2Client(
      this.configService.get<string>('GOOGLE_CLIENT_ID'),
    );
  }

  private async generateTokens(userId: string, sessionId: string) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, sessionId, type: 'access' },
        { secret: accessSecret, expiresIn: '15m' },
      ),
      this.jwt.signAsync(
        { sub: userId, sessionId, type: 'refresh' },
        { secret: refreshSecret, expiresIn: '30d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async checkRateLimit(
    key: string,
    limit: number,
    ttlSeconds: number,
  ): Promise<void> {
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, ttlSeconds);
    }
    if (current > limit) {
      throw new BadRequestException(
        'Terlalu banyak permintaan. Silakan coba lagi nanti.',
      );
    }
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Email atau nomor telepon sudah digunakan');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const pin = crypto.randomInt(100000, 999999).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    let user;

    try {
      user = await this.prisma.user.create({
        data: {
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          status: 'PENDING_VERIFICATION',
        },
      });

      await Promise.all([
        this.redis.set(`verify-pin:${user.id}`, hashedPin, 'EX', 300),
        this.redis.set(`verify-pin-attempt:${user.id}`, '0', 'EX', 300),
      ]);

      await this.mailService.sendEmail(
        user.email,
        'Verify Your Account',
        `
        <html>
          <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">
            <div style="max-width:500px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
              <h2>Email Verification</h2>
              <p>Hello <b>${user.fullName}</b>,</p>
              <p>Use the following verification code to activate your account:</p>
              <div style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;margin:20px 0;">
                ${pin}
              </div>
              <p style="color:#777;font-size:13px;">This code will expire in <b>5 minutes</b>.</p>
            </div>
          </body>
        </html>
        `,
      );

      return {
        message: 'Verification code sent to email',
        data: {
          userId: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      if (user?.id) {
        await Promise.allSettled([
          this.prisma.user.delete({ where: { id: user.id } }),
          this.redis.del(`verify-pin:${user.id}`),
          this.redis.del(`verify-pin-attempt:${user.id}`),
        ]);
      }
      throw new InternalServerErrorException(
        'Registration failed. Please try again.',
      );
    }
  }

  async verifyPinEmail(userId: string, pin: string) {
    const storedHash = await this.redis.get(`verify-pin:${userId}`);
    if (!storedHash) {
      throw new BadRequestException(
        'Kode verifikasi telah kadaluwarsa atau tidak valid',
      );
    }

    const attemptsKey = `verify-pin-attempt:${userId}`;
    const attempts = parseInt((await this.redis.get(attemptsKey)) || '0', 10);

    if (attempts >= 5) {
      throw new BadRequestException(
        'Terlalu banyak percobaan salah. Silakan minta kode baru.',
      );
    }

    const isValid = await bcrypt.compare(pin, storedHash);
    if (!isValid) {
      await this.redis.set(attemptsKey, String(attempts + 1), 'EX', 300);
      throw new BadRequestException('Kode verifikasi salah');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      },
    });

    await Promise.all([
      this.redis.del(`verify-pin:${userId}`),
      this.redis.del(attemptsKey),
    ]);

    return {
      message: 'Account verified successfully',
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
      },
    };
  }

  async login(
    dto: LoginDto,
    deviceData?: DeviceDataDto,
    meta?: RequestMetaDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Email atau password salah');
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Akun tidak dapat digunakan');
    }

    const isValidPassword = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '',
        deviceId: deviceData?.deviceId,
        deviceName: deviceData?.deviceName,
        platform: deviceData?.platform,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        token: deviceData?.token,
        expoToken: deviceData?.expoToken,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      session.id,
    );
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    };
  }

  async googleLogin(
    idToken: string,
    deviceData?: DeviceDataDto,
    meta?: RequestMetaDto,
  ) {
    if (!idToken) {
      throw new BadRequestException('ID Token Google wajib diisi');
    }

    let payload;
    try {
      const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException(
        'Token Google tidak valid atau telah kadaluwarsa',
      );
    }

    if (!payload) {
      throw new UnauthorizedException('Payload token Google tidak ditemukan');
    }

    const { email, name, picture, sub: googleId } = payload;

    if (!email) {
      throw new BadRequestException(
        'Email tidak ditemukan dari akun Google ini',
      );
    }

    const user = await this.prisma.$transaction(async (tx) => {
      const oauthAccount = await tx.oAuthAccount.findUnique({
        where: {
          provider_providerAccountId: {
            provider: 'GOOGLE',
            providerAccountId: googleId,
          },
        },
        include: { user: true },
      });

      if (oauthAccount) {
        return oauthAccount.user;
      }

      let existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        existingUser = await tx.user.create({
          data: {
            email,
            fullName: name || 'Google User',
            avatarUrl: picture || null,
            status: 'ACTIVE',
            emailVerifiedAt: new Date(),
          },
        });
      }

      await tx.oAuthAccount.create({
        data: {
          userId: existingUser.id,
          provider: 'GOOGLE',
          providerAccountId: googleId,
        },
      });

      return existingUser;
    });

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      throw new UnauthorizedException('Akun tidak dapat digunakan');
    }

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '',
        deviceId: deviceData?.deviceId,
        deviceName: deviceData?.deviceName,
        platform: deviceData?.platform,
        ipAddress: meta?.ipAddress,
        userAgent: meta?.userAgent,
        token: deviceData?.token,
        expoToken: deviceData?.expoToken,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const tokens = await this.generateTokens(user.id, session.id);
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12);

    await this.prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash },
    });

    await this.redis.set(
      `user:${user.id}`,
      JSON.stringify({
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
      }),
      'EX',
      3600,
    );

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
      ...tokens,
    };
  }

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token tidak ditemukan');
    }

    let decoded: JwtRefreshPayload;
    try {
      const refreshSecret =
        this.configService.get<string>('JWT_REFRESH_SECRET');
      decoded = await this.jwt.verifyAsync<JwtRefreshPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException(
        'Refresh token tidak valid atau telah kadaluwarsa',
      );
    }

    if (!decoded?.sub || !decoded?.sessionId) {
      throw new UnauthorizedException('Payload refresh token tidak valid');
    }

    const session = await this.prisma.session.findUnique({
      where: { id: decoded.sessionId },
    });

    if (!session || session.userId !== decoded.sub) {
      throw new UnauthorizedException('Sesi login tidak ditemukan');
    }

    if (session.revokedAt) {
      throw new UnauthorizedException('Sesi login telah dicabut');
    }

    if (new Date(session.expiresAt) <= new Date()) {
      throw new UnauthorizedException('Sesi login telah kadaluwarsa');
    }

    const isValidToken = await bcrypt.compare(
      refreshToken,
      session.refreshTokenHash,
    );
    if (!isValidToken) {
      throw new UnauthorizedException('Refresh token tidak valid');
    }

    const tokens = await this.generateTokens(decoded.sub, session.id);
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 12);

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newRefreshTokenHash,
        lastUsedAt: new Date(),
      },
    });

    return tokens;
  }

  async resendVerification(email: string, ip: string) {
    const emailKey = `rate:resend:email:${email}`;
    const ipKey = `rate:resend:ip:${ip}`;

    await this.checkRateLimit(emailKey, 3, 600);
    await this.checkRateLimit(ipKey, 10, 600);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.status === 'ACTIVE' || user.emailVerifiedAt) {
      return {
        message:
          'If your email is not verified, a verification code has been sent.',
      };
    }

    const pin = crypto.randomInt(100000, 999999).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    await Promise.all([
      this.redis.set(`verify-pin:${user.id}`, hashedPin, 'EX', 300),
      this.redis.set(`verify-pin-attempt:${user.id}`, '0', 'EX', 300),
    ]);

    await this.mailService.sendEmail(
      user.email,
      'Verify Your Email - Resend Code',
      `
      <html>
        <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">
          <div style="max-width:500px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
            <h2>Email Verification</h2>
            <p>Hello <b>${user.fullName}</b>,</p>
            <p>Your new verification code is:</p>
            <div style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;margin:20px 0;">
              ${pin}
            </div>
            <p style="color:#777;font-size:13px;">This code will expire in <b>5 minutes</b>.</p>
          </div>
        </body>
      </html>
      `,
    );

    return {
      message: 'Verification code resent successfully',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto, ip: string) {
    const emailKey = `rate:forgot:email:${dto.email}`;
    const ipKey = `rate:forgot:ip:${ip}`;

    await this.checkRateLimit(emailKey, 3, 600);
    await this.checkRateLimit(ipKey, 10, 600);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return {
        message:
          'Jika email terdaftar, kode verifikasi reset password telah dikirim.',
      };
    }

    const pin = crypto.randomInt(100000, 999999).toString();
    const hashedPin = await bcrypt.hash(pin, 10);

    await Promise.all([
      this.redis.set(`forgot-pin:${user.id}`, hashedPin, 'EX', 300),
      this.redis.set(`forgot-pin-attempt:${user.id}`, '0', 'EX', 300),
    ]);

    await this.mailService.sendEmail(
      user.email,
      'Reset Your Password',
      `
      <html>
        <body style="font-family:Arial,sans-serif;background:#f4f6f8;padding:30px;">
          <div style="max-width:500px;margin:auto;background:#fff;padding:30px;border-radius:10px;">
            <h2>Reset Password Request</h2>
            <p>Hello <b>${user.fullName}</b>,</p>
            <p>Use the following code to reset your password:</p>
            <div style="font-size:28px;letter-spacing:6px;font-weight:bold;text-align:center;margin:20px 0;">
              ${pin}
            </div>
            <p style="color:#777;font-size:13px;">This code will expire in <b>5 minutes</b>.</p>
          </div>
        </body>
      </html>
      `,
    );

    return {
      message:
        'Jika email terdaftar, kode verifikasi reset password telah dikirim.',
    };
  }

  async verifyForgotPasswordPin(dto: VerifyForgotPasswordPinDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException(
        'Kode verifikasi salah atau telah kadaluwarsa',
      );
    }

    const storedHash = await this.redis.get(`forgot-pin:${user.id}`);
    if (!storedHash) {
      throw new BadRequestException(
        'Kode verifikasi telah kadaluwarsa atau tidak valid',
      );
    }

    const attemptsKey = `forgot-pin-attempt:${user.id}`;
    const attempts = parseInt((await this.redis.get(attemptsKey)) || '0', 10);

    if (attempts >= 5) {
      throw new BadRequestException(
        'Terlalu banyak percobaan salah. Silakan minta kode baru.',
      );
    }

    const isValid = await bcrypt.compare(dto.pin, storedHash);
    if (!isValid) {
      await this.redis.set(attemptsKey, String(attempts + 1), 'EX', 300);
      throw new BadRequestException('Kode verifikasi salah');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await this.redis.set(`reset-token:${resetToken}`, user.id, 'EX', 900);

    await Promise.all([
      this.redis.del(`forgot-pin:${user.id}`),
      this.redis.del(attemptsKey),
    ]);

    return {
      message: 'PIN verified successfully',
      resetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const userId = await this.redis.get(`reset-token:${dto.resetToken}`);
    if (!userId) {
      throw new BadRequestException(
        'Reset token tidak valid atau telah kadaluwarsa',
      );
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          status: 'ACTIVE',
        },
      });

      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.redis.del(`reset-token:${dto.resetToken}`);

    return {
      message:
        'Password successfully reset. Please log in with your new password.',
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.passwordHash) {
      throw new BadRequestException(
        'Password tidak dapat diubah untuk akun ini',
      );
    }

    const isValidPassword = await bcrypt.compare(
      dto.oldPassword,
      user.passwordHash,
    );
    if (!isValidPassword) {
      throw new BadRequestException('Password lama Anda salah');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return {
      message: 'Password successfully updated',
    };
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: {
          phone: dto.phone,
          NOT: { id: userId },
        },
      });

      if (existingPhone) {
        throw new ConflictException(
          'Nomor telepon sudah digunakan oleh akun lain',
        );
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.phone && { phone: dto.phone }),
        ...(dto.avatarUrl !== undefined && { avatarUrl: dto.avatarUrl }),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.redis.set(
      `user:${userId}`,
      JSON.stringify({
        fullName: updatedUser.fullName,
        avatarUrl: updatedUser.avatarUrl,
      }),
      'EX',
      3600,
    );

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          status: 'SUSPENDED',
        },
      });

      await tx.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    await this.redis.del(`user:${userId}`);

    return {
      message: 'User account has been deleted successfully',
    };
  }
}
