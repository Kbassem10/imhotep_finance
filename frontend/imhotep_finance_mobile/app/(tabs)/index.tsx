import React from 'react';
import { TaskListScreen } from '@/components/tasks';
import { useAuth } from '@/contexts/AuthContext';

export default function TodayTasksScreen() {
  const { user } = useAuth();

  return (
    <TaskListScreen
      pageType="today-tasks"
      title="Today's Tasks"
      username={user?.username}
    />
  );
}

