# Copilot Instructions - Study Planner Todo App

## 📋 Panoramica Progetto

Questa è un'applicazione **React + Vite** per la gestione di task di studio organizzati in gruppi, con analytics e timer per il focus.

**Stack tecnologico:**
- React 18.3.1
- Vite 5.4.10
- Zustand 5.0.6 (state management)
- Bootstrap 5.3.8 (UI)
- Chart.js 4.4.3 (grafici)
- Bootstrap Icons (icone)

**Comandi principali:**
- `npm run dev` → avvia dev server su localhost:5173
- `npm run build` → build per produzione
- `npm run preview` → preview della build

---

## 🏗️ Architettura

```
src/
├── pages/          # Pagine principali (es. Dashboard)
├── components/     # Componenti riutilizzabili
│   ├── Task/       # Componenti per task (TaskForm, TaskItem, TaskList, FocusTimerPanel)
│   ├── Group/      # Componenti per gruppi (GroupItem, GroupList)
│   ├── Analytics/  # Grafici e statistiche (StudyChart, StudyDayPieChart, StudyHistoryChart)
│   └── UI/         # Componenti UI base (Button)
├── hooks/          # Custom hooks (useGroups, useTasks, useTaskTimer, useFullscreen)
├── services/       # Servizi di logica (taskService, groupService, storageService, analyticsService)
├── state/          # Zustand store (store.js con useAppStore)
├── model/          # Modelli di dati (Task.js, Group.js)
├── utils/          # Utility (timeFormat.js)
└── styles.css      # Stili globali
```

### Store Zustand (`state/store.js`)

Lo **store centralizzato** gestisce:
- `tasks` - lista di tutti i task
- `groups` - lista di gruppi con status aggregati
- `selectedGroupId` - gruppo correntemente selezionato

**Azioni disponibili:**
- `selectGroup(groupId)` - seleziona un gruppo
- `createGroup(groupData)` - crea nuovo gruppo
- `updateGroup(groupId, updates)` - aggiorna dati gruppo
- `deleteGroup(groupId)` - elimina gruppo e relativi task
- `createTask(groupId, taskData)` - crea nuovo task
- `updateTask(taskId, updates)` - aggiorna task
- `deleteTask(taskId)` - elimina task
- `focusTask(taskId)` - inizia timer focus su task
- `markTaskAsCompleted(taskId)` - segna task come completato

---

## 🛠️ Come Sviluppare

### 1. Creare un nuovo componente

Usa questa struttura:

```jsx
// src/components/MyComponent/MyComponent.jsx
import { useAppStore } from '../../state/store';

function MyComponent() {
  const { tasks, groups } = useAppStore();
  
  return (
    <div>
      {/* contenuto */}
    </div>
  );
}

export default MyComponent;
```

**Convenzioni:**
- Cartella con nome in PascalCase
- File `.jsx` con nome identico
- Esporta default il componente

### 2. Usare lo store Zustand

```jsx
// Leggere dallo store
const { tasks, groups, selectedGroupId } = useAppStore();

// Modificare lo store
const { createTask, updateTask, deleteTask } = useAppStore();

createTask(selectedGroupId, { title: "Nuovo task", duration: 60 });
```

### 3. Usare i servizi

I servizi sono nel `src/services/` e gestiscono la logica persistente:

**`taskService.js`** - gestisce task
```jsx
import { taskService } from '../services/taskService';

taskService.getTasks()
taskService.createTask(groupId, taskData)
taskService.updateTask(taskId, updates)
taskService.deleteTask(taskId)
taskService.deleteTasksByGroup(groupId)
```

**`groupService.js`** - gestisce gruppi
```jsx
groupService.getGroups()
groupService.createGroup(groupData)
groupService.updateGroup(groupId, updates)
groupService.deleteGroup(groupId)
groupService.attachStatuses(groups, tasks)  // Aggrega status da task
```

**`storageService.js`** - persistenza localStorage
```jsx
storageService.save(key, data)
storageService.get(key)
storageService.remove(key)
```

**`analyticsService.js`** - calcola statistiche
```jsx
analyticsService.getCompletionStats(tasks)
analyticsService.getTotalFocusTime(tasks)
```

### 4. Usare gli hook personalizzati

