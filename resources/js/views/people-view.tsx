import { useEffect, useState, type FormEvent } from 'react';
import { LoaderCircle, Mail, Trash2, UserPlus, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { request, type Workspace } from './planning-view';

type Member = { id: number; name: string; email: string; role: 'owner' | 'admin' | 'member' | 'guest' };
type ApiError = { message?: string; errors?: Record<string, string[]> };

export function PeopleView({ workspace }: { workspace: Workspace & { role: string } }) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const canManage = workspace.role === 'owner' || workspace.role === 'admin';

    async function loadMembers() {
        const { data } = await request<{ data: Member[] }>(`/api/v1/workspaces/${workspace.id}/members`);
        setMembers(data);
        setLoading(false);
    }

    useEffect(() => {
        void loadMembers();
    }, [workspace.id]);

    async function addMember(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        const form = event.currentTarget;
        const payload = Object.fromEntries(new FormData(form).entries());

        try {
            await fetch('/sanctum/csrf-cookie', { credentials: 'include' });
            await request(`/api/v1/workspaces/${workspace.id}/members`, { method: 'POST', body: JSON.stringify(payload) });
            await loadMembers();
            form.reset();
            setMessage('Person added to the workspace');
        } catch (caught) {
            const apiError = caught as ApiError;
            setError(apiError.errors?.email?.[0] ?? apiError.message ?? 'Unable to add this person.');
        } finally {
            setBusy(false);
        }
    }

    async function changeRole(member: Member, role: string) {
        setError('');
        await request(`/api/v1/workspaces/${workspace.id}/members/${member.id}`, { method: 'PATCH', body: JSON.stringify({ role }) });
        await loadMembers();
        setMessage(`${member.name}'s role was updated`);
    }

    async function removeMember(member: Member) {
        if (!window.confirm(`Remove ${member.name} from ${workspace.name}?`)) {
            return;
        }

        await request(`/api/v1/workspaces/${workspace.id}/members/${member.id}`, { method: 'DELETE' });
        await loadMembers();
        setMessage(`${member.name} was removed`);
    }

    return <main className="min-h-[calc(100vh-4.25rem)] bg-[#f7f8f4] p-5 dark:bg-[#111512] sm:p-8">
        <div className="mx-auto grid max-w-6xl gap-6 stagger-children">
            <div><p className="text-sm font-bold text-brand-600 dark:text-brand-300">Workspace administration</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.04em]">People</h1><p className="mt-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">Manage who can collaborate and be assigned work in {workspace.name}.</p></div>
            {message && <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{message}</div>}
            {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">{error}</div>}
            {canManage && <Card className="p-5"><h2 className="flex items-center gap-2 font-bold"><UserPlus size={18} />Add a person</h2><p className="mt-1 text-sm text-[#68736c] dark:text-[#a8b1ab]">Add someone who already has a WeberFlow account using their email address.</p><form className="mt-4 grid gap-3 md:grid-cols-[minmax(240px,1fr)_160px_auto]" onSubmit={addMember}><div className="grid gap-1.5"><Label htmlFor="member-email">Email address</Label><Input id="member-email" name="email" type="email" required placeholder="colleague@company.com" /></div><label className="grid gap-1.5 text-sm font-medium"><span>Role</span><select name="role" defaultValue="member" className="h-11 rounded-xl border border-[#dce3dc] bg-white px-3 dark:border-[#303a33] dark:bg-[#181d1a]"><option value="member">Member</option><option value="admin">Admin</option><option value="guest">Guest</option></select></label><Button type="submit" className="self-end" disabled={busy}>{busy ? <LoaderCircle className="animate-spin" size={16} /> : <UserPlus size={16} />}Add person</Button></form></Card>}
            <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-[#dce3dc] p-5 dark:border-[#303a33]"><h2 className="flex items-center gap-2 font-bold"><Users size={18} />Workspace members</h2><span className="text-sm text-[#68736c]">{members.length} people</span></div>{loading ? <div className="grid min-h-48 place-items-center"><LoaderCircle className="animate-spin text-brand-600" /></div> : <div className="divide-y divide-[#dce3dc] stagger-children dark:divide-[#303a33]">{members.map((member) => <div key={member.id} className="grid items-center gap-4 p-4 sm:grid-cols-[1fr_170px_44px]"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-300">{member.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</span><div className="min-w-0"><strong className="block truncate text-sm">{member.name}</strong><span className="flex items-center gap-1 truncate text-xs text-[#68736c]"><Mail size={12} />{member.email}</span></div></div><select aria-label={`Role for ${member.name}`} value={member.role} disabled={!canManage || member.role === 'owner'} onChange={(event) => changeRole(member, event.target.value)} className="h-9 rounded-lg border border-[#dce3dc] bg-transparent px-3 text-sm capitalize disabled:opacity-60 dark:border-[#303a33]"><option value="owner">Owner</option><option value="admin">Admin</option><option value="member">Member</option><option value="guest">Guest</option></select><Button size="icon" variant="ghost" aria-label={`Remove ${member.name}`} disabled={!canManage || member.role === 'owner'} onClick={() => removeMember(member)}><Trash2 size={16} /></Button></div>)}</div>}</Card>
        </div>
    </main>;
}
