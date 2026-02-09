import React from 'react';
import { TaskListScreen } from '@/components/tasks';

export default function AllTasksScreen() {
  return <TaskListScreen pageType="all" title="All Tasks" showNavButtons={true} />;
}
