// Paste this script into the browser console while the app is open on the
// original client, then run `exportStudyPlannerLocalStorage()`.
window.exportStudyPlannerLocalStorage = async () => {
  const KNOWN_KEYS = [
    'studyPlannerData',
    'tasks',
    'groups',
    'sidebar-open',
    'analytics-stats-period',
    'studyPlannerTheme',
    'focus-timer-expanded',
    'focus-timer-position',
  ];

  const safeParse = (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  };

  const snapshot = {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    origin: window.location.origin,
    path: window.location.pathname,
    knownKeys: {},
    allLocalStorage: {},
  };

  for (const key of KNOWN_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      snapshot.knownKeys[key] = {
        raw,
        parsed: safeParse(raw),
      };
    }
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) {
      continue;
    }

    const raw = window.localStorage.getItem(key);
    snapshot.allLocalStorage[key] = {
      raw,
      parsed: safeParse(raw),
    };
  }

  const studyPlannerData = snapshot.knownKeys.studyPlannerData?.parsed;
  snapshot.summary = {
    totalLocalStorageKeys: Object.keys(snapshot.allLocalStorage).length,
    taskCount: Array.isArray(studyPlannerData?.tasks) ? studyPlannerData.tasks.length : 0,
    groupCount: Array.isArray(studyPlannerData?.groups) ? studyPlannerData.groups.length : 0,
  };

  const fileName = [
    'studyplanner-localstorage-export',
    new Date().toISOString().replace(/[:.]/g, '-'),
    '.json',
  ].join('');

  const json = JSON.stringify(snapshot, null, 2);

  if (typeof window.showSaveFilePicker === 'function') {
    const handle = await window.showSaveFilePicker({
      suggestedName: fileName,
      types: [
        {
          description: 'JSON file',
          accept: {
            'application/json': ['.json'],
          },
        },
      ],
    });

    const writable = await handle.createWritable();
    await writable.write(json);
    await writable.close();

    console.log('Export completed.');
    console.log('Saved file:', fileName);
    console.log('Summary:', snapshot.summary);
    console.log('Snapshot object:', snapshot);
    return snapshot;
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);

  console.log('Export completed through browser download fallback.');
  console.log('Downloaded file:', fileName);
  console.log('Summary:', snapshot.summary);
  console.log('Snapshot object:', snapshot);
  return snapshot;
};
