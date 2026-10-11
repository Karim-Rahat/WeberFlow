import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, CalendarRange, ChartNoAxesGantt, Columns3, Copy, Diamond, LayoutList, ListPlus, LoaderCircle, Plus, SlidersHorizontal, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { TaskDetail } from './task-detail';

export type Workspace = { id: number; name: string };
export type Task = { id: number; title: string; description?: string | null; status: string; priority: string; start_date: string | null; due_date: string | null; is_milestone: boolean; recurrence?: string | null; recurrence_interval?: number; predecessors: Task[]; blocked_by_dependency?: boolean };
type CustomField = { id: number; name: string; type: string; is_required: boolean };
type ProjectForm = { id: number; name: string; fields: { label: string; type: string; required: boolean }[] };
type Project = { id: number; name: string; description: string | null; status: string; start_date: string | null; due_date: string | null; tasks_count: number; tasks?: Task[]; custom_fields?: CustomField[]; forms?: ProjectForm[] };
type ProjectTemplate = { id: number; name: string; description: string | null };
type ApiError = { message?: string; errors?: Record<string, string[]> };
type Workload = { assignee: { id: number; name: string } | null; total: number; completed: number; blocked: number };

export async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const csrfCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.split('=')[1];
    const response = await fetch(url, {
        credentials: 'include',
        headers: { Accept: 'application/json', ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(csrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfCookie) } : {}) },
        ...options,
    });
    if (!response.ok) throw (await response.json().catch(() => ({ message: 'Something went wrong.' }))) as ApiError;
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
}

