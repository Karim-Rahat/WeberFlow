import { useEffect, useState } from 'react';
import { Bell, Check, LoaderCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';

type InboxItem = { id: string; data: { title?: string; message?: string }; read_at: string | null; created_at: string };

async function call<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.split('=')[1];
    const response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}) }, ...options });
    return response.json() as Promise<T>;
}

export function InboxView() {
    const [items, setItems] = useState<InboxItem[] | null>(null);
    const load = () => call<{ data: InboxItem[] }>('/api/v1/notifications').then(({ data }) => setItems(data));
    useEffect(() => { load(); }, []);
    async function markRead(id: string) { await call(`/api/v1/notifications/${id}/read`, { method: 'POST' }); await load(); }
    return <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8"><div className="mb-7"><p className="text-sm font-bold text-brand-600 dark:text-brand-300">Updates that need attention</p><h1 className="text-3xl font-semibold tracking-[-.045em]">Inbox</h1></div><Card className="overflow-hidden">{items === null ? <LoaderCircle className="m-8 animate-spin text-brand-600" /> : <div className="divide-y divide-[#dce3dc] dark:divide-[#303a33]">{items.map((item) => <article key={item.id} className={`flex items-start gap-3 p-5 ${item.read_at ? 'opacity-60' : ''}`}><Bell size={17} className="mt-0.5 text-brand-600" /><div className="flex-1"><strong className="text-sm">{item.data.title ?? item.data.message ?? 'WeberFlow update'}</strong><p className="mt-1 text-xs text-[#68736c]">{new Date(item.created_at).toLocaleString()}</p></div>{!item.read_at && <Button variant="ghost" size="sm" onClick={() => markRead(item.id)}><Check size={14} />Read</Button>}</article>)}{items.length === 0 && <p className="p-10 text-center text-sm text-[#68736c]">Your inbox is clear.</p>}</div>}</Card></main>;
}
