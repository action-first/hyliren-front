export const env = {
  partnerApiBaseUrl: process.env.NEXT_PUBLIC_PARTNER_API_BASE_URL ?? 'http://localhost:3002/partner',
} as const;
