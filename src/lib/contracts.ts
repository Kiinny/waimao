export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface MoneySnapshot {
  amount: string;
  currency: string;
  exchangeRateToUsd: string;
  amountUsd: string;
}
