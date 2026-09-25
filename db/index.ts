import { MongoClient, type Db } from 'mongodb';
import { ensureIndexes } from './indexes';

let connection: Promise<Db> | undefined;
export function database(): Promise<Db> {
  if (!connection) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not configured.');
    const client = new MongoClient(uri, { maxPoolSize: 5, minPoolSize: 0, serverSelectionTimeoutMS: 10000 });
    connection = (async () => {
      try {
        await client.connect();
        // An explicit app database keeps other projects in the same cluster separate.
        const db = client.db(process.env.MONGODB_DB_NAME || 'beenthere');
        await ensureIndexes(db);
        return db;
      } catch (error) {
        connection = undefined;
        await client.close();
        throw error;
      }
    })();
  }
  return connection;
}
