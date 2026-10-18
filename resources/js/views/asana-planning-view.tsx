import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronRight, Circle, Filter, LayoutDashboard, List, MoreHorizontal, Plus, Search, SlidersHorizontal, Star, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { AsanaTaskDetail } from './asana-task-detail';
import { request, type Task, type Workspace } from './planning-view';

type Project = {
    id: number;
    name: string;
    description: string | null;
    status: string | null;
    tasks_count: number;
    tasks?: Task[];
    sections?: Section[];
};

type Section = { id: number; name: string; position: number };

type View = 'list' | 'board' | 'timeline' | 'calendar' | 'dashboard';
type Member = { id: number; name: string; email: string };
type GroupBy = 'section' | 'status' | 'priority' | 'assignee';
type SortBy = 'position' | 'title' | 'due_date' | 'priority' | 'assignee';
type Filters = { status: string; priority: string; assignee: string; due: string };
type ListOptions = { showCompleted: boolean; compact: boolean; assignee: boolean; dueDate: boolean; priority: boolean; status: boolean };

const views: { id: View; label: string }[] = [
    { id: 'list', label: 'List' },
    { id: 'board', label: 'Board' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'calendar', label: 'Calendar' },
];

export function AsanaPlanningView({ workspace, initialProjectId = null, initialTaskId = null }: { workspace: Workspace; initialProjectId?: number | null; initialTaskId?: number | null }) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [selected, setSelected] = useState<Project | null>(null);
    const [view, setView] = useState<View>('list');
    const [query, setQuery] = useState('');
    const [notice, setNotice] = useState('');
    const [showNewProject, setShowNewProject] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
    const [openMenu, setOpenMenu] = useState<'filter' | 'sort' | 'group' | 'options' | null>(null);
    const [filters, setFilters] = useState<Filters>({ status: 'all', priority: 'all', assignee: 'all', due: 'all' });
    const [sortBy, setSortBy] = useState<SortBy>('position');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [groupBy, setGroupBy] = useState<GroupBy>('section');
    const [listOptions, setListOptions] = useState<ListOptions>({ showCompleted: true, compact: false, assignee: true, dueDate: true, priority: true, status: true });

    useEffect(() => {
        request<{ data: Member[] }>(`/api/v1/workspaces/${workspace.id}/members`).then(({ data }) => setMembers(data));
        request<{ data: Project[] }>(`/api/v1/workspaces/${workspace.id}/projects`).then(({ data }) => {
            setProjects(data);
            const initialProject = data.find((project) => project.id === initialProjectId) ?? data[0];
            if (initialProject) {
                void openProject(initialProject, 'replace', initialProject.id === initialProjectId ? initialTaskId : null);
            }
        });
    }, [workspace.id]);

    useEffect(() => {
        function restoreProjectFromHistory() {
            const match = window.location.pathname.match(/^\/app\/([^/]+)\/(\d+)\/?$/);
            const projectId = Number(match?.[2]);
            const project = projects.find((candidate) => candidate.id === projectId);
            const taskId = Number(new URLSearchParams(window.location.search).get('task'));

            if (match && decodeURIComponent(match[1]) === workspace.slug && project) {
                void openProject(project, 'none', Number.isInteger(taskId) && taskId > 0 ? taskId : null);
            }
        }

        window.addEventListener('popstate', restoreProjectFromHistory);

        return () => window.removeEventListener('popstate', restoreProjectFromHistory);
    }, [projects, workspace.slug]);

    function projectUrl(project: Project, taskId: number | null = null) {
        const url = `/app/${encodeURIComponent(workspace.slug)}/${project.id}`;

        return taskId ? `${url}?task=${taskId}` : url;
    }

    async function openProject(project: Project, historyMode: 'push' | 'replace' | 'none' = 'push', taskId: number | null = null) {
        const { data } = await request<{ data: Project }>(`/api/v1/projects/${project.id}`);
        setSelected(data);
        setSelectedTaskId(taskId);
        if (historyMode !== 'none') {
            window.history[historyMode === 'push' ? 'pushState' : 'replaceState']({}, '', projectUrl(project, taskId));
        }
    }

    async function refreshProject() {
        if (selected) {
            const { data } = await request<{ data: Project }>(`/api/v1/projects/${selected.id}`);
            setSelected(data);
        }
    }

    function openTask(taskId: number) {
        if (!selected) {
            return;
        }

        setSelectedTaskId(taskId);
        window.history.pushState({}, '', projectUrl(selected, taskId));
    }

    function closeTask() {
        if (!selected) {
            return;
        }

        setSelectedTaskId(null);
        window.history.pushState({}, '', projectUrl(selected));
    }

    async function shareProject() {
        await navigator.clipboard.writeText(window.location.origin + (selected ? projectUrl(selected) : window.location.pathname));
        setNotice('Project link copied');
    }

    async function createProject(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form).entries());
        await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
        const { data } = await request<{ data: Project }>(`/api/v1/workspaces/${workspace.id}/projects`, { method: 'POST', body: JSON.stringify(payload) });
        setProjects([data, ...projects]);
        await openProject({ ...data, tasks: [] });
        setShowNewProject(false);
        setNotice('Project created');
        form.reset();
    }

    async function createTask(title: string, isMilestone = false, sectionId: number | null = null) {
        if (!selected || !title.trim()) {
            return;
        }

        await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
        await request(`/api/v1/projects/${selected.id}/tasks`, {
            method: 'POST',
            body: JSON.stringify({ title: title.trim(), is_milestone: isMilestone, ...(sectionId ? { section_id: sectionId } : {}) }),
        });
        await refreshProject();
        setNotice(isMilestone ? 'Milestone added' : 'Task added');
    }

    async function createSection(name: string) {
        if (!selected || !name.trim()) {
            return;
        }

        await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
        await request(`/api/v1/projects/${selected.id}/sections`, {
            method: 'POST',
            body: JSON.stringify({ name: name.trim() }),
        });
        await refreshProject();
        setNotice('Section added');
    }

    async function updateTask(task: Task, fields: Record<string, unknown>) {
        await request(`/api/v1/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify(fields) });
        await refreshProject();
    }

    const filteredTasks = useMemo(() => {
        const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 } as Record<string, number>;
        const tasks = (selected?.tasks ?? []).filter((task) => {
            const matchesSearch = task.title.toLowerCase().includes(query.toLowerCase());
            const matchesStatus = filters.status === 'all' || task.status === filters.status;
            const matchesPriority = filters.priority === 'all' || task.priority === filters.priority;
            const matchesAssignee = filters.assignee === 'all' || (filters.assignee === 'unassigned' ? !task.assignee : task.assignee?.id === Number(filters.assignee));
            const today = new Date().toISOString().slice(0, 10);
            const matchesDue = filters.due === 'all'
                || (filters.due === 'overdue' && Boolean(task.due_date && task.due_date < today && task.status !== 'complete'))
                || (filters.due === 'today' && task.due_date === today)
                || (filters.due === 'none' && !task.due_date);

            return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesDue && (listOptions.showCompleted || task.status !== 'complete');
        });

        if (sortBy === 'position') {
            return tasks;
        }

        return [...tasks].sort((left, right) => {
            const leftValue = sortBy === 'priority' ? priorityOrder[left.priority] : sortBy === 'assignee' ? left.assignee?.name ?? '' : sortBy === 'due_date' ? left.due_date ?? '9999-12-31' : left.title.toLowerCase();
            const rightValue = sortBy === 'priority' ? priorityOrder[right.priority] : sortBy === 'assignee' ? right.assignee?.name ?? '' : sortBy === 'due_date' ? right.due_date ?? '9999-12-31' : right.title.toLowerCase();
            const comparison = leftValue < rightValue ? -1 : leftValue > rightValue ? 1 : 0;

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [selected?.tasks, query, filters, sortBy, sortDirection, listOptions.showCompleted]);

    const activeFilterCount = Object.values(filters).filter((value) => value !== 'all').length;

    return <main className="min-h-[calc(100vh-4.25rem)] bg-white text-[#1e1f21] dark:bg-[#1e1f21] dark:text-[#f5f4f3]">
        <div className="grid min-h-[calc(100vh-4.25rem)] lg:grid-cols-[270px_minmax(0,1fr)]">
            <aside className="border-r border-[#edeae9] bg-[#f7f5f4] dark:border-[#3d3e40] dark:bg-[#292a2c]">
                <div className="flex items-center justify-between border-b border-[#edeae9] px-4 py-4 dark:border-[#3d3e40]">
                    <div><p className="text-xs font-semibold text-[#6d6e6f] dark:text-[#a2a0a2]">Workspace</p><h2 className="font-semibold">{workspace.name}</h2></div>
                    <Button size="icon" variant="ghost" aria-label="Create project" onClick={() => setShowNewProject(!showNewProject)}><Plus size={18} /></Button>
                </div>
                {showNewProject && <form className="grid gap-2 border-b border-[#edeae9] p-3 dark:border-[#3d3e40]" onSubmit={createProject}>
                    <Input autoFocus name="name" required placeholder="Project name" className="h-9 rounded-lg" />
                    <div className="grid grid-cols-2 gap-2"><Input name="start_date" type="date" className="h-9 rounded-lg px-2" /><Input name="due_date" type="date" className="h-9 rounded-lg px-2" /></div>
                    <div className="flex justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={() => setShowNewProject(false)}>Cancel</Button><Button type="submit" size="sm">Create</Button></div>
                </form>}
                <div className="px-3 py-4">
                    <div className="mb-3 flex items-center justify-between px-2 text-xs font-semibold text-[#6d6e6f] dark:text-[#a2a0a2]"><span>Projects</span><MoreHorizontal size={16} /></div>
                    <div className="grid gap-1">{projects.map((project, index) => <button key={project.id} onClick={() => openProject(project)} className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${selected?.id === project.id ? 'bg-[#e8e5e4] font-semibold dark:bg-[#454447]' : 'hover:bg-[#eeeceb] dark:hover:bg-[#363638]'}`}>
                        <span className={`grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold text-white ${['bg-[#f06a6a]', 'bg-[#a66dd4]', 'bg-[#4573d2]', 'bg-[#00a88b]'][index % 4]}`}>{project.name.slice(0, 1).toUpperCase()}</span>
                        <span className="min-w-0 flex-1 truncate">{project.name}</span>
                        <span className="text-xs text-[#8b8c8d]">{project.tasks_count}</span>
                    </button>)}</div>
                    {projects.length === 0 && <button className="w-full rounded-lg border border-dashed border-[#c9c6c4] p-5 text-sm text-[#6d6e6f]" onClick={() => setShowNewProject(true)}>Create your first project</button>}
                </div>
            </aside>

            <section className="min-w-0">
                {selected ? <>
                    <header className="border-b border-[#edeae9] dark:border-[#3d3e40]">
                        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5">
                            <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-[#a66dd4] font-bold text-white">{selected.name.slice(0, 1).toUpperCase()}</span><h1 className="text-xl font-semibold">{selected.name}</h1><Star size={17} className="text-[#6d6e6f]" /><button className="flex items-center gap-1 text-xs text-[#6d6e6f]"><Circle size={12} />Set status</button></div>
                            <div className="flex items-center gap-2"><div className="flex -space-x-2"><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#4573d2] text-[10px] font-bold text-white dark:border-[#1e1f21]">KR</span><span className="grid size-7 place-items-center rounded-full border-2 border-white bg-[#00a88b] text-[10px] font-bold text-white dark:border-[#1e1f21]">WF</span></div><Button size="sm" onClick={shareProject}>Share</Button><Button size="sm" variant="outline" onClick={() => setOpenMenu(openMenu === 'options' ? null : 'options')}><SlidersHorizontal size={14} />Customize</Button></div>
                        </div>
                        <nav className="mt-3 flex gap-1 overflow-x-auto px-5">{views.map((item) => <button key={item.id} onClick={() => setView(item.id)} className={`border-b-2 px-3 py-3 text-sm font-semibold ${view === item.id ? 'border-[#4573d2] text-[#4573d2]' : 'border-transparent text-[#6d6e6f] hover:text-[#1e1f21] dark:hover:text-white'}`}>{item.label}</button>)}</nav>
                    </header>

                    {notice && <div className="mx-6 mt-4 flex items-center gap-2 rounded-lg bg-[#e8f7f2] px-3 py-2 text-sm text-[#147d64] dark:bg-[#163c33] dark:text-[#6ee7c5]"><Check size={15} />{notice}</div>}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edeae9] px-6 py-3 dark:border-[#3d3e40]">
                        <InlineAddTask onCreate={(title) => createTask(title)} compact />
                        <div className="flex flex-wrap items-center gap-1 text-sm text-[#6d6e6f]">
                            <ToolbarMenu open={openMenu === 'filter'} button={<ToolbarButton active={activeFilterCount > 0} icon={<Filter size={15} />} label={`Filter${activeFilterCount ? ` (${activeFilterCount})` : ''}`} onClick={() => setOpenMenu(openMenu === 'filter' ? null : 'filter')} />}>
                                <MenuSelect label="Status" value={filters.status} onChange={(value) => setFilters({ ...filters, status: value })} options={[['all', 'All statuses'], ['not_started', 'Not started'], ['in_progress', 'In progress'], ['blocked', 'Blocked'], ['complete', 'Completed']]} />
                                <MenuSelect label="Priority" value={filters.priority} onChange={(value) => setFilters({ ...filters, priority: value })} options={[['all', 'All priorities'], ['low', 'Low'], ['medium', 'Medium'], ['high', 'High'], ['urgent', 'Urgent']]} />
                                <MenuSelect label="Assignee" value={filters.assignee} onChange={(value) => setFilters({ ...filters, assignee: value })} options={[['all', 'Anyone'], ['unassigned', 'Unassigned'], ...members.map((member) => [String(member.id), member.name] as [string, string])]} />
                                <MenuSelect label="Due date" value={filters.due} onChange={(value) => setFilters({ ...filters, due: value })} options={[['all', 'Any date'], ['overdue', 'Overdue'], ['today', 'Due today'], ['none', 'No due date']]} />
                                <button className="text-left text-xs font-semibold text-[#4573d2]" onClick={() => setFilters({ status: 'all', priority: 'all', assignee: 'all', due: 'all' })}>Clear filters</button>
                            </ToolbarMenu>
                            <ToolbarMenu open={openMenu === 'sort'} button={<ToolbarButton active={sortBy !== 'position'} icon={<ChevronDown size={15} />} label="Sort" onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')} />}>
                                <MenuSelect label="Sort by" value={sortBy} onChange={(value) => setSortBy(value as SortBy)} options={[['position', 'Default order'], ['title', 'Task name'], ['due_date', 'Due date'], ['priority', 'Priority'], ['assignee', 'Assignee']]} />
                                <MenuSelect label="Direction" value={sortDirection} onChange={(value) => setSortDirection(value as 'asc' | 'desc')} options={[['asc', 'Ascending'], ['desc', 'Descending']]} />
                            </ToolbarMenu>
                            <ToolbarMenu open={openMenu === 'group'} button={<ToolbarButton active={groupBy !== 'section'} icon={<LayoutDashboard size={15} />} label="Group" onClick={() => setOpenMenu(openMenu === 'group' ? null : 'group')} />}>
                                <MenuSelect label="Group tasks by" value={groupBy} onChange={(value) => setGroupBy(value as GroupBy)} options={[['section', 'Project section'], ['status', 'Status'], ['priority', 'Priority'], ['assignee', 'Assignee']]} />
                            </ToolbarMenu>
                            <ToolbarMenu open={openMenu === 'options'} button={<ToolbarButton active={!listOptions.showCompleted || listOptions.compact} icon={<SlidersHorizontal size={15} />} label="Options" onClick={() => setOpenMenu(openMenu === 'options' ? null : 'options')} />}>
                                <MenuToggle label="Show completed tasks" checked={listOptions.showCompleted} onChange={(checked) => setListOptions({ ...listOptions, showCompleted: checked })} />
                                <MenuToggle label="Compact rows" checked={listOptions.compact} onChange={(checked) => setListOptions({ ...listOptions, compact: checked })} />
                                <p className="pt-1 text-[11px] font-bold uppercase tracking-wide text-[#8b8c8d]">Visible fields</p>
                                <MenuToggle label="Assignee" checked={listOptions.assignee} onChange={(checked) => setListOptions({ ...listOptions, assignee: checked })} />
                                <MenuToggle label="Due date" checked={listOptions.dueDate} onChange={(checked) => setListOptions({ ...listOptions, dueDate: checked })} />
                                <MenuToggle label="Priority" checked={listOptions.priority} onChange={(checked) => setListOptions({ ...listOptions, priority: checked })} />
                                <MenuToggle label="Task progress" checked={listOptions.status} onChange={(checked) => setListOptions({ ...listOptions, status: checked })} />
                            </ToolbarMenu>
                            <div className="relative ml-2"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2" size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} className="h-8 w-36 rounded-lg border border-[#cfcbca] bg-transparent pl-8 pr-2 text-xs outline-none focus:border-[#4573d2]" placeholder="Search" /></div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {view === 'list' && <TaskList tasks={filteredTasks} members={members} groupBy={groupBy} options={listOptions} sections={selected.sections ?? []} onOpen={openTask} onCreate={createTask} onCreateSection={createSection} onUpdate={updateTask} />}
                        {view === 'board' && <TaskBoard tasks={filteredTasks} onOpen={openTask} />}
                        {view === 'timeline' && <TaskTimeline tasks={filteredTasks} onOpen={openTask} />}
                        {view === 'calendar' && <TaskCalendar tasks={filteredTasks} onOpen={openTask} />}
                        {view === 'dashboard' && <ProjectDashboard tasks={filteredTasks} />}
                    </div>
                </> : <div className="grid min-h-[70vh] place-items-center p-8 text-center"><div><List className="mx-auto text-[#a2a0a2]" size={44} /><h2 className="mt-4 text-xl font-semibold">Select a project</h2><p className="mt-2 text-sm text-[#6d6e6f]">Choose a project from the sidebar or create a new one.</p></div></div>}
            </section>
        </div>
        {selectedTaskId && selected && <AsanaTaskDetail taskId={selectedTaskId} projectId={selected.id} workspace={workspace} onClose={closeTask} onChanged={refreshProject} />}
    </main>;
}

function TaskList({ tasks, members, groupBy, options, sections, onOpen, onCreate, onCreateSection, onUpdate }: { tasks: Task[]; members: Member[]; groupBy: GroupBy; options: ListOptions; sections: Section[]; onOpen: (id: number) => void; onCreate: (title: string, isMilestone?: boolean, sectionId?: number | null) => Promise<void>; onCreateSection: (name: string) => Promise<void>; onUpdate: (task: Task, fields: Record<string, unknown>) => Promise<void> }) {
    const groups = taskGroups(tasks, groupBy, sections);
    const columns = ['minmax(320px,1fr)', options.assignee && '170px', options.dueDate && '130px', options.priority && '120px', options.status && '140px'].filter(Boolean).join(' ');

    return <div className="min-w-[760px] px-6 pb-12">
        <div className="grid border-b border-[#edeae9] text-xs text-[#6d6e6f] dark:border-[#3d3e40]" style={{ gridTemplateColumns: columns }}><span className="px-2 py-3">Name</span>{options.assignee && <span className="border-l border-[#edeae9] px-3 py-3 dark:border-[#3d3e40]">Assignee</span>}{options.dueDate && <span className="border-l border-[#edeae9] px-3 py-3 dark:border-[#3d3e40]">Due date</span>}{options.priority && <span className="border-l border-[#edeae9] px-3 py-3 dark:border-[#3d3e40]">Priority</span>}{options.status && <span className="border-l border-[#edeae9] px-3 py-3 dark:border-[#3d3e40]">Task progress</span>}</div>
        {groups.map((group) => <section key={group.title} className="pt-4 stagger-children"><h2 className="flex items-center gap-2 px-2 py-2 font-semibold"><ChevronDown size={16} />{group.title}<span className="text-xs font-normal text-[#8b8c8d]">{group.tasks.length}</span></h2>
            {group.tasks.map((task) => <TaskRow key={task.id} task={task} members={members} options={options} columns={columns} onOpen={onOpen} onUpdate={onUpdate} />)}
            {groupBy === 'section' && <InlineAddTask onCreate={(title) => onCreate(title, false, group.sectionId)} />}
        </section>)}
        {groups.length === 0 && <div className="grid min-h-44 place-items-center text-sm text-[#8b8c8d]">No tasks match these filters.</div>}
        {groupBy !== 'section' && <InlineAddTask onCreate={onCreate} />}
        {groupBy === 'section' && <AddSection onAdd={onCreateSection} />}
    </div>;
}

function AddSection({ onAdd }: { onAdd: (name: string) => Promise<void> }) {
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState('');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!name.trim()) {
            return;
        }
        await onAdd(name.trim());
        setName('');
        setEditing(false);
    }

    if (!editing) {
        return <button onClick={() => setEditing(true)} className="mt-4 flex items-center gap-2 px-2 py-2 text-sm font-semibold text-[#6d6e6f] hover:text-[#1e1f21] dark:hover:text-white"><Plus size={17} />Add section</button>;
    }

    return <form onSubmit={submit} className="mt-4 flex items-center gap-2 px-2"><Input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Section name" className="h-9 w-72 rounded-lg" /><Button type="submit" size="sm" className="whitespace-nowrap">Add section</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></form>;
}

