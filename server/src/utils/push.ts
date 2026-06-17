import https from 'https';
import { pool } from '../config/db';

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function sendPushToUser(userId: string, msg: PushMessage): Promise<void> {
  const { rows } = await pool.query<{ token: string }>(
    'SELECT token FROM push_tokens WHERE user_id = $1',
    [userId]
  );
  if (!rows.length) return;
  const messages = rows.map(({ token }) => ({
    to: token,
    sound: 'default',
    title: msg.title,
    body: msg.body,
    data: msg.data ?? {},
  }));
  const payload = JSON.stringify(messages);
  await new Promise<void>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'exp.host',
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'Accept-Encoding': 'gzip, deflate',
        },
      },
      (res) => {
        res.resume();
        res.on('end', resolve);
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}
