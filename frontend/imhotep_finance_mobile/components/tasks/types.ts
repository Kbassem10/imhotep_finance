// Shared Task type definition used across task components

export interface Task {
  id: number;
  task_title: string;
  task_details?: string;
  due_date?: string;
  status: boolean;
  transaction_id?: number;
  transaction_status?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TaskFormData {
  task_title: string;
  task_details: string;
  due_date: string;
}

export interface TasksResponse {
  user_tasks: Task[];
  pagination: {
    page: number;
    num_pages: number;
  };
  total_number_tasks: number;
  completed_tasks_count: number;
  pending_tasks: number;
}

export interface TaskCounts {
  total_number_tasks?: number;
  completed_tasks_count?: number;
  pending_tasks?: number;
}
