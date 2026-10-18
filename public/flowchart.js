const journey = [
    { id: 'join', title: 'Join workspace', note: 'Invite, profile, team, role', phase: 'foundation', actor: 'Employee or workspace admin', output: 'Verified workspace membership', release: 'Foundation', description: 'A user accepts a secure invitation, completes their profile, joins a team, and receives an authorized workspace role.' },
    { id: 'plan', title: 'Plan the work', note: 'Project, sections, dates', phase: 'mvp', actor: 'Project manager', output: 'Structured project plan', release: 'MVP', description: 'The project owner defines scope, sections, members, milestones, dates, privacy, and the first actionable tasks.' },
    { id: 'assign', title: 'Assign ownership', note: 'Assignee, priority, deadline', phase: 'mvp', actor: 'Manager or task creator', output: 'Accountable task owner', release: 'MVP', description: 'Each task receives an owner, priority, dates, followers, and enough context for the assignee to start confidently.' },
    { id: 'execute', title: 'Execute together', note: 'Comments, files, updates', phase: 'mvp', actor: 'Project contributors', output: 'Visible execution history', release: 'MVP', description: 'Contributors update status, attach files, complete subtasks, discuss decisions, and mention the people who need to respond.' },
    { id: 'monitor', title: 'Monitor delivery', note: 'Progress, risk, workload', phase: 'planning', actor: 'Team lead and stakeholders', output: 'Current delivery health', release: 'Planning', description: 'Dashboards, timeline, workload, dependencies, and status updates expose delays, blockers, and capacity problems early.' },
    { id: 'improve', title: 'Improve the system', note: 'Rules, goals, reports', phase: 'advanced', actor: 'Operations and leadership', output: 'Repeatable operating model', release: 'Advanced', description: 'Automation, goals, portfolios, templates, and reports turn successful team habits into reliable organization-wide workflows.' }
];

const columns = [
    { id: 'access', number: '01', title: 'Access & structure' },
    { id: 'work', number: '02', title: 'Plan & organize' },
    { id: 'collaboration', number: '03', title: 'Execute together' },
    { id: 'insight', number: '04', title: 'Measure & improve' },
    { id: 'platform', number: '05', title: 'Platform services' }
];

