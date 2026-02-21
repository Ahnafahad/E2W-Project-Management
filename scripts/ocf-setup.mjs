// Run with: node scripts/ocf-setup.mjs
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read MONGODB_URI from .env.local
let MONGODB_URI
try {
  const envPath = resolve(__dirname, '..', '.env.local')
  const envContent = readFileSync(envPath, 'utf8')
  const match = envContent.match(/MONGODB_URI=(.+)/)
  if (match) MONGODB_URI = match[1].trim()
} catch {
  console.error('Could not read .env.local')
  process.exit(1)
}

if (!MONGODB_URI) {
  console.error('MONGODB_URI not found in .env.local')
  process.exit(1)
}

// Inline schema definitions (avoid Next.js module resolution)
await mongoose.connect(MONGODB_URI)
console.log('Connected to MongoDB')

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  avatar: String,
  accessMode: { type: String, enum: ['both', 'ocf_only'], default: 'both' },
  projectRoles: [{ project: String, role: String }],
  lastLogin: Date,
}, { timestamps: true })

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  owner: { type: String, required: true },
  members: [String],
  isOCF: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema)

const ABDULLAH_EMAIL = 'abdullah.26nasir@gmail.com'
const OCF_PROJECT_NAME = 'Oxford Cambridge Fellowship'

// --- User ---
let user = await User.findOne({ email: ABDULLAH_EMAIL })
let userCreated = false

if (!user) {
  const hashed = await bcrypt.hash('123456', 10)
  user = await User.create({
    email: ABDULLAH_EMAIL,
    name: 'Abdullah',
    password: hashed,
    accessMode: 'ocf_only',
    projectRoles: [],
  })
  userCreated = true
  console.log('✅ Created user: Abdullah')
} else {
  // Ensure accessMode is set
  if (user.accessMode !== 'ocf_only') {
    await User.updateOne({ _id: user._id }, { accessMode: 'ocf_only' })
    console.log('✅ Updated Abdullah accessMode to ocf_only')
  } else {
    console.log('ℹ️  User Abdullah already exists')
  }
}

// --- Project ---
let project = await Project.findOne({ isOCF: true, deleted: { $ne: true } })
let projectCreated = false

if (!project) {
  project = await Project.create({
    name: OCF_PROJECT_NAME,
    description: 'Oxford Cambridge Fellowship project',
    owner: user._id.toString(),
    members: [user._id.toString()],
    isOCF: true,
  })
  projectCreated = true
  console.log('✅ Created OCF project:', project.name)
} else {
  console.log('ℹ️  OCF project already exists:', project.name)
}

console.log('\n--- Setup Complete ---')
console.log('User:', { id: user._id.toString(), email: user.email, accessMode: user.accessMode, created: userCreated })
console.log('Project:', { id: project._id.toString(), name: project.name, isOCF: project.isOCF, created: projectCreated })

await mongoose.disconnect()
process.exit(0)
