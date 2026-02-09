import React from 'react';
import { TaskListScreen } from '@/components/tasks';

export default function NextWeekScreen() {
  return <TaskListScreen pageType="next-week" title="Next 7 Days" />;
}