const nodes = [
    { id: 'auth', column: 'access', title: 'Authentication', subtitle: 'Login, recovery, sessions', icon: 'A', phase: 'foundation', actor: 'Every user', output: 'Secure authenticated session', description: 'Sanctum-backed authentication, email verification, password recovery, and session controls form the entry boundary.' },
    { id: 'workspace', column: 'access', title: 'Workspaces', subtitle: 'Tenant boundary & settings', icon: 'W', phase: 'foundation', actor: 'Workspace owner', output: 'Isolated organization', description: 'All business data belongs to a workspace with explicit membership and strict cross-workspace authorization.' },
    { id: 'people', column: 'access', title: 'People & teams', subtitle: 'Invites, roles, departments', icon: 'P', phase: 'mvp', actor: 'Admin and team lead', output: 'Organized membership', description: 'Admins invite colleagues, create departments, assign roles, and manage active or guest membership.' },
    { id: 'permissions', column: 'access', title: 'Permissions', subtitle: 'Policies & project access', icon: 'R', phase: 'mvp', actor: 'Application policy layer', output: 'Authorized action', description: 'Workspace roles and project access levels are enforced by Laravel policies for every protected operation.' },

    { id: 'projects', column: 'work', title: 'Projects', subtitle: 'Scope, members, health', icon: 'P', phase: 'mvp', actor: 'Project manager', output: 'Project workspace', description: 'Projects collect members, dates, sections, status, privacy rules, and all connected execution data.' },
    { id: 'tasks', column: 'work', title: 'Tasks & subtasks', subtitle: 'Ownership and delivery', icon: 'T', phase: 'mvp', actor: 'Managers and contributors', output: 'Actionable work record', description: 'Tasks contain ownership, dates, priority, status, descriptions, followers, tags, files, and child work.' },
    { id: 'views', column: 'work', title: 'Flexible views', subtitle: 'List, board, calendar', icon: 'V', phase: 'mvp', actor: 'Project contributors', output: 'Preferred project view', description: 'The same authorized task data appears consistently in list, Kanban board, calendar, and My Tasks experiences.' },
    { id: 'timeline', column: 'work', title: 'Timeline & dependency', subtitle: 'Schedule and blockers', icon: 'D', phase: 'planning', actor: 'Project planner', output: 'Dependency-aware schedule', description: 'Date ranges, milestones, dependencies, and blocked states reveal the delivery sequence and critical conflicts.' },
    { id: 'custom', column: 'work', title: 'Custom workflows', subtitle: 'Fields, forms, templates', icon: 'C', phase: 'planning', actor: 'Process owner', output: 'Reusable team workflow', description: 'Custom fields, intake forms, recurring work, and templates adapt the platform to different departments.' },

    { id: 'comments', column: 'collaboration', title: 'Comments & mentions', subtitle: 'Decisions in context', icon: '@', phase: 'mvp', actor: 'Project contributors', output: 'Contextual discussion', description: 'Rich comments and mentions keep questions, answers, and decisions attached to the work they affect.' },
    { id: 'files', column: 'collaboration', title: 'Files & activity', subtitle: 'Evidence and audit trail', icon: 'F', phase: 'mvp', actor: 'Contributors and auditors', output: 'Traceable work history', description: 'Private attachments and immutable activity events show the evidence and history behind important changes.' },
    { id: 'inbox', column: 'collaboration', title: 'Inbox', subtitle: 'Assignments and updates', icon: 'I', phase: 'mvp', actor: 'Every member', output: 'Prioritized attention queue', description: 'An in-app inbox collects relevant assignments, mentions, comments, deadlines, and project changes.' },
    { id: 'realtime', column: 'collaboration', title: 'Live collaboration', subtitle: 'Reverb event updates', icon: 'L', phase: 'planning', actor: 'Active application clients', output: 'Synchronized screens', description: 'Reverb broadcasts authorized task, comment, and notification events so open views remain current.' },
    { id: 'messages', column: 'collaboration', title: 'Status & messages', subtitle: 'Team-level communication', icon: 'S', phase: 'planning', actor: 'Project owner', output: 'Shared delivery narrative', description: 'Project updates and messages communicate health, decisions, risks, and next actions beyond individual tasks.' },
    { id: 'dms', column: 'collaboration', title: 'Direct messages', subtitle: 'Private threads & files', icon: 'M', phase: 'planning', actor: 'Workspace members', output: 'Private conversation history', description: 'Members message each other or keep personal notes with image attachments, unread counts, and real-time delivery.' },

    { id: 'dashboard', column: 'insight', title: 'Dashboards', subtitle: 'Progress and overdue work', icon: 'D', phase: 'mvp', actor: 'Managers and members', output: 'Actionable summary', description: 'Home and project dashboards summarize assigned work, overdue items, progress, and upcoming deadlines.' },
    { id: 'reports', column: 'insight', title: 'Reporting', subtitle: 'Saved filters and charts', icon: 'R', phase: 'planning', actor: 'Managers and analysts', output: 'Decision-ready report', description: 'Saved searches, charts, and exports answer delivery questions across projects, people, dates, and custom fields.' },
    { id: 'workload', column: 'insight', title: 'Workload', subtitle: 'Capacity and allocation', icon: 'W', phase: 'planning', actor: 'Team lead', output: 'Balanced assignments', description: 'Workload compares assignments and estimated effort with team capacity to reveal overload before it becomes delay.' },
    { id: 'portfolio', column: 'insight', title: 'Portfolios & goals', subtitle: 'Strategy to execution', icon: 'G', phase: 'advanced', actor: 'Leadership', output: 'Aligned strategic progress', description: 'Portfolios roll up project health while goals connect day-to-day delivery to measurable organization outcomes.' },
    { id: 'automation', column: 'insight', title: 'Automation rules', subtitle: 'Triggers and actions', icon: '⚡', phase: 'advanced', actor: 'Workspace process owner', output: 'Automated routine work', description: 'Rules evaluate triggers and conditions after committed changes, then execute traceable asynchronous actions.' },

    { id: 'api', column: 'platform', title: 'Laravel REST API', subtitle: 'Validation and policies', icon: 'API', phase: 'foundation', actor: 'React client and integrations', output: 'Versioned business interface', description: 'Versioned controllers delegate to domain actions after validation, authentication, and policy enforcement.' },
    { id: 'database', column: 'platform', title: 'MySQL data layer', subtitle: 'Transactions and indexing', icon: 'DB', phase: 'foundation', actor: 'Laravel domain layer', output: 'Consistent durable state', description: 'Transactions protect related changes while constraints, tenant keys, and indexes preserve integrity and performance.' },
    { id: 'queue', column: 'platform', title: 'Queue & scheduler', subtitle: 'Jobs, reminders, retries', icon: 'Q', phase: 'mvp', actor: 'Redis workers and scheduler', output: 'Reliable background work', description: 'Email, reminders, imports, exports, automation, and file work run asynchronously with retries and observability.' },
    { id: 'delivery', column: 'platform', title: 'Mail & real-time', subtitle: 'SMTP, inbox, Reverb', icon: 'N', phase: 'mvp', actor: 'Notification resolver', output: 'Channel-aware delivery', description: 'User preferences decide whether a domain event becomes an inbox item, email, real-time update, or digest.' },
    { id: 'storage', column: 'platform', title: 'Private storage', subtitle: 'Local then S3-compatible', icon: 'S3', phase: 'planning', actor: 'Attachment service', output: 'Authorized file access', description: 'Files use random private object paths, metadata validation, and policy-protected downloads.' },
    { id: 'enterprise', column: 'platform', title: 'Enterprise controls', subtitle: 'SSO, SCIM, audit, API', icon: 'E', phase: 'enterprise', actor: 'Enterprise administrator', output: 'Governed deployment', description: 'SSO, provisioning, custom roles, retention, exports, webhooks, and scoped API tokens support large organizations.' }
];