export function PlanningView({ workspace }: { workspace: Workspace }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [selected, setSelected] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState('');
    const [errors, setErrors] = useState<Record<string, string[]>>({});
    const [view, setView] = useState<'list' | 'board' | 'calendar' | 'timeline'>('list');
    const [workload, setWorkload] = useState<Workload[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [templates, setTemplates] = useState<ProjectTemplate[]>([]);

    useEffect(() => {
        setLoading(true);
        Promise.all([request<{ data: Project[] }>(`/api/v1/workspaces/${workspace.id}/projects`), request<{ data: ProjectTemplate[] }>(`/api/v1/workspaces/${workspace.id}/templates`)])
            .then(([projectResponse, templateResponse]) => { setProjects(projectResponse.data); setTemplates(templateResponse.data); })
            .finally(() => setLoading(false));
    }, [workspace.id]);

    async function openProject(project: Project) {
        const [response, workloadResponse] = await Promise.all([request<{ data: Project }>(`/api/v1/projects/${project.id}`), request<{ data: Workload[] }>(`/api/v1/projects/${project.id}/workload`)]);
        setSelected(response.data);
        setWorkload(workloadResponse.data);
        setErrors({});
    }

    async function refreshProject() {
        if (!selected) return;
        await openProject(selected);
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
            const response = await request<{ data: Task }>(`/api/v1/projects/${selected.id}/tasks`, { method: 'POST', body: JSON.stringify({ ...payload, is_milestone: payload.is_milestone === 'on', recurrence: payload.recurrence || null }) });
            setSelected({ ...selected, tasks: [...(selected.tasks ?? []), response.data], tasks_count: selected.tasks_count + 1 });
            setProjects(projects.map((project) => project.id === selected.id ? { ...project, tasks_count: project.tasks_count + 1 } : project));
            setNotice(response.data.is_milestone ? 'Milestone added.' : 'Scheduled task added.');
            form.reset();
        } catch (error) {
            setErrors((error as ApiError).errors ?? { form: [(error as ApiError).message ?? 'Unable to create task.'] });
        }
    }

    async function createCustomField(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected) return;
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form).entries());
        await request(`/api/v1/projects/${selected.id}/custom-fields`, { method: 'POST', body: JSON.stringify({ ...payload, is_required: payload.is_required === 'on' }) });
        form.reset();
        await refreshProject();
        setNotice('Custom field added to the project.');
    }

    async function createForm(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!selected) return;
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form).entries());
        await request(`/api/v1/projects/${selected.id}/forms`, { method: 'POST', body: JSON.stringify({ name: payload.name, fields: [{ label: payload.field_label, type: 'text', required: true }] }) });
        form.reset();
        await refreshProject();
        setNotice('Intake form published.');
    }

    async function saveTemplate() {
        if (!selected) return;
        const response = await request<{ data: ProjectTemplate }>(`/api/v1/projects/${selected.id}/templates`, { method: 'POST', body: JSON.stringify({ name: `${selected.name} template` }) });
        setTemplates([response.data, ...templates]);
        setNotice('Project saved as a reusable template.');
    }

    async function applyTemplate(template: ProjectTemplate) {
        const response = await request<{ data: Project }>(`/api/v1/workspaces/${workspace.id}/templates/${template.id}`, { method: 'POST', body: JSON.stringify({ name: `${template.name} copy` }) });
        setProjects([response.data, ...projects]);
        setSelected(response.data);
        setNotice('Template applied to a new project.');
    }

    return <main className="mx-auto grid max-w-[1480px] gap-6 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-bold text-brand-600 dark:text-brand-300">Release 1 · Complete</p><h1 className="text-3xl font-semibold tracking-[-.045em] sm:text-4xl">Projects and tasks</h1><p className="mt-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">Organize ownership and delivery in list, board, or calendar views.</p></div><span className="rounded-full bg-[#e9f3ed] px-3 py-1.5 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">Core work complete</span></header>
        {notice && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300">{notice}</p>}
        {errors.form && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{errors.form[0]}</p>}
        <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <div className="grid content-start gap-4">
                <Card className="p-5"><h2 className="font-bold">New project</h2><form className="mt-4 grid gap-3" onSubmit={createProject}><Field label="Project name" name="name" error={errors.name?.[0]} /><div className="grid grid-cols-2 gap-3"><Field label="Start" name="start_date" type="date" error={errors.start_date?.[0]} /><Field label="Due" name="due_date" type="date" error={errors.due_date?.[0]} /></div><Button type="submit"><Plus size={16} />Create project</Button></form></Card>
                <Card className="overflow-hidden"><div className="border-b border-[#dce3dc] p-4 dark:border-[#303a33]"><h2 className="font-bold">Projects</h2></div>{loading ? <LoaderCircle className="m-6 animate-spin text-brand-600" /> : <div className="grid p-2">{projects.map((project) => <button key={project.id} onClick={() => openProject(project)} className={`rounded-xl p-3 text-left hover:bg-[#eef1ea] dark:hover:bg-[#222a25] ${selected?.id === project.id ? 'bg-brand-50 dark:bg-brand-900' : ''}`}><strong className="block text-sm">{project.name}</strong><small className="text-[#68736c] dark:text-[#a8b1ab]">{project.tasks_count} scheduled items</small></button>)}{projects.length === 0 && <p className="p-5 text-sm text-[#68736c]">Create your first project.</p>}</div>}</Card>
                <Card className="overflow-hidden"><div className="flex items-center gap-2 border-b border-[#dce3dc] p-4 dark:border-[#303a33]"><Copy size={16} /><h2 className="font-bold">Templates</h2></div><div className="grid p-2">{templates.map((template) => <button key={template.id} onClick={() => applyTemplate(template)} className="rounded-xl p-3 text-left text-sm hover:bg-[#eef1ea] dark:hover:bg-[#222a25]"><strong className="block">{template.name}</strong><small className="text-[#68736c]">Create a project copy</small></button>)}{templates.length === 0 && <p className="p-4 text-sm text-[#68736c]">Save a project to reuse its work.</p>}</div></Card>
            </div>
            {selected ? <div className="grid content-start gap-5"><Card className="p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.12em] text-brand-600 dark:text-brand-300">{(selected.status ?? 'on_track').replaceAll('_', ' ')}</p><h2 className="mt-1 text-2xl font-semibold">{selected.name}</h2><p className="mt-1 text-xs font-bold text-blue-600 dark:text-blue-300">Release 2 planning · Complete</p></div><div className="grid justify-items-end gap-2 text-right text-xs text-[#68736c] dark:text-[#a8b1ab]"><div><p>{selected.start_date ?? 'No start date'}</p><p>{selected.due_date ?? 'No due date'}</p></div><Button size="sm" variant="outline" onClick={saveTemplate}><Copy size={14} />Save template</Button></div></div></Card><Card className="overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dce3dc] px-5 py-4 dark:border-[#303a33]"><div className="flex items-center gap-2"><CalendarRange size={18} className="text-brand-600" /><h2 className="font-bold">Project work</h2></div><div className="flex flex-wrap rounded-lg bg-[#eef1ea] p-1 dark:bg-[#222a25]"><ViewButton active={view === 'list'} onClick={() => setView('list')} icon={<LayoutList size={14} />} label="List" /><ViewButton active={view === 'board'} onClick={() => setView('board')} icon={<Columns3 size={14} />} label="Board" /><ViewButton active={view === 'calendar'} onClick={() => setView('calendar')} icon={<CalendarDays size={14} />} label="Calendar" /><ViewButton active={view === 'timeline'} onClick={() => setView('timeline')} icon={<ChartNoAxesGantt size={14} />} label="Timeline" /></div></div><TaskCollection tasks={selected.tasks ?? []} view={view} onOpen={setSelectedTaskId} /></Card><Card className="p-5"><h2 className="flex items-center gap-2 font-bold"><Users size={17} />Workload preview</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{workload.map((row, index) => <div key={row.assignee?.id ?? `none-${index}`} className="rounded-xl bg-[#f4f6f1] p-3 dark:bg-[#222a25]"><div className="flex justify-between text-sm"><strong>{row.assignee?.name ?? 'Unassigned'}</strong><span>{row.total} tasks</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-[#dce3dc] dark:bg-[#303a33]"><div className="h-full bg-brand-500" style={{ width: `${row.total ? (row.completed / row.total) * 100 : 0}%` }} /></div>{row.blocked > 0 && <small className="mt-1 block text-amber-700 dark:text-amber-300">{row.blocked} blocked</small>}</div>)}</div></Card><div className="grid gap-5 lg:grid-cols-2"><Card className="p-5"><h2 className="flex items-center gap-2 font-bold"><SlidersHorizontal size={17} />Custom fields</h2><div className="mt-3 flex flex-wrap gap-2">{selected.custom_fields?.map((field) => <span key={field.id} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{field.name} · {field.type}</span>)}</div><form className="mt-4 grid gap-3 sm:grid-cols-[1fr_120px_auto]" onSubmit={createCustomField}><Input name="name" required placeholder="Field name" /><select name="type" className="h-11 rounded-xl border border-[#dce3dc] bg-white px-3 dark:border-[#303a33] dark:bg-[#181d1a]"><option value="text">Text</option><option value="number">Number</option><option value="date">Date</option><option value="select">Select</option></select><Button type="submit"><Plus size={15} />Add</Button></form></Card><Card className="p-5"><h2 className="flex items-center gap-2 font-bold"><ListPlus size={17} />Intake forms</h2><div className="mt-3 grid gap-2">{selected.forms?.map((form) => <span key={form.id} className="text-sm font-semibold">{form.name} · {form.fields.length} fields</span>)}</div><form className="mt-4 grid gap-3" onSubmit={createForm}><Input name="name" required placeholder="Form name" /><Input name="field_label" required placeholder="First question" /><Button type="submit"><Plus size={15} />Publish form</Button></form></Card></div><Card className="p-5"><h2 className="font-bold">Add task</h2><form className="mt-4 grid gap-4" onSubmit={createTask}><Field label="Task or milestone" name="title" error={errors.title?.[0]} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Start" name="start_date" type="date" error={errors.start_date?.[0]} /><Field label="Due" name="due_date" type="date" error={errors.due_date?.[0]} /></div><div className="grid gap-2"><Label htmlFor="recurrence">Repeat</Label><select id="recurrence" name="recurrence" className="h-11 rounded-xl border border-[#dce3dc] bg-white px-3 dark:border-[#303a33] dark:bg-[#181d1a]"><option value="">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></div><label className="flex items-center gap-2 text-sm font-semibold"><input className="size-4 accent-[#245b45]" type="checkbox" name="is_milestone" />Mark as milestone</label><Button type="submit"><Plus size={16} />Add task</Button></form></Card></div> : <Card className="grid min-h-96 place-items-center p-8 text-center"><div><CalendarRange className="mx-auto text-brand-500" size={38} /><h2 className="mt-4 text-xl font-bold">Select a project</h2><p className="mt-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">Choose a project to open its work views.</p></div></Card>}
        </section>
        {selectedTaskId && selected && <TaskDetail taskId={selectedTaskId} projectId={selected.id} workspace={workspace} onClose={() => setSelectedTaskId(null)} onChanged={refreshProject} />}
    </main>;
}

function TaskCollection({ tasks, view, onOpen }: { tasks: Task[]; view: 'list' | 'board' | 'calendar' | 'timeline'; onOpen: (id: number) => void }) {
    if (tasks.length === 0) return <p className="p-10 text-center text-sm text-[#68736c]">No tasks yet.</p>;
    if (view === 'board') return <div className="grid gap-4 overflow-x-auto p-5 md:grid-cols-3">{(['not_started', 'in_progress', 'complete'] as const).map((status) => <section key={status} className="min-w-56 rounded-xl bg-[#f4f6f1] p-3 dark:bg-[#202722]"><h3 className="mb-3 text-xs font-bold uppercase tracking-wider">{status.replaceAll('_', ' ')}</h3><div className="grid gap-2">{tasks.filter((task) => task.status === status).map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} />)}</div></section>)}</div>;
    if (view === 'calendar') return <div className="grid gap-2 p-5 sm:grid-cols-2 lg:grid-cols-3">{[...tasks].sort((a, b) => (a.due_date ?? '9999').localeCompare(b.due_date ?? '9999')).map((task) => <TaskCard key={task.id} task={task} dateFirst onOpen={onOpen} />)}</div>;
    if (view === 'timeline') return <Timeline tasks={tasks} onOpen={onOpen} />;
    return <div className="grid gap-3 p-5">{tasks.map((task) => <TaskCard key={task.id} task={task} onOpen={onOpen} />)}</div>;
}

function Timeline({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: number) => void }) {
    const scheduled = tasks.filter((task) => task.start_date && task.due_date);
    if (scheduled.length === 0) return <p className="p-10 text-center text-sm text-[#68736c]">Add start and due dates to build the timeline.</p>;
    const start = Math.min(...scheduled.map((task) => new Date(task.start_date!).getTime()));
    const end = Math.max(...scheduled.map((task) => new Date(task.due_date!).getTime()));
    const span = Math.max(end - start, 86400000);
    return <div className="grid gap-3 overflow-x-auto p-5">{scheduled.map((task) => { const left = ((new Date(task.start_date!).getTime() - start) / span) * 75; const width = Math.max(4, ((new Date(task.due_date!).getTime() - new Date(task.start_date!).getTime()) / span) * 75); return <button key={task.id} onClick={() => onOpen(task.id)} className="grid min-w-[680px] grid-cols-[180px_1fr] items-center gap-3 text-left"><span className="truncate text-sm font-semibold">{task.title}</span><span className="relative h-8 rounded-lg bg-[#eef1ea] dark:bg-[#222a25]"><span className={`absolute top-1 h-6 rounded-md ${task.blocked_by_dependency ? 'bg-amber-500' : task.is_milestone ? 'bg-brand-700' : 'bg-brand-500'}`} style={{ left: `${left}%`, width: task.is_milestone ? '10px' : `${width}%` }} /></span></button>; })}</div>;
}

function TaskCard({ task, dateFirst = false, onOpen }: { task: Task; dateFirst?: boolean; onOpen: (id: number) => void }) {
    return <button onClick={() => onOpen(task.id)} className="grid gap-2 rounded-xl border border-[#dce3dc] bg-white p-4 text-left hover:border-brand-300 dark:border-[#303a33] dark:bg-[#181d1a]"><div className="flex items-center gap-3">{task.is_milestone ? <Diamond size={17} className="fill-brand-500 text-brand-600" /> : <span className="size-3 rounded-full bg-brand-300" />}<strong className="text-sm">{task.title}</strong></div><small className="text-[#68736c] dark:text-[#a8b1ab]">{dateFirst ? task.due_date ?? 'Unscheduled' : `${task.priority} · ${task.start_date ?? 'Unscheduled'} → ${task.due_date ?? 'Open'}`}</small></button>;
}

function ViewButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: ReactNode; label: string }) {
    return <button className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold ${active ? 'bg-white text-brand-700 shadow-sm dark:bg-[#303a33] dark:text-brand-300' : 'text-[#68736c]'}`} onClick={onClick}>{icon}{label}</button>;
}

function Field({ label, error, ...props }: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
    const id = String(props.name);
    return <div className="grid gap-1.5"><Label htmlFor={id}>{label}</Label><Input id={id} required={props.name === 'name' || props.name === 'title'} {...props} />{error && <small className="text-red-600">{error}</small>}</div>;
}
