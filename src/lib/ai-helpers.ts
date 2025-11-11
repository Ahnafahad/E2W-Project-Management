import { Task, Project, TaskPriority } from '@/types'

// Task templates for common project types
export const taskTemplates = {
  'Software Development': [
    { title: 'Set up development environment', priority: 'HIGH' as TaskPriority, tags: ['setup', 'development'] },
    { title: 'Create project structure', priority: 'HIGH' as TaskPriority, tags: ['setup', 'architecture'] },
    { title: 'Implement core functionality', priority: 'HIGH' as TaskPriority, tags: ['development', 'core'] },
    { title: 'Write unit tests', priority: 'MEDIUM' as TaskPriority, tags: ['testing', 'quality'] },
    { title: 'Code review and refactoring', priority: 'MEDIUM' as TaskPriority, tags: ['review', 'quality'] },
    { title: 'Documentation and deployment', priority: 'MEDIUM' as TaskPriority, tags: ['documentation', 'deployment'] }
  ],
  'Marketing Campaign': [
    { title: 'Define target audience and goals', priority: 'HIGH' as TaskPriority, tags: ['strategy', 'planning'] },
    { title: 'Create content calendar', priority: 'HIGH' as TaskPriority, tags: ['content', 'planning'] },
    { title: 'Design marketing materials', priority: 'MEDIUM' as TaskPriority, tags: ['design', 'creative'] },
    { title: 'Set up tracking and analytics', priority: 'MEDIUM' as TaskPriority, tags: ['analytics', 'tracking'] },
    { title: 'Launch campaign', priority: 'HIGH' as TaskPriority, tags: ['launch', 'execution'] },
    { title: 'Monitor and optimize performance', priority: 'MEDIUM' as TaskPriority, tags: ['optimization', 'monitoring'] }
  ],
  'Product Launch': [
    { title: 'Market research and validation', priority: 'HIGH' as TaskPriority, tags: ['research', 'validation'] },
    { title: 'Product development and testing', priority: 'HIGH' as TaskPriority, tags: ['development', 'testing'] },
    { title: 'Create launch strategy', priority: 'HIGH' as TaskPriority, tags: ['strategy', 'planning'] },
    { title: 'Prepare marketing materials', priority: 'MEDIUM' as TaskPriority, tags: ['marketing', 'materials'] },
    { title: 'Beta testing and feedback', priority: 'MEDIUM' as TaskPriority, tags: ['testing', 'feedback'] },
    { title: 'Official product launch', priority: 'HIGH' as TaskPriority, tags: ['launch', 'execution'] }
  ],
  'Event Planning': [
    { title: 'Define event scope and budget', priority: 'HIGH' as TaskPriority, tags: ['planning', 'budget'] },
    { title: 'Book venue and vendors', priority: 'HIGH' as TaskPriority, tags: ['venue', 'vendors'] },
    { title: 'Create event timeline', priority: 'MEDIUM' as TaskPriority, tags: ['timeline', 'planning'] },
    { title: 'Marketing and promotion', priority: 'MEDIUM' as TaskPriority, tags: ['marketing', 'promotion'] },
    { title: 'Final preparations and setup', priority: 'HIGH' as TaskPriority, tags: ['setup', 'preparation'] },
    { title: 'Event execution and follow-up', priority: 'HIGH' as TaskPriority, tags: ['execution', 'follow-up'] }
  ],
  'Content Creation': [
    { title: 'Research and outline content', priority: 'HIGH' as TaskPriority, tags: ['research', 'planning'] },
    { title: 'Create content draft', priority: 'HIGH' as TaskPriority, tags: ['writing', 'creation'] },
    { title: 'Review and edit content', priority: 'MEDIUM' as TaskPriority, tags: ['editing', 'review'] },
    { title: 'Design visual elements', priority: 'MEDIUM' as TaskPriority, tags: ['design', 'visuals'] },
    { title: 'Optimize for SEO/accessibility', priority: 'LOW' as TaskPriority, tags: ['seo', 'optimization'] },
    { title: 'Publish and promote', priority: 'MEDIUM' as TaskPriority, tags: ['publishing', 'promotion'] }
  ]
}

