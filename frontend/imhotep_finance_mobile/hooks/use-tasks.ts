import { useState, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import api from '@/constants/api';
import { Task, TasksResponse, TaskFormData } from '@/components/tasks';
import { isOverdue } from '@/components/tasks';

export type TaskPageType = 'today-tasks' | 'next-week' | 'all';

// Minimum delay helper to ensure loading state is visible for better UX
const MIN_LOADING_TIME = 500;
const withMinDelay = async <T,>(promise: Promise<T>, minMs: number = MIN_LOADING_TIME): Promise<T> => {
  const [result] = await Promise.all([
    promise,
    new Promise(resolve => setTimeout(resolve, minMs)),
  ]);
  return result;
};

interface UseTasksOptions {
  pageType: TaskPageType;
  sortOverdueFirst?: boolean;
}

interface UseTasksReturn {
  // Data
  tasks: Task[];
  sortedTasks: Task[];
  page: number;
  numPages: number;
  totalTasks: number;
  completedCount: number;
  pendingCount: number;
  
  // Selection state
  selectedIds: number[];
  selectionMode: boolean;
  
  // Loading states
  loading: boolean;
  refreshing: boolean;
  formLoading: boolean;
  actionLoading: number | null;
  bulkLoading: boolean;
  
  // Modal states
  showFormModal: boolean;
  formMode: 'add' | 'edit';
  editingTask: Task | null;
  detailsTask: Task | null;
  
  // Actions
  fetchTasks: (pageNum?: number, isRefresh?: boolean) => Promise<void>;
  onRefresh: () => void;
  handleLoadMore: () => void;
  openAddModal: () => void;
  openEditModal: (task: Task) => void;
  closeFormModal: () => void;
  setDetailsTask: (task: Task | null) => void;
  handleFormSubmit: (taskData: TaskFormData) => Promise<void>;
  handleToggleComplete: (task: Task) => Promise<void>;
  handleDeleteTask: (taskId: number) => Promise<void>;
  
  // Selection actions
  toggleSelect: (id: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSelectionMode: () => void;
  
  // Bulk actions
  handleBulkDelete: () => Promise<void>;
  handleBulkComplete: () => Promise<void>;
  handleBulkUpdateDate: (newDate: string) => Promise<void>;
}

const API_ENDPOINTS: Record<TaskPageType, string> = {
  'today-tasks': 'api/tasks/today_tasks/',
  'next-week': 'api/tasks/next_week_tasks/',
  'all': 'api/tasks/all_tasks/',
};

export function useTasks({ pageType, sortOverdueFirst = true }: UseTasksOptions): UseTasksReturn {
  // Data state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [numPages, setNumPages] = useState(1);
  const [totalTasks, setTotalTasks] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [formMode, setFormMode] = useState<'add' | 'edit'>('add');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [detailsTask, setDetailsTask] = useState<Task | null>(null);

  const url_call = pageType;
  const endpoint = API_ENDPOINTS[pageType];

  // Track initial order - only sort on fetch, not on toggle
  const [initialOrder, setInitialOrder] = useState<number[]>([]);

  // Sort tasks with overdue at the top - only on initial load
  const sortedTasks = useMemo(() => {
    if (!sortOverdueFirst || initialOrder.length === 0) return tasks;
    
    // Maintain the initial order established on fetch
    return [...tasks].sort((a, b) => {
      const aIndex = initialOrder.indexOf(a.id);
      const bIndex = initialOrder.indexOf(b.id);
      
      // If both are in the initial order, maintain that order
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      
      // New tasks (not in initial order) go to the top
      if (aIndex === -1 && bIndex !== -1) return -1;
      if (aIndex !== -1 && bIndex === -1) return 1;
      
      return 0;
    });
  }, [tasks, sortOverdueFirst, initialOrder]);

  // Fetch tasks
  const fetchTasks = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const res = await api.get<TasksResponse>(`${endpoint}?page=${pageNum}`);
      const data = res.data;
      const fetchedTasks = data.user_tasks || [];
      
      // Sort tasks with overdue first on initial fetch
      if (sortOverdueFirst) {
        const sorted = [...fetchedTasks].sort((a, b) => {
          const aOverdue = isOverdue(a.due_date, a.status);
          const bOverdue = isOverdue(b.due_date, b.status);

          // Overdue tasks first
          if (aOverdue && !bOverdue) return -1;
          if (!aOverdue && bOverdue) return 1;

          // Then by completion status (pending first)
          if (!a.status && b.status) return -1;
          if (a.status && !b.status) return 1;

          return 0;
        });
        
        // Store the initial sorted order
        setInitialOrder(sorted.map(t => t.id));
        setTasks(sorted);
      } else {
        setInitialOrder(fetchedTasks.map(t => t.id));
        setTasks(fetchedTasks);
      }
      
      setPage(data.pagination?.page || 1);
      setNumPages(data.pagination?.num_pages || 1);
      setTotalTasks(data.total_number_tasks ?? 0);
      setCompletedCount(data.completed_tasks_count ?? 0);
      setPendingCount(data.pending_tasks ?? 0);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      Alert.alert('Error', 'Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [endpoint, sortOverdueFirst]);

  const onRefresh = useCallback(() => {
    fetchTasks(1, true);
  }, [fetchTasks]);

  const handleLoadMore = useCallback(() => {
    if (page < numPages && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchTasks(nextPage);
    }
  }, [page, numPages, loading, fetchTasks]);

  // Modal handlers
  const openAddModal = useCallback(() => {
    setFormMode('add');
    setEditingTask(null);
    setShowFormModal(true);
  }, []);

  const openEditModal = useCallback((task: Task) => {
    setFormMode('edit');
    setEditingTask(task);
    setShowFormModal(true);
  }, []);

  const closeFormModal = useCallback(() => {
    setShowFormModal(false);
    setEditingTask(null);
  }, []);

  // Create task
  const handleCreateTask = useCallback(async (taskData: TaskFormData) => {
    setFormLoading(true);
    try {
      const payload = {
        task_title: taskData.task_title,
        task_details: taskData.task_details,
        due_date: taskData.due_date || null,
        url_call,
      };
      const res = await api.post('api/tasks/add_task/', payload);
      const serverResponse = res.data;
      const created = serverResponse.task ?? serverResponse;

      if (page === 1) {
        setTasks((prev) => [created, ...prev]);
      }

      setTotalTasks((prev) => serverResponse.total_number_tasks ?? prev);
      setCompletedCount((prev) => serverResponse.completed_tasks_count ?? prev);
      setPendingCount((prev) => serverResponse.pending_tasks ?? prev);
    } catch (err) {
      console.error('Error creating task:', err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [url_call, page]);

  // Update task
  const handleUpdateTask = useCallback(async (taskData: TaskFormData) => {
    if (!editingTask) return;

    setFormLoading(true);
    try {
      const payload = {
        task_title: taskData.task_title,
        task_details: taskData.task_details,
        due_date: taskData.due_date || null,
        url_call,
      };
      const res = await api.patch(`api/tasks/update_task/${editingTask.id}/`, payload);
      const serverResponse = res.data;
      const updated = serverResponse.task ?? { ...editingTask, ...taskData };

      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? updated : t))
      );

      if (serverResponse.total_number_tasks !== undefined) {
        setTotalTasks(serverResponse.total_number_tasks);
      }
      if (serverResponse.completed_tasks_count !== undefined) {
        setCompletedCount(serverResponse.completed_tasks_count);
      }
      if (serverResponse.pending_tasks !== undefined) {
        setPendingCount(serverResponse.pending_tasks);
      }
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    } finally {
      setFormLoading(false);
    }
  }, [editingTask, url_call]);

  // Form submit handler
  const handleFormSubmit = useCallback(async (taskData: TaskFormData) => {
    if (formMode === 'edit') {
      await handleUpdateTask(taskData);
    } else {
      await handleCreateTask(taskData);
    }
  }, [formMode, handleUpdateTask, handleCreateTask]);

  // Toggle complete
  const handleToggleComplete = useCallback(async (task: Task) => {
    setActionLoading(task.id);
    try {
      // Use minimum delay to ensure loading state is visible for better UX
      const res = await withMinDelay(
        api.post(`api/tasks/task_complete/${task.id}/`, {
          url_call,
        })
      );
      const data = res.data;
      const updatedTask = data.task ?? { ...task, status: !task.status };

      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? updatedTask : t))
      );
      setTotalTasks((prev) => data.total_number_tasks ?? prev);
      setCompletedCount((prev) => data.completed_tasks_count ?? prev);
      setPendingCount((prev) => data.pending_tasks ?? prev);
    } catch (err) {
      console.error('Error completing task:', err);
      Alert.alert('Error', 'Failed to update task.');
    } finally {
      setActionLoading(null);
    }
  }, [url_call]);

  // Delete task
  const handleDeleteTask = useCallback(async (taskId: number) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(taskId);
            try {
              const res = await api.delete(`api/tasks/delete_task/${taskId}/`, {
                data: { url_call },
              });
              const data = res.data;

              setTasks((prev) => prev.filter((t) => t.id !== taskId));
              setTotalTasks((prev) => data.total_number_tasks ?? Math.max(0, prev - 1));
              setCompletedCount((prev) => data.completed_tasks_count ?? prev);
              setPendingCount((prev) => data.pending_tasks ?? Math.max(0, prev - 1));
            } catch (err) {
              console.error('Error deleting task:', err);
              Alert.alert('Error', 'Failed to delete task.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }, [url_call]);

  // Selection handlers
  const toggleSelect = useCallback((id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback(() => {
    if (selectedIds.length === tasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tasks.map(t => t.id));
    }
  }, [tasks, selectedIds.length]);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    setSelectionMode(false);
  }, []);

  const toggleSelectionMode = useCallback(() => {
    if (selectionMode) {
      setSelectedIds([]);
    }
    setSelectionMode(prev => !prev);
  }, [selectionMode]);

  // Bulk delete - same endpoint as web: DELETE api/tasks/multiple_delete_task/
  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    Alert.alert(
      'Delete Tasks',
      `Are you sure you want to delete ${selectedIds.length} task${selectedIds.length > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBulkLoading(true);
            try {
              await api.delete('api/tasks/multiple_delete_task/', {
                data: { task_ids: selectedIds, url_call }
              });
              await fetchTasks(page);
              clearSelection();
            } catch (err) {
              console.error('Error bulk deleting tasks:', err);
              Alert.alert('Error', 'Failed to delete tasks.');
            } finally {
              setBulkLoading(false);
            }
          },
        },
      ]
    );
  }, [selectedIds, url_call, page, fetchTasks, clearSelection]);

  // Bulk complete toggle - same endpoint as web: POST api/tasks/multiple_task_complete/
  const handleBulkComplete = useCallback(async () => {
    if (selectedIds.length === 0) return;

    setBulkLoading(true);
    try {
      await api.post('api/tasks/multiple_task_complete/', {
        task_ids: selectedIds,
        url_call
      });
      await fetchTasks(page);
      clearSelection();
    } catch (err) {
      console.error('Error bulk completing tasks:', err);
      Alert.alert('Error', 'Failed to update tasks.');
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, url_call, page, fetchTasks, clearSelection]);

  // Bulk update date - same endpoint as web: PATCH api/tasks/multiple_update_task_dates/
  const handleBulkUpdateDate = useCallback(async (newDate: string) => {
    if (selectedIds.length === 0 || !newDate) return;

    setBulkLoading(true);
    try {
      await api.patch('api/tasks/multiple_update_task_dates/', {
        task_ids: selectedIds,
        due_date: newDate,
        url_call
      });
      await fetchTasks(page);
      clearSelection();
    } catch (err) {
      console.error('Error bulk updating dates:', err);
      Alert.alert('Error', 'Failed to update task dates.');
    } finally {
      setBulkLoading(false);
    }
  }, [selectedIds, url_call, page, fetchTasks, clearSelection]);

  return {
    // Data
    tasks,
    sortedTasks,
    page,
    numPages,
    totalTasks,
    completedCount,
    pendingCount,
    
    // Selection state
    selectedIds,
    selectionMode,
    
    // Loading states
    loading,
    refreshing,
    formLoading,
    actionLoading,
    bulkLoading,
    
    // Modal states
    showFormModal,
    formMode,
    editingTask,
    detailsTask,
    
    // Actions
    fetchTasks,
    onRefresh,
    handleLoadMore,
    openAddModal,
    openEditModal,
    closeFormModal,
    setDetailsTask,
    handleFormSubmit,
    handleToggleComplete,
    handleDeleteTask,
    
    // Selection actions
    toggleSelect,
    selectAll,
    clearSelection,
    toggleSelectionMode,
    
    // Bulk actions
    handleBulkDelete,
    handleBulkComplete,
    handleBulkUpdateDate,
  };
}
