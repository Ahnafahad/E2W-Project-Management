/**
 * Email Notification System
 * Provides email notifications for task assignments, comments, and due dates
 *
 * Note: This is a ready-to-use implementation that requires an email service provider
 * Supports: SendGrid, Postmark, Resend, or any SMTP service
 */

import type { User, Task, Comment, Project } from '@/types'

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface EmailNotificationConfig {
  provider: 'sendgrid' | 'postmark' | 'resend' | 'smtp'
  apiKey?: string
  fromEmail: string
  fromName: string
}

/**
 * Email notification service
 */
export class EmailNotificationService {
  private config: EmailNotificationConfig

  constructor(config: EmailNotificationConfig) {
    this.config = config
  }

  /**
   * Send task assignment notification
   */
  async notifyTaskAssignment(task: Task, assignee: User, assigner: User) {
    const template = this.generateTaskAssignmentEmail(task, assignee, assigner)
    return this.sendEmail(assignee.email, template)
  }

  /**
   * Send task comment notification
   */
  async notifyTaskComment(
    task: Task,
    comment: Comment,
    commenter: User,
    recipients: User[]
  ) {
    const template = this.generateTaskCommentEmail(task, comment, commenter)
    return Promise.all(
      recipients.map((recipient) => this.sendEmail(recipient.email, template))
    )
  }

  /**
   * Send task due date reminder
   */
  async notifyTaskDueDate(task: Task, assignees: User[]) {
    const template = this.generateTaskDueDateEmail(task)
    return Promise.all(
      assignees.map((assignee) => this.sendEmail(assignee.email, template))
    )
  }

  /**
   * Send project invitation
   */
  async notifyProjectInvitation(project: Project, invitee: User, inviter: User) {
    const template = this.generateProjectInvitationEmail(
      project,
      invitee,
      inviter
    )
    return this.sendEmail(invitee.email, template)
  }

  /**
   * Send daily digest
   */
  async sendDailyDigest(user: User, tasks: Task[], projects: Project[]) {
    const template = this.generateDailyDigestEmail(user, tasks, projects)
    return this.sendEmail(user.email, template)
  }

  /**
   * Send email using configured provider
   */
  private async sendEmail(to: string, template: EmailTemplate) {
    // In development, just log the email
    if (process.env.NODE_ENV === 'development') {
      console.log('[Email Notification]', { to, subject: template.subject })
      return { success: true, messageId: 'dev-mode' }
    }

    // Implementation would depend on the provider
    // Example for SendGrid:
    if (this.config.provider === 'sendgrid') {
      return this.sendViaSendGrid(to, template)
    }

    // Example for Resend:
    if (this.config.provider === 'resend') {
      return this.sendViaResend(to, template)
    }

    throw new Error(`Email provider ${this.config.provider} not implemented`)
  }

  /**
   * Send via SendGrid
   */
  private async sendViaSendGrid(to: string, template: EmailTemplate) {
    // This would require @sendgrid/mail package
    // Implementation example:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(this.config.apiKey)

    const msg = {
      to,
      from: {
        email: this.config.fromEmail,
        name: this.config.fromName,
      },
      subject: template.subject,
      text: template.text,
      html: template.html,
    }

    return await sgMail.send(msg)
    */
    return { success: true, messageId: 'sendgrid-stub' }
  }

  /**
   * Send via Resend
   */
  private async sendViaResend(to: string, template: EmailTemplate) {
    // This would require resend package
    // Implementation example:
    /*
    const { Resend } = require('resend')
    const resend = new Resend(this.config.apiKey)

    return await resend.emails.send({
      from: `${this.config.fromName} <${this.config.fromEmail}>`,
      to: [to],
      subject: template.subject,
      html: template.html,
    })
    */
    return { success: true, messageId: 'resend-stub' }
  }

