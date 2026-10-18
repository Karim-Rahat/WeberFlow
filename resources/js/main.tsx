import { StrictMode, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { configureEcho } from '@laravel/echo-react';
import {
    Bell,
    CalendarRange,
    CheckCircle2,
    ChevronDown,
    FolderKanban,
    Home,
    Inbox,
    LoaderCircle,
    LogOut,
    Menu,
    Moon,
    Plus,
    Search,
    Settings,
    ShieldCheck,
    Sun,
    Users,
    X,
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { AsanaPlanningView } from './views/asana-planning-view';
import { InboxView } from './views/inbox-view';
import { AdminView } from './views/admin-view';
import { PeopleView } from './views/people-view';
import '../css/app.css';

configureEcho({ broadcaster: 'reverb' });

type Workspace = { id: number; name: string; slug: string; timezone: string; locale: string; role: string };
type Preferences = {
    assignments_email: boolean;
    mentions_email: boolean;
    comments_email: boolean;
    deadlines_email: boolean;
    daily_digest_email: boolean;
    in_app_notifications: boolean;
};
type User = {
    id: number;
    name: string;
    email: string;
    email_verified: boolean;
    timezone: string;
    locale: string;
    current_workspace: Workspace;
    workspaces: Workspace[];
    notification_preferences: Preferences;
    is_platform_admin: boolean;
    status: string;
};
type ApiError = { message?: string; errors?: Record<string, string[]> };
type AuthMode = 'login' | 'register' | 'forgot' | 'reset';
type ProjectRoute = { workspaceSlug: string; projectId: number; taskId: number | null };

function currentProjectRoute(): ProjectRoute | null {
    const match = window.location.pathname.match(/^\/app\/([^/]+)\/(\d+)\/?$/);

    if (!match) {
        return null;
    }

    const taskId = Number(new URLSearchParams(window.location.search).get('task'));

    return {
        workspaceSlug: decodeURIComponent(match[1]),
        projectId: Number(match[2]),
        taskId: Number.isInteger(taskId) && taskId > 0 ? taskId : null,
    };
}

const initialPreferences: Preferences = {
    assignments_email: true,
    mentions_email: true,
    comments_email: true,
    deadlines_email: true,
    daily_digest_email: false,
    in_app_notifications: true,
};

async function csrf(): Promise<void> {
    await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
}

async function api<T>(url: string, options: RequestInit = {}): Promise<T> {
    const method = options.method?.toUpperCase() ?? 'GET';
    const csrfCookie = document.cookie
        .split('; ')
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='))
        ?.split('=')[1];

    const response = await fetch(url, {
        credentials: 'include',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(csrfCookie && method !== 'GET' ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfCookie) } : {}),
            ...options.headers,
        },
        ...options,
    });

    if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as ApiError;
        throw error;
    }

    return response.json() as Promise<T>;
}

function App() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api<{ data: User }>('/api/v1/me')
            .then(({ data }) => setUser(data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="grid min-h-screen place-items-center"><LoaderCircle className="animate-spin text-brand-600" /></div>;
    }

    return user ? <WorkspaceApp user={user} onUserChange={setUser} /> : <AuthScreen onAuthenticated={setUser} />;
}