function TaskRow({ task, members, options, columns, onOpen, onUpdate }: { task: Task; members: Member[]; options: ListOptions; columns: string; onOpen: (id: number) => void; onUpdate: (task: Task, fields: Record<string, unknown>) => Promise<void> }) {
    return <div className="group grid border-b border-[#edeae9] text-sm hover:bg-[#f9f8f8] dark:border-[#3d3e40] dark:hover:bg-[#28282a]" style={{ gridTemplateColumns: columns }}>
        <div onClick={() => onOpen(task.id)} className={`flex min-w-0 cursor-pointer items-center gap-3 px-7 ${options.compact ? 'py-1' : 'py-2'} hover:bg-[#f7f5f4] dark:hover:bg-[#292a2c]`}><button aria-label={`${task.status === 'complete' ? 'Reopen' : 'Complete'} ${task.title}`} onClick={(event) => { event.stopPropagation(); void onUpdate(task, { status: task.status === 'complete' ? 'not_started' : 'complete' }); }} className={`grid size-4 shrink-0 place-items-center rounded-full border ${task.status === 'complete' ? 'border-[#00a88b] bg-[#00a88b] text-white' : 'border-[#8b8c8d] hover:border-[#00a88b] hover:text-[#00a88b]'}`}>{task.status === 'complete' && <Check size={11} />}</button><button onClick={(event) => { event.stopPropagation(); onOpen(task.id); }} className="min-w-0 truncate text-left">{task.title}</button></div>
        {options.assignee && <div className="flex items-center border-l border-[#edeae9] px-2 dark:border-[#3d3e40]"><select aria-label={`Assignee for ${task.title}`} value={task.assignee?.id ?? ''} onChange={(event) => onUpdate(task, { assignee_id: event.target.value ? Number(event.target.value) : null })} className="w-full bg-transparent py-1 text-xs outline-none"><option value="">Unassigned</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></div>}
        {options.dueDate && <div className="flex items-center border-l border-[#edeae9] px-2 dark:border-[#3d3e40]"><input aria-label={`Due date for ${task.title}`} type="date" value={task.due_date ?? ''} onChange={(event) => onUpdate(task, { due_date: event.target.value || null })} className="w-full bg-transparent text-xs text-[#6d6e6f] outline-none" /></div>}
        {options.priority && <div className="flex items-center border-l border-[#edeae9] px-2 dark:border-[#3d3e40]"><select aria-label={`Priority for ${task.title}`} value={task.priority} onChange={(event) => onUpdate(task, { priority: event.target.value })} className={`w-full rounded px-2 py-1 text-xs font-semibold outline-none ${priorityClass(task.priority)}`}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>}
        {options.status && <div className="flex items-center border-l border-[#edeae9] px-2 dark:border-[#3d3e40]"><select aria-label={`Status for ${task.title}`} value={task.status} onChange={(event) => onUpdate(task, { status: event.target.value })} className={`w-full rounded px-2 py-1 text-xs font-semibold outline-none ${statusClass(task.status)}`}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="complete">Done</option></select></div>}
    </div>;
}