```jsx
// useGroups - gestisce operazioni su gruppi
const { groups, createGroup, updateGroup } = useGroups();

// useTasks - gestisce operazioni su task
const { tasks, createTask, updateTask } = useTasks();

// useTaskTimer - gestisce timer focus
const { isActive, timeRemaining, startTimer, pauseTimer } = useTaskTimer(taskId);

// useFullscreen - per modal/fullscreen
const { isFullscreen, toggleFullscreen } = useFullscreen();
```

### 5. Modelli di dati

**`Task.js`** - struttura di un task
```js
{
  id: string,
  groupId: string,
  title: string,
  duration: number,      // in minuti
  focusTime: number,     // tempo accumulo focus
  completed: boolean,
  createdAt: timestamp,
  completedAt: timestamp
}
```

**`Group.js`** - struttura di un gruppo
```js
{
  id: string,
  name: string,
  color: string,
  description: string,
  createdAt: timestamp,
  tasksCount: number,      // calcolato
  completedCount: number   // calcolato
}
```

---

## 📐 Convenzioni di Codice

### Naming
- **Componenti**: PascalCase (es. `TaskList`, `GroupItem`)
- **File componenti**: PascalCase + `.jsx`
- **Variabili/funzioni**: camelCase (es. `selectedGroupId`, `handleSubmit`)
- **Costanti**: UPPER_SNAKE_CASE
- **File servizi/utils**: camelCase + `.js`

### Struttura componente React
```jsx
import { useState } from 'react';
import { useAppStore } from '../../state/store';
import './MyComponent.css';  // se ha stili specifici

function MyComponent({ prop1, prop2 }) {
  const [localState, setLocalState] = useState(null);
  const { storeData, storeAction } = useAppStore();

  const handleEvent = () => {
    // logica
  };

  return (
    <div className="my-component">
      {/* JSX */}
    </div>
  );
}

export default MyComponent;
```

### Commenti
- Commenta la **logica complessa**, non codice ovvio
- Commenta le **funzioni pubbliche** nei servizi
- Usa commenti JSX prima dei componenti

---

## 🎨 Stile e UI

- **Framework CSS**: Bootstrap 5
- **Icone**: Bootstrap Icons (`<i className="bi bi-icon-name"></i>`)
- **Colori**: Bootstrap palette (primary, success, danger, warning, info)
- **Responsive**: Mobile-first, grid Bootstrap

### Esempio componente con Bootstrap
```jsx
<div className="container mt-4">
  <div className="row">
    <div className="col-md-6">
      <button className="btn btn-primary">
        <i className="bi bi-plus"></i> Aggiungi
      </button>
    </div>
  </div>
</div>
```

---

## 📊 Analytics

Il `analyticsService` calcola:
- Statistiche di completamento (total, completed, % completamento)
- Tempo totale di focus accumulato
- Dati per i grafici (StudyChart, StudyDayPieChart, StudyHistoryChart)

Usa `Chart.js` per visualizzare i dati nei componenti Analytics.

---

## ⏱️ Timer Focus

Il componente `FocusTimerPanel` gestisce il timer di focus. Usa l'hook `useTaskTimer`:
```jsx
const { isActive, timeRemaining, startTimer, pauseTimer, resetTimer } = useTaskTimer(taskId);
```

---

## 🔄 Workflow di sviluppo

1. **Per una nuova feature**: crea il componente → usa lo store → aggiungi al servizio se necessario
2. **Per correggere bug**: verifica i servizi → controlla lo store → valuta il componente
3. **Per migliorare UX**: aggiorna i componenti → considera hook personalizzati → testa il flusso

---

## 🚀 Deployment

L'app è pronta per Vercel/Netlify:
- Build: `npm run build` → genera `dist/`
- Environment: non ha variabili d'ambiente critiche
- Storage: usa localStorage per persistenza

---

## 📝 Note Importanti

- **State locale vs store**: usa state locale per UI temporanea (collapse, hover), store per dati persistenti
- **Performance**: i componenti sono ottimizzati con Zustand, evita troppe re-render
- **Storage**: tutti i dati persistenti vanno in localStorage via `storageService`
- **Validazione**: valida input nei servizi, non nei componenti
