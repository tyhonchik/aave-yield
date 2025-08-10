import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const nextConfigs = compat.extends('next/core-web-vitals', 'next/typescript', 'prettier');

const eslintConfig = [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/build/**',
      '**/.vercel/**',
      '**/.turbo/**',
    ],
  },

  // Next.js recommended configs
  ...nextConfigs,
];

export default eslintConfig;