function InlineAddTask({ onCreate, compact = false }: { onCreate: (title: string) => Promise<void>; compact?: boolean }) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');

    async function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        await onCreate(title);
        setTitle('');
        setEditing(false);
    }

    if (!editing) {
        return <button onClick={() => setEditing(true)} className={`flex items-center gap-2 text-sm ${compact ? 'rounded-lg border border-[#cfcbca] px-3 py-1.5 font-semibold' : 'px-14 py-2 text-[#6d6e6f]'}`}><Plus size={15} />Add task{compact && <ChevronDown size={14} />}</button>;
    }

    return <form onSubmit={submit} className={`flex items-center gap-2 ${compact ? '' : 'px-7 py-1.5'}`}><Input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task name" className="h-8 w-72 rounded-lg" /><Button type="submit" size="sm">Add</Button><Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></form>;
}

function TaskBoard({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: number) => void }) {
    return <div className="grid min-w-[760px] grid-cols-4 gap-4 p-6 stagger-children">{['not_started', 'in_progress', 'blocked', 'complete'].map((status) => <section key={status} className="rounded-xl bg-[#f7f5f4] p-3 dark:bg-[#292a2c]"><h2 className="mb-3 text-sm font-semibold capitalize">{status.replaceAll('_', ' ')}</h2><div className="grid gap-2 stagger-children">{tasks.filter((task) => task.status === status).map((task) => <button key={task.id} onClick={() => onOpen(task.id)} className="rounded-lg border border-[#edeae9] bg-white p-3 text-left text-sm shadow-sm dark:border-[#3d3e40] dark:bg-[#1e1f21]">{task.title}</button>)}</div></section>)}</div>;
}

