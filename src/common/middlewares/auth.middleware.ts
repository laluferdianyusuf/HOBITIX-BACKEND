import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      token?: string;
    }
  }
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private redis: Redis;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.redis = new Redis(
      this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379',
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException({
        status: false,
        message: 'Unauthorized: Missing token',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret =
        this.configService.get<string>('JWT_ACCESS_SECRET') || 'secretKey';
      const decoded = jwt.verify(token, secret) as { sub: string };

      const blacklisted = await this.redis.get(`blacklist:${token}`);
      if (blacklisted) {
        throw new UnauthorizedException({
          status: false,
          message: 'Token revoked',
        });
      }

      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new UnauthorizedException({
          status: false,
          message: 'User not found',
        });
      }

      req.user = user;
      req.token = token;

      next();
    } catch (err: any) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }

      const isExpired = err.name === 'TokenExpiredError';
      throw new UnauthorizedException({
        status: false,
        message: isExpired ? 'Token expired' : 'Invalid token',
        isExpired,
      });
    }
  }
}
