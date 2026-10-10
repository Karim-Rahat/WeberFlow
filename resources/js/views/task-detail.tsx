import { useEffect, useState, type FormEvent } from 'react';
import { useEcho } from '@laravel/echo-react';
import { Activity, Download, LoaderCircle, MessageSquare, Paperclip, Plus, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { type Task, type Workspace } from './planning-view';

type Member = { id: number; name: string; email: string };
type Comment = { id: number; body: string; author: { id: number; name: string }; created_at: string };
type Attachment = { id: number; name: string; size: number; url: string };
type ActivityItem = { id: number; event: string; actor: string | null; created_at: string };
type DetailedTask = Task & { assignee: Member | null; comments: Comment[]; attachments: Attachment[]; activity: ActivityItem[] };

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const csrfCookie = document.cookie.split('; ').find((cookie) => cookie.startsWith('XSRF-TOKEN='))?.split('=')[1];
    const response = await fetch(url, { credentials: 'include', headers: { Accept: 'application/json', ...(!(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}), ...(csrfCookie ? { 'X-XSRF-TOKEN': decodeURIComponent(csrfCookie) } : {}) }, ...options });
    if (!response.ok) throw await response.json();
    return response.json() as Promise<T>;
}

export function TaskDetail({ taskId, projectId, workspace, onClose, onChanged }: { taskId: number; projectId: number; workspace: Workspace; onClose: () => void; onChanged: () => void }) {
    const [task, setTask] = useState<DetailedTask | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [message, setMessage] = useState('');

    async function load() {
        const [{ data: taskData }, { data: memberData }] = await Promise.all([
            request<{ data: DetailedTask }>(`/api/v1/tasks/${taskId}`),
            request<{ data: Member[] }>(`/api/v1/workspaces/${workspace.id}/members`),
        ]);
        setTask(taskData);
        setMembers(memberData);
    }

    useEffect(() => { load(); }, [taskId, workspace.id]);
    useEcho<{ task_id: number }>(`workspace.${workspace.id}`, '.task.changed', (event) => { if (event.task_id === taskId) load(); }, [taskId]);

    async function update(fields: Record<string, unknown>) {
        await request(`/api/v1/tasks/${taskId}`, { method: 'PATCH', body: JSON.stringify(fields) });
        await load();
        await onChanged();
        setMessage('Task updated.');
    }

    async function addComment(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const body = String(new FormData(form).get('body') ?? '');
        await request(`/api/v1/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ body }) });
        form.reset();
        await load();
        setMessage('Comment added. Use @email to mention a teammate.');
    }

    async function addSubtask(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        const title = String(new FormData(form).get('title') ?? '');
        await request(`/api/v1/projects/${projectId}/tasks`, { method: 'POST', body: JSON.stringify({ title, parent_id: taskId }) });
        form.reset();
        await onChanged();
        setMessage('Subtask created.');
    }

    async function upload(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = event.currentTarget;
        await request(`/api/v1/tasks/${taskId}/attachments`, { method: 'POST', body: new FormData(form) });
        form.reset();
        await load();
        setMessage('Attachment uploaded privately.');
    }

    return <div className="fixed inset-0 z-50 flex justify-end bg-black/35" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
        <aside className="h-full w-full max-w-2xl overflow-y-auto border-l border-[#dce3dc] bg-[#f7f8f4] p-5 shadow-2xl dark:border-[#303a33] dark:bg-[#111512] sm:p-7">
            {!task ? <div className="grid h-full place-items-center"><LoaderCircle className="animate-spin text-brand-600" /></div> : <div className="grid gap-6">
                <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">Task details</p><h2 className="mt-1 text-2xl font-semibold">{task.title}</h2></div><Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button></header>
                {message && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-700 dark:bg-brand-900 dark:text-brand-300">{message}</p>}
                <section className="grid gap-4 rounded-2xl border border-[#dce3dc] bg-white p-5 dark:border-[#303a33] dark:bg-[#181d1a] sm:grid-cols-3">
                    <SelectField label="Status" value={task.status} onChange={(value) => update({ status: value })} options={[['not_started', 'Not started'], ['in_progress', 'In progress'], ['blocked', 'Blocked'], ['complete', 'Complete']]} />
                    <SelectField label="Priority" value={task.priority} onChange={(value) => update({ priority: value })} options={['low', 'medium', 'high', 'urgent'].map((value) => [value, value])} />
                    <SelectField label="Assignee" value={task.assignee?.id ? String(task.assignee.id) : ''} onChange={(value) => update({ assignee_id: value ? Number(value) : null })} options={[['', 'Unassigned'], ...members.map((member) => [String(member.id), member.name])]} />
                </section>
                <section className="grid gap-3 rounded-2xl border border-[#dce3dc] bg-white p-5 dark:border-[#303a33] dark:bg-[#181d1a]"><h3 className="flex items-center gap-2 font-bold"><Plus size={16} />Subtask</h3><form className="flex gap-2" onSubmit={addSubtask}><Input name="title" required placeholder="Add a smaller step" /><Button type="submit">Add</Button></form></section>
                <section className="grid gap-4 rounded-2xl border border-[#dce3dc] bg-white p-5 dark:border-[#303a33] dark:bg-[#181d1a]"><h3 className="flex items-center gap-2 font-bold"><MessageSquare size={16} />Comments</h3><div className="grid gap-3">{task.comments.map((comment) => <article key={comment.id} className="rounded-xl bg-[#f4f6f1] p-3 dark:bg-[#222a25]"><strong className="text-sm">{comment.author.name}</strong><p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p></article>)}{task.comments.length === 0 && <p className="text-sm text-[#68736c]">No comments yet.</p>}</div><form className="grid gap-2" onSubmit={addComment}><textarea name="body" required rows={3} placeholder="Comment or mention @person@example.com" className="rounded-xl border border-[#dce3dc] bg-transparent p-3 text-sm outline-none focus:border-brand-500 dark:border-[#303a33]" /><Button type="submit">Post comment</Button></form></section>
                <section className="grid gap-4 rounded-2xl border border-[#dce3dc] bg-white p-5 dark:border-[#303a33] dark:bg-[#181d1a]"><h3 className="flex items-center gap-2 font-bold"><Paperclip size={16} />Attachments</h3>{task.attachments.map((file) => <a key={file.id} href={file.url} className="flex items-center gap-2 text-sm font-semibold text-brand-600"><Download size={15} />{file.name}</a>)}<form className="flex flex-wrap gap-2" onSubmit={upload}><Input name="file" type="file" required className="flex-1" /><Button type="submit">Upload</Button></form></section>
                <section className="grid gap-3 rounded-2xl border border-[#dce3dc] bg-white p-5 dark:border-[#303a33] dark:bg-[#181d1a]"><h3 className="flex items-center gap-2 font-bold"><Activity size={16} />Activity</h3>{task.activity.map((item) => <p key={item.id} className="text-sm"><strong>{item.actor ?? 'System'}</strong> · {item.event.replace('.', ' ')}</p>)}</section>
            </div>}
        </aside>
    </div>;
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[][]; onChange: (value: string) => void }) {
    return <div className="grid gap-2"><Label>{label}</Label><select value={value} onChange={(event) => onChange(event.target.value)} className="h-10 rounded-xl border border-[#dce3dc] bg-transparent px-3 text-sm capitalize dark:border-[#303a33]">{options.map(([optionValue, text]) => <option key={optionValue} value={optionValue}>{text}</option>)}</select></div>;
}
