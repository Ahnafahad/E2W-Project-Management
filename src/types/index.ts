export interface User {
  _id: string;
  email: string;
  password?: string; // Optional because it's excluded in queries
  name: string;
  avatar?: string;
  created: Date;
  lastLogin?: Date;
  projectRoles: ProjectRole[];
}

export interface ProjectRole {
  project: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  owner: string;
  members: string[];
  created: Date;
  updated: Date;
  deleted?: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  creator: string;
  watchers: string[];
  project: string;
  parent?: string;
  dependencies: string[];
  tags: string[];
  customFields?: Record<string, unknown>;
  dates: {
    created: Date;
    updated: Date;
    due?: Date;
    start?: Date;
    completed?: Date;
  };
  timeEstimate?: number;
  timeTracked?: number;
  attachments: Attachment[];
  commentCount: number;
  recurring?: RecurringConfig;
  deleted?: boolean;
  deletedAt?: Date;
}

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface RecurringConfig {
  enabled: boolean;
  frequency: string;
  interval: number;
  endDate?: Date;
}

export interface Attachment {
  fileId: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export interface Comment {
  _id: string;
  task: string;
  author: string;
  content: string;
  mentions: string[];
  parent?: string;
  reactions: Record<string, string[]>;
  created: Date;
  updated: Date;
  edited: boolean;
  deleted?: boolean;
}

export interface ProjectStats {
  project: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
  tasksByPriority: Record<TaskPriority, number>;
  avgCompletionTime: number;
  velocityLastWeek: number;
  lastUpdated: Date;
}

export interface Automation {
  _id: string;
  name: string;
  project: string;
  enabled: boolean;
  trigger: {
    type: string;
    config: Record<string, unknown>;
  };
  conditions: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
  actions: Array<{
    type: string;
    config: Record<string, unknown>;
  }>;
  lastRun?: Date;
  runCount: number;
}

export interface ActivityLog {
  _id: string;
  user: string;
  action: string;
  resource: string;
  resourceId: string;
  details?: Record<string, unknown>;
  created: Date;
}

export type ViewType = 'list' | 'board' | 'calendar' | 'timeline';

export interface FilterState {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignees?: string[];
  tags?: string[];
  dueDate?: {
    start?: Date;
    end?: Date;
  };
  search?: string;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}