const releases = [
    { phase: 'foundation', label: 'Release 0', title: 'Foundation', description: 'Architecture, design system, authentication, workspace boundary, CI.', time: 'Week 1' },
    { phase: 'mvp', label: 'Release 1', title: 'Core work', description: 'Projects, tasks, collaboration, notifications, list, board, calendar.', time: 'Weeks 2–4' },
    { phase: 'planning', label: 'Release 2', title: 'Planning', description: 'Timeline, dependencies, milestones, fields, forms, templates, recurring tasks.', time: '6–8 weeks' },
    { phase: 'advanced', label: 'Release 3', title: 'Scale', description: 'Portfolios, goals, automation, approvals, time tracking.', time: '6–8 weeks' },
    { phase: 'enterprise', label: 'Release 4', title: 'Enterprise', description: 'SSO, SCIM, compliance controls, integrations, public API.', time: '8–12 weeks' }
];

const state = { phase: 'all', search: '' };
const phaseNames = { foundation: 'Foundation', mvp: 'MVP', planning: 'Planning', advanced: 'Advanced', enterprise: 'Enterprise' };
const dependencies = [
    ['auth', 'workspace'], ['workspace', 'people'], ['people', 'permissions'],
    ['permissions', 'projects'], ['projects', 'tasks'], ['tasks', 'views'], ['tasks', 'comments'],
    ['comments', 'inbox'], ['inbox', 'dashboard'], ['dashboard', 'reports'],
    ['api', 'database'], ['database', 'queue'], ['queue', 'delivery']
];

const journeyTrack = document.getElementById('journeyTrack');
const flowColumns = document.getElementById('flowColumns');
const releaseGrid = document.getElementById('releaseGrid');
const search = document.getElementById('flowSearch');
const resultCount = document.getElementById('resultCount');
const dialog = document.getElementById('detailDialog');

function searchable(item) {
    return `${item.title} ${item.subtitle || item.note || ''} ${item.description} ${item.actor} ${item.output} ${phaseNames[item.phase]}`.toLowerCase();
}

function matches(item) {
    const phaseMatch = state.phase === 'all' || item.phase === state.phase;
    const searchMatch = !state.search || searchable(item).includes(state.search);
    return phaseMatch && searchMatch;
}

function showDetails(item) {
    document.getElementById('dialogPhase').textContent = phaseNames[item.phase] || item.release;
    document.getElementById('dialogTitle').textContent = item.title;
    document.getElementById('dialogDescription').textContent = item.description;
    document.getElementById('dialogActor').textContent = item.actor;
    document.getElementById('dialogOutput').textContent = item.output;
    document.getElementById('dialogRelease').textContent = item.release || phaseNames[item.phase];
    dialog.showModal();
}

