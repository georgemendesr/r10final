interface StoreItem {
  data: Buffer;
  expires: number;
}

const store = new Map<string, StoreItem>();

// Limpeza automática a cada minuto
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of store.entries()) {
    if (item.expires < now) {
      store.delete(key);
    }
  }
}, 60000);

export function putTmp(id: string, buffer: Buffer, ttlMin: number): void {
  const expires = Date.now() + (ttlMin * 60 * 1000);
  store.set(id, { data: buffer, expires });
}

export function getTmp(id: string): Buffer | null {
  const item = store.get(id);
  if (!item) return null;
  
  if (item.expires < Date.now()) {
    store.delete(id);
    return null;
  }
  
  return item.data;
} 