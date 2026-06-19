// Pagina principale dell'applicazione.
// Compone layout adaptivo, dati derivati, analytics, gruppi, task e timer.
import { useEffect, useMemo, useState } from 'react';
import AnalyticsZone from '../components/Dashboard/AnalyticsZone';
import GroupWorkspacePanel, { createWorkspaceState } from '../components/Group/GroupWorkspacePanel';
import DashboardLayout from '../components/Layout/DashboardLayout';
import Header from '../components/Layout/Header';
import MainContent from '../components/Layout/MainContent';
import Sidebar from '../components/Layout/Sidebar';
import SettingsPanel from '../components/Settings/SettingsPanel';
import FocusTimerPanel from '../components/Task/FocusTimerPanel';
import TaskList from '../components/Task/TaskList';
import SyncDataModal from '../components/UI/SyncDataModal';
import { useFullscreen } from '../hooks/useFullscreen';
import { useGroups } from '../hooks/useGroups';
import { useTaskTimer } from '../hooks/useTaskTimer';
import { useTasks } from '../hooks/useTasks';
import { analyticsService } from '../services/analyticsService';
import { useAppStore } from '../state/store';
import { applyThemeToDocument, getInitialTheme } from '../utils/themePreferences';

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

function Dashboard() {
  const { groups, selectedGroupId, createGroup, updateGroup, deleteGroup, selectGroup } = useGroups();
  const { tasks, allTasks, createTask, updateTask, deleteTask, toggleTaskComplete } = useTasks();
  const [editingTask, setEditingTask] = useState(null);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);
  const [groupWorkspace, setGroupWorkspace] = useState(createWorkspaceState);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const {
    sidebarOpen,
    toggleSidebar,
    setSidebarOpen,
    activeTab,
    setActiveTab,
    statsPeriod,
    setStatsPeriod,
    authUser,
    signOut,
    reimportLocalData,
    isReimporting,
    appError,
    migrationSource,
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
    applyThemeToDocument(theme);
  }, [theme]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? null;
  const workspaceGroup = groups.find((group) => group.id === groupWorkspace.groupId) ?? null;
  const activeTaskGroup = groups.find((group) => group.id === activeTask?.groupId) ?? null;
  const pendingTasks = tasks.filter((task) => !task.completed);
  const pendingTasksCount = allTasks.filter((task) => !task.completed).length;
  const completedTasksCount = allTasks.length - pendingTasksCount;

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

    if (groupWorkspace.groupId === groupId) {
      setGroupWorkspace(createWorkspaceState());
    }

    deleteGroup(groupId);
  };

  const handleSelectGroup = (groupId) => {
    selectGroup(groupId);
    setGroupWorkspace(createWorkspaceState());

    if (typeof window !== 'undefined' && window.innerWidth <= 1024) {
      setSidebarOpen(false);
    }
  };

  const handleOpenCreateGroup = () => {
    setActiveTab('tasks');
    setGroupWorkspace({ mode: 'create', groupId: null });
  };

  const handleOpenEditGroup = (group) => {
    setActiveTab('tasks');
    setGroupWorkspace({ mode: 'edit', groupId: group.id });
  };

  const handleOpenGroupMilestones = (group) => {
    setActiveTab('tasks');
    setGroupWorkspace({ mode: 'milestones', groupId: group.id });
  };

  const handleCloseGroupWorkspace = () => {
    setGroupWorkspace(createWorkspaceState());
  };

  const handleSubmitGroupWorkspace = (groupData) => {
    if (groupWorkspace.mode === 'edit' && groupWorkspace.groupId) {
      updateGroup(groupWorkspace.groupId, groupData);
    } else {
      createGroup(groupData);
    }

    setGroupWorkspace(createWorkspaceState());
  };

  const handleToggleWorkspaceMilestone = (index) => {
    if (!workspaceGroup) {
      return;
    }

    const updatedMilestones = (workspaceGroup.milestones ?? []).map((milestone, milestoneIndex) => (
      milestoneIndex === index ? { ...milestone, completed: !milestone.completed } : milestone
    ));

    updateGroup(workspaceGroup.id, { milestones: updatedMilestones });
  };

  const handleShowAnalytics = () => {
    setActiveTab('analytics');
  };

  const handleShowSettings = () => {
    setActiveTab('settings');
  };

  useEffect(() => {
    if (groupWorkspace.mode && groupWorkspace.mode !== 'create' && !workspaceGroup) {
      setGroupWorkspace(createWorkspaceState());
    }
  }, [groupWorkspace.mode, workspaceGroup]);

  const getTimerLabel = (task) => formatRemainingTime(getTaskRemainingSeconds(task));

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const handleSetTheme = (nextTheme) => {
    setTheme(nextTheme === 'dark' ? 'dark' : 'light');
  };

  const handleOpenSyncModal = () => {
    setIsSyncModalOpen(true);
  };

  const handleCloseSyncModal = () => {
    if (isReimporting) {
      return;
    }

    setIsSyncModalOpen(false);
  };

  const handleConfirmReimportLocalData = () => {
    setIsSyncModalOpen(false);
    reimportLocalData();
  };

  const showSidebarToggle = typeof window !== 'undefined' && window.innerWidth <= 1024;

  return (
    <>
      <DashboardLayout
        header={(
          <Header
            onToggleSidebar={toggleSidebar}
            showSidebarToggle={showSidebarToggle}
            activeTab={activeTab}
            onShowAnalytics={handleShowAnalytics}
            onShowSettings={handleShowSettings}
            theme={theme}
            onToggleTheme={toggleTheme}
            isFullscreen={isFullscreen}
            onToggleFullscreen={toggleFullscreen}
            authUser={authUser}
            onOpenSyncModal={handleOpenSyncModal}
            isReimporting={isReimporting}
            onSignOut={signOut}
          />
        )}
        sidebar={(
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            groups={groups}
            selectedGroupId={selectedGroupId}
            onOpenCreateGroup={handleOpenCreateGroup}
            onOpenEditGroup={handleOpenEditGroup}
            onOpenViewMilestones={handleOpenGroupMilestones}
            onDeleteGroup={handleDeleteGroup}
            onSelectGroup={handleSelectGroup}
            taskCounts={taskCounts}
          />
        )}
        mainContent={(
          <MainContent
            className={
              activeTab === 'analytics'
                ? 'main-content--analytics'
                : activeTab === 'settings'
                  ? 'main-content--settings'
                  : 'main-content--tasks'
            }
          >
            {appError ? <div className="firebase-inline-error">{appError}</div> : null}
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
            ) : activeTab === 'settings' ? (
              <SettingsPanel
                theme={theme}
                onSetTheme={handleSetTheme}
                statsPeriod={statsPeriod}
                onStatsPeriodChange={setStatsPeriod}
                authUser={authUser}
                groupsCount={groups.length}
                tasksCount={allTasks.length}
                completedTasksCount={completedTasksCount}
                pendingTasksCount={pendingTasksCount}
                selectedGroupName={selectedGroup?.name ?? ''}
                migrationSource={migrationSource}
                isReimporting={isReimporting}
                onOpenSyncModal={handleOpenSyncModal}
                onShowAnalytics={handleShowAnalytics}
              />
            ) : groupWorkspace.mode ? (
              <GroupWorkspacePanel
                mode={groupWorkspace.mode}
                group={workspaceGroup}
                onSubmit={handleSubmitGroupWorkspace}
                onCancel={handleCloseGroupWorkspace}
                onToggleMilestone={handleToggleWorkspaceMilestone}
                onEditGroup={(groupId) => setGroupWorkspace({ mode: 'edit', groupId })}
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

            {activeTab !== 'settings' && !groupWorkspace.mode ? (
              <FocusTimerPanel
                activeTask={activeTask}
                activeGroupName={activeTaskGroup?.name ?? ''}
                activeGroupColor={activeTaskGroup?.color ?? ''}
                isRunning={isRunning}
                activeTimerLabel={formatRemainingTime(remainingSeconds)}
                onStartTimer={startTimer}
                onPauseTimer={pauseTimer}
                onResetTimer={resetTimer}
              />
            ) : null}
          </MainContent>
        )}
      />

      <SyncDataModal
        isOpen={isSyncModalOpen}
        isSubmitting={isReimporting}
        groupsCount={groups.length}
        tasksCount={allTasks.length}
        pendingTasksCount={pendingTasksCount}
        onCancel={handleCloseSyncModal}
        onConfirm={handleConfirmReimportLocalData}
      />
    </>
  );
}

export default Dashboard;