function renderJourney() {
    journeyTrack.innerHTML = '';
    journey.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'journey-step';
        button.setAttribute('role', 'listitem');
        button.innerHTML = `<span class="number">${String(index + 1).padStart(2, '0')}</span><strong>${item.title}</strong><small>${item.note}</small>`;
        button.style.opacity = matches(item) ? '1' : '.2';
        button.addEventListener('click', () => showDetails(item));
        journeyTrack.appendChild(button);
    });
}

function renderNodes() {
    flowColumns.innerHTML = '';
    columns.forEach(column => {
        const section = document.createElement('section');
        section.className = 'flow-column';
        section.innerHTML = `<div class="flow-column-header"><span>${column.number}</span><h3>${column.title}</h3></div>`;
        nodes.filter(node => node.column === column.id).forEach(node => {
            const button = document.createElement('button');
            const isMatch = matches(node);
            button.type = 'button';
            button.id = `node-${node.id}`;
            button.className = `flow-node${isMatch ? (state.search ? ' match' : '') : ' dimmed'}`;
            button.setAttribute('aria-label', `${node.title}: ${node.subtitle}`);
            button.innerHTML = `<span class="flow-node-top"><span class="node-icon">${node.icon}</span><span class="phase-dot ${node.phase}"></span></span><strong>${node.title}</strong><small>${node.subtitle}</small>`;
            button.addEventListener('click', () => showDetails(node));
            section.appendChild(button);
        });
        flowColumns.appendChild(section);
    });
    const count = nodes.filter(matches).length;
    resultCount.textContent = `${count} of ${nodes.length} capabilities visible`;
    document.getElementById('emptyState').hidden = count !== 0;
    requestAnimationFrame(drawConnectors);
}

function renderReleases() {
    releaseGrid.innerHTML = '';
    releases.forEach(item => {
        const article = document.createElement('article');
        article.className = `release${state.phase === item.phase ? ' active' : ''}`;
        article.setAttribute('role', 'button');
        article.setAttribute('tabindex', '0');
        article.innerHTML = `<span>${item.label}</span><strong>${item.title}</strong><p>${item.description}</p><small>${item.time}</small>`;
        const select = () => setPhase(state.phase === item.phase ? 'all' : item.phase);
        article.addEventListener('click', select);
        article.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(); } });
        releaseGrid.appendChild(article);
    });
}

function drawConnectors() {
    const svg = document.getElementById('connectors');
    const board = document.getElementById('flowBoard');
    const boardRect = board.getBoundingClientRect();
    svg.innerHTML = '';
    svg.setAttribute('viewBox', `0 0 ${board.scrollWidth} ${board.scrollHeight}`);
    dependencies.forEach(([from, to]) => {
        const start = document.getElementById(`node-${from}`);
        const end = document.getElementById(`node-${to}`);
        if (!start || !end || start.classList.contains('dimmed') || end.classList.contains('dimmed')) return;
        const a = start.getBoundingClientRect();
        const b = end.getBoundingClientRect();
        const x1 = a.right - boardRect.left + board.scrollLeft;
        const y1 = a.top + a.height / 2 - boardRect.top + board.scrollTop;
        const x2 = b.left - boardRect.left + board.scrollLeft;
        const y2 = b.top + b.height / 2 - boardRect.top + board.scrollTop;
        const mid = x1 + (x2 - x1) / 2;
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`);
        svg.appendChild(path);
    });
}

function setPhase(phase) {
    state.phase = phase;
    document.querySelectorAll('.filter').forEach(button => {
        const active = button.dataset.phase === phase;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
    });
    renderAll();
}

function renderAll() {
    renderJourney();
    renderNodes();
    renderReleases();
}

document.getElementById('phaseFilters').addEventListener('click', event => {
    const button = event.target.closest('[data-phase]');
    if (button) setPhase(button.dataset.phase);
});

search.addEventListener('input', event => {
    state.search = event.target.value.trim().toLowerCase();
    renderAll();
});

document.addEventListener('keydown', event => {
    if (event.key === '/' && document.activeElement !== search) { event.preventDefault(); search.focus(); }
    if (event.key === 'Escape' && document.activeElement === search && search.value) { search.value = ''; state.search = ''; renderAll(); }
});

const storedTheme = localStorage.getItem('weberflow-blueprint-theme');
if (storedTheme) document.documentElement.dataset.theme = storedTheme;
document.getElementById('themeToggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('weberflow-blueprint-theme', next);
});

window.addEventListener('resize', () => requestAnimationFrame(drawConnectors));
document.fonts?.ready.then(drawConnectors);
renderAll();
