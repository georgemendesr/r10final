import { createHmac } from 'crypto';
import { putTmp } from '../memStore';

export function sign(id: string, secret: string): string {
  return createHmac('sha256', secret).update(id).digest('hex');
}

export function makeTempUrl({ buffer, ttlMin, origin, secret }: {
  buffer: Buffer;
  ttlMin: number;
  origin: string;
  secret: string;
}): string {
  const id = Math.random().toString(36).substring(2, 15);
  const sig = sign(id, secret);
  
  // Salva no store temporário
  putTmp(id, buffer, ttlMin);
  
  return `${origin}/api/social/tmp/${id}?sig=${sig}`;
} 