function AuthScreen({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
    const resetMatch = window.location.pathname.match(/^\/app\/reset-password\/([^/]+)$/);
    const [mode, setMode] = useState<AuthMode>(resetMatch ? 'reset' : 'login');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setErrors({});
        setMessage('');
        const form = new FormData(event.currentTarget);
        const payload = Object.fromEntries(form.entries());

        try {
            await csrf();
            if (mode === 'forgot') {
                const response = await api<{ message: string }>('/api/v1/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) });
                setMessage(response.message);
                return;
            }
            if (mode === 'reset') {
                const response = await api<{ message: string }>('/api/v1/auth/reset-password', {
                    method: 'POST',
                    body: JSON.stringify({ ...payload, token: resetMatch?.[1], email: new URLSearchParams(window.location.search).get('email') }),
                });
                setMessage(response.message);
                setMode('login');
                return;
            }

            const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
            const response = await api<{ data: User }>(endpoint, { method: 'POST', body: JSON.stringify(payload) });
            onAuthenticated(response.data);
            window.history.replaceState({}, '', '/app');
        } catch (error) {
            const apiError = error as ApiError;
            setErrors(apiError.errors ?? { form: [apiError.message ?? 'Something went wrong.'] });
        } finally {
            setBusy(false);
        }
    }

    const title = mode === 'register' ? 'Create your workspace' : mode === 'forgot' ? 'Reset your password' : mode === 'reset' ? 'Choose a new password' : 'Welcome back';

    return (
        <main className="grid min-h-screen bg-[#f5f6f1] dark:bg-[#111512] lg:grid-cols-[1.05fr_.95fr]">
            <section className="hidden animate-fade-in overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
                <Brand inverse />
                <div className="max-w-xl">
                    <p className="mb-4 text-sm font-bold uppercase tracking-[.18em] text-brand-300">Work moves better together</p>
                    <h1 className="text-6xl font-semibold leading-[1.02] tracking-[-.06em]">Plan clearly.<br />Deliver calmly.</h1>
                    <p className="mt-7 max-w-lg text-lg text-white/70">WeberFlow gives your office one focused place for projects, ownership, collaboration, and delivery.</p>
                </div>
                <p className="text-sm text-white/50">Laravel · React · Secure workspace isolation</p>
            </section>

            <section className="flex min-h-screen items-center justify-center p-5 sm:p-10">
                <div className="w-full max-w-md animate-rise-in">
                    <div className="mb-10 lg:hidden"><Brand /></div>
                    <p className="mb-2 text-sm font-bold text-brand-600 dark:text-brand-300">{mode === 'register' ? 'Start your team' : 'WeberFlow account'}</p>
                    <h2 className="text-3xl font-semibold tracking-[-.045em]">{title}</h2>
                    <p className="mt-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">{mode === 'forgot' ? 'We will email a secure reset link if the account exists.' : 'Use your company account to continue.'}</p>

                    <form className="mt-8 grid gap-5" onSubmit={submit}>
                        {mode === 'register' && <><Field label="Full name" name="name" placeholder="Karim Rahat" errors={errors} /><Field label="Workspace name" name="workspace_name" placeholder="Acme Company" errors={errors} /><input type="hidden" name="timezone" value={Intl.DateTimeFormat().resolvedOptions().timeZone} /></>}
                        {mode !== 'reset' && <Field label="Work email" name="email" type="email" placeholder="you@company.com" errors={errors} />}
                        {(mode === 'login' || mode === 'register' || mode === 'reset') && <Field label="Password" name="password" type="password" placeholder="At least 8 characters" errors={errors} />}
                        {(mode === 'register' || mode === 'reset') && <Field label="Confirm password" name="password_confirmation" type="password" placeholder="Repeat password" errors={errors} />}
                        {errors.form && <p className="text-sm text-[#b64545]">{errors.form[0]}</p>}
                        {message && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300">{message}</p>}
                        <Button type="submit" className="mt-1" disabled={busy}>{busy && <LoaderCircle className="animate-spin" size={16} />}{mode === 'register' ? 'Create workspace' : mode === 'forgot' ? 'Send reset link' : mode === 'reset' ? 'Save new password' : 'Sign in'}</Button>
                    </form>

                    <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                        {mode === 'login' && <><button className="font-semibold text-brand-600 dark:text-brand-300" onClick={() => setMode('register')}>Create an account</button><button className="text-[#68736c] dark:text-[#a8b1ab]" onClick={() => setMode('forgot')}>Forgot password?</button></>}
                        {mode !== 'login' && <button className="font-semibold text-brand-600 dark:text-brand-300" onClick={() => setMode('login')}>Back to sign in</button>}
                    </div>
                </div>
            </section>
        </main>
    );
}

function Field({ label, errors, ...props }: { label: string; errors: Record<string, string[]> } & React.ComponentProps<typeof Input>) {
    const name = String(props.name);
    return <div className="grid gap-2"><Label htmlFor={name}>{label}</Label><Input id={name} required {...props} />{errors[name] && <p className="text-xs text-[#b64545]">{errors[name][0]}</p>}</div>;
}

function WorkspaceApp({ user, onUserChange }: { user: User; onUserChange: (user: User | null) => void }) {
    const projectRoute = currentProjectRoute();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [view, setView] = useState<'home' | 'planning' | 'people' | 'inbox' | 'admin' | 'settings'>(() => projectRoute ? 'planning' : 'home');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => localStorage.getItem('weberflow-theme') === 'dark' ? 'dark' : 'light');
    const [query, setQuery] = useState('');
    const [workspaceMenu, setWorkspaceMenu] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('weberflow-theme', theme);
    }, [theme]);

    async function logout() {
        await csrf();
        await api('/api/v1/auth/session', { method: 'DELETE' });
        onUserChange(null);
    }

    async function switchWorkspace(workspaceId: number) {
        await csrf();
        await api('/api/v1/current-workspace', { method: 'PUT', body: JSON.stringify({ workspace_id: workspaceId }) });
        const response = await api<{ data: User }>('/api/v1/me');
        onUserChange(response.data);
        setWorkspaceMenu(false);
    }

    useEffect(() => {
        if (!projectRoute || projectRoute.workspaceSlug === user.current_workspace.slug) {
            return;
        }

        const targetWorkspace = user.workspaces.find((workspace) => workspace.slug === projectRoute.workspaceSlug);

        if (targetWorkspace) {
            void switchWorkspace(targetWorkspace.id);
        }
    }, [projectRoute?.workspaceSlug, user.current_workspace.slug]);

    const initials = user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[252px_1fr]">
            {sidebarOpen && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-black/35 lg:hidden" onClick={() => setSidebarOpen(false)} />}
            <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#dce3dc] bg-white transition-transform dark:border-[#303a33] dark:bg-[#181d1a] lg:sticky lg:top-0 lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex h-17 items-center justify-between border-b border-[#dce3dc] px-5 dark:border-[#303a33]"><Brand compact /><button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button></div>
                <div className="relative px-3 pt-4">
                    <button className="flex w-full items-center gap-3 rounded-xl border border-[#dce3dc] bg-[#f7f8f4] p-2.5 text-left dark:border-[#303a33] dark:bg-[#222a25]" onClick={() => setWorkspaceMenu(!workspaceMenu)}>
                        <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{user.current_workspace.name.slice(0, 2).toUpperCase()}</span>
                        <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{user.current_workspace.name}</strong><small className="text-[#68736c] dark:text-[#a8b1ab]">{user.current_workspace.role}</small></span><ChevronDown size={15} />
                    </button>
                    {workspaceMenu && <Card className="absolute right-3 left-3 top-[70px] z-50 animate-pop-in overflow-hidden p-1">{user.workspaces.map((workspace) => <button key={workspace.id} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-[#eef1ea] dark:hover:bg-[#222a25]" onClick={() => switchWorkspace(workspace.id)}>{workspace.name}{workspace.id === user.current_workspace.id && <CheckCircle2 size={15} className="text-brand-600" />}</button>)}</Card>}
                </div>
                <nav className="mt-5 grid flex-1 content-start gap-1 px-3 stagger-children">
                    <NavButton active={view === 'home'} icon={<Home size={17} />} label="Home" onClick={() => setView('home')} />
                    <NavButton active={view === 'planning'} icon={<CheckCircle2 size={17} />} label="My tasks" onClick={() => setView('planning')} />
                    <NavButton active={view === 'inbox'} icon={<Inbox size={17} />} label="Inbox" onClick={() => setView('inbox')} />
                    <p className="mt-6 px-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b]">Workspace</p>
                    <NavButton active={view === 'planning'} icon={<FolderKanban size={17} />} label="Projects" onClick={() => setView('planning')} />
                    <NavButton active={view === 'planning'} icon={<CalendarRange size={17} />} label="Planning" onClick={() => setView('planning')} />
                    <NavButton active={view === 'people'} icon={<Users size={17} />} label="People" onClick={() => setView('people')} />
                    {user.is_platform_admin && <><p className="mt-6 px-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b]">Platform</p><NavButton active={view === 'admin'} icon={<ShieldCheck size={17} />} label="Admin" onClick={() => setView('admin')} /></>}
                </nav>
                <div className="grid gap-1 border-t border-[#dce3dc] p-3 dark:border-[#303a33]"><NavButton active={view === 'settings'} icon={<Settings size={17} />} label="Settings" onClick={() => setView('settings')} /><NavButton icon={<LogOut size={17} />} label="Sign out" onClick={logout} /></div>
            </aside>

            <div className="min-w-0">
                <header className="sticky top-0 z-20 flex h-17 items-center gap-3 border-b border-[#dce3dc] bg-white/90 px-4 backdrop-blur-xl dark:border-[#303a33] dark:bg-[#181d1a]/90 sm:px-6">
                    <button className="rounded-lg p-2 lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                    <div className="relative max-w-xl flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a857e]" size={17} /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 bg-[#f7f8f4] pl-10 dark:bg-[#222a25]" placeholder="Search WeberFlow" /></div>
                    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</Button>
                    <Button variant="ghost" size="icon" aria-label="Notifications"><Bell size={18} /></Button>
                    <span className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{initials}</span>
                </header>
                {!user.email_verified && <VerificationBanner />}
                <div key={view} className="view-enter">{view === 'settings' ? <SettingsViewV2 user={user} onUserChange={onUserChange} /> : view === 'planning' ? <AsanaPlanningView workspace={user.current_workspace} initialProjectId={projectRoute?.workspaceSlug === user.current_workspace.slug ? projectRoute.projectId : null} initialTaskId={projectRoute?.taskId ?? null} /> : view === 'people' ? <PeopleView workspace={user.current_workspace} /> : view === 'inbox' ? <InboxView user={user} workspace={user.current_workspace} /> : view === 'admin' ? <AdminView /> : <Dashboard user={user} query={query} onCreateTask={() => setView('planning')} />}</div>
            </div>
        </div>
    );
}

function VerificationBanner() {
    const [message, setMessage] = useState('Verify your email to secure your account and enable all workspace features.');
    async function resend() { await csrf(); const response = await api<{ message: string }>('/api/v1/email/verification-notification', { method: 'POST' }); setMessage(response.message); }
    return <div className="flex flex-wrap items-center justify-between gap-3 bg-[#f4ecd9] px-5 py-3 text-sm text-[#76511f] dark:bg-[#342c1e] dark:text-[#e4b976]"><span>{message}</span><button className="font-bold underline" onClick={resend}>Resend verification</button></div>;
}

const demoTasks = [
    ['Finalize Q4 campaign brief', 'Marketing launch', 'Today', 'High'],
    ['Review mobile navigation prototype', 'Product redesign', 'Oct 12', 'Medium'],
    ['Prepare client onboarding checklist', 'Operations', 'Oct 13', 'Low'],
    ['Resolve payment webhook retries', 'Platform reliability', 'Yesterday', 'High'],
];

function Dashboard({ user, query, onCreateTask }: { user: User; query: string; onCreateTask: () => void }) {
    const tasks = useMemo(() => demoTasks.filter((task) => `${task[0]} ${task[1]}`.toLowerCase().includes(query.toLowerCase())), [query]);
    return <main className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-8"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-sm text-[#68736c] dark:text-[#a8b1ab]">{user.current_workspace.name}</p><h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Good afternoon, {user.name.split(' ')[0]}</h1></div><Button onClick={onCreateTask}><Plus size={17} />Create task</Button></div><section className="mb-8 grid gap-4 stagger-children sm:grid-cols-2 xl:grid-cols-4"><Metric label="Due today" value="6" /><Metric label="Overdue" value="3" danger /><Metric label="Completed this week" value="18" /><Metric label="Active projects" value="7" /></section><Card className="overflow-hidden"><div className="border-b border-[#dce3dc] px-5 py-4 dark:border-[#303a33]"><h2 className="font-bold">My tasks</h2><p className="text-xs text-[#68736c] dark:text-[#a8b1ab]">Your most important work</p></div><div className="divide-y divide-[#e5e9e3] stagger-children dark:divide-[#303a33]">{tasks.map((task) => <div key={task[0]} className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-5 py-4 hover:bg-[#f8f9f6] dark:hover:bg-[#1e2520]"><button aria-label={`Complete ${task[0]}`} className="size-5 rounded-full border-2 border-[#aeb8b1]" /><div><strong className="block text-sm">{task[0]}</strong><small className="text-[#78827b]">{task[1]}</small></div><span className={`text-xs font-semibold ${task[2] === 'Yesterday' ? 'text-[#b64545]' : 'text-[#68736c]'}`}>{task[2]}</span></div>)}{tasks.length === 0 && <p className="p-10 text-center text-sm text-[#68736c]">No matching tasks.</p>}</div></Card></main>;
}

function SettingsView({ user, onUserChange }: { user: User; onUserChange: (user: User) => void }) {
    const [message, setMessage] = useState('');
    const [preferences, setPreferences] = useState<Preferences>(user.notification_preferences ?? initialPreferences);
    async function saveProfile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); await csrf(); const response = await api<{ data: User }>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(data) }); onUserChange(response.data); setMessage('Profile saved.'); }
    async function savePreferences() { await csrf(); await api('/api/v1/notification-preferences', { method: 'PUT', body: JSON.stringify(preferences) }); setMessage('Notification preferences saved.'); }
    async function createWorkspace(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); await csrf(); await api('/api/v1/workspaces', { method: 'POST', body: JSON.stringify(data) }); const response = await api<{ data: User }>('/api/v1/me'); onUserChange(response.data); setMessage('Workspace created.'); event.currentTarget.reset(); }
    return <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><div className="mb-7"><p className="text-sm text-brand-600 dark:text-brand-300">Account and workspace</p><h1 className="text-3xl font-semibold tracking-[-.045em]">Settings</h1></div>{message && <p className="mb-5 rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300">{message}</p>}<div className="grid gap-6 lg:grid-cols-2"><Card className="p-5"><h2 className="mb-5 font-bold">Profile</h2><form className="grid gap-4" onSubmit={saveProfile}><Field label="Name" name="name" defaultValue={user.name} errors={{}} /><Field label="Email" name="email" type="email" defaultValue={user.email} errors={{}} /><Field label="Timezone" name="timezone" defaultValue={user.timezone} errors={{}} /><div className="grid gap-2"><Label htmlFor="locale">Language</Label><select id="locale" name="locale" defaultValue={user.locale} className="h-11 rounded-xl border border-[#dce3dc] bg-white px-3 dark:border-[#303a33] dark:bg-[#181d1a]"><option value="en">English</option><option value="bn">বাংলা</option></select></div><Button type="submit">Save profile</Button></form></Card><Card className="p-5"><h2 className="mb-5 font-bold">Create workspace</h2><form className="grid gap-4" onSubmit={createWorkspace}><Field label="Workspace name" name="name" placeholder="Design Team" errors={{}} /><input type="hidden" name="timezone" value={user.timezone} /><Button type="submit">Create workspace</Button></form></Card><Card className="p-5 lg:col-span-2"><h2 className="mb-5 font-bold">Notifications</h2><div className="grid gap-3 sm:grid-cols-2">{Object.entries(preferences).map(([key, value]) => <label key={key} className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f8f4] p-3 dark:bg-[#222a25]"><span className="text-sm font-semibold">{key.replaceAll('_', ' ')}</span><input type="checkbox" checked={value} onChange={(event) => setPreferences({ ...preferences, [key]: event.target.checked })} className="size-4 accent-[#245b45]" /></label>)}</div><Button className="mt-5" onClick={savePreferences}>Save notifications</Button></Card></div></main>;
}

function SettingsViewV2({ user, onUserChange }: { user: User; onUserChange: (user: User) => void }) {
    const [message, setMessage] = useState('');
    const [section, setSection] = useState<'profile' | 'workspace' | 'notifications' | 'preferences'>('profile');
    const [preferences, setPreferences] = useState<Preferences>(user.notification_preferences ?? initialPreferences);
    async function saveProfile(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); await csrf(); const response = await api<{ data: User }>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(data) }); onUserChange(response.data); setMessage('Profile saved.'); }
    async function savePreferences() { await csrf(); await api('/api/v1/notification-preferences', { method: 'PUT', body: JSON.stringify(preferences) }); setMessage('Notification preferences saved.'); }
    async function createWorkspace(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = Object.fromEntries(new FormData(event.currentTarget).entries()); await csrf(); await api('/api/v1/workspaces', { method: 'POST', body: JSON.stringify(data) }); const response = await api<{ data: User }>('/api/v1/me'); onUserChange(response.data); setMessage('Workspace created.'); event.currentTarget.reset(); }
    const sections = [{ id: 'profile', label: 'Profile', icon: <Users size={16} />, description: 'Personal details' }, { id: 'workspace', label: 'Workspace', icon: <FolderKanban size={16} />, description: 'Create and manage spaces' }, { id: 'notifications', label: 'Notifications', icon: <Bell size={16} />, description: 'Email and inbox alerts' }, { id: 'preferences', label: 'Preferences', icon: <Settings size={16} />, description: 'Language and appearance' }] as const;
    return <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><div className="mb-7"><p className="text-sm text-brand-600 dark:text-brand-300">Account and workspace</p><h1 className="text-3xl font-semibold tracking-[-.045em]">Settings</h1></div><div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><aside className="h-fit rounded-2xl border border-[#dce3dc] bg-white p-2 dark:border-[#303a33] dark:bg-[#181d1a]"><p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b]">Settings</p>{sections.map((item) => <button key={item.id} onClick={() => setSection(item.id)} className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition ${section === item.id ? 'bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-[#536058] hover:bg-[#f4f6f1] dark:text-[#b4bdb7] dark:hover:bg-[#222a25]'}`}>{item.icon}<span><strong className="block text-sm">{item.label}</strong><small className="text-[11px] opacity-70">{item.description}</small></span></button>)}</aside><div className="min-w-0">{message && <p className="mb-5 rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300">{message}</p>}{section === 'profile' && <Card className="p-5 sm:p-6"><h2 className="mb-1 text-lg font-bold">Profile</h2><p className="mb-5 text-sm text-[#68736c] dark:text-[#a8b1ab]">Manage your personal information and locale.</p><form className="grid max-w-2xl gap-4" onSubmit={saveProfile}><Field label="Name" name="name" defaultValue={user.name} errors={{}} /><Field label="Email" name="email" type="email" defaultValue={user.email} errors={{}} /><Field label="Timezone" name="timezone" defaultValue={user.timezone} errors={{}} /><div className="grid gap-2"><Label htmlFor="locale-v2">Language</Label><select id="locale-v2" name="locale" defaultValue={user.locale} className="h-11 rounded-xl border border-[#dce3dc] bg-white px-3 dark:border-[#303a33] dark:bg-[#181d1a]"><option value="en">English</option><option value="bn">বাংলা</option></select></div><Button type="submit">Save profile</Button></form></Card>}{section === 'workspace' && <Card className="p-5 sm:p-6"><h2 className="mb-1 text-lg font-bold">Workspace</h2><p className="mb-5 text-sm text-[#68736c] dark:text-[#a8b1ab]">Create a new workspace for another team or initiative.</p><form className="grid max-w-xl gap-4" onSubmit={createWorkspace}><Field label="Workspace name" name="name" placeholder="Design Team" errors={{}} /><input type="hidden" name="timezone" value={user.timezone} /><Button type="submit">Create workspace</Button></form><div className="mt-8 border-t border-[#dce3dc] pt-5 dark:border-[#303a33]"><h3 className="font-bold">Your workspaces</h3><div className="mt-3 grid gap-2 sm:grid-cols-2">{user.workspaces.map((workspace) => <div key={workspace.id} className="rounded-xl bg-[#f7f8f4] p-3 text-sm dark:bg-[#222a25]"><strong>{workspace.name}</strong><small className="mt-1 block text-[#68736c] dark:text-[#a8b1ab]">{workspace.role}</small></div>)}</div></div></Card>}{section === 'notifications' && <Card className="p-5 sm:p-6"><h2 className="mb-1 text-lg font-bold">Notifications</h2><p className="mb-5 text-sm text-[#68736c] dark:text-[#a8b1ab]">Choose which activity reaches your inbox and email.</p><div className="grid gap-3 sm:grid-cols-2">{Object.entries(preferences).map(([key, value]) => <label key={key} className="flex items-center justify-between gap-4 rounded-xl bg-[#f7f8f4] p-3 dark:bg-[#222a25]"><span className="text-sm font-semibold">{key.replaceAll('_', ' ')}</span><input type="checkbox" checked={value} onChange={(event) => setPreferences({ ...preferences, [key]: event.target.checked })} className="size-4 accent-[#245b45]" /></label>)}</div><Button className="mt-5" onClick={savePreferences}>Save notifications</Button></Card>}{section === 'preferences' && <Card className="p-5 sm:p-6"><h2 className="mb-1 text-lg font-bold">Preferences</h2><p className="mb-5 text-sm text-[#68736c] dark:text-[#a8b1ab]">Your display and language preferences are saved with your profile.</p><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[#f7f8f4] p-4 dark:bg-[#222a25]"><strong>Language</strong><p className="mt-1 text-sm text-[#68736c] dark:text-[#a8b1ab]">Change language from the Profile section.</p></div><div className="rounded-xl bg-[#f7f8f4] p-4 dark:bg-[#222a25]"><strong>Theme</strong><p className="mt-1 text-sm text-[#68736c] dark:text-[#a8b1ab]">Use the sun/moon control in the top bar.</p></div></div></Card>}</div></div></main>;
}

