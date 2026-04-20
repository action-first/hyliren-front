export const env = {
  customerApiBaseUrl: process.env.NEXT_PUBLIC_CUSTOMER_API_BASE_URL ?? 'http://localhost:3001/customer',
} as const;
