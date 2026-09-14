export interface CreatePaymentParams {
  orderId: string;
  orderNumber: string;
  amount: number;
  currency: string;
}

export interface CreatePaymentResult {
  providerReference: string;
  paymentUrl?: string;
  paymentMethod?: string;
  expiresAt?: Date;
}

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
}
