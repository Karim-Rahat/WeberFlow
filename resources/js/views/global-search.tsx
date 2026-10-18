import { useEffect, useRef, useState } from 'react';
import { FolderKanban, ListTodo, MessageSquare, Search, UserRound } from 'lucide-react';
import { Input } from '../components/ui/input';

type SearchResults = {
    tasks: { id: number; title: string; status: string; project: { id: number; name: string } | null }[];
    projects: { id: number; name: string; status: string | null }[];
    comments: { id: number; body: string; task: { id: number; project_id: number; title: string } | null; author: string | null }[];
    people: { id: number; name: string; email: string }[];
};

type Workspace = { id: number; slug: string };

const emptyResults: SearchResults = { tasks: [], projects: [], comments: [], people: [] };

export function GlobalSearch({ workspace, onOpenProject, onOpenTask, onOpenPerson }: {
    workspace: Workspace;
    onOpenProject: (projectId: number) => void;
    onOpenTask: (projectId: number, taskId: number) => void;
    onOpenPerson: () => void;
}) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const trimmed = query.trim();

    useEffect(() => {
        if (trimmed.length < 2) {
            setResults(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        const handle = setTimeout(() => {
            fetch(`/api/v1/search?q=${encodeURIComponent(trimmed)}`, { credentials: 'include', headers: { Accept: 'application/json' } })
                .then((response) => response.json())
                .then((json: { data: SearchResults }) => { setResults(json.data); setOpen(true); })
                .catch(() => setResults(emptyResults))
                .finally(() => setLoading(false));
        }, 220);

        return () => clearTimeout(handle);
    }, [trimmed, workspace.id]);

    useEffect(() => {
        function onPointerDown(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        }

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, []);

    function go(action: () => void) {
        setOpen(false);
        setQuery('');
        setResults(null);
        action();
    }

    const hasResults = results !== null && (results.tasks.length > 0 || results.projects.length > 0 || results.comments.length > 0 || results.people.length > 0);

    return (
        <div ref={containerRef} className="relative max-w-xl flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a857e]" size={17} />
            <Input
                value={query}
                onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
                onFocus={() => { if (trimmed.length >= 2) { setOpen(true); } }}
                className="h-10 bg-[#f7f8f4] pl-10 dark:bg-[#222a25]"
                placeholder="Search tasks, projects, people"
            />
            {open && trimmed.length >= 2 && (
                <div className="animate-pop-in absolute left-0 right-0 top-12 z-40 max-h-[70vh] overflow-y-auto rounded-xl border border-[#dce3dc] bg-white p-2 shadow-xl dark:border-[#303a33] dark:bg-[#181d1a]">
                    {loading && results === null && <p className="px-3 py-2 text-sm text-[#68736c] dark:text-[#a8b1ab]">Searching…</p>}
                    {!loading && !hasResults && <p className="px-3 py-4 text-center text-sm text-[#68736c] dark:text-[#a8b1ab]">No matches for “{trimmed}”.</p>}

                    {results?.projects.length ? <ResultSection title="Projects">{results.projects.map((project) => (
                        <ResultButton key={project.id} icon={<FolderKanban size={15} />} onClick={() => go(() => onOpenProject(project.id))}>
                            <strong className="truncate">{project.name}</strong>
                        </ResultButton>
                    ))}</ResultSection> : null}

                    {results?.tasks.length ? <ResultSection title="Tasks">{results.tasks.map((task) => {
                        const project = task.project;
                        return (
                            <ResultButton key={task.id} icon={<ListTodo size={15} />} disabled={project === null} onClick={() => { if (project) { const projectId = project.id; go(() => onOpenTask(projectId, task.id)); } }}>
                                <strong className="truncate">{task.title}</strong>
                                <small className="truncate text-[#68736c] dark:text-[#a8b1ab]">{project?.name ?? 'No project'}</small>
                            </ResultButton>
                        );
                    })}</ResultSection> : null}

                    {results?.comments.length ? <ResultSection title="Comments">{results.comments.map((comment) => {
                        const target = comment.task;
                        return (
                            <ResultButton key={comment.id} icon={<MessageSquare size={15} />} disabled={target === null} onClick={() => { if (target) { const projectId = target.project_id; const taskId = target.id; go(() => onOpenTask(projectId, taskId)); } }}>
                                <strong className="truncate">{comment.body}</strong>
                                <small className="truncate text-[#68736c] dark:text-[#a8b1ab]">{comment.author ?? 'Someone'} · {target?.title ?? 'task'}</small>
                            </ResultButton>
                        );
                    })}</ResultSection> : null}

                    {results?.people.length ? <ResultSection title="People">{results.people.map((person) => (
                        <ResultButton key={person.id} icon={<UserRound size={15} />} onClick={() => go(onOpenPerson)}>
                            <strong className="truncate">{person.name}</strong>
                            <small className="truncate text-[#68736c] dark:text-[#a8b1ab]">{person.email}</small>
                        </ResultButton>
                    ))}</ResultSection> : null}
                </div>
            )}
        </div>
    );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-1">
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[.12em] text-[#78827b]">{title}</p>
            <div className="grid gap-0.5">{children}</div>
        </div>
    );
}

function ResultButton({ icon, disabled = false, onClick, children }: { icon: React.ReactNode; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button type="button" disabled={disabled} onClick={onClick} className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#eef1ea] disabled:opacity-50 dark:hover:bg-[#222a25]">
            <span className="text-[#68736c] dark:text-[#a8b1ab]">{icon}</span>
            <span className="flex min-w-0 flex-1 flex-col">{children}</span>
        </button>
    );
}
