import { createHash } from 'crypto';

export class DuitkuSignature {
  static generateCallbackSignature(
    merchantCode: string,
    amount: string,
    merchantOrderId: string,
    merchantKey: string,
  ): string {
    const value = merchantCode + amount + merchantOrderId + merchantKey;

    return createHash('md5').update(value).digest('hex');
  }

  static verifyCallbackSignature(
    merchantCode: string,
    amount: string,
    merchantOrderId: string,
    merchantKey: string,
    receivedSignature: string,
  ): boolean {
    const expected = this.generateCallbackSignature(
      merchantCode,
      amount,
      merchantOrderId,
      merchantKey,
    );

    return expected.toLowerCase() === receivedSignature.toLowerCase();
  }
}
