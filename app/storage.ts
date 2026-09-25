import { getStore } from '@netlify/blobs';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

export function photoStore() {
  // Local development only. Production always uses durable Netlify Blobs.
  if (process.env.NODE_ENV === 'development' && !process.env.NETLIFY) {
    const root = path.resolve('.local', 'photos');
    const filename = (id: string) => {
      if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error('Invalid photo ID');
      return path.join(root, id);
    };
    return {
      async set(id: string, data: ArrayBuffer, _options?: unknown) {
        await mkdir(root, { recursive: true });
        await writeFile(filename(id), new Uint8Array(data));
      },
      async get(id: string, _options?: unknown): Promise<ArrayBuffer | null> {
        try {
          const data = await readFile(filename(id));
          return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
          throw error;
        }
      },
      async delete(id: string) { await unlink(filename(id)); },
    };
  }
  const context = process.env.CONTEXT;
  const suffix = context && context !== 'production' ? `-${process.env.DEPLOY_ID || 'local'}` : '';
  return getStore({ name: `beenthere-photos${suffix}`, consistency: 'strong' });
}
