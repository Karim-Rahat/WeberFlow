(() => {
  const completedCapabilities = new Set([
    'Authentication',
    'Workspaces',
    'Laravel REST API',
    'MySQL data layer',
    'Projects',
    'Tasks & subtasks',
    'Flexible views',
    'People & teams',
    'Permissions',
    'Comments & mentions',
    'Files & activity',
    'Inbox',
    'Mail & real-time',
    'Timeline & dependency',
    'Custom workflows',
    'Workload',
    'Live collaboration',
    'Direct messages',
    'Status & messages',
    'Dashboards',
    'Reporting',
    'Queue & scheduler',
    'Private storage',
  ]);
  const completionDate = 'October 11, 2026';
  const phaseStartDate = 'October 12, 2026';

  function addSummary() {
    if (document.querySelector('.completion-summary')) return;

    const target = document.querySelector('.flow-toolbar, .legend, .controls, .flowchart, .hero');
    if (!target) return;

    const summary = document.createElement('div');
    summary.className = 'completion-summary';
    summary.innerHTML = `
      <strong>✓ Releases 0, 1, and 2 complete</strong>
      <span>23 roadmap capabilities + platform admin, direct messaging, saved views, CSV import/export, project updates and real-time sync delivered · ${completionDate}</span>
    `;
    target.insertAdjacentElement('afterend', summary);
    summary.insertAdjacentHTML('beforeend', `<span>Release 3 started ${phaseStartDate}</span>`);
  }

  function markCapabilities() {
    document.querySelectorAll('.flow-node').forEach((card) => {
      const title = card.querySelector('strong')?.textContent?.trim();
      if (!completedCapabilities.has(title) || card.classList.contains('completed')) return;

      card.classList.add('completed');
      const marker = card.querySelector('.phase-dot');
      if (marker) {
        marker.outerHTML = '<span class="completion-badge" aria-label="Complete">✓ Complete</span>';
      }
    });
  }

  function markRelease() {
    document.querySelectorAll('.release').forEach((card) => {
      const label = card.querySelector('span')?.textContent?.trim();
      if (!['Release 0', 'Release 1', 'Release 2'].includes(label) || card.classList.contains('completed')) return;

      card.classList.add('completed');
      const labelElement = card.querySelector('span');
      if (labelElement) {
        const row = document.createElement('div');
        row.className = 'release-completion';
        labelElement.before(row);
        row.append(labelElement);
        row.insertAdjacentHTML('beforeend', '<span class="completion-badge">✓ Complete</span>');
      }

      const date = document.createElement('small');
      date.className = 'completion-date';
      date.textContent = `Completed ${completionDate}`;
      card.append(date);
    });
  }

  function markInProgress() {
    document.querySelectorAll('.release').forEach((card) => {
      const label = card.querySelector('span')?.textContent?.trim();
      if (label !== 'Release 3' || card.classList.contains('in-progress')) return;

      card.classList.add('in-progress');
      const labelElement = card.querySelector('span');
      if (!labelElement) return;

      const row = document.createElement('div');
      row.className = 'release-completion';
      labelElement.before(row);
      row.append(labelElement);
      row.insertAdjacentHTML('beforeend', '<span class="progress-badge">In progress</span>');

      const date = document.createElement('small');
      date.className = 'completion-date';
      date.textContent = `Started ${phaseStartDate}`;
      card.append(date);
    });
  }

  function updateTracking() {
    addSummary();
    markCapabilities();
    markRelease();
    markInProgress();
  }

  updateTracking();
  new MutationObserver(updateTracking).observe(document.body, { childList: true, subtree: true });
})();