function TaskTimeline({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: number) => void }) {
    return <div className="grid gap-3 p-6 stagger-children">{tasks.map((task, index) => <button key={task.id} onClick={() => onOpen(task.id)} className="grid grid-cols-[180px_1fr] items-center gap-4 text-left"><span className="truncate text-sm">{task.title}</span><span className="relative h-8 rounded bg-[#f1f0ef] dark:bg-[#292a2c]"><span className="absolute top-1 h-6 rounded bg-[#4573d2]" style={{ left: `${(index * 9) % 55}%`, width: `${20 + (index % 3) * 8}%` }} /></span></button>)}</div>;
}

function TaskCalendar({ tasks, onOpen }: { tasks: Task[]; onOpen: (id: number) => void }) {
    return <div className="grid gap-3 p-6 stagger-children sm:grid-cols-2 xl:grid-cols-3">{tasks.map((task) => <button key={task.id} onClick={() => onOpen(task.id)} className="rounded-xl border border-[#edeae9] p-4 text-left dark:border-[#3d3e40]"><CalendarDays size={17} className="mb-3 text-[#4573d2]" /><strong className="block text-sm">{task.title}</strong><span className="mt-1 block text-xs text-[#6d6e6f]">{task.due_date ?? 'No due date'}</span></button>)}</div>;
}

