/**
 * Advanced Permissions System
 * Provides granular, role-based access control (RBAC) for tasks, projects, and resources
 */

import type { User, Project, Task } from '@/types'

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'

export type Resource = 'task' | 'project' | 'comment' | 'time_entry' | 'project_stats'

export type Action =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'assign'
  | 'comment'
  | 'track_time'
  | 'view_stats'
  | 'manage_members'
  | 'manage_permissions'

export interface Permission {
  resource: Resource
  action: Action
  allowed: boolean
  conditions?: PermissionCondition[]
}

export interface PermissionCondition {
  field: string
  operator: 'equals' | 'contains' | 'in' | 'notIn'
  value: unknown
}

/**
 * Permission definitions for each role
 */
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  OWNER: [
    // Owners have full access
    { resource: 'project', action: 'create', allowed: true },
    { resource: 'project', action: 'read', allowed: true },
    { resource: 'project', action: 'update', allowed: true },
    { resource: 'project', action: 'delete', allowed: true },
    { resource: 'project', action: 'manage_members', allowed: true },
    { resource: 'project', action: 'manage_permissions', allowed: true },
    { resource: 'task', action: 'create', allowed: true },
    { resource: 'task', action: 'read', allowed: true },
    { resource: 'task', action: 'update', allowed: true },
    { resource: 'task', action: 'delete', allowed: true },
    { resource: 'task', action: 'assign', allowed: true },
    { resource: 'comment', action: 'create', allowed: true },
    { resource: 'comment', action: 'read', allowed: true },
    { resource: 'comment', action: 'update', allowed: true },
    { resource: 'comment', action: 'delete', allowed: true },
    { resource: 'time_entry', action: 'create', allowed: true },
    { resource: 'time_entry', action: 'read', allowed: true },
    { resource: 'time_entry', action: 'update', allowed: true },
    { resource: 'time_entry', action: 'delete', allowed: true },
    { resource: 'project_stats', action: 'view_stats', allowed: true },
  ],
  ADMIN: [
    // Admins can manage tasks and members but not delete project
    { resource: 'project', action: 'read', allowed: true },
    { resource: 'project', action: 'update', allowed: true },
    { resource: 'project', action: 'manage_members', allowed: true },
    { resource: 'task', action: 'create', allowed: true },
    { resource: 'task', action: 'read', allowed: true },
    { resource: 'task', action: 'update', allowed: true },
    { resource: 'task', action: 'delete', allowed: true },
    { resource: 'task', action: 'assign', allowed: true },
    { resource: 'comment', action: 'create', allowed: true },
    { resource: 'comment', action: 'read', allowed: true },
    { resource: 'comment', action: 'update', allowed: true },
    { resource: 'comment', action: 'delete', allowed: true },
    { resource: 'time_entry', action: 'create', allowed: true },
    { resource: 'time_entry', action: 'read', allowed: true },
    { resource: 'time_entry', action: 'update', allowed: true },
    { resource: 'time_entry', action: 'delete', allowed: true },
    { resource: 'project_stats', action: 'view_stats', allowed: true },
  ],
  MEMBER: [
    // Members can work on tasks but not manage project
    { resource: 'project', action: 'read', allowed: true },
    { resource: 'task', action: 'create', allowed: true },
    { resource: 'task', action: 'read', allowed: true },
    {
      resource: 'task',
      action: 'update',
      allowed: true,
      conditions: [
        {
          field: 'assignees',
          operator: 'contains',
          value: 'currentUserId', // Will be replaced at runtime
        },
      ],
    },
    {
      resource: 'task',
      action: 'delete',
      allowed: true,
      conditions: [
        {
          field: 'creator',
          operator: 'equals',
          value: 'currentUserId',
        },
      ],
    },
    { resource: 'comment', action: 'create', allowed: true },
    { resource: 'comment', action: 'read', allowed: true },
    {
      resource: 'comment',
      action: 'update',
      allowed: true,
      conditions: [
        {
          field: 'author',
          operator: 'equals',
          value: 'currentUserId',
        },
      ],
    },
    {
      resource: 'comment',
      action: 'delete',
      allowed: true,
      conditions: [
        {
          field: 'author',
          operator: 'equals',
          value: 'currentUserId',
        },
      ],
    },
    { resource: 'time_entry', action: 'create', allowed: true },
    { resource: 'time_entry', action: 'read', allowed: true },
    {
      resource: 'time_entry',
      action: 'update',
      allowed: true,
      conditions: [
        {
          field: 'user',
          operator: 'equals',
          value: 'currentUserId',
        },
      ],
    },
    {
      resource: 'time_entry',
      action: 'delete',
      allowed: true,
      conditions: [
        {
          field: 'user',
          operator: 'equals',
          value: 'currentUserId',
        },
      ],
    },
    { resource: 'project_stats', action: 'view_stats', allowed: true },
  ],
  VIEWER: [
    // Viewers can only read
    { resource: 'project', action: 'read', allowed: true },
    { resource: 'task', action: 'read', allowed: true },
    { resource: 'comment', action: 'read', allowed: true },
    { resource: 'time_entry', action: 'read', allowed: true },
    { resource: 'project_stats', action: 'view_stats', allowed: true },
  ],
}

