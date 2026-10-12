import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useEcho } from '@laravel/echo-react';
import { Activity, ArrowUp, CalendarDays, Check, ChevronDown, Circle, Download, Expand, Link2, LoaderCircle, MoreHorizontal, Paperclip, Plus, Share2, Smile, Star, Trash2, UserRound, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { request, type Task, type Workspace } from './planning-view';

type Member = { id: number; name: string; email: string };
type Comment = { id: number; body: string; author: { id: number; name: string }; created_at: string };
type Attachment = { id: number; name: string; size: number; url: string };
type ActivityItem = { id: number; event: string; actor: string | null; created_at: string };
type CustomFieldValue = { id: number; name: string; type: string; value: string | null };
type DetailedTask = Task & {
    parent_id: number | null;
    completed_at: string | null;
    project: { id: number; name: string };
    assignee: Member | null;
    subtasks: DetailedTask[];
    comments: Comment[];
    attachments: Attachment[];
    activity: ActivityItem[];
    custom_fields: CustomFieldValue[];
};

type ProjectTasks = { data: { tasks: Task[] } };

export function AsanaTaskDetail({ taskId, projectId, workspace, onClose, onChanged }: { taskId: number; projectId: number; workspace: Workspace; onClose: () => void; onChanged: () => void }) {
    const [task, setTask] = useState<DetailedTask | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [projectTasks, setProjectTasks] = useState<Task[]>([]);
    const [tab, setTab] = useState<'comments' | 'activity'>('comments');
    const [message, setMessage] = useState('');

    async function load() {
        const [{ data: taskData }, { data: memberData }, projectData] = await Promise.all([
            request<{ data: DetailedTask }>(`/api/v1/tasks/${taskId}`),
            request<{ data: Member[] }>(`/api/v1/workspaces/${workspace.id}/members`),
            request<ProjectTasks>(`/api/v1/projects/${projectId}`),
        ]);
        setTask(taskData);
        setMembers(memberData);
        setProjectTasks(projectData.data.tasks);
    }

    useEffect(() => {
        load();
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', closeOnEscape);
        return () => document.removeEventListener('keydown', closeOnEscape);
    }, [taskId, workspace.id]);

    useEcho<{ task_id: number }>(`workspace.${workspace.id}`, '.task.changed', (event) => {
        if (event.task_id === taskId) load();
    }, [taskId]);

    async function update(fields: Record<string, unknown>, confirmation = 'Task updated') {
        await request(`/api/v1/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(fields) });
        await load();
        await onChanged();
        setMessage(confirmation);
    }

    async function addComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const body = String(new FormData(form).get('body') ?? '');
        await request(`/api/v1/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
        form.reset();
        await load();
        setTab('comments');
    }

    async function addSubtask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const title = String(new FormData(form).get('title') ?? '');
        await request(`/api/v1/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify({ title, parent_id: taskId }) });
        form.reset();
        await load();
        await onChanged();
    }

    async function upload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        await request(`/api/v1/tasks/${taskId}/attachments`, { method: 'POST', body: new FormData(form) });
        form.reset();
        await load();
    }

    async function removeAttachment(attachmentId: number) {
        await request(`/api/v1/attachments/${attachmentId}`, { method: 'DELETE' });
        await load();
    }

    async function addDependency(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const predecessorTaskId = Number(new FormData(form).get('predecessor_task_id'));
        await request(`/api/v1/tasks/${taskId}/dependencies`, { method: 'POST', body: JSON.stringify({ predecessor_task_id: predecessorTaskId }) });
        form.reset();
        await load();
    }

    async function removeDependency(predecessorTaskId: number) {
        await request(`/api/v1/tasks/${taskId}/dependencies`, { method: 'DELETE', body: JSON.stringify({ predecessor_task_id: predecessorTaskId }) });
        await load();
    }

    async function deleteTask() {
        if (!window.confirm('Delete this task permanently?')) return;
        await request(`/api/v1/tasks/${taskId}`, { method: 'DELETE' });
        await onChanged();
        onClose();
    }

    async function copyLink() {
        const url = new URL(window.location.href);
        url.searchParams.set('task', String(taskId));
        await navigator.clipboard.writeText(url.toString());
        setMessage('Task link copied');
    }

    async function shareTask() {
        const url = new URL(window.location.href);
        url.searchParams.set('task', String(taskId));
        if (navigator.share) {
            await navigator.share({ title: task?.title, url: url.toString() });
            return;
        }
        await copyLink();
    }

    const dependencyOptions = useMemo(() => projectTasks.filter((candidate) => candidate.id !== taskId && !task?.predecessors.some((item) => item.id === candidate.id)), [projectTasks, task?.predecessors, taskId]);

    return <div className="drawer-backdrop-enter fixed inset-0 z-50 flex justify-end bg-black/30" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
        <aside className="drawer-panel-enter flex h-full w-full max-w-[780px] flex-col border-l border-[#3d3e40] bg-white shadow-2xl dark:bg-[#1e1f21]">
            {!task ? <div className="grid h-full place-items-center"><LoaderCircle className="animate-spin text-[#4573d2]" /></div> : <>
                <header className="flex shrink-0 items-center justify-between border-b border-[#edeae9] px-5 py-3 dark:border-[#3d3e40]">
                    <button onClick={() => update({ status: task.status === 'complete' ? 'not_started' : 'complete' }, task.status === 'complete' ? 'Task reopened' : 'Task completed')} className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold ${task.status === 'complete' ? 'border-[#00a88b] bg-[#e8f7f2] text-[#147d64] dark:bg-[#163c33] dark:text-[#6ee7c5]' : 'border-[#cfcbca] hover:bg-[#f7f5f4] dark:border-[#565557] dark:hover:bg-[#292a2c]'}`}><span className={`grid size-4 place-items-center rounded-full border ${task.status === 'complete' ? 'border-[#00a88b] bg-[#00a88b] text-white' : 'border-[#8b8c8d]'}`}>{task.status === 'complete' && <Check size={11} />}</span>{task.status === 'complete' ? 'Completed' : 'Mark complete'}</button>
                    <div className="flex items-center gap-1"><Button size="sm" variant="outline" onClick={shareTask}><Share2 size={14} />Share</Button><Button size="icon" variant="ghost" aria-label="Copy task link" onClick={copyLink}><Link2 size={17} /></Button><Button size="icon" variant="ghost" aria-label="Expand task"><Expand size={17} /></Button><Button size="icon" variant="ghost" aria-label="More task actions"><MoreHorizontal size={18} /></Button><Button size="icon" variant="ghost" aria-label="Close task" onClick={onClose}><X size={19} /></Button></div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="drawer-content-enter mx-auto grid max-w-[690px] gap-7 px-6 py-7 sm:px-8">
                        {message && <div className="flex items-center gap-2 rounded-lg bg-[#e8f7f2] px-3 py-2 text-sm text-[#147d64] dark:bg-[#163c33] dark:text-[#6ee7c5]"><Check size={15} />{message}</div>}
                        <input key={`${task.id}-${task.title}`} defaultValue={task.title} onBlur={(event) => { if (event.target.value.trim() && event.target.value !== task.title) update({ title: event.target.value.trim() }, 'Title updated'); }} className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-[#a2a0a2]" aria-label="Task title" />

                        <section className="grid gap-1 text-sm">
                            <DetailRow label="Assignee" icon={<UserRound size={17} />}><select value={task.assignee?.id ?? ''} onChange={(event) => update({ assignee_id: event.target.value ? Number(event.target.value) : null }, 'Assignee updated')} className="w-full bg-transparent py-2 outline-none"><option value="">No assignee</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></DetailRow>
                            <DetailRow label="Start date" icon={<CalendarDays size={17} />}><input type="date" value={task.start_date ?? ''} onChange={(event) => update({ start_date: event.target.value || null }, 'Start date updated')} className="w-full bg-transparent py-2 outline-none" /></DetailRow>
                            <DetailRow label="Due date" icon={<CalendarDays size={17} />}><input type="date" value={task.due_date ?? ''} onChange={(event) => update({ due_date: event.target.value || null }, 'Due date updated')} className="w-full bg-transparent py-2 outline-none" /></DetailRow>
                            <DetailRow label="Dependencies" icon={<Link2 size={17} />}><div className="flex flex-wrap gap-2 py-2">{task.predecessors.map((predecessor) => <button key={predecessor.id} onClick={() => removeDependency(predecessor.id)} className="rounded-md bg-[#f1f0ef] px-2 py-1 text-xs dark:bg-[#323234]">{predecessor.title} ×</button>)}<form className="flex min-w-48 flex-1 gap-2" onSubmit={addDependency}><select name="predecessor_task_id" required className="min-w-0 flex-1 bg-transparent outline-none"><option value="">Add dependencies</option>{dependencyOptions.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.title}</option>)}</select><button aria-label="Add dependency" className="text-[#4573d2]"><Plus size={17} /></button></form></div></DetailRow>
                            <DetailRow label="Project" icon={<Circle size={17} />}><div className="flex items-center gap-2 py-2"><span className="size-3 rounded bg-[#a66dd4]" /><strong>{task.project.name}</strong><span className="text-[#6d6e6f]">Planning</span><ChevronDown size={14} /></div></DetailRow>
                            <DetailRow label="Priority" icon={<Star size={17} />}><select value={task.priority} onChange={(event) => update({ priority: event.target.value }, 'Priority updated')} className={`my-1 rounded px-2 py-1 text-xs font-semibold outline-none ${priorityClass(task.priority)}`}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></DetailRow>
                            <DetailRow label="Status" icon={<Circle size={17} />}><select value={task.status} onChange={(event) => update({ status: event.target.value }, 'Status updated')} className={`my-1 rounded px-2 py-1 text-xs font-semibold outline-none ${statusClass(task.status)}`}><option value="not_started">Not started</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="complete">Done</option></select></DetailRow>
                            <DetailRow label="Repeat" icon={<Activity size={17} />}><select value={task.recurrence ?? ''} onChange={(event) => update({ recurrence: event.target.value || null }, 'Recurrence updated')} className="w-full bg-transparent py-2 outline-none"><option value="">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></DetailRow>
                        </section>

                        {task.custom_fields.length > 0 && <section><h3 className="mb-3 text-sm font-semibold">Custom fields</h3><div className="grid gap-2 sm:grid-cols-2">{task.custom_fields.map((field) => <label key={field.id} className="grid gap-1 text-xs text-[#6d6e6f]"><span>{field.name}</span><Input defaultValue={field.value ?? ''} type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'} onBlur={(event) => update({ custom_fields: Object.fromEntries(task.custom_fields.map((item) => [item.id, item.id === field.id ? event.target.value : item.value])) }, `${field.name} updated`)} className="h-9 rounded-lg" /></label>)}</div></section>}

                        <section><h3 className="mb-3 text-sm font-semibold">Description</h3><textarea key={`${task.id}-${task.description}`} defaultValue={task.description ?? ''} onBlur={(event) => { if (event.target.value !== (task.description ?? '')) update({ description: event.target.value || null }, 'Description updated'); }} rows={7} placeholder="Add details, steps to reproduce, expected results, or links…" className="w-full resize-y rounded-lg border border-transparent bg-transparent p-3 text-sm leading-6 outline-none hover:border-[#cfcbca] focus:border-[#4573d2] dark:hover:border-[#565557]" /></section>

                        <section><div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-semibold">Subtasks <span className="ml-1 text-[#6d6e6f]">{task.subtasks.length}</span></h3><SlidersHorizontalIcon /></div><div className="border-y border-[#edeae9] dark:border-[#3d3e40]">{task.subtasks.map((subtask) => <div key={subtask.id} className="flex items-center gap-3 border-b border-[#edeae9] px-2 py-2 last:border-0 dark:border-[#3d3e40]"><button aria-label={`Complete ${subtask.title}`} onClick={() => request(`/api/v1/tasks/${subtask.id}`, { method: 'PATCH', body: JSON.stringify({ status: subtask.status === 'complete' ? 'not_started' : 'complete' }) }).then(load)} className={`grid size-4 place-items-center rounded-full border ${subtask.status === 'complete' ? 'border-[#00a88b] bg-[#00a88b] text-white' : 'border-[#8b8c8d]'}`}>{subtask.status === 'complete' && <Check size={11} />}</button><button onClick={() => setMessage(`Open subtask “${subtask.title}” from the project list`)} className="min-w-0 flex-1 truncate text-left text-sm">{subtask.title}</button><span className="text-xs text-[#6d6e6f]">{subtask.due_date ?? 'No date'}</span></div>)}</div><form className="mt-2 flex gap-2" onSubmit={addSubtask}><Input name="title" required placeholder="Add subtask" className="h-9 rounded-lg border-transparent bg-transparent hover:border-[#cfcbca]" /><Button type="submit" size="sm" variant="ghost"><Plus size={15} />Add</Button></form></section>

                        <section><div className="mb-3 flex items-center gap-2"><h3 className="text-sm font-semibold">Attachments</h3><label className="grid size-7 place-items-center rounded-md hover:bg-[#f1f0ef] dark:hover:bg-[#292a2c]"><Plus size={16} /><input form="task-attachment-form" name="file" type="file" className="hidden" onChange={(event) => event.currentTarget.form?.requestSubmit()} /></label></div><div className="grid gap-2 sm:grid-cols-2">{task.attachments.map((file) => <div key={file.id} className="flex items-center gap-3 rounded-lg border border-[#edeae9] p-3 dark:border-[#3d3e40]"><Paperclip size={17} className="text-[#6d6e6f]" /><a href={file.url} className="min-w-0 flex-1 truncate text-sm font-semibold">{file.name}</a><a href={file.url} aria-label={`Download ${file.name}`}><Download size={15} /></a><button aria-label={`Delete ${file.name}`} onClick={() => removeAttachment(file.id)}><X size={15} /></button></div>)}</div><form id="task-attachment-form" onSubmit={upload} className="hidden" /></section>

                        <section><div className="flex items-center justify-between border-b border-[#edeae9] dark:border-[#3d3e40]"><div className="flex gap-1"><button onClick={() => setTab('comments')} className={`px-3 py-2 text-sm font-semibold ${tab === 'comments' ? 'border-b-2 border-[#4573d2] text-[#4573d2]' : 'text-[#6d6e6f]'}`}>Comments</button><button onClick={() => setTab('activity')} className={`px-3 py-2 text-sm font-semibold ${tab === 'activity' ? 'border-b-2 border-[#4573d2] text-[#4573d2]' : 'text-[#6d6e6f]'}`}>All activity</button></div><span className="text-xs text-[#6d6e6f]">Oldest</span></div>
                            <div className="grid gap-4 py-4">{tab === 'comments' ? task.comments.map((comment) => <article key={comment.id} className="flex gap-3"><Avatar name={comment.author.name} /><div><p className="text-sm"><strong>{comment.author.name}</strong> <span className="text-xs text-[#6d6e6f]">{new Date(comment.created_at).toLocaleString()}</span></p><p className="mt-1 whitespace-pre-wrap text-sm leading-6">{comment.body}</p></div></article>) : task.activity.map((item) => <article key={item.id} className="flex gap-3"><Avatar name={item.actor ?? 'System'} /><p className="text-sm"><strong>{item.actor ?? 'System'}</strong> {activityText(item.event)} <span className="text-xs text-[#6d6e6f]">{new Date(item.created_at).toLocaleString()}</span></p></article>)}</div>
                        </section>

                        <button onClick={deleteTask} className="flex w-fit items-center gap-2 text-sm font-semibold text-[#b43232]"><Trash2 size={16} />Delete task</button>
                    </div>
                </div>

                <form onSubmit={addComment} className="shrink-0 border-t border-[#edeae9] bg-white p-4 dark:border-[#3d3e40] dark:bg-[#1e1f21]"><div className="mx-auto max-w-[690px] rounded-xl border border-[#cfcbca] p-3 focus-within:border-[#4573d2] dark:border-[#565557]"><textarea name="body" required rows={2} placeholder="Add a comment or @mention a teammate" className="w-full resize-none bg-transparent text-sm outline-none" /><div className="mt-2 flex items-center justify-between text-[#6d6e6f]"><div className="flex gap-1"><button type="button" className="rounded p-1.5 hover:bg-[#f1f0ef] dark:hover:bg-[#292a2c]"><Plus size={17} /></button><button type="button" className="rounded p-1.5 hover:bg-[#f1f0ef] dark:hover:bg-[#292a2c]"><Smile size={17} /></button><button type="button" className="rounded p-1.5 hover:bg-[#f1f0ef] dark:hover:bg-[#292a2c]">@</button><button type="button" className="rounded p-1.5 hover:bg-[#f1f0ef] dark:hover:bg-[#292a2c]"><Star size={17} /></button></div><button aria-label="Post comment" className="grid size-8 place-items-center rounded-lg bg-[#4573d2] text-white"><ArrowUp size={17} /></button></div></div></form>
            </>}
        </aside>
    </div>;
}

function DetailRow({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
    return <div className="grid grid-cols-[130px_1fr] items-center border-b border-transparent"><span className="flex items-center gap-2 py-2 font-semibold">{icon}{label}</span><div className="min-w-0 text-[#6d6e6f] dark:text-[#c7c4c2]">{children}</div></div>;
}

function Avatar({ name }: { name: string }) {
    return <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#e8e5e4] text-[10px] font-bold text-[#494a4b]">{name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span>;
}

function SlidersHorizontalIcon() {
    return <button aria-label="Subtask options" className="text-[#6d6e6f]"><MoreHorizontal size={17} /></button>;
}

function priorityClass(priority: string): string {
    return priority === 'urgent' || priority === 'high' ? 'bg-[#ff7361] text-[#501c17]' : priority === 'medium' ? 'bg-[#f8c458] text-[#4f3700]' : 'bg-[#e8e5e4] text-[#494a4b]';
}

function statusClass(status: string): string {
    return status === 'complete' ? 'bg-[#67d7c4] text-[#173f38]' : status === 'in_progress' ? 'bg-[#9ec5ff] text-[#153d75]' : status === 'blocked' ? 'bg-[#ffb4a8] text-[#5d1f17]' : 'bg-[#e8e5e4] text-[#494a4b]';
}

function activityText(event: string | null | undefined): string {
    const labels: Record<string, string> = { 'task.created': 'created this task', 'task.updated': 'updated this task', 'comment.created': 'commented', 'attachment.created': 'added an attachment', 'dependency.created': 'added a dependency', 'dependency.deleted': 'removed a dependency' };
    const normalizedEvent = event ?? 'activity.updated';
    return labels[normalizedEvent] ?? normalizedEvent.replaceAll('.', ' ');
}
