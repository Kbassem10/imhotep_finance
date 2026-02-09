import React, { createContext, useContext, useState, useCallback } from 'react';

interface TaskModalContextType {
  showAddTaskModal: boolean;
  openAddTaskModal: () => void;
  closeAddTaskModal: () => void;
  onTaskAdded: (() => void) | null;
  setOnTaskAdded: (callback: (() => void) | null) => void;
}

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [onTaskAdded, setOnTaskAdded] = useState<(() => void) | null>(null);

  const openAddTaskModal = useCallback(() => {
    setShowAddTaskModal(true);
  }, []);

  const closeAddTaskModal = useCallback(() => {
    setShowAddTaskModal(false);
  }, []);

  return (
    <TaskModalContext.Provider
      value={{
        showAddTaskModal,
        openAddTaskModal,
        closeAddTaskModal,
        onTaskAdded,
        setOnTaskAdded,
      }}
    >
      {children}
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (context === undefined) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
}
