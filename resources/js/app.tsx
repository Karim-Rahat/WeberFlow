import { StrictMode, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
    Bell,
    CalendarDays,
    Check,
    ChevronDown,
    CircleHelp,
    FolderKanban,
    Home,
    Inbox,
    LayoutDashboard,
    Menu,
    Moon,
    Plus,
    Search,
    Settings,
    Sun,
    Target,
    Users,
    X,
} from 'lucide-react';
import '../css/app.css';

type Theme = 'light' | 'dark';

type Task = {
    id: number;
    title: string;
    project: string;
    due: string;
    status: 'Today' | 'Upcoming' | 'Overdue';
    priority: 'High' | 'Medium' | 'Low';
    assignee: string;
};

const navigation = [
    { label: 'Home', icon: Home, active: true },
    { label: 'My tasks', icon: Check },
    { label: 'Inbox', icon: Inbox, count: 7 },
];

const workspaceNavigation = [
    { label: 'Projects', icon: FolderKanban },
    { label: 'Portfolios', icon: LayoutDashboard },
    { label: 'Goals', icon: Target },
    { label: 'People', icon: Users },
];

const tasks: Task[] = [
    { id: 1, title: 'Finalize Q4 campaign brief', project: 'Marketing launch', due: 'Today', status: 'Today', priority: 'High', assignee: 'KR' },
    { id: 2, title: 'Review mobile navigation prototype', project: 'Product redesign', due: 'Oct 12', status: 'Upcoming', priority: 'Medium', assignee: 'SN' },
    { id: 3, title: 'Prepare client onboarding checklist', project: 'Operations', due: 'Oct 13', status: 'Upcoming', priority: 'Low', assignee: 'AM' },
    { id: 4, title: 'Resolve payment webhook retries', project: 'Platform reliability', due: 'Yesterday', status: 'Overdue', priority: 'High', assignee: 'TR' },
];