// Smart suggestions based on task patterns
export class AIHelper {

  // Suggest task priority based on keywords and context
  static suggestPriority(title: string, description: string = ''): TaskPriority {
    const text = `${title} ${description}`.toLowerCase()

    const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately', 'deadline', 'hotfix', 'bug', 'security']
    const highKeywords = ['important', 'priority', 'milestone', 'launch', 'release', 'client', 'customer', 'demo']
    const lowKeywords = ['nice to have', 'future', 'optional', 'cleanup', 'documentation', 'refactor', 'optimize']

    if (urgentKeywords.some(keyword => text.includes(keyword))) {
      return 'URGENT'
    }

    if (highKeywords.some(keyword => text.includes(keyword))) {
      return 'HIGH'
    }

    if (lowKeywords.some(keyword => text.includes(keyword))) {
      return 'LOW'
    }

    return 'MEDIUM'
  }

  // Suggest tags based on task content
  static suggestTags(title: string, description: string = ''): string[] {
    const text = `${title} ${description}`.toLowerCase()
    const suggestions: string[] = []

    const tagPatterns = {
      'frontend': ['frontend', 'ui', 'interface', 'react', 'vue', 'angular', 'css', 'html'],
      'backend': ['backend', 'api', 'server', 'database', 'node', 'python', 'java'],
      'design': ['design', 'mockup', 'wireframe', 'figma', 'sketch', 'prototype'],
      'testing': ['test', 'testing', 'qa', 'quality', 'bug', 'debug'],
      'documentation': ['document', 'docs', 'readme', 'guide', 'manual'],
      'deployment': ['deploy', 'deployment', 'release', 'production', 'staging'],
      'security': ['security', 'auth', 'authentication', 'permission', 'vulnerability'],
      'performance': ['performance', 'optimize', 'speed', 'cache', 'memory'],
      'research': ['research', 'investigate', 'analyze', 'study', 'explore'],
      'meeting': ['meeting', 'call', 'discussion', 'standup', 'review'],
      'planning': ['plan', 'planning', 'strategy', 'roadmap', 'brainstorm'],
      'urgent': ['urgent', 'critical', 'emergency', 'hotfix', 'asap']
    }

    Object.entries(tagPatterns).forEach(([tag, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        suggestions.push(tag)
      }
    })

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }

  // Suggest time estimate based on task complexity
  static suggestTimeEstimate(title: string, description: string = '', priority: TaskPriority): number {
    const text = `${title} ${description}`.toLowerCase()

    let baseTime = 120 // 2 hours in minutes

    // Adjust based on complexity indicators
    const complexityFactors = {
      'simple': ['fix', 'update', 'change', 'small'],
      'medium': ['implement', 'create', 'develop', 'build'],
      'complex': ['architecture', 'integration', 'migration', 'refactor', 'redesign']
    }

    if (complexityFactors.simple.some(word => text.includes(word))) {
      baseTime = 60 // 1 hour
    } else if (complexityFactors.complex.some(word => text.includes(word))) {
      baseTime = 480 // 8 hours
    }

    // Adjust based on priority
    const priorityMultipliers = {
      'LOW': 0.8,
      'MEDIUM': 1.0,
      'HIGH': 1.5,
      'URGENT': 0.5 // Urgent tasks are often quick fixes
    }

    return Math.round(baseTime * priorityMultipliers[priority])
  }

