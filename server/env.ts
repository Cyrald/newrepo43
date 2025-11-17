import { z } from 'zod';
import 'dotenv/config';
import { randomBytes } from 'crypto';

if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ SESSION_SECRET обязателен в production окружении');
    process.exit(1);
  }
  const generatedSecret = randomBytes(32).toString('hex');
  process.env.SESSION_SECRET = generatedSecret;
  console.log('⚠️  SESSION_SECRET автоматически сгенерирован для development. В production используйте постоянный ключ через переменные окружения.');
} else if (process.env.SESSION_SECRET.length < 32) {
  console.error('❌ SESSION_SECRET должен быть минимум 32 символа');
  process.exit(1);
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters long'),
  
  EMAIL_HOST: z.string().optional(),
  EMAIL_PORT: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  SITE_URL: z.string().url().optional(),
  
  YUKASSA_SHOP_ID: z.string().optional(),
  YUKASSA_SECRET_KEY: z.string().optional(),
  
  CDEK_CLIENT_ID: z.string().optional(),
  CDEK_CLIENT_SECRET: z.string().optional(),
  
  BOXBERRY_API_TOKEN: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

let env: Env;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export { env };