function App() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('workos-app-theme') as Theme) || 'light');
    const [query, setQuery] = useState('');

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('workos-app-theme', theme);
    }, [theme]);

    const visibleTasks = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return tasks;
        }

        return tasks.filter((task) => `${task.title} ${task.project}`.toLowerCase().includes(normalizedQuery));
    }, [query]);

    return (
        <div className="min-h-screen lg:grid lg:grid-cols-[252px_1fr]">
            {sidebarOpen && (
                <button
                    type="button"
                    aria-label="Close sidebar"
                    className="fixed inset-0 z-30 bg-black/35 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside className={`fixed inset-y-0 left-0 z-40 flex w-[252px] flex-col border-r border-[#dce3dc] bg-white transition-transform dark:border-[#303a33] dark:bg-[#181d1a] lg:sticky lg:top-0 lg:h-screen ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="flex h-17 items-center justify-between border-b border-[#dce3dc] px-5 dark:border-[#303a33]">
                    <a href="/app" className="flex items-center gap-2.5 font-bold tracking-tight">
                        <span className="grid size-8 grid-cols-3 items-end gap-0.5 rounded-[10px] bg-brand-600 p-2 dark:bg-brand-300" aria-hidden="true">
                            <span className="h-1.5 rounded-sm bg-white dark:bg-brand-900" />
                            <span className="h-4 rounded-sm bg-white dark:bg-brand-900" />
                            <span className="h-2.5 rounded-sm bg-white dark:bg-brand-900" />
                        </span>
                        WorkOS
                    </a>
                    <button type="button" aria-label="Close sidebar" className="rounded-lg p-2 hover:bg-[#eef1ea] dark:hover:bg-[#222a25] lg:hidden" onClick={() => setSidebarOpen(false)}><X size={18} /></button>
                </div>

                <div className="flex-1 overflow-y-auto px-3 py-4">
                    <button type="button" className="mb-5 flex w-full items-center gap-3 rounded-xl border border-[#dce3dc] bg-[#f7f8f4] p-2.5 text-left dark:border-[#303a33] dark:bg-[#222a25]">
                        <span className="grid size-8 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">AC</span>
                        <span className="min-w-0 flex-1"><strong className="block truncate text-sm">Acme Company</strong><small className="text-[#68736c] dark:text-[#a8b1ab]">12 members</small></span>
                        <ChevronDown size={15} />
                    </button>

                    <nav className="grid gap-1" aria-label="Primary">
                        {navigation.map((item) => <NavItem key={item.label} {...item} />)}
                    </nav>

                    <div className="mt-7">
                        <div className="mb-2 flex items-center justify-between px-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b] dark:text-[#96a099]">
                            Workspace
                            <button type="button" aria-label="Add workspace item" className="rounded p-1 hover:bg-[#eef1ea] dark:hover:bg-[#222a25]"><Plus size={14} /></button>
                        </div>
                        <nav className="grid gap-1" aria-label="Workspace">
                            {workspaceNavigation.map((item) => <NavItem key={item.label} {...item} />)}
                        </nav>
                    </div>

                    <div className="mt-7">
                        <div className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b] dark:text-[#96a099]">Favorites</div>
                        <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[#eef1ea] dark:hover:bg-[#222a25]"><span className="size-2.5 rounded-sm bg-[#809aeb]" />Website redesign</a>
                        <a href="#" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-[#eef1ea] dark:hover:bg-[#222a25]"><span className="size-2.5 rounded-sm bg-[#d59b58]" />Marketing launch</a>
                    </div>
                </div>

                <div className="grid gap-1 border-t border-[#dce3dc] p-3 dark:border-[#303a33]">
                    <NavItem label="Settings" icon={Settings} />
                    <NavItem label="Help & support" icon={CircleHelp} />
                </div>
            </aside>

            <div className="min-w-0">
                <header className="sticky top-0 z-20 flex h-17 items-center gap-3 border-b border-[#dce3dc] bg-white/90 px-4 backdrop-blur-xl dark:border-[#303a33] dark:bg-[#181d1a]/90 sm:px-6">
                    <button type="button" aria-label="Open sidebar" className="rounded-lg p-2 hover:bg-[#eef1ea] dark:hover:bg-[#222a25] lg:hidden" onClick={() => setSidebarOpen(true)}><Menu size={20} /></button>
                    <div className="relative max-w-xl flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a857e]" size={17} />
                        <input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 w-full rounded-xl border border-[#dce3dc] bg-[#f7f8f4] pr-4 pl-10 text-sm outline-none transition focus:border-brand-500 focus:ring-3 focus:ring-brand-100 dark:border-[#303a33] dark:bg-[#222a25] dark:focus:ring-brand-900" placeholder="Search tasks and projects" aria-label="Search tasks and projects" />
                    </div>
                    <a href="/flowchart.html" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-[#68736c] hover:bg-[#eef1ea] hover:text-[#17221b] dark:text-[#a8b1ab] dark:hover:bg-[#222a25] dark:hover:text-white md:block">Blueprint</a>
                    <button type="button" aria-label="Toggle theme" className="rounded-lg p-2.5 hover:bg-[#eef1ea] dark:hover:bg-[#222a25]" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}</button>
                    <button type="button" aria-label="Notifications" className="relative rounded-lg p-2.5 hover:bg-[#eef1ea] dark:hover:bg-[#222a25]"><Bell size={18} /><span className="absolute top-2 right-2 size-2 rounded-full border-2 border-white bg-[#c64d4d] dark:border-[#181d1a]" /></button>
                    <button type="button" aria-label="Open account menu" className="grid size-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">KR</button>
                </header>

                <main className="mx-auto max-w-[1480px] p-4 sm:p-6 lg:p-8">
                    <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
                        <div>
                            <p className="mb-1 text-sm text-[#68736c] dark:text-[#a8b1ab]">Saturday, October 10</p>
                            <h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Good afternoon, Karim</h1>
                        </div>
                        <button type="button" className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl bg-brand-600 px-4 text-sm font-bold text-white shadow-sm hover:bg-brand-700 dark:bg-brand-300 dark:text-brand-900"><Plus size={17} /> Create task</button>
                    </section>

                    <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Task summary">
                        <MetricCard label="Tasks due today" value="6" detail="2 high priority" tone="brand" />
                        <MetricCard label="Overdue tasks" value="3" detail="Needs attention" tone="danger" />
                        <MetricCard label="Completed this week" value="18" detail="12% above last week" tone="blue" />
                        <MetricCard label="Active projects" value="7" detail="5 on track" tone="sage" />
                    </section>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
                        <section className="overflow-hidden rounded-2xl border border-[#dce3dc] bg-white shadow-[0_8px_24px_rgba(25,50,36,.05)] dark:border-[#303a33] dark:bg-[#181d1a]">
                            <div className="flex items-center justify-between border-b border-[#dce3dc] px-5 py-4 dark:border-[#303a33]">
                                <div><h2 className="font-bold">My tasks</h2><p className="mt-0.5 text-xs text-[#68736c] dark:text-[#a8b1ab]">Your most important work</p></div>
                                <button type="button" className="rounded-lg px-3 py-2 text-sm font-semibold text-brand-600 hover:bg-brand-50 dark:text-brand-300 dark:hover:bg-brand-900">View all</button>
                            </div>
                            <div className="divide-y divide-[#e5e9e3] dark:divide-[#303a33]">
                                {visibleTasks.map((task) => <TaskRow key={task.id} task={task} />)}
                                {visibleTasks.length === 0 && <div className="px-5 py-12 text-center text-sm text-[#68736c] dark:text-[#a8b1ab]">No tasks match your search.</div>}
                            </div>
                        </section>

                        <aside className="grid content-start gap-6">
                            <section className="rounded-2xl border border-[#dce3dc] bg-white p-5 shadow-[0_8px_24px_rgba(25,50,36,.05)] dark:border-[#303a33] dark:bg-[#181d1a]">
                                <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Project health</h2><p className="mt-0.5 text-xs text-[#68736c] dark:text-[#a8b1ab]">7 active projects</p></div><LayoutDashboard size={18} className="text-brand-600 dark:text-brand-300" /></div>
                                <div className="grid gap-4">
                                    <HealthBar label="On track" value={5} width="71%" color="bg-brand-500" />
                                    <HealthBar label="At risk" value={1} width="14%" color="bg-[#d29a4f]" />
                                    <HealthBar label="Off track" value={1} width="14%" color="bg-[#c95a5a]" />
                                </div>
                            </section>
                            <section className="rounded-2xl border border-[#dce3dc] bg-white p-5 shadow-[0_8px_24px_rgba(25,50,36,.05)] dark:border-[#303a33] dark:bg-[#181d1a]">
                                <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold">Coming up</h2><p className="mt-0.5 text-xs text-[#68736c] dark:text-[#a8b1ab]">Next 7 days</p></div><CalendarDays size={18} className="text-brand-600 dark:text-brand-300" /></div>
                                <div className="grid gap-3">
                                    <Event day="12" month="Oct" title="Design review" meta="Product redesign · 10:00 AM" />
                                    <Event day="14" month="Oct" title="Campaign launch" meta="Marketing · All day" />
                                </div>
                            </section>
                        </aside>
                    </div>
                </main>
            </div>
        </div>
    );
}

function NavItem({ label, icon: Icon, active = false, count }: { label: string; icon: typeof Home; active?: boolean; count?: number }) {
    return <a href="#" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${active ? 'bg-brand-50 font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300' : 'text-[#536058] hover:bg-[#eef1ea] hover:text-[#17221b] dark:text-[#b4bdb7] dark:hover:bg-[#222a25] dark:hover:text-white'}`}><Icon size={17} /><span className="flex-1">{label}</span>{count && <span className="grid min-w-5 place-items-center rounded-full bg-brand-100 px-1.5 text-[10px] font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{count}</span>}</a>;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'brand' | 'danger' | 'blue' | 'sage' }) {
    const tones = { brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300', danger: 'bg-[#f7e5e3] text-[#a83f3f] dark:bg-[#3a2322] dark:text-[#f08a84]', blue: 'bg-[#e5eef5] text-[#476e91] dark:bg-[#20303d] dark:text-[#8db5d7]', sage: 'bg-[#e7eee5] text-[#617963] dark:bg-[#263329] dark:text-[#9cbc9f]' };
    return <article className="rounded-2xl border border-[#dce3dc] bg-white p-5 shadow-[0_8px_24px_rgba(25,50,36,.05)] dark:border-[#303a33] dark:bg-[#181d1a]"><div className={`mb-5 grid size-9 place-items-center rounded-xl ${tones[tone]}`}><Check size={17} /></div><p className="text-sm text-[#68736c] dark:text-[#a8b1ab]">{label}</p><div className="mt-1 flex items-end justify-between gap-3"><strong className="text-3xl tracking-[-.04em]">{value}</strong><small className="pb-1 text-right text-[#78827b] dark:text-[#96a099]">{detail}</small></div></article>;
}

function TaskRow({ task }: { task: Task }) {
    const statusColor = task.status === 'Overdue' ? 'text-[#b44545]' : task.status === 'Today' ? 'text-[#aa7125]' : 'text-[#68736c] dark:text-[#a8b1ab]';
    const priorityColor = task.priority === 'High' ? 'bg-[#f7e5e3] text-[#a83f3f] dark:bg-[#3a2322] dark:text-[#f08a84]' : task.priority === 'Medium' ? 'bg-[#f4ecd9] text-[#91601e] dark:bg-[#3a3020] dark:text-[#e0ad60]' : 'bg-[#e7eee5] text-[#617963] dark:bg-[#263329] dark:text-[#9cbc9f]';
    return <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-4 transition hover:bg-[#f8f9f6] dark:hover:bg-[#1e2520] sm:grid-cols-[auto_minmax(0,1fr)_110px_90px_auto]"><button type="button" aria-label={`Complete ${task.title}`} className="size-5 rounded-full border-2 border-[#aeb8b1] hover:border-brand-500 hover:bg-brand-50 dark:border-[#617067] dark:hover:border-brand-300" /><div className="min-w-0"><strong className="block truncate text-sm font-semibold">{task.title}</strong><small className="text-[#78827b] dark:text-[#96a099]">{task.project}</small></div><span className={`hidden text-xs font-semibold sm:block ${statusColor}`}>{task.due}</span><span className={`hidden w-fit rounded-full px-2 py-1 text-[10px] font-bold sm:block ${priorityColor}`}>{task.priority}</span><span className="grid size-8 place-items-center rounded-full bg-[#e7ece5] text-[10px] font-bold text-[#536058] dark:bg-[#2b352e] dark:text-[#c0c8c2]">{task.assignee}</span></div>;
}

function HealthBar({ label, value, width, color }: { label: string; value: number; width: string; color: string }) {
    return <div><div className="mb-1.5 flex justify-between text-xs"><span className="text-[#68736c] dark:text-[#a8b1ab]">{label}</span><strong>{value}</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#edf1ea] dark:bg-[#252e28]"><div className={`h-full rounded-full ${color}`} style={{ width }} /></div></div>;
}

function Event({ day, month, title, meta }: { day: string; month: string; title: string; meta: string }) {
    return <div className="flex items-center gap-3 rounded-xl bg-[#f7f8f4] p-3 dark:bg-[#222a25]"><div className="grid size-10 place-items-center rounded-lg bg-white text-center leading-none shadow-sm dark:bg-[#181d1a]"><strong className="text-sm">{day}</strong><small className="text-[9px] uppercase text-[#78827b]">{month}</small></div><div className="min-w-0"><strong className="block truncate text-sm">{title}</strong><small className="block truncate text-[#78827b] dark:text-[#96a099]">{meta}</small></div></div>;
}

const root = document.getElementById('app');

if (!root) {
    throw new Error('React application root was not found.');
}

createRoot(root).render(<StrictMode><App /></StrictMode>);
