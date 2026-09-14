import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DuitkuService {
  private readonly merchantCode: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.merchantCode = this.config.getOrThrow<string>('DUITKU_MERCHANT_CODE');

    this.apiKey = this.config.getOrThrow<string>('DUITKU_API_KEY');

    this.baseUrl = this.config.getOrThrow<string>('DUITKU_BASE_URL');
  }

  getMerchantCode() {
    return this.merchantCode;
  }

  getApiKey() {
    return this.apiKey;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  async createPayment(params: {
    merchantOrderId: string;
    amount: number;
    productDetails: string;
    paymentMethod: string;
    customerEmail: string;
    customerName: string;
  }) {
    /**
     * Implementasi request ke Duitku
     * diletakkan di sini.
     *
     * Jangan taruh HTTP request Duitku
     * di OrdersService.
     */

    // TODO:
    // POST ke endpoint Duitku sesuai
    // V2 / POP yang digunakan.

    return {
      merchantOrderId: params.merchantOrderId,
    };
  }
}
