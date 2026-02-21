import mongoose from 'mongoose'

const MONGODB_URI =
  'mongodb+srv://ahnaf816_db_user:T4vRqOPjzZ50voXC@e2w-pm-cluster.dgky81m.mongodb.net/e2w-pm?retryWrites=true&w=majority&appName=e2w-pm-cluster'

await mongoose.connect(MONGODB_URI)
console.log('Connected to MongoDB')

const db = mongoose.connection.db

// --- Lookup OCF project ---
const project = await db.collection('projects').findOne({ isOCF: true, deleted: { $ne: true } })
if (!project) {
  console.error('OCF project not found. Run /api/ocf/setup first.')
  process.exit(1)
}
const projectId = project._id.toString()
console.log(`OCF Project: ${project.name} (${projectId})`)

// --- Lookup users ---
const ahnaf = await db.collection('users').findOne({ name: { $regex: /ahnaf/i } })
const fabiana = await db.collection('users').findOne({ name: { $regex: /fabiana/i } })

if (!ahnaf) { console.warn('WARNING: Ahnaf user not found') }
if (!fabiana) { console.warn('WARNING: Fabiana user not found') }

const ahnafId = ahnaf?._id.toString()
const fabianaId = fabiana?._id.toString()
const assignees = [ahnafId, fabianaId].filter(Boolean)
const creator = ahnafId || fabianaId

console.log(`Assignees: ${assignees.join(', ')}`)

// --- Task definitions ---
const now = new Date()

const tasks = [
  {
    title: 'Partnership Video Completion',
    description: 'Complete and finalize the partnership video',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-22') },
  },
  {
    title: 'Website Copy Improvements and Cohort Rebranding',
    description:
      'Remove all "Spring 2026 cohort" and "quarterly cohort" references across the site. Replace consistently with "Cohort 2" or "Cohort 2.0". Add specific dates showing when cohort takes place. Remove filler words, strengthen language, eliminate em-dashes, and improve spacing and visual hierarchy.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-28') },
  },
  {
    title: 'Scholarship FAQ Addition and Ops Document Distribution',
    description:
      'Add scholarship fund question and response to FAQ section using ops document template for consistent messaging. Do not reveal 50% discount percentage in public FAQ. Distribute ops document to relevant team members.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-28') },
  },
  {
    title: 'Google Drive Restructuring',
    description:
      'Create "Cohort 1 July 2025" folder and move all legacy materials into it. Establish "Cohort 2" folder for current work. Build "OCF Assets" folder containing all logo variations (white, color, SVG, PNG), banner designs, templates, and brand guidelines.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-28') },
  },
  {
    title: 'Add LinkedIn Links for All Active Team Members',
    description:
      "Add LinkedIn profile links for all active team members on the website team section. Note: Saket's LinkedIn is currently not working — handle as exception.",
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-28') },
  },
  {
    title: 'Add One-Liner Descriptions for Each Team Member',
    description:
      'Write and add a one-liner description for each active team member on the website, covering their role at OCF and/or relevant career background to add credibility and personal connection.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-28') },
  },
  {
    title: 'Add Scholarship Fund FAQ Entry',
    description:
      'Add a scholarship fund question and answer to the public FAQ section. Use standardized ops document template for messaging. Do not publish the scholarship form link publicly or reveal the 50% discount amount.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-02-28') },
  },
  {
    title: 'Homepage Partner Integration',
    description:
      'Feature 3 key partners on the homepage with short descriptions each. Add a "View more" link directing to the dedicated partners page. Test larger sizing to avoid cramped layout and ensure visual impact.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-03-07') },
  },
  {
    title: 'Full Partners Page Redesign',
    description:
      'Redesign the full partners page. Highlight 3 key partners at the top. Display remaining partners in a visually interesting carousel or grid. Create clear distinction between "key partners this cohort" and the full partner list to address visitor confusion.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-03-07') },
  },
  {
    title: 'Alumni Directory Development with LinkedIn Integration',
    description:
      'Create a comprehensive alumni directory including LinkedIn profiles for networking and credibility. Require all graduates to add the fellowship to their LinkedIn education section to serve as ongoing marketing for future applicants.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-03-14') },
  },
  {
    title: 'Blog Section Implementation with Initial Content',
    description:
      'Build a blog section on the website. Write initial content including partnership announcements with company backgrounds and startup ecosystem articles. Set up author attribution with photo, publication date, and last updated date. Repurpose existing LinkedIn posts into blog articles with outbound links.',
    status: 'TODO',
    priority: 'MEDIUM',
    dates: { created: now, updated: now, due: new Date('2026-03-14') },
  },
]

const docs = tasks.map((t) => ({
  ...t,
  project: projectId,
  creator,
  assignees,
  externalAssignees: [],
  watchers: [...assignees],
  tags: [],
  dependencies: [],
  customFields: {},
  attachments: [],
  timeTracked: 0,
  commentCount: 0,
  deleted: false,
  archived: false,
}))

const result = await db.collection('tasks').insertMany(docs)
console.log(`\nInserted ${result.insertedCount} tasks successfully.`)

// Update project stats (totalTasks count)
const totalTasks = await db.collection('tasks').countDocuments({
  project: projectId,
  deleted: { $ne: true },
  archived: { $ne: true },
})
await db.collection('projectstats').findOneAndUpdate(
  { project: projectId },
  { $set: { totalTasks, lastUpdated: now } },
  { upsert: true }
)
console.log(`Project stats updated. Total tasks in OCF project: ${totalTasks}`)

await mongoose.disconnect()
console.log('Done.')