function ProjectDashboard({ tasks }: { tasks: Task[] }) {
    const complete = tasks.filter((task) => task.status === 'complete').length;
    return <div className="grid gap-4 p-6 stagger-children sm:grid-cols-3"><Stat label="Total tasks" value={tasks.length} /><Stat label="Completed" value={complete} /><Stat label="In progress" value={tasks.filter((task) => task.status === 'in_progress').length} /><div className="sm:col-span-3 rounded-xl border border-[#edeae9] p-5 dark:border-[#3d3e40]"><h2 className="font-semibold">Progress</h2><div className="mt-4 h-3 overflow-hidden rounded-full bg-[#edeae9] dark:bg-[#3d3e40]"><div className="h-full bg-[#00a88b]" style={{ width: `${tasks.length ? (complete / tasks.length) * 100 : 0}%` }} /></div></div></div>;
}

function Stat({ label, value }: { label: string; value: number }) {
    return <div className="rounded-xl border border-[#edeae9] p-5 dark:border-[#3d3e40]"><span className="text-sm text-[#6d6e6f]">{label}</span><strong className="mt-2 block text-3xl">{value}</strong></div>;
}

function taskGroups(tasks: Task[], groupBy: GroupBy, sections: Section[]): { title: string; tasks: Task[]; sectionId: number | null }[] {
    if (groupBy === 'section') {
        if (sections.length === 0) {
            return [{ title: 'Tasks', tasks, sectionId: null }];
        }

        const known = new Set(sections.map((section) => section.id));
        const groups: { title: string; tasks: Task[]; sectionId: number | null }[] = sections.map((section) => ({
            title: section.name,
            sectionId: section.id,
            tasks: tasks.filter((task) => task.section_id === section.id),
        }));
        const unsectioned = tasks.filter((task) => !task.section_id || !known.has(task.section_id));

        if (unsectioned.length > 0) {
            groups.push({ title: 'No section', sectionId: null, tasks: unsectioned });
        }

        return groups;
    }

    const labels: Record<string, string> = {
        not_started: 'Not started', in_progress: 'In progress', blocked: 'Blocked', complete: 'Completed',
        low: 'Low priority', medium: 'Medium priority', high: 'High priority', urgent: 'Urgent',
    };
    const grouped = new Map<string, Task[]>();

    tasks.forEach((task) => {
        const key = groupBy === 'assignee' ? task.assignee?.name ?? 'Unassigned' : task[groupBy];
        grouped.set(key, [...(grouped.get(key) ?? []), task]);
    });

    return [...grouped.entries()].map(([key, groupedTasks]) => ({ title: labels[key] ?? key, tasks: groupedTasks, sectionId: null }));
}

