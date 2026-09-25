import type { Db } from 'mongodb';

export async function ensureIndexes(db: Db) {
  await Promise.all([
    ...['accounts', 'posts', 'photos', 'comments'].map(name => db.collection(name).createIndex({ id: 1 }, { unique: true })),
    db.collection('accounts').createIndex({ google_sub: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ token_hash: 1 }, { unique: true }),
    db.collection('sessions').createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
    db.collection('login_nonces').createIndex({ token_hash: 1 }, { unique: true }),
    db.collection('login_nonces').createIndex({ expires: 1 }, { expireAfterSeconds: 0 }),
    db.collection('posts').createIndex({ created: -1 }),
    db.collection('posts').createIndex({ photos: 1 }),
    db.collection('comments').createIndex({ created: -1 }),
    db.collection('votes').createIndex({ post_id: 1, user_id: 1, kind: 1 }, { unique: true }),
    db.collection('saves').createIndex({ post_id: 1, user_id: 1 }, { unique: true }),
    db.collection('saves').createIndex({ user_id: 1 }),
  ]);
}
