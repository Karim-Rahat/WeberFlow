import { useEffect, useState, type FormEvent } from 'react';
import { CalendarRange, Diamond, LoaderCircle, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

type Workspace = { id: number; name: string };
type Task = { id: number; title: string; status: string; priority: string; start_date: string | null; due_date: string | null; is_milestone: boolean; predecessors: Task[] };
type Project = { id: number; name: string; description: string | null; status: string; start_date: string | null; due_date: string | null; tasks_count: number; tasks?: Task[] };
type ApiError = { message?: string; errors?: Record<string, string[]> };

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const csrfCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.split('=')[1];
    const response = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...(csrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfCookie) } : {}) },
        ...options,
    });
    if (!response.ok) throw (await response.json().catch(() => ({ message: 'Something went wrong.' }))) as ApiError;
    return response.json() as Promise<T>;
}

export function PlanningView({ workspace }: { workspace: Workspace }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selected, setSelected] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});

    useEffect(() => {
        setLoading(true);
        request<{ data: Project[] }>(`/api/v1/workspaces/${workspace.id}/projects`)
            .then(({ data }) => setProjects(data))
            .finally(() => setLoading(false));
    }, [workspace.id]);

    async function openProject(project: Project) {
        const response = await request<{ data: Project }>(`/api/v1/projects/${project.id}`);
        setSelected(response.data);
        setErrors({});
    }

    async function createProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrors({});
        const form = event.currentTarget;
        try {
            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            const response = await request<{ data: Project }>(`/api/v1/workspaces/${workspace.id}/projects`, { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(form).entries())) });
            setProjects([response.data, ...projects]);
            setSelected({ ...response.data, tasks: [] });
            setNotice('Project created. Add scheduled work to build the timeline.');
            form.reset();
        } catch (error) {
            setErrors((error as ApiError).errors ?? { form: [(error as ApiError).message ?? 'Unable to create project.'] });
        }
    }

    async function createTask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected) return;
        setErrors({});
        const form = event.currentTarget;
        try {
            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            const payload = Object.fromEntries(new FormData(form).entries());
            const response = await request<{ data: Task }>(`/api/v1/projects/${selected.id}/tasks`, { method: 'POST', body: JSON.stringify({ ...payload, is_milestone: payload.is_milestone === 'on' }) });
            setSelected({ ...selected, tasks: [...(selected.tasks ?? []), response.data], tasks_count: selected.tasks_count + 1 });
            setProjects(projects.map((project) => project.id === selected.id ? { ...project, tasks_count: project.tasks_count + 1 } : project));
            setNotice(response.data.is_milestone ? 'Milestone added.' : 'Scheduled task added.');
            form.reset();
        } catch (error) {
            setErrors((error as ApiError).errors ?? { form: [(error as ApiError).message ?? 'Unable to create task.'] });
        }
    }

    return <main className="mx-auto grid max-w-[1480px] gap-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-brand-600 dark:text-brand-300">Release 2 · In progress</p><h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Planning workspace</h1><p className="mt-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">Build date-aware projects, milestones, and dependency-ready schedules.</p></div><span className="rounded-full bg-[#e9f3ed] px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">Planning foundation</span></header>
        {notice && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300">{notice}</p>}
        {errors.form && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errors.form[0]}</p>}
        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="grid content-start gap-4">
                <Card className="p-5"><h2 className="font-bold">New project</h2><form className="mt-4 grid gap-3" onSubmit={createProject}><Field label="Project name" name="name" error={errors.name?.[0]} /><div className="grid grid-cols-2 gap-3"><Field label="Start" name="start_date" type="date" error={errors.start_date?.[0]} /><Field label="Due" name="due_date" type="date" error={errors.due_date?.[0]} /></div><Button type="submit"><Plus size={16} />Create project</Button></form></Card>
                <Card className="overflow-hidden"><div className="border-b border-[#dce3dc] p-4 dark:border-[#303a33]"><h2 className="font-bold">Projects</h2></div>{loading ? <LoaderCircle className="m-6 animate-spin text-brand-600" /> : <div className="grid p-2">{projects.map((project) => <button key={project.id} onClick={() => openProject(project)} className={`rounded-xl p-3 text-left hover:bg-[#eef1ea] dark:hover:bg-[#222a25] ${selected?.id === project.id ? 'bg-brand-50 dark:bg-brand-900' : ''}`}><strong className="block text-sm">{project.name}</strong><small className="text-[#68736c] dark:text-[#a8b1ab]">{project.tasks_count} scheduled items</small></button>)}{projects.length === 0 && <p className="p-5 text-sm text-[#68736c]">Create your first project.</p>}</div>}</Card>
            </div>
            {selected ? <div className="grid content-start gap-5"><Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-brand-600 dark:text-brand-300">{selected.status.replaceAll('_', ' ')}</p><h2 className="mt-1 text-2xl font-semibold">{selected.name}</h2></div><div className="text-right text-xs text-[#68736c] dark:text-[#a8b1ab]"><p>{selected.start_date ?? 'No start date'}</p><p>{selected.due_date ?? 'No due date'}</p></div></div></Card><Card className="overflow-hidden"><div className="flex items-center gap-2 border-b border-[#dce3dc] px-5 py-4 dark:border-[#303a33]"><CalendarRange size={18} className="text-brand-600" /><h2 className="font-bold">Timeline</h2></div><div className="grid gap-3 p-5">{selected.tasks?.map((task) => <div key={task.id} className="grid gap-3 rounded-xl border border-[#dce3dc] p-4 dark:border-[#303a33] sm:grid-cols-[1fr_auto] sm:items-center"><div className="flex items-center gap-3">{task.is_milestone ? <Diamond size={17} className="fill-brand-500 text-brand-600" /> : <span className="size-3 rounded-full bg-brand-300" />}<div><strong className="block text-sm">{task.title}</strong><small className="text-[#68736c] dark:text-[#a8b1ab]">{task.priority} priority · {task.status.replaceAll('_', ' ')}</small></div></div><span className="text-xs font-semibold">{task.start_date ?? 'Unscheduled'} → {task.due_date ?? 'Open'}</span></div>)}{selected.tasks?.length === 0 && <p className="py-8 text-center text-sm text-[#68736c]">No timeline items yet.</p>}</div></Card><Card className="p-5"><h2 className="font-bold">Add scheduled work</h2><form className="mt-4 grid gap-4" onSubmit={createTask}><Field label="Task or milestone" name="title" error={errors.title?.[0]} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Start" name="start_date" type="date" error={errors.start_date?.[0]} /><Field label="Due" name="due_date" type="date" error={errors.due_date?.[0]} /></div><label className="flex items-center gap-2 text-sm font-semibold"><input className="size-4 accent-[#245b45]" type="checkbox" name="is_milestone" />Mark as milestone</label><Button type="submit"><Plus size={16} />Add to timeline</Button></form></Card></div> : <Card className="grid min-h-96 place-items-center p-8 text-center"><div><CalendarRange className="mx-auto text-brand-500" size={38} /><h2 className="mt-4 text-xl font-bold">Select a project</h2><p className="mt-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">Choose a project to open its Release 2 timeline.</p></div></Card>}
        </section>
    </main>;
}

function Field({ label, error, ...props }: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
    const id = String(props.name);
    return <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} required={props.name === 'name' || props.name === 'title'} {...props} />{error && <small className="text-red-600">{error}</small>}</div>;
}
