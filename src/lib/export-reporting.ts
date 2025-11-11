/**
 * Export and Reporting System
 * Provides data export in various formats (CSV, JSON) and reporting features
 */

import type { Task, Project, User, ProjectStats } from '@/types'

export interface ReportData {
  title: string
  generatedAt: Date
  generatedBy: string
  data: unknown[]
}

/**
 * Export service for tasks, projects, and reports
 */
export class ExportService {
  /**
   * Export tasks to CSV
   */
  static exportTasksToCSV(tasks: Task[]): string {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Status',
      'Priority',
      'Assignees',
      'Project',
      'Created',
      'Due Date',
      'Completed',
      'Tags',
      'Time Estimate (hrs)',
      'Time Tracked (hrs)',
    ]

    const rows = tasks.map((task) => [
      task._id,
      this.escapeCSV(task.title),
      this.escapeCSV(task.description || ''),
      task.status,
      task.priority,
      task.assignees.join(';'),
      task.project,
      new Date(task.dates.created).toISOString(),
      task.dates.due ? new Date(task.dates.due).toISOString() : '',
      task.dates.completed ? new Date(task.dates.completed).toISOString() : '',
      task.tags.join(';'),
      task.timeEstimate ? (task.timeEstimate / 60).toFixed(2) : '',
      (task.timeTracked || 0) / 60,
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  /**
   * Export projects to CSV
   */
  static exportProjectsToCSV(projects: Project[]): string {
    const headers = [
      'ID',
      'Name',
      'Description',
      'Owner',
      'Members',
      'Created',
      'Updated',
    ]

    const rows = projects.map((project) => [
      project._id,
      this.escapeCSV(project.name),
      this.escapeCSV(project.description || ''),
      project.owner,
      project.members.join(';'),
      new Date(project.created).toISOString(),
      new Date(project.updated).toISOString(),
    ])

    return this.arrayToCSV([headers, ...rows])
  }

  /**
   * Export project report to CSV
   */
  static exportProjectReportToCSV(
    project: Project,
    stats: ProjectStats,
    tasks: Task[]
  ): string {
    const report: string[] = []

    // Project Overview
    report.push('PROJECT OVERVIEW')
    report.push(`Name,${this.escapeCSV(project.name)}`)
    report.push(`Description,${this.escapeCSV(project.description || '')}`)
    report.push(`Created,${new Date(project.created).toLocaleDateString()}`)
    report.push(`Total Tasks,${stats.totalTasks}`)
    report.push(`Completed Tasks,${stats.completedTasks}`)
    report.push(`Completion Rate,${stats.totalTasks > 0 ? ((stats.completedTasks / stats.totalTasks) * 100).toFixed(1) : 0}%`)
    report.push(`Average Completion Time,${stats.avgCompletionTime.toFixed(1)} days`)
    report.push(`Velocity (Last Week),${stats.velocityLastWeek} tasks`)
    report.push('')

    // Status Breakdown
    report.push('TASKS BY STATUS')
    report.push(`TODO,${stats.tasksByStatus.TODO}`)
    report.push(`IN_PROGRESS,${stats.tasksByStatus.IN_PROGRESS}`)
    report.push(`DONE,${stats.tasksByStatus.DONE}`)
    report.push(`BLOCKED,${stats.tasksByStatus.BLOCKED}`)
    report.push('')

    // Priority Breakdown
    report.push('TASKS BY PRIORITY')
    report.push(`LOW,${stats.tasksByPriority.LOW}`)
    report.push(`MEDIUM,${stats.tasksByPriority.MEDIUM}`)
    report.push(`HIGH,${stats.tasksByPriority.HIGH}`)
    report.push(`URGENT,${stats.tasksByPriority.URGENT}`)
    report.push('')

    // Task Details
    report.push('TASK DETAILS')
    report.push('ID,Title,Status,Priority,Assignees,Due Date,Completed')
    tasks.forEach((task) => {
      report.push(
        [
          task._id,
          this.escapeCSV(task.title),
          task.status,
          task.priority,
          task.assignees.join(';'),
          task.dates.due ? new Date(task.dates.due).toLocaleDateString() : '',
          task.dates.completed ? new Date(task.dates.completed).toLocaleDateString() : '',
        ].join(',')
      )
    })

    return report.join('\n')
  }

  /**
   * Export time tracking report to CSV
   */
  static exportTimeTrackingReportToCSV(tasks: Task[]): string {
    const headers = [
      'Task ID',
      'Task Title',
      'Assignees',
      'Time Estimate (hrs)',
      'Time Tracked (hrs)',
      'Remaining (hrs)',
      'Progress %',
      'Status',
    ]

    const rows = tasks.map((task) => {
      const estimated = task.timeEstimate || 0
      const tracked = task.timeTracked || 0
      const remaining = Math.max(0, estimated - tracked)
      const progress = estimated > 0 ? ((tracked / estimated) * 100).toFixed(1) : '0'

      return [
        task._id,
        this.escapeCSV(task.title),
        task.assignees.join(';'),
        (estimated / 60).toFixed(2),
        (tracked / 60).toFixed(2),
        (remaining / 60).toFixed(2),
        progress,
        task.status,
      ]
    })

    return this.arrayToCSV([headers, ...rows])
  }

  /**
   * Export user productivity report
   */
  static exportUserProductivityReport(
    user: User,
    tasks: Task[],
    dateRange: { start: Date; end: Date }
  ): string {
    const completedTasks = tasks.filter(
      (t) =>
        t.dates.completed &&
        new Date(t.dates.completed) >= dateRange.start &&
        new Date(t.dates.completed) <= dateRange.end
    )

    const totalTimeTracked = tasks.reduce((sum, t) => sum + (t.timeTracked || 0), 0)

    const report: string[] = []

    report.push('USER PRODUCTIVITY REPORT')
    report.push(`User,${user.name}`)
    report.push(`Email,${user.email}`)
    report.push(`Period,${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`)
    report.push('')

    report.push('SUMMARY')
    report.push(`Total Tasks,${tasks.length}`)
    report.push(`Completed Tasks,${completedTasks.length}`)
    report.push(`Completion Rate,${tasks.length > 0 ? ((completedTasks.length / tasks.length) * 100).toFixed(1) : 0}%`)
    report.push(`Total Time Tracked,${(totalTimeTracked / 60).toFixed(2)} hours`)
    report.push('')

    report.push('TASK DETAILS')
    report.push('Task ID,Title,Status,Priority,Time Tracked (hrs),Completed Date')
    tasks.forEach((task) => {
      report.push(
        [
          task._id,
          this.escapeCSV(task.title),
          task.status,
          task.priority,
          ((task.timeTracked || 0) / 60).toFixed(2),
          task.dates.completed ? new Date(task.dates.completed).toLocaleDateString() : '',
        ].join(',')
      )
    })

    return report.join('\n')
  }

  /**
   * Export to JSON
   */
  static exportToJSON<T>(data: T[]): string {
    return JSON.stringify(data, null, 2)
  }

  /**
   * Generate velocity chart data
   */
  static generateVelocityChartData(
    tasks: Task[],
    weeks: number = 12
  ): { week: string; completed: number }[] {
    const now = new Date()
    const data: { week: string; completed: number }[] = []

    for (let i = weeks - 1; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - i * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const completed = tasks.filter((t) => {
        if (!t.dates.completed) return false
        const completedDate = new Date(t.dates.completed)
        return completedDate >= weekStart && completedDate < weekEnd
      }).length

      data.push({
        week: `Week ${weeks - i}`,
        completed,
      })
    }

    return data
  }

  /**
   * Generate burndown chart data
   */
  static generateBurndownChartData(
    tasks: Task[],
    projectStartDate: Date,
    projectEndDate: Date
  ): { date: string; remaining: number; ideal: number }[] {
    const totalTasks = tasks.length
    const days = Math.ceil(
      (projectEndDate.getTime() - projectStartDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const data: { date: string; remaining: number; ideal: number }[] = []

    for (let i = 0; i <= days; i++) {
      const currentDate = new Date(projectStartDate)
      currentDate.setDate(currentDate.getDate() + i)

      const completedByDate = tasks.filter((t) => {
        if (!t.dates.completed) return false
        return new Date(t.dates.completed) <= currentDate
      }).length

      const remaining = totalTasks - completedByDate
      const ideal = totalTasks - (totalTasks * i) / days

      data.push({
        date: currentDate.toLocaleDateString(),
        remaining,
        ideal: Math.max(0, ideal),
      })
    }

    return data
  }

  /**
   * Helper: Convert 2D array to CSV string
   */
  private static arrayToCSV(data: (string | number)[][]): string {
    return data.map((row) => row.join(',')).join('\n')
  }

  /**
   * Helper: Escape CSV field
   */
  private static escapeCSV(field: string): string {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  /**
   * Helper: Download file in browser
   */
  static downloadFile(content: string, filename: string, mimeType: string) {
    if (typeof window === 'undefined') return

    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    window.URL.revokeObjectURL(url)
  }
}