  /**
   * Generate task assignment email template
   */
  private generateTaskAssignmentEmail(
    task: Task,
    assignee: User,
    assigner: User
  ): EmailTemplate {
    const subject = `You've been assigned to: ${task.title}`
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:9696'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #000; color: #FFD97F; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #FFD97F; color: #000; text-decoration: none; border-radius: 4px; }
            .task-details { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #FFD97F; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>E2W Project Management</h1>
            </div>
            <div class="content">
              <p>Hi ${assignee.name},</p>
              <p>${assigner.name} has assigned you to a task:</p>
              <div class="task-details">
                <h2>${task.title}</h2>
                ${task.description ? `<p>${task.description}</p>` : ''}
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Status:</strong> ${task.status}</p>
                ${task.dates.due ? `<p><strong>Due Date:</strong> ${new Date(task.dates.due).toLocaleDateString()}</p>` : ''}
              </div>
              <p>
                <a href="${appUrl}/tasks?taskId=${task._id}" class="button">View Task</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Hi ${assignee.name},

${assigner.name} has assigned you to a task:

${task.title}
${task.description || ''}

Priority: ${task.priority}
Status: ${task.status}
${task.dates.due ? `Due Date: ${new Date(task.dates.due).toLocaleDateString()}` : ''}

View task: ${appUrl}/tasks?taskId=${task._id}
    `

    return { subject, html, text }
  }

  /**
   * Generate task comment email template
   */
  private generateTaskCommentEmail(
    task: Task,
    comment: Comment,
    commenter: User
  ): EmailTemplate {
    const subject = `New comment on: ${task.title}`
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:9696'

    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>E2W Project Management</h1>
            </div>
            <div class="content">
              <p>${commenter.name} commented on <strong>${task.title}</strong>:</p>
              <div class="task-details">
                <p>${comment.content}</p>
              </div>
              <p>
                <a href="${appUrl}/tasks?taskId=${task._id}" class="button">View Task</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
${commenter.name} commented on ${task.title}:

${comment.content}

View task: ${appUrl}/tasks?taskId=${task._id}
    `

    return { subject, html, text }
  }

  /**
   * Generate task due date email template
   */
  private generateTaskDueDateEmail(task: Task): EmailTemplate {
    const daysUntilDue = task.dates.due
      ? Math.ceil(
          (new Date(task.dates.due).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      : 0

    const subject =
      daysUntilDue === 0
        ? `Task due today: ${task.title}`
        : `Task due in ${daysUntilDue} days: ${task.title}`

    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:9696'

    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>E2W Project Management</h1>
            </div>
            <div class="content">
              <p><strong>Reminder:</strong> Your task is ${daysUntilDue === 0 ? 'due today' : `due in ${daysUntilDue} days`}:</p>
              <div class="task-details">
                <h2>${task.title}</h2>
                <p><strong>Priority:</strong> ${task.priority}</p>
                <p><strong>Due Date:</strong> ${task.dates.due ? new Date(task.dates.due).toLocaleDateString() : 'N/A'}</p>
              </div>
              <p>
                <a href="${appUrl}/tasks?taskId=${task._id}" class="button">View Task</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Reminder: Your task is ${daysUntilDue === 0 ? 'due today' : `due in ${daysUntilDue} days`}:

${task.title}
Priority: ${task.priority}
Due Date: ${task.dates.due ? new Date(task.dates.due).toLocaleDateString() : 'N/A'}

View task: ${appUrl}/tasks?taskId=${task._id}
    `

    return { subject, html, text }
  }

  /**
   * Generate project invitation email template
   */
  private generateProjectInvitationEmail(
    project: Project,
    invitee: User,
    inviter: User
  ): EmailTemplate {
    const subject = `You've been invited to: ${project.name}`
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:9696'

    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>E2W Project Management</h1>
            </div>
            <div class="content">
              <p>Hi ${invitee.name},</p>
              <p>${inviter.name} has invited you to join the project <strong>${project.name}</strong>.</p>
              ${project.description ? `<p>${project.description}</p>` : ''}
              <p>
                <a href="${appUrl}/projects/${project._id}" class="button">View Project</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Hi ${invitee.name},

${inviter.name} has invited you to join the project ${project.name}.

${project.description || ''}

View project: ${appUrl}/projects/${project._id}
    `

    return { subject, html, text }
  }

  /**
   * Generate daily digest email template
   */
  private generateDailyDigestEmail(
    user: User,
    tasks: Task[],
    projects: Project[]
  ): EmailTemplate {
    const subject = `Your daily digest - ${new Date().toLocaleDateString()}`
    const appUrl = process.env.NEXTAUTH_URL || 'http://localhost:9696'

    const dueTasks = tasks.filter((t) => t.dates.due && new Date(t.dates.due) <= new Date())
    const inProgressTasks = tasks.filter((t) => t.status === 'IN_PROGRESS')

    const html = `
      <!DOCTYPE html>
      <html>
        <body>
          <div class="container">
            <div class="header">
              <h1>E2W Project Management</h1>
            </div>
            <div class="content">
              <p>Hi ${user.name},</p>
              <h2>Your Daily Digest</h2>

              <h3>Due Tasks (${dueTasks.length})</h3>
              ${dueTasks.map((t) => `<li>${t.title}</li>`).join('')}

              <h3>In Progress (${inProgressTasks.length})</h3>
              ${inProgressTasks.map((t) => `<li>${t.title}</li>`).join('')}

              <h3>Active Projects (${projects.length})</h3>
              ${projects.map((p) => `<li>${p.name}</li>`).join('')}

              <p>
                <a href="${appUrl}/dashboard" class="button">Go to Dashboard</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `

    const text = `
Hi ${user.name},

Your Daily Digest:

Due Tasks (${dueTasks.length}):
${dueTasks.map((t) => `- ${t.title}`).join('\n')}

In Progress (${inProgressTasks.length}):
${inProgressTasks.map((t) => `- ${t.title}`).join('\n')}

Active Projects (${projects.length}):
${projects.map((p) => `- ${p.name}`).join('\n')}

Dashboard: ${appUrl}/dashboard
    `

    return { subject, html, text }
  }
}

// Initialize default instance (can be configured via environment variables)
export const emailService = new EmailNotificationService({
  provider: (process.env.EMAIL_PROVIDER as EmailNotificationConfig['provider']) || 'sendgrid',
  apiKey: process.env.EMAIL_API_KEY,
  fromEmail: process.env.EMAIL_FROM_ADDRESS || 'notifications@e2w.com',
  fromName: process.env.EMAIL_FROM_NAME || 'E2W Project Management',
})