  // Generate smart task breakdown for complex tasks
  static suggestTaskBreakdown(title: string, description: string = ''): Array<{title: string, priority: TaskPriority}> {
    const text = `${title} ${description}`.toLowerCase()
    const subtasks: Array<{title: string, priority: TaskPriority}> = []

    // Feature development breakdown
    if (text.includes('feature') || text.includes('implement') || text.includes('develop')) {
      subtasks.push(
        { title: 'Research and planning', priority: 'HIGH' },
        { title: 'Design and mockups', priority: 'MEDIUM' },
        { title: 'Implementation', priority: 'HIGH' },
        { title: 'Testing and validation', priority: 'MEDIUM' },
        { title: 'Documentation', priority: 'LOW' }
      )
    }

    // Bug fix breakdown
    if (text.includes('bug') || text.includes('fix') || text.includes('issue')) {
      subtasks.push(
        { title: 'Reproduce and investigate issue', priority: 'HIGH' },
        { title: 'Identify root cause', priority: 'HIGH' },
        { title: 'Implement fix', priority: 'HIGH' },
        { title: 'Test fix and edge cases', priority: 'MEDIUM' },
        { title: 'Deploy and monitor', priority: 'MEDIUM' }
      )
    }

    // Research breakdown
    if (text.includes('research') || text.includes('investigate') || text.includes('analyze')) {
      subtasks.push(
        { title: 'Define research scope and questions', priority: 'HIGH' },
        { title: 'Gather information and data', priority: 'MEDIUM' },
        { title: 'Analyze findings', priority: 'MEDIUM' },
        { title: 'Document insights and recommendations', priority: 'MEDIUM' }
      )
    }

    return subtasks
  }

  // Suggest due date based on priority and context
  static suggestDueDate(priority: TaskPriority, timeEstimate?: number): Date | null {
    const now = new Date()
    const dueDate = new Date(now)

    const dueDateOffsets = {
      'URGENT': 1, // 1 day
      'HIGH': 3,   // 3 days
      'MEDIUM': 7, // 1 week
      'LOW': 14    // 2 weeks
    }

    dueDate.setDate(now.getDate() + dueDateOffsets[priority])

    // Adjust for weekends - push to next Monday if due on weekend
    if (dueDate.getDay() === 0) { // Sunday
      dueDate.setDate(dueDate.getDate() + 1)
    } else if (dueDate.getDay() === 6) { // Saturday
      dueDate.setDate(dueDate.getDate() + 2)
    }

    return dueDate
  }