function ToolbarMenu({ open, button, children }: { open: boolean; button: ReactNode; children: ReactNode }) {
    return <div className="relative">{button}{open && <div className="absolute right-0 top-full z-30 mt-1 grid min-w-56 gap-3 rounded-xl border border-[#cfcbca] bg-white p-3 text-[#1e1f21] shadow-xl dark:border-[#4b4c4f] dark:bg-[#292a2c] dark:text-[#f5f4f3]">{children}</div>}</div>;
}

function ToolbarButton({ icon, label, active = false, onClick }: { icon: ReactNode; label: string; active?: boolean; onClick: () => void }) {
    return <button onClick={onClick} className={`flex items-center gap-1 rounded-md px-2 py-1.5 ${active ? 'bg-[#e9f2ff] font-semibold text-[#2f6fce] dark:bg-[#263a55]' : 'hover:bg-[#f1f0ef] dark:hover:bg-[#292a2c]'}`}>{icon}{label}</button>;
}

function MenuSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
    return <label className="grid gap-1 text-xs font-semibold"><span>{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-9 rounded-lg border border-[#cfcbca] bg-white px-2 text-sm font-normal outline-none focus:border-[#4573d2] dark:border-[#4b4c4f] dark:bg-[#1e1f21]">{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}

function MenuToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
    return <label className="flex items-center justify-between gap-4 text-sm"><span>{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="size-4 accent-[#4573d2]" /></label>;
}

function priorityClass(priority: string): string {
    return priority === 'urgent' || priority === 'high' ? 'bg-[#ff7361] text-[#501c17]' : priority === 'medium' ? 'bg-[#f8c458] text-[#4f3700]' : 'bg-[#e8e5e4] text-[#494a4b]';
}

function statusClass(status: string): string {
    return status === 'complete' ? 'bg-[#67d7c4] text-[#173f38]' : status === 'in_progress' ? 'bg-[#9ec5ff] text-[#153d75]' : status === 'blocked' ? 'bg-[#ffb4a8] text-[#5d1f17]' : 'bg-[#e8e5e4] text-[#494a4b]';
}
