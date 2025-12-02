import { z } from 'zod';

/**
 * Environment variable validation schema
 * 
 * This ensures all required environment variables are present and valid
 * at application startup, preventing runtime errors from missing config.
 */

const envSchema = z.object({
  // Database - REQUIRED
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .url('DATABASE_URL must be a valid URL')
    .refine((url) => url.startsWith('postgresql://'), {
      message: 'DATABASE_URL must be a PostgreSQL connection string',
    }),

  // Server - optional with default
  PORT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 3001))
    .pipe(z.number().int().min(1).max(65535)),

  // Environment - optional with default
  NODE_ENV: z
    .enum(['development', 'production', 'test'], {
      errorMap: () => ({ message: 'NODE_ENV must be development, production, or test' }),
    })
    .optional()
    .transform((val) => val || 'development'),

  // File uploads - optional with default
  UPLOAD_DIR: z
    .string()
    .min(1, 'UPLOAD_DIR cannot be empty')
    .optional()
    .transform((val) => val || './uploads'),

  // CORS - optional with default
  FRONTEND_URL: z
    .string()
    .url('FRONTEND_URL must be a valid URL')
    .optional()
    .transform((val) => val || 'http://localhost:3000'),
});

/**
 * Validated environment variables
 * 
 * Access this instead of process.env directly to ensure type safety
 * and that all required variables are present.
 */
export type Env = z.infer<typeof envSchema>;

/**
 * Validates and returns environment variables
 * 
 * Throws an error if validation fails, preventing the app from starting
 * with invalid or missing configuration.
 */
function validateEnv(): Env {
  // Load environment variables first
  require('dotenv').config();

  // Prepare environment with defaults for optional values
  const envInput = {
    DATABASE_URL: process.env.DATABASE_URL,
    PORT: process.env.PORT || '3001',
    NODE_ENV: process.env.NODE_ENV || 'development',
    UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  };

  try {
    const validated = envSchema.parse(envInput);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Environment variables validated successfully');
    }
    
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => {
        const path = err.path.join('.');
        const message = err.message;
        return `  - ${path}: ${message}`;
      }).join('\n');

      console.error('❌ Environment variable validation failed:\n');
      console.error(missingVars);
      console.error('\n💡 Make sure all required environment variables are set in your .env file.');
      console.error('   See .env.example for a template.\n');
      
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
