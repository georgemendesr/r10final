// Cliente HTTP centralizado para o frontend (cookies + refresh)
// Importante: usar caminho relativo '/api' em dev para aproveitar o proxy do Vite.
// Isso garante que os cookies HttpOnly fiquem sempre no MESMO host:porta do app (evitando 401 ao alternar localhost/192.168.x.x).
export const API_BASE_URL = (import.meta as any)?.env?.VITE_API_BASE_URL || '/api';

type Json = Record<string, any> | undefined;

function readAuthToken(): string | null {
	try {
		const raw = localStorage.getItem('r10_auth');
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		return parsed?.token || null;
	} catch (_) {
		return null;
	}
}

async function tryRefresh(): Promise<boolean> {
	try {
		const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
			method: 'POST',
			credentials: 'include'
		});
		if (!res.ok) return false;
		// Atualiza token retornado (fallback Authorization) se disponível
		try {
			const data = await res.json().catch(() => null);
			if (data && data.token) {
				setAuthToken(String(data.token));
			}
		} catch (_) {}
		return true;
	} catch (_) {
		return false;
	}
}

async function handle<T>(res: Response): Promise<T> {
	if (!res.ok) {
		const text = await res.text().catch(()=> '');
		const err: any = new Error(`HTTP ${res.status}`);
		err.status = res.status;
		err.body = text;
		throw err;
	}
	return res.json();
}

export async function get<T>(path: string): Promise<T> {
	const url = `${API_BASE_URL}${path}${path.includes('?') ? '&' : '?'}_ts=${Date.now()}`;
	const token = readAuthToken();
	let res = await fetch(url, { headers: { 'Cache-Control': 'no-cache', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }, credentials: 'include' });
	if (res.status === 401) {
		const ok = await tryRefresh();
		if (ok) {
			const nextToken = readAuthToken();
			res = await fetch(url, { headers: { 'Cache-Control': 'no-cache', ...(nextToken ? { 'Authorization': `Bearer ${nextToken}` } : {}) }, credentials: 'include' });
		}
	}
	return handle<T>(res);
}

export async function post<T>(path: string, body?: Json): Promise<T> {
	const url = `${API_BASE_URL}${path}`;
	const token = readAuthToken();
	let res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include'
	});
	if (res.status === 401) {
		const ok = await tryRefresh();
		if (ok) {
			const nextToken = readAuthToken();
			res = await fetch(url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', ...(nextToken ? { 'Authorization': `Bearer ${nextToken}` } : {}) },
				body: body ? JSON.stringify(body) : undefined,
				credentials: 'include'
			});
		}
	}
	return handle<T>(res);
}

export async function put<T>(path: string, body?: Json): Promise<T> {
	const url = `${API_BASE_URL}${path}`;
	const token = readAuthToken();
	let res = await fetch(url, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
		body: body ? JSON.stringify(body) : undefined,
		credentials: 'include'
	});
	if (res.status === 401) {
		const ok = await tryRefresh();
		if (ok) {
			const nextToken = readAuthToken();
			res = await fetch(url, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json', ...(nextToken ? { 'Authorization': `Bearer ${nextToken}` } : {}) },
				body: body ? JSON.stringify(body) : undefined,
				credentials: 'include'
			});
		}
	}
	return handle<T>(res);
}

export async function del<T>(path: string): Promise<T> {
	const url = `${API_BASE_URL}${path}`;
	const token = readAuthToken();
	let res = await fetch(url, { method: 'DELETE', credentials: 'include', headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) } });
	if (res.status === 401) {
		const ok = await tryRefresh();
		if (ok) {
			const nextToken = readAuthToken();
			res = await fetch(url, { method: 'DELETE', credentials: 'include', headers: { ...(nextToken ? { 'Authorization': `Bearer ${nextToken}` } : {}) } });
		}
	}
	return handle<T>(res);
}

export function setAuthToken(token: string | null) {
	try {
		const raw = localStorage.getItem('r10_auth');
		const cur = raw ? JSON.parse(raw) : {};
		const next = { ...cur, token, isAuthenticated: !!token };
		localStorage.setItem('r10_auth', JSON.stringify(next));
	} catch (_) {}
}

