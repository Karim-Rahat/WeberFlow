(() => {
  const completedCapabilities = new Set([
    'Authentication',
    'Workspaces',
    'Laravel REST API',
    'MySQL data layer',
    'Projects',
    'Tasks & subtasks',
    'Flexible views',
    'Comments & mentions',
    'Files & activity',
    'Inbox',
    'Mail & real-time',
    'Timeline & dependency',
    'Custom workflows',
    'Workload',
  ]);
  const completionDate = 'October 11, 2026';

  function addSummary() {
    if (document.querySelector('.completion-summary')) return;

    const target = document.querySelector('.flow-toolbar, .legend, .flowchart');
    if (!target) return;

    const summary = document.createElement('div');
    summary.className = 'completion-summary';
    summary.innerHTML = `
      <strong>✓ Releases 0, 1, and 2 complete</strong>
      <span>14 roadmap capabilities + platform admin delivered · ${completionDate}</span>
    `;
    target.insertAdjacentElement('afterend', summary);
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

  function updateTracking() {
    addSummary();
    markCapabilities();
    markRelease();
  }

  updateTracking();
  new MutationObserver(updateTracking).observe(document.body, { childList: true, subtree: true });
})();
