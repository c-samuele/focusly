// Pagina principale dell'applicazione.
// Compone layout adaptivo, dati derivati, analytics, gruppi, task e timer.
import { useEffect, useMemo, useState } from 'react';
import Header from '../components/Layout/Header';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Sidebar from '../components/Layout/Sidebar';
import MainContent from '../components/Layout/MainContent';
import AnalyticsZone from '../components/Dashboard/AnalyticsZone';
import FocusTimerPanel from '../components/Task/FocusTimerPanel';
import TaskList from '../components/Task/TaskList';
import { useFullscreen } from '../hooks/useFullscreen';
import { useGroups } from '../hooks/useGroups';
import { useTaskTimer } from '../hooks/useTaskTimer';
import { useTasks } from '../hooks/useTasks';
import { useAppStore } from '../state/store';
import { analyticsService } from '../services/analyticsService';

const formatRemainingTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const PRIORITY_ORDER = {
  high: 3,
  medium: 2,
  low: 1,
};

const THEME_STORAGE_KEY = 'studyPlannerTheme';

const getInitialTheme = () => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === 'light' || storedTheme === 'dark') {
    return storedTheme;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function Dashboard() {
  const { groups, selectedGroupId, createGroup, updateGroup, deleteGroup, selectGroup } = useGroups();
  const { tasks, allTasks, createTask, updateTask, deleteTask, toggleTaskComplete } = useTasks();
  const [editingTask, setEditingTask] = useState(null);
  const [theme, setTheme] = useState(getInitialTheme);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    activeTab,
    setActiveTab,
    statsPeriod,
    setStatsPeriod,
  } = useAppStore();
  const {
    activeTask,
    activeTaskId,
    isRunning,
    remainingSeconds,
    startTimer,
    pauseTimer,
    resetTimer,
    getTaskRemainingSeconds,
  } = useTaskTimer(allTasks, toggleTaskComplete);

  // Close sidebar on larger screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const pendingTasks = tasks.filter((task) => !task.completed);
  
  const periodTasks = useMemo(
    () => {
      const periodBounds = analyticsService.getCurrentPeriodBounds(statsPeriod);

      return allTasks
        .filter((task) => (
          !task.completed &&
          task.scheduledDate &&
          analyticsService.isWithinBounds(task.scheduledDate, periodBounds)
        ))
        .map((task) => ({
          ...task,
          groupName: groups.find((group) => group.id === task.groupId)?.name ?? 'No Group',
          groupColor: groups.find((group) => group.id === task.groupId)?.color,
        }))
        .sort((left, right) => {
          const dateDiff = left.scheduledDate.localeCompare(right.scheduledDate);
          if (dateDiff !== 0) {
            return dateDiff;
          }

          const priorityDiff = PRIORITY_ORDER[right.priority] - PRIORITY_ORDER[left.priority];
          if (priorityDiff !== 0) {
            return priorityDiff;
          }

          const groupDiff = left.groupName.localeCompare(right.groupName);
          if (groupDiff !== 0) {
            return groupDiff;
          }

          return left.title.localeCompare(right.title);
        });
    },
    [allTasks, groups, statsPeriod]
  );

  const studyStats = useMemo(
    () => analyticsService.buildStudyStats({ tasks: allTasks, groups, period: statsPeriod }),
    [allTasks, groups, statsPeriod]
  );

  const historyStats = useMemo(
    () => analyticsService.buildHistoryStats({ tasks: allTasks, period: statsPeriod }),
    [allTasks, statsPeriod]
  );

  const taskCounts = allTasks.filter((task) => !task.completed).reduce((counts, task) => {
    counts[task.groupId] = (counts[task.groupId] ?? 0) + 1;
    return counts;
  }, {});

  const handleCreateTask = (taskData) => {
    if (!selectedGroupId) {
      return;
    }

    createTask({
      ...taskData,
      groupId: selectedGroupId,
      completed: false,
    });
  };

  const handleUpdateTask = (taskData) => {
    if (!editingTask) {
      return;
    }

    updateTask(editingTask.id, taskData);
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    if (editingTask?.id === taskId) {
      setEditingTask(null);
    }

    deleteTask(taskId);
  };

  const handleDeleteGroup = (groupId) => {
    if (editingTask?.groupId === groupId) {
      setEditingTask(null);
    }

    deleteGroup(groupId);
  };

  const handleSelectGroup = (groupId) => {
    selectGroup(groupId);

    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  const handleShowAnalytics = () => {
    setActiveTab('analytics');
  };

  const getTimerLabel = (task) => formatRemainingTime(getTaskRemainingSeconds(task));
  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  // Responsive: show sidebar toggle only on tablet/mobile
  const showSidebarToggle = typeof window !== 'undefined' && window.innerWidth <= 1024;

  return (
    <DashboardLayout
      header={
        <Header
          onToggleSidebar={toggleSidebar}
          showSidebarToggle={showSidebarToggle}
          activeTab={activeTab}
          onShowAnalytics={handleShowAnalytics}
          theme={theme}
          onToggleTheme={toggleTheme}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      }
      sidebar={
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          groups={groups}
          selectedGroupId={selectedGroupId}
          onCreateGroup={createGroup}
          onUpdateGroup={updateGroup}
          onDeleteGroup={handleDeleteGroup}
          onSelectGroup={handleSelectGroup}
          taskCounts={taskCounts}
        />
      }
      mainContent={
        <MainContent
          className={
            activeTab === 'analytics'
              ? 'main-content--analytics'
              : 'main-content--tasks'
          }
        >
          {activeTab === 'analytics' ? (
            <AnalyticsZone
              stats={studyStats}
              period={statsPeriod}
              onPeriodChange={setStatsPeriod}
              historyStats={historyStats}
              periodTasks={periodTasks}
              theme={theme}
              activeTaskId={activeTaskId}
              isRunning={isRunning}
              onStartTimer={startTimer}
              onPauseTimer={pauseTimer}
            />
          ) : (
            <TaskList
              groupName={selectedGroup?.name ?? 'Tasks'}
              group={selectedGroup}
              tasks={tasks}
              pendingTasks={pendingTasks}
              editingTask={editingTask}
              onCreateTask={handleCreateTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              activeTaskId={activeTaskId}
              isRunning={isRunning}
              onToggleComplete={toggleTaskComplete}
              onEditTask={setEditingTask}
              onCancelEdit={() => setEditingTask(null)}
              hasSelectedGroup={Boolean(selectedGroupId)}
              onStartTimer={startTimer}
              onPauseTimer={pauseTimer}
              onResetTimer={resetTimer}
              getTimerLabel={getTimerLabel}
            />
          )}

          <FocusTimerPanel
            activeTask={activeTask}
            isRunning={isRunning}
            activeTimerLabel={formatRemainingTime(remainingSeconds)}
            onStartTimer={startTimer}
            onPauseTimer={pauseTimer}
            onResetTimer={resetTimer}
          />
        </MainContent>
      }
    />
  );
}

export default Dashboard;