function Brand({ inverse = false }: { inverse?: boolean; compact?: boolean }) { return <a href="/app" className={`inline-flex items-center gap-2.5 font-bold tracking-tight ${inverse ? 'text-white' : ''}`}><span className={`grid size-8 grid-cols-3 items-end gap-0.5 rounded-[10px] p-2 ${inverse ? 'bg-white' : 'bg-brand-600 dark:bg-brand-300'}`}><span className={`h-1.5 rounded-sm ${inverse ? 'bg-brand-900' : 'bg-white dark:bg-brand-900'}`} /><span className={`h-4 rounded-sm ${inverse ? 'bg-brand-900' : 'bg-white dark:bg-brand-900'}`} /><span className={`h-2.5 rounded-sm ${inverse ? 'bg-brand-900' : 'bg-white dark:bg-brand-900'}`} /></span><span>WeberFlow</span></a>; }
function NavButton({ icon, label, badge, active, onClick }: { icon: ReactNode; label: string; badge?: string; active?: boolean; onClick?: () => void }) { return <button className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm ${active ? 'bg-brand-50 font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-[#536058] hover:bg-[#eef1ea] dark:text-[#b4bdb7] dark:hover:bg-[#222a25]'}`} onClick={onClick}>{icon}<span className="flex-1">{label}</span>{badge && <span className="rounded-full bg-brand-100 px-1.5 text-[10px] font-bold text-brand-700">{badge}</span>}</button>; }
function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) { return <Card className="p-5"><p className="text-sm text-[#68736c] dark:text-[#a8b1ab]">{label}</p><strong className={`mt-2 block text-3xl tracking-[-.04em] ${danger ? 'text-[#b64545]' : ''}`}>{value}</strong></Card>; }

const root = document.getElementById('app');
if (!root) throw new Error('WeberFlow application root was not found.');
createRoot(root).render(<StrictMode><App /></StrictMode>);
