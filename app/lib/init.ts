import { initDatabase } from './database/init';

export async function initializeApp() {
  await initDatabase();
} 