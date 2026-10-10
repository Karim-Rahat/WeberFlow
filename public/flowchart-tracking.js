(() => {
  const completedCapabilities = new Set([
    'Authentication',
    'Workspace',
    'REST API',
    'Core Database',
  ]);
  const completionDate = 'October 10, 2026';

  function addSummary() {
    if (document.querySelector('.completion-summary')) return;

    const target = document.querySelector('.flow-toolbar, .legend, .flowchart');
    if (!target) return;

    const summary = document.createElement('div');
    summary.className = 'completion-summary';
    summary.innerHTML = `
      <strong>✓ Release 0 — Foundation complete</strong>
      <span>4 capabilities complete · ${completionDate}</span>
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
      if (label !== 'Release 0' || card.classList.contains('completed')) return;

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

  function markReleaseInProgress() {
    document.querySelectorAll('.release').forEach((card) => {
      const label = card.querySelector('span')?.textContent?.trim();
      if (label !== 'Release 2' || card.classList.contains('in-progress')) return;

      card.classList.add('in-progress');
      const labelElement = card.querySelector('span');
      if (labelElement) {
        const row = document.createElement('div');
        row.className = 'release-completion';
        labelElement.before(row);
        row.append(labelElement);
        row.insertAdjacentHTML('beforeend', '<span class="progress-badge">In progress</span>');
      }
    });
  }

  function updateTracking() {
    addSummary();
    markCapabilities();
    markRelease();
    markReleaseInProgress();
  }

  updateTracking();
  new MutationObserver(updateTracking).observe(document.body, { childList: true, subtree: true });
})();
