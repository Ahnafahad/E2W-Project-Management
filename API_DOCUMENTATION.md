# E2W Project Management API Documentation

Version: 1.0.0
Base URL: `https://your-domain.com/api`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Projects](#projects)
4. [Tasks](#tasks)
5. [Comments](#comments)
6. [Time Entries](#time-entries)
7. [Project Stats](#project-stats)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)

---

## Authentication

All API endpoints (except registration and login) require authentication via NextAuth.js session cookies.

### Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

### Login

```http
POST /api/auth/[...nextauth]
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
Sets session cookie and returns session data.

---

## Users

### Get All Users

```http
GET /api/users
```

**Query Parameters:**
- `email` (optional): Filter by email address

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john@example.com",
      "avatar": "https://example.com/avatar.jpg",
      "created": "2025-01-01T00:00:00.000Z",
      "projectRoles": [
        {
          "project": "507f1f77bcf86cd799439012",
          "role": "OWNER"
        }
      ]
    }
  ]
}
```

### Get User by ID

```http
GET /api/users/{userId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "created": "2025-01-01T00:00:00.000Z"
  }
}
```

### Update User

```http
PATCH /api/users/{userId}
Content-Type: application/json

{
  "name": "John Smith",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated user object */ }
}
```

### Delete User

```http
DELETE /api/users/{userId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## Projects

### Get All Projects

```http
GET /api/projects
```

**Query Parameters:**
- `userId` (optional): Filter projects by user (member or owner)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Website Redesign",
      "description": "Redesign the company website",
      "owner": "507f1f77bcf86cd799439011",
      "members": ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439013"],
      "created": "2025-01-01T00:00:00.000Z",
      "updated": "2025-01-15T00:00:00.000Z",
      "deleted": false
    }
  ]
}
```

### Create Project

```http
POST /api/projects
Content-Type: application/json

{
  "name": "New Project",
  "description": "Project description",
  "members": ["507f1f77bcf86cd799439013"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* Created project object */ }
}
```

### Get Project by ID

```http
GET /api/projects/{projectId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Project object */ }
}
```

### Update Project

```http
PATCH /api/projects/{projectId}
Content-Type: application/json

{
  "name": "Updated Project Name",
  "description": "Updated description",
  "members": ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated project object */ }
}
```

### Delete Project

```http
DELETE /api/projects/{projectId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### Get Project Statistics

```http
GET /api/projects/{projectId}/stats
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "project": "507f1f77bcf86cd799439012",
    "totalTasks": 45,
    "completedTasks": 23,
    "overdueTasks": 3,
    "tasksByStatus": {
      "TODO": 10,
      "IN_PROGRESS": 12,
      "DONE": 23,
      "BLOCKED": 0
    },
    "tasksByPriority": {
      "LOW": 8,
      "MEDIUM": 25,
      "HIGH": 10,
      "URGENT": 2
    },
    "avgCompletionTime": 3.5,
    "velocityLastWeek": 7,
    "lastUpdated": "2025-01-15T00:00:00.000Z"
  }
}
```

---

## Tasks

### Get All Tasks

```http
GET /api/tasks
```

**Query Parameters:**
- `projectId` (optional): Filter by project
- `userId` (optional): Filter by assigned user
- `status` (optional): Filter by status (TODO, IN_PROGRESS, DONE, BLOCKED)
- `priority` (optional): Filter by priority (LOW, MEDIUM, HIGH, URGENT)
- `search` (optional): Search in title and description
- `excludeDone` (optional): Exclude completed tasks (boolean)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Offset for pagination (default: 0)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439015",
      "title": "Design homepage mockup",
      "description": "Create high-fidelity mockups for the new homepage",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "priorityRank": 1,
      "assignees": ["507f1f77bcf86cd799439011"],
      "creator": "507f1f77bcf86cd799439011",
      "watchers": [],
      "project": "507f1f77bcf86cd799439012",
      "parent": null,
      "dependencies": [],
      "tags": ["design", "frontend"],
      "customFields": {},
      "dates": {
        "created": "2025-01-10T00:00:00.000Z",
        "updated": "2025-01-15T00:00:00.000Z",
        "due": "2025-01-20T00:00:00.000Z",
        "start": "2025-01-10T00:00:00.000Z",
        "completed": null
      },
      "timeEstimate": 480,
      "timeTracked": 240,
      "attachments": [],
      "commentCount": 3,
      "deleted": false
    }
  ],
  "total": 45,
  "limit": 50,
  "offset": 0
}
```

### Create Task

```http
POST /api/tasks
Content-Type: application/json

{
  "title": "New Task",
  "description": "Task description",
  "project": "507f1f77bcf86cd799439012",
  "status": "TODO",
  "priority": "MEDIUM",
  "assignees": ["507f1f77bcf86cd799439011"],
  "tags": ["backend"],
  "dates": {
    "due": "2025-02-01T00:00:00.000Z"
  },
  "timeEstimate": 600
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* Created task object */ }
}
```

### Get Task by ID

```http
GET /api/tasks/{taskId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Task object */ }
}
```

### Update Task

```http
PATCH /api/tasks/{taskId}
Content-Type: application/json

{
  "status": "DONE",
  "dates": {
    "completed": "2025-01-16T00:00:00.000Z"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated task object */ }
}
```

### Delete Task (Soft Delete)

```http
DELETE /api/tasks/{taskId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## Comments

### Get Task Comments

```http
GET /api/tasks/{taskId}/comments
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "task": "507f1f77bcf86cd799439015",
      "author": "507f1f77bcf86cd799439011",
      "content": "Looking great! Just a few minor adjustments needed.",
      "mentions": [],
      "parent": null,
      "reactions": {
        "👍": ["507f1f77bcf86cd799439013"]
      },
      "created": "2025-01-15T10:30:00.000Z",
      "updated": "2025-01-15T10:30:00.000Z",
      "edited": false,
      "deleted": false
    }
  ]
}
```

### Create Comment

```http
POST /api/tasks/{taskId}/comments
Content-Type: application/json

