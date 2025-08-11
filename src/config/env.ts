import 'server-only';
import { z } from 'zod';

const EnvSchema = z.object({
  RPC_MAINNET: z.string().url({ message: 'RPC_MAINNET must be a valid URL' }),
  RPC_POLYGON: z.string().url({ message: 'RPC_POLYGON must be a valid URL' }),
  RPC_BASE: z.string().url({ message: 'RPC_BASE must be a valid URL' }),
  RPC_ARBITRUM: z.string().url({ message: 'RPC_ARBITRUM must be a valid URL' }),
  RPC_OPTIMISM: z.string().url({ message: 'RPC_OPTIMISM must be a valid URL' }),
});

export type Env = z.infer<typeof EnvSchema>;

export function getValidatedEnv(): Env {
  const parsed = EnvSchema.safeParse({
    RPC_MAINNET: process.env.RPC_MAINNET,
    RPC_POLYGON: process.env.RPC_POLYGON,
    RPC_BASE: process.env.RPC_BASE,
    RPC_ARBITRUM: process.env.RPC_ARBITRUM,
    RPC_OPTIMISM: process.env.RPC_OPTIMISM,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return parsed.data;
}
