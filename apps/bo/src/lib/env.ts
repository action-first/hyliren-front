export const env = {
  adminApiBaseUrl: process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL ?? 'http://localhost:3003/admin',
} as const;