{
  "content": "This is a comment",
  "mentions": ["507f1f77bcf86cd799439013"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* Created comment object */ }
}
```

### Update Comment

```http
PATCH /api/comments/{commentId}
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated comment object */ }
}
```

### Delete Comment

```http
DELETE /api/comments/{commentId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Comment deleted successfully"
}
```

---

## Time Entries

### Get Time Entries for Task

```http
GET /api/tasks/{taskId}/time-entries
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439025",
      "task": "507f1f77bcf86cd799439015",
      "user": "507f1f77bcf86cd799439011",
      "startTime": "2025-01-15T09:00:00.000Z",
      "endTime": "2025-01-15T13:00:00.000Z",
      "duration": 14400,
      "description": "Worked on mockup designs",
      "created": "2025-01-15T13:00:00.000Z",
      "updated": "2025-01-15T13:00:00.000Z",
      "deleted": false
    }
  ]
}
```

### Create Time Entry

```http
POST /api/tasks/{taskId}/time-entries
Content-Type: application/json

{
  "startTime": "2025-01-15T09:00:00.000Z",
  "endTime": "2025-01-15T13:00:00.000Z",
  "duration": 14400,
  "description": "Working on task"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": { /* Created time entry object */ }
}
```

### Update Time Entry

```http
PATCH /api/time-entries/{timeEntryId}
Content-Type: application/json

{
  "endTime": "2025-01-15T14:00:00.000Z",
  "duration": 18000
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { /* Updated time entry object */ }
}
```

### Delete Time Entry

```http
DELETE /api/time-entries/{timeEntryId}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Time entry deleted successfully"
}
```

---

## Error Handling

All API endpoints follow a consistent error response format:

**Error Response:**
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently, no rate limiting is implemented. For production use, consider implementing rate limiting using services like:
- Vercel Edge Middleware
- Upstash Rate Limiting
- Redis-based rate limiting

---

## Data Types

### TaskStatus
- `TODO` - Task not started
- `IN_PROGRESS` - Task in progress
- `DONE` - Task completed
- `BLOCKED` - Task blocked

### TaskPriority
- `LOW` - Low priority
- `MEDIUM` - Medium priority
- `HIGH` - High priority
- `URGENT` - Urgent priority

### ProjectRole
- `OWNER` - Project owner (full access)
- `ADMIN` - Project admin (manage tasks and members)
- `MEMBER` - Project member (work on tasks)
- `VIEWER` - View-only access

---

## Best Practices

1. **Authentication**: Always include authentication credentials with requests
2. **Pagination**: Use `limit` and `offset` parameters for large datasets
3. **Filtering**: Use query parameters to filter results
4. **Error Handling**: Always check the `success` field in responses
5. **Date Formats**: Use ISO 8601 format for all dates
6. **Soft Deletes**: Deleted resources have `deleted: true` flag

---

## Support

For API support and questions:
- Documentation: https://docs.e2w.com
- GitHub Issues: https://github.com/your-org/e2w-project-management
- Email: support@e2w.com