/**
 * Permission service for checking access control
 */
export class PermissionService {
  /**
   * Check if user has permission to perform action on resource
   */
  static can(
    user: User,
    action: Action,
    resource: Resource,
    project?: Project,
    resourceData?: Record<string, unknown>
  ): boolean {
    // Get user's role for the project
    const role = this.getUserRoleForProject(user, project)
    if (!role) return false

    // Get permissions for role
    const permissions = ROLE_PERMISSIONS[role]

    // Find matching permission
    const permission = permissions.find(
      (p) => p.resource === resource && p.action === action
    )

    if (!permission) return false
    if (!permission.allowed) return false

    // Check conditions if any
    if (permission.conditions && resourceData) {
      return this.evaluateConditions(
        permission.conditions,
        resourceData,
        user._id
      )
    }

    return true
  }

  /**
   * Check if user can create a resource
   */
  static canCreate(
    user: User,
    resource: Resource,
    project?: Project
  ): boolean {
    return this.can(user, 'create', resource, project)
  }

  /**
   * Check if user can read a resource
   */
  static canRead(
    user: User,
    resource: Resource,
    project?: Project
  ): boolean {
    return this.can(user, 'read', resource, project)
  }

  /**
   * Check if user can update a resource
   */
  static canUpdate(
    user: User,
    resource: Resource,
    project?: Project,
    resourceData?: Record<string, unknown>
  ): boolean {
    return this.can(user, 'update', resource, project, resourceData)
  }

  /**
   * Check if user can delete a resource
   */
  static canDelete(
    user: User,
    resource: Resource,
    project?: Project,
    resourceData?: Record<string, unknown>
  ): boolean {
    return this.can(user, 'delete', resource, project, resourceData)
  }

  /**
   * Check if user can manage project members
   */
  static canManageMembers(user: User, project?: Project): boolean {
    return this.can(user, 'manage_members', 'project', project)
  }

  /**
   * Check if user can assign tasks
   */
  static canAssignTasks(user: User, project?: Project): boolean {
    return this.can(user, 'assign', 'task', project)
  }

  /**
   * Get user's role for a project
   */
  static getUserRoleForProject(user: User, project?: Project): Role | null {
    if (!project) return null

    // Check if user is owner
    if (project.owner === user._id) return 'OWNER'

    // Check project roles
    const projectRole = user.projectRoles?.find(
      (pr) => pr.project === project._id
    )

    return projectRole?.role || null
  }

  /**
   * Get all permissions for a user role
   */
  static getPermissionsForRole(role: Role): Permission[] {
    return ROLE_PERMISSIONS[role]
  }

  /**
   * Filter resources based on user permissions
   */
  static filterByPermission<T extends { _id: string }>(
    user: User,
    action: Action,
    resource: Resource,
    items: T[],
    project?: Project
  ): T[] {
    return items.filter((item) =>
      this.can(user, action, resource, project, item as unknown as Record<string, unknown>)
    )
  }

  /**
   * Evaluate permission conditions
   */
  private static evaluateConditions(
    conditions: PermissionCondition[],
    resourceData: Record<string, unknown>,
    userId: string
  ): boolean {
    return conditions.every((condition) => {
      const fieldValue = resourceData[condition.field]
      let conditionValue = condition.value

      // Replace placeholders
      if (conditionValue === 'currentUserId') {
        conditionValue = userId
      }

      switch (condition.operator) {
        case 'equals':
          return fieldValue === conditionValue
        case 'contains':
          if (Array.isArray(fieldValue)) {
            return fieldValue.includes(conditionValue)
          }
          return false
        case 'in':
          if (Array.isArray(conditionValue)) {
            return conditionValue.includes(fieldValue)
          }
          return false
        case 'notIn':
          if (Array.isArray(conditionValue)) {
            return !conditionValue.includes(fieldValue)
          }
          return false
        default:
          return false
      }
    })
  }
}

/**
 * Permission check decorator/wrapper for API routes
 */
export function requirePermission(
  action: Action,
  resource: Resource
): (user: User, project?: Project, resourceData?: Record<string, unknown>) => boolean {
  return (user: User, project?: Project, resourceData?: Record<string, unknown>) =>
    PermissionService.can(user, action, resource, project, resourceData)
}
