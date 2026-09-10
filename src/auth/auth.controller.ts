import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import {
  ChangePasswordDto,
  DeviceDataDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  UpdateUserDto,
  VerifyForgotPasswordPinDto,
} from './dto/auth.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body('userId') userId: string, @Body('pin') pin: string) {
    return this.authService.verifyPinEmail(userId, pin);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerification(@Body('email') email: string, @Ip() ip: string) {
    return this.authService.resendVerification(email, ip);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Body('deviceData') deviceData?: DeviceDataDto,
    @Req() req?: any,
  ) {
    const meta = {
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
    };
    return this.authService.login(dto, deviceData, meta);
  }

  @Post('google')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body('idToken') idToken: string,
    @Body('deviceData') deviceData?: DeviceDataDto,
    @Req() req?: any,
  ) {
    const meta = {
      ipAddress: req?.ip,
      userAgent: req?.headers['user-agent'],
    };
    return this.authService.googleLogin(idToken, deviceData, meta);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Ip() ip: string) {
    return this.authService.forgotPassword(dto, ip);
  }

  @Post('verify-forgot-password-pin')
  @HttpCode(HttpStatus.OK)
  async verifyForgotPasswordPin(@Body() dto: VerifyForgotPasswordPinDto) {
    return this.authService.verifyForgotPasswordPin(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser('userId') userId: string,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser('userId') userId: string) {
    return this.authService.getMe(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.authService.updateUser(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@CurrentUser('userId') userId: string) {
    return this.authService.deleteUser(userId);
  }
}