  // Analyze task patterns to suggest improvements
  static analyzeTaskPatterns(tasks: Task[]): Array<{type: string, suggestion: string, impact: 'low' | 'medium' | 'high'}> {
    const suggestions: Array<{type: string, suggestion: string, impact: 'low' | 'medium' | 'high'}> = []

    // Analyze overdue tasks
    const overdueTasks = tasks.filter(task =>
      task.dates.due &&
      new Date(task.dates.due) < new Date() &&
      task.status !== 'DONE'
    )

    if (overdueTasks.length > 3) {
      suggestions.push({
        type: 'time_management',
        suggestion: `You have ${overdueTasks.length} overdue tasks. Consider breaking large tasks into smaller ones and adjusting time estimates.`,
        impact: 'high'
      })
    }

    // Analyze blocked tasks
    const blockedTasks = tasks.filter(task => task.status === 'BLOCKED')
    if (blockedTasks.length > 2) {
      suggestions.push({
        type: 'workflow',
        suggestion: `${blockedTasks.length} tasks are blocked. Review dependencies and consider parallel work streams.`,
        impact: 'high'
      })
    }

    // Analyze task distribution
    const incompleteTasks = tasks.filter(task => task.status !== 'DONE')
    const highPriorityTasks = incompleteTasks.filter(task => task.priority === 'HIGH' || task.priority === 'URGENT')

    if (highPriorityTasks.length > incompleteTasks.length * 0.5) {
      suggestions.push({
        type: 'prioritization',
        suggestion: 'Over 50% of your tasks are high priority. Consider re-evaluating priorities to focus on what truly matters.',
        impact: 'medium'
      })
    }

    // Analyze task completion patterns
    const completedTasks = tasks.filter(task => task.status === 'DONE' && task.dates.completed)
    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, task) => {
          const created = new Date(task.dates.created).getTime()
          const completed = new Date(task.dates.completed!).getTime()
          return sum + (completed - created)
        }, 0) / completedTasks.length / (1000 * 60 * 60 * 24) // Convert to days
      : 0

    if (avgCompletionTime > 7) {
      suggestions.push({
        type: 'efficiency',
        suggestion: `Average task completion time is ${Math.round(avgCompletionTime)} days. Consider breaking tasks into smaller, more manageable pieces.`,
        impact: 'medium'
      })
    }

    return suggestions
  }

  // Smart project template suggestion
  static suggestProjectTemplate(projectName: string, description: string = ''): string | null {
    const text = `${projectName} ${description}`.toLowerCase()

    const templatePatterns = {
      'Software Development': ['app', 'software', 'code', 'development', 'website', 'api', 'system'],
      'Marketing Campaign': ['marketing', 'campaign', 'promotion', 'advertising', 'brand', 'social media'],
      'Product Launch': ['launch', 'product', 'release', 'go-to-market', 'mvp'],
      'Event Planning': ['event', 'conference', 'meeting', 'workshop', 'seminar', 'celebration'],
      'Content Creation': ['content', 'blog', 'article', 'video', 'podcast', 'documentation']
    }

    for (const [template, keywords] of Object.entries(templatePatterns)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return template
      }
    }

    return null
  }

  // Generate smart task suggestions based on project context
  static suggestNextTasks(project: Project, existingTasks: Task[]): Array<{title: string, priority: TaskPriority, tags: string[]}> {
    const suggestions: Array<{title: string, priority: TaskPriority, tags: string[]}> = []

    // Analyze existing tasks to understand project phase
    const taskTitles = existingTasks.map(task => task.title.toLowerCase()).join(' ')
    const completedTasks = existingTasks.filter(task => task.status === 'DONE')
    const completionRate = existingTasks.length > 0 ? completedTasks.length / existingTasks.length : 0

    // Early phase suggestions
    if (completionRate < 0.3) {
      if (!taskTitles.includes('planning') && !taskTitles.includes('scope')) {
        suggestions.push({
          title: 'Define project scope and requirements',
          priority: 'HIGH',
          tags: ['planning', 'requirements']
        })
      }

      if (!taskTitles.includes('timeline') && !taskTitles.includes('schedule')) {
        suggestions.push({
          title: 'Create project timeline and milestones',
          priority: 'MEDIUM',
          tags: ['planning', 'timeline']
        })
      }
    }

    // Mid phase suggestions
    if (completionRate >= 0.3 && completionRate < 0.8) {
      if (!taskTitles.includes('review') && !taskTitles.includes('check')) {
        suggestions.push({
          title: 'Mid-project review and adjustment',
          priority: 'MEDIUM',
          tags: ['review', 'planning']
        })
      }

      if (!taskTitles.includes('test') && !taskTitles.includes('quality')) {
        suggestions.push({
          title: 'Quality assurance and testing',
          priority: 'HIGH',
          tags: ['testing', 'quality']
        })
      }
    }

    // Final phase suggestions
    if (completionRate >= 0.8) {
      if (!taskTitles.includes('documentation') && !taskTitles.includes('docs')) {
        suggestions.push({
          title: 'Complete project documentation',
          priority: 'MEDIUM',
          tags: ['documentation', 'final']
        })
      }

      if (!taskTitles.includes('deploy') && !taskTitles.includes('launch')) {
        suggestions.push({
          title: 'Prepare for deployment/launch',
          priority: 'HIGH',
          tags: ['deployment', 'launch']
        })
      }

      suggestions.push({
        title: 'Project retrospective and lessons learned',
        priority: 'LOW',
        tags: ['retrospective', 'learning']
      })
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions
  }
}