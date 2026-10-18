import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useEcho } from '@laravel/echo-react';
import { Bell, Check, ImagePlus, LoaderCircle, MessageSquarePlus, Search, Send, UserRound, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

type User = { id: number; name: string };
type Workspace = { id: number; name: string; slug: string };
type Member = { id: number; name: string; email: string; role: string };
type Conversation = { user: { id: number; name: string }; last_message: { body: string; created_at: string; from_me: boolean }; unread_count: number };
type ThreadMessage = { id: number; body: string; created_at: string; from_me: boolean; image_url: string | null; image_name: string | null; sender: { id: number; name: string } };
type InboxItem = { id: string; data: { title?: string; message?: string }; read_at: string | null; created_at: string };

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const token = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.split('=')[1];
    const isFormData = options.body instanceof FormData;
    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token ? { 'X-XSRF-TOKEN': decodeURIComponent(token) } : {}),
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        throw await response.json().catch(() => ({ message: 'Something went wrong.' }));
    }

    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

async function csrf(): Promise<void> {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
}

const initials = (name: string): string => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

export function InboxView({ user, workspace }: { user: User; workspace: Workspace }) {
    const [tab, setTab] = useState<'messages' | 'notifications'>('messages');

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [search, setSearch] = useState('');
    const [active, setActive] = useState<Member | null>(null);
    const [thread, setThread] = useState<ThreadMessage[]>([]);
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);
    const [loadingThread, setLoadingThread] = useState(false);
    const [error, setError] = useState('');

    const [items, setItems] = useState<InboxItem[] | null>(null);
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    async function loadConversations(): Promise<void> {
        const { data } = await request<{ data: Conversation[] }>(`/api/v1/workspaces/${workspace.id}/messages`);
        setConversations(data);
    }

    async function loadThread(member: Member): Promise<void> {
        setLoadingThread(true);
        try {
            const { data } = await request<{ data: ThreadMessage[] }>(`/api/v1/workspaces/${workspace.id}/messages/${member.id}`);
            setThread(data);
            void loadConversations();
        } finally {
            setLoadingThread(false);
        }
    }

    async function loadNotifications(): Promise<void> {
        const { data } = await request<{ data: InboxItem[] }>('/api/v1/notifications');
        setItems(data);
    }

    useEffect(() => {
        void loadConversations();
    }, [workspace.id]);

    useEffect(() => {
        if (tab === 'notifications' && items === null) {
            void loadNotifications();
        }
    }, [tab]);

    useEffect(() => {
        const handle = setTimeout(() => {
            const query = search.trim();
            if (query === '') {
                setMembers([]);
                return;
            }
            request<{ data: Member[] }>(`/api/v1/workspaces/${workspace.id}/members?search=${encodeURIComponent(query)}`)
                .then(({ data }) => setMembers(data.filter((member) => member.id !== user.id)))
                .catch(() => setMembers([]));
        }, 200);

        return () => clearTimeout(handle);
    }, [search, workspace.id]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [thread]);

    useEcho<{ sender_id: number; workspace_id: number }>(`App.Models.User.${user.id}`, '.message.sent', (event) => {
        if (event.workspace_id !== workspace.id) {
            return;
        }
        void loadConversations();
        if (active && event.sender_id === active.id) {
            void loadThread(active);
        }
    }, [user.id, workspace.id, active?.id]);

    async function openConversation(member: Member): Promise<void> {
        setError('');
        setActive(member);
        setSearch('');
        setMembers([]);
        await loadThread(member);
    }

    function pickImage(event: React.ChangeEvent<HTMLInputElement>): void {
        const file = event.target.files?.[0] ?? null;
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setImage(file);
        setPreview(file ? URL.createObjectURL(file) : null);
    }

    function clearImage(): void {
        if (preview) {
            URL.revokeObjectURL(preview);
        }
        setImage(null);
        setPreview(null);
        if (fileRef.current) {
            fileRef.current.value = '';
        }
    }

    async function send(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        const text = body.trim();
        if (!active || sending || (text === '' && !image)) {
            return;
        }
        setSending(true);
        setError('');
        try {
            await csrf();
            let payload: BodyInit;
            if (image) {
                const form = new FormData();
                form.append('recipient_id', String(active.id));
                if (text !== '') {
                    form.append('body', text);
                }
                form.append('image', image);
                payload = form;
            } else {
                payload = JSON.stringify({ recipient_id: active.id, body: text });
            }

            const { data } = await request<{ data: ThreadMessage }>(`/api/v1/workspaces/${workspace.id}/messages`, {
                method: 'POST',
                body: payload,
            });
            setThread((current) => [...current, data]);
            setBody('');
            clearImage();
            await loadConversations();
        } catch {
            setError('Your message could not be sent. Please try again.');
        } finally {
            setSending(false);
        }
    }

    async function markRead(id: string): Promise<void> {
        await csrf();
        await request(`/api/v1/notifications/${id}/read`, { method: 'POST' });
        await loadNotifications();
    }

    const selfConversation = conversations.find((conversation) => conversation.user.id === user.id);
    const otherConversations = conversations.filter((conversation) => conversation.user.id !== user.id);
    const isSelfThread = active?.id === user.id;

    return (
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-bold text-brand-600 dark:text-brand-300">Updates and conversations</p>
                    <h1 className="text-3xl font-semibold tracking-[-.045em]">Inbox</h1>
                </div>
                <div className="flex rounded-lg bg-[#eef1ea] p-1 dark:bg-[#222a25]">
                    <TabButton active={tab === 'messages'} onClick={() => setTab('messages')} icon={<MessageSquarePlus size={15} />} label="Messages" />
                    <TabButton active={tab === 'notifications'} onClick={() => setTab('notifications')} icon={<Bell size={15} />} label="Notifications" />
                </div>
            </div>

            {tab === 'messages' ? (
                <Card className="grid min-h-[70vh] overflow-hidden md:grid-cols-[320px_minmax(0,1fr)]">
                    <aside className="flex min-h-0 flex-col border-b border-[#dce3dc] md:border-b-0 md:border-r dark:border-[#303a33]">
                        <div className="relative border-b border-[#dce3dc] p-3 dark:border-[#303a33]">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-[#7a857e]" size={16} />
                            <Input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search member"
                                className="h-10 bg-[#f7f8f4] pl-9 dark:bg-[#222a25]"
                            />
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto p-2">
                            {search.trim() !== '' ? (
                                <div className="grid gap-1 stagger-children">
                                    <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b]">Members</p>
                                    {members.map((member) => (
                                        <button
                                            key={member.id}
                                            onClick={() => void openConversation(member)}
                                            className="flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm hover:bg-[#eef1ea] dark:hover:bg-[#222a25]"
                                        >
                                            <Avatar name={member.name} />
                                            <span className="min-w-0 flex-1">
                                                <strong className="block truncate">{member.name}</strong>
                                                <small className="block truncate text-xs text-[#68736c] dark:text-[#a8b1ab]">{member.email}</small>
                                            </span>
                                        </button>
                                    ))}
                                    {members.length === 0 && (
                                        <p className="px-3 py-6 text-center text-sm text-[#68736c] dark:text-[#a8b1ab]">
                                            No other members match "{search.trim()}". Add teammates from the People page to message them.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid gap-1 stagger-children">
                                    <button
                                        onClick={() => void openConversation({ id: user.id, name: `${user.name} (You)`, email: 'Personal notes', role: '' })}
                                        className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm ${isSelfThread ? 'bg-brand-50 dark:bg-brand-900' : 'hover:bg-[#eef1ea] dark:hover:bg-[#222a25]'}`}
                                    >
                                        <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-brand-400 text-brand-600 dark:text-brand-300">
                                            <UserRound size={16} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <strong className="block truncate">You</strong>
                                            <small className="block truncate text-xs text-[#68736c] dark:text-[#a8b1ab]">
                                                {selfConversation ? selfConversation.last_message.body : 'Notes to self'}
                                            </small>
                                        </span>
                                        <span className="rounded-full bg-[#eef1ea] px-2 py-0.5 text-[10px] font-bold text-[#68736c] dark:bg-[#222a25] dark:text-[#a8b1ab]">Note</span>
                                    </button>

                                    <p className="mt-2 px-2 py-1 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b]">Conversations</p>
                                    {otherConversations.map((conversation) => (
                                        <button
                                            key={conversation.user.id}
                                            onClick={() => void openConversation({ id: conversation.user.id, name: conversation.user.name, email: '', role: '' })}
                                            className={`flex items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm ${active?.id === conversation.user.id ? 'bg-brand-50 dark:bg-brand-900' : 'hover:bg-[#eef1ea] dark:hover:bg-[#222a25]'}`}
                                        >
                                            <Avatar name={conversation.user.name} />
                                            <span className="min-w-0 flex-1">
                                                <strong className="block truncate">{conversation.user.name}</strong>
                                                <small className="block truncate text-xs text-[#68736c] dark:text-[#a8b1ab]">
                                                    {conversation.last_message.from_me ? 'You: ' : ''}{conversation.last_message.body}
                                                </small>
                                            </span>
                                            {conversation.unread_count > 0 && (
                                                <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">{conversation.unread_count}</span>
                                            )}
                                        </button>
                                    ))}
                                    {otherConversations.length === 0 && (
                                        <p className="px-3 py-6 text-center text-sm text-[#68736c] dark:text-[#a8b1ab]">
                                            Search for a member above to start a conversation.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </aside>

                    <section className="flex min-h-[60vh] flex-col md:min-h-0">
                        {active ? (
                            <>
                                <header className="flex items-center gap-3 border-b border-[#dce3dc] px-5 py-3 dark:border-[#303a33]">
                                    <Avatar name={active.name} />
                                    <div>
                                        <strong className="block text-sm">{active.name}</strong>
                                        <small className="text-xs text-[#68736c] dark:text-[#a8b1ab]">{active.email || 'Workspace member'}</small>
                                    </div>
                                </header>
                                <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#f7f8f4] p-5 dark:bg-[#111512]">
                                    {loadingThread && <div className="grid place-items-center py-6"><LoaderCircle className="animate-spin text-brand-600" size={20} /></div>}
                                    {!loadingThread && thread.length === 0 && (
                                        <p className="py-10 text-center text-sm text-[#68736c] dark:text-[#a8b1ab]">No messages yet. Say hello to {active.name.split(' ')[0]}.</p>
                                    )}
                                    {thread.map((message, index) => (
                                        <div key={message.id} className={`flex ${message.from_me ? 'justify-end' : 'justify-start'}${index === thread.length - 1 ? ' animate-rise-in' : ''}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${message.from_me ? 'bg-brand-600 text-white' : 'border border-[#dce3dc] bg-white dark:border-[#303a33] dark:bg-[#181d1a]'}`}>
                                                {message.image_url && (
                                                    <a href={message.image_url} target="_blank" rel="noreferrer" className="mb-2 block">
                                                        <img src={message.image_url} alt={message.image_name ?? 'Shared image'} className="max-h-64 w-full rounded-lg object-cover" />
                                                    </a>
                                                )}
                                                {message.body !== '' && <p className="whitespace-pre-wrap break-words">{message.body}</p>}
                                                <small className={`mt-1 block text-[10px] ${message.from_me ? 'text-white/70' : 'text-[#78827b]'}`}>
                                                    {new Date(message.created_at).toLocaleString()}
                                                </small>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={send} className="border-t border-[#dce3dc] p-3 dark:border-[#303a33]">
                                    {error && <p className="mb-2 text-xs font-semibold text-[#b64545]">{error}</p>}
                                    {preview && (
                                        <div className="relative mb-2 w-fit">
                                            <img src={preview} alt="Selected image preview" className="max-h-32 rounded-lg border border-[#dce3dc] dark:border-[#303a33]" />
                                            <button type="button" onClick={clearImage} aria-label="Remove image" className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-[#b64545] text-white">
                                                <X size={13} />
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex items-end gap-2">
                                        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            aria-label="Attach image"
                                            className="grid size-11 shrink-0 place-items-center rounded-xl border border-[#dce3dc] text-[#68736c] hover:bg-[#eef1ea] dark:border-[#303a33] dark:hover:bg-[#222a25]"
                                        >
                                            <ImagePlus size={18} />
                                        </button>
                                        <textarea
                                            value={body}
                                            onChange={(event) => setBody(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' && !event.shiftKey) {
                                                    event.preventDefault();
                                                    event.currentTarget.form?.requestSubmit();
                                                }
                                            }}
                                            rows={2}
                                            placeholder={isSelfThread ? 'Write a note to yourself' : `Message ${active.name}`}
                                            className="min-h-[44px] w-full resize-none rounded-xl border border-[#dce3dc] bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 dark:border-[#303a33] dark:bg-[#181d1a]"
                                        />
                                        <Button type="submit" size="icon" aria-label={isSelfThread ? 'Save note' : 'Send message'} disabled={sending || (body.trim() === '' && !image)}>
                                            {sending ? <LoaderCircle className="animate-spin" size={16} /> : <Send size={16} />}
                                        </Button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="grid flex-1 place-items-center p-8 text-center">
                                <div>
                                    <UserRound className="mx-auto text-[#a2a0a2]" size={40} />
                                    <h2 className="mt-4 text-lg font-semibold">Select a conversation</h2>
                                    <p className="mt-1 text-sm text-[#68736c] dark:text-[#a8b1ab]">Search for a member to start messaging.</p>
                                </div>
                            </div>
                        )}
                    </section>
                </Card>
            ) : (
                <Card className="overflow-hidden">
                    {items === null ? (
                        <LoaderCircle className="m-8 animate-spin text-brand-600" />
                    ) : (
                        <div className="divide-y divide-[#dce3dc] stagger-children dark:divide-[#303a33]">
                            {items.map((item) => (
                                <article key={item.id} className={`flex items-start gap-3 p-5 ${item.read_at ? 'opacity-60' : ''}`}>
                                    <Bell size={17} className="mt-0.5 text-brand-600" />
                                    <div className="flex-1">
                                        <strong className="text-sm">{item.data.title ?? item.data.message ?? 'WeberFlow update'}</strong>
                                        <p className="mt-1 text-xs text-[#68736c]">{new Date(item.created_at).toLocaleString()}</p>
                                    </div>
                                    {!item.read_at && (
                                        <Button variant="ghost" size="sm" onClick={() => void markRead(item.id)}>
                                            <Check size={14} />Read
                                        </Button>
                                    )}
                                </article>
                            ))}
                            {items.length === 0 && <p className="p-10 text-center text-sm text-[#68736c]">Your inbox is clear.</p>}
                        </div>
                    )}
                </Card>
            )}
        </main>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${active ? 'bg-white text-brand-700 shadow-sm dark:bg-[#303a33] dark:text-brand-300' : 'text-[#68736c] dark:text-[#a8b1ab]'}`}
        >
            {icon}{label}
        </button>
    );
}

function Avatar({ name }: { name: string }) {
    return (
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">
            {initials(name)}
        </span>
    );
}
