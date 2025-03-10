// lib/webauthnConfig.ts
export const rpName = process.env.COMPANY_NAME;
export const rpID = process.env.DOMAIN; // The domain of your application
export const origin = `https://${rpID}`;
