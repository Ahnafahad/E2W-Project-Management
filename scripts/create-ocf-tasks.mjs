// Run with: node scripts/create-ocf-tasks.mjs
// Imports 76 OCF Cohort 2 tasks into MongoDB. Idempotent — skips by title + project.

import mongoose from 'mongoose'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Config ───────────────────────────────────────────────────────────────────
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

await mongoose.connect(MONGODB_URI)
console.log('Connected to MongoDB\n')

// ─── Inline schema (avoids Next.js module resolution) ─────────────────────────
const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    status: { type: String, default: 'TODO' },
    priority: { type: String, default: 'MEDIUM' },
    assignees: [String],
    creator: { type: String, required: true },
    watchers: [String],
    project: { type: String, required: true },
    parent: String,
    dependencies: [String],
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed,
    contentPost: mongoose.Schema.Types.Mixed,
    dates: {
      created: Date,
      updated: Date,
      due: Date,
      start: Date,
      completed: Date,
    },
    timeEstimate: Number,
    timeTracked: { type: Number, default: 0 },
    attachments: [],
    commentCount: { type: Number, default: 0 },
    externalAssignees: [String],
    deleted: { type: Boolean, default: false },
    archived: { type: Boolean, default: false },
  },
  { timestamps: false }
)

const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema)

// ─── IDs ──────────────────────────────────────────────────────────────────────
const OCF_PROJECT = '699916e1af236be355859c48'
const AHNAF    = '68e8467082bb7b7d03ae025f'
const FABIHA   = '68eb7165b41279db727d578e'
const ANNUR    = '691a6dc6202241a96e34f4d3'
const FABIANA  = '6989e68fa906085d5c52a1af'
const ABDULLAH = '699916e1af236be355859c45'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTHS = { Jan: 1, Feb: 2, Mar: 3, Apr: 4 }

/** UTC midnight for a day/month in 2026 */
function d(day, month) {
  return new Date(Date.UTC(2026, MONTHS[month] - 1, day))
}

/** Build a contentPost object from "day month" string + platform array */
function post(str, platforms) {
  const [day, month] = str.split(' ')
  return {
    isContentPost: true,
    postDate: d(parseInt(day), month).toISOString(),
    platforms,
  }
}

const LI = 'LinkedIn'
const IG = 'Instagram'
const TW = 'Twitter'

// ─── Task definitions ─────────────────────────────────────────────────────────
// Fields per task: title, description, priority, assignees, externalAssignees,
//                  dueDate (Date), contentPost (object | undefined)
const TASKS = [

  // ══ SECTION A — Graphics & Content Assets (31) ═══════════════════════════

  {
    title: 'Outliers Fund Scholarship Graphic',
    description: 'Create scholarship graphic for Outliers Fund.',
    priority: 'URGENT',
    assignees: [FABIHA],
    ext: [],
    due: d(21, 'Feb'),
  },
  {
    title: '"I\'m In" Accepted Graphic Template',
    description: 'Create accepted graphic template for fellows to share. Ahnaf posts on LinkedIn and Instagram (13 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(10, 'Mar'),
    cp: post('13 Mar', [LI, IG]),
  },
  {
    title: 'Uncooked x OCF Partnership Graphic',
    description: 'Create partnership announcement graphic for Uncooked x OCF. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (23 Feb).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF, ABDULLAH],
    ext: [],
    due: d(20, 'Feb'),
    cp: post('23 Feb', [LI, IG, TW]),
  },
  {
    title: 'Partner Announcement Template',
    description: 'Create reusable partner announcement template for future partnerships.',
    priority: 'HIGH',
    assignees: [FABIHA],
    ext: [],
    due: d(25, 'Feb'),
  },
  {
    title: 'Luma Event Graphics',
    description: 'Create graphics for Luma event listings.',
    priority: 'HIGH',
    assignees: [FABIHA],
    ext: [],
    due: d(26, 'Feb'),
  },
  {
    title: 'Halkin Offices x OCF Graphic',
    description: 'Create partnership graphic for Halkin Offices x OCF. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (24 Feb).',
    priority: 'HIGH',
    assignees: [FABIANA, AHNAF, ABDULLAH],
    ext: [],
    due: d(21, 'Feb'),
    cp: post('24 Feb', [LI, IG, TW]),
  },
  {
    title: 'Kickstart Global x OCF Graphic',
    description: 'Create partnership graphic for Kickstart Global x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (27 Feb).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(24, 'Feb'),
    cp: post('27 Feb', [LI, IG, TW]),
  },
  {
    title: 'AWS x OCF Graphic',
    description: 'Create partnership graphic for AWS x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (28 Feb).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(25, 'Feb'),
    cp: post('28 Feb', [LI, IG, TW]),
  },
  {
    title: 'Ideas Forum x OCF Graphic',
    description: 'Create partnership graphic for Ideas Forum x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (26 Feb).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(23, 'Feb'),
    cp: post('26 Feb', [LI, IG, TW]),
  },
  {
    title: 'Lucas Games x OCF Graphic',
    description: 'Create partnership graphic for Lucas Games x OCF. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (2 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF, ABDULLAH],
    ext: [],
    due: d(27, 'Feb'),
    cp: post('2 Mar', [LI, IG, TW]),
  },
  {
    title: 'Lovable x OCF Graphic',
    description: 'Create partnership graphic for Lovable x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (3 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(28, 'Feb'),
    cp: post('3 Mar', [LI, IG, TW]),
  },
  {
    title: 'Proximo Ventures x OCF Graphic',
    description: 'Create partnership graphic for Proximo Ventures x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (5 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(2, 'Mar'),
    cp: post('5 Mar', [LI, IG, TW]),
  },
  {
    title: 'EWOR x OCF Graphic (conditional — only if confirmed)',
    description: 'Create partnership graphic for EWOR x OCF — only proceed if partnership is confirmed. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (6 Mar). External: Daniel (EWOR) to provide assets.',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF, ABDULLAH],
    ext: ['Daniel (EWOR)'],
    due: d(3, 'Mar'),
    cp: post('6 Mar', [LI, IG, TW]),
  },
  {
    title: 'Barclays Eagle Labs x OCF Graphic',
    description: 'Create partnership graphic for Barclays Eagle Labs x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (7 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(4, 'Mar'),
    cp: post('7 Mar', [LI, IG, TW]),
  },
  {
    title: 'L Marks x OCF Graphic',
    description: 'Create partnership graphic for L Marks x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (8 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(5, 'Mar'),
    cp: post('8 Mar', [LI, IG, TW]),
  },
  {
    title: 'Oxbridge AI X x OCF Graphic',
    description: 'Create partnership graphic for Oxbridge AI X x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (10 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(7, 'Mar'),
    cp: post('10 Mar', [LI, IG, TW]),
  },
  {
    title: 'Anthropic x OCF Graphic',
    description: 'Create partnership graphic for Anthropic x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (12 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(9, 'Mar'),
    cp: post('12 Mar', [LI, IG, TW]),
  },
  {
    title: 'Mariam Ahmed / Menza x OCF Graphic',
    description: 'Create partnership graphic for Mariam Ahmed / Menza x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (12 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(9, 'Mar'),
    cp: post('12 Mar', [LI, IG, TW]),
  },
  {
    title: 'Oxentia x OCF Graphic',
    description: 'Create partnership graphic for Oxentia x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (14 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(11, 'Mar'),
    cp: post('14 Mar', [LI, IG, TW]),
  },
  {
    title: 'Redwood Founders x OCF Graphic + Countdown Day 7',
    description: 'Create partnership graphic for Redwood Founders x OCF, combined with Countdown Day 7 post. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (16 Mar).',
    priority: 'HIGH',
    assignees: [FABIANA, AHNAF, ABDULLAH],
    ext: [],
    due: d(13, 'Mar'),
    cp: post('16 Mar', [LI, IG, TW]),
  },
  {
    title: 'Cardiff Finance Society x OCF Graphic',
    description: 'Create partnership graphic for Cardiff Finance Society x OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (10 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(7, 'Mar'),
    cp: post('10 Mar', [LI, IG, TW]),
  },
  {
    title: 'Gossip Girl x OCF Graphic (UNCONFIRMED — do not post until confirmed)',
    description: 'Create partnership graphic for Gossip Girl x OCF — UNCONFIRMED. Do not post until partnership is confirmed. Ahnaf posts on LinkedIn, Instagram, Twitter (31 Mar).',
    priority: 'LOW',
    assignees: [FABIANA, AHNAF],
    ext: [],
    due: d(28, 'Mar'),
    cp: post('31 Mar', [LI, IG, TW]),
  },
  {
    title: 'Ambassador Announcement Graphic Template',
    description: 'Create reusable ambassador announcement graphic template.',
    priority: 'HIGH',
    assignees: [FABIHA],
    ext: [],
    due: d(26, 'Feb'),
  },
  {
    title: 'Self-Serve Canva Template ("I\'m In")',
    description: 'Create self-serve Canva template for accepted fellows to share their acceptance on social media.',
    priority: 'MEDIUM',
    assignees: [FABIHA],
    ext: [],
    due: d(8, 'Mar'),
  },
  {
    title: '"30 Founders, 15 Countries" Map Visual',
    description: 'Create map visual showing 30 founders from 15 countries. Ahnaf posts on LinkedIn, Instagram, Twitter (20 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(17, 'Mar'),
    cp: post('20 Mar', [LI, IG, TW]),
  },
  {
    title: '"What Happens Inside OCF" Carousel (10 slides)',
    description: 'Create 10-slide carousel explaining what happens inside OCF. Ahnaf posts on LinkedIn, Instagram, Twitter (9 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(6, 'Mar'),
    cp: post('9 Mar', [LI, IG, TW]),
  },
  {
    title: 'Partner Roundup Carousel (15 partners)',
    description: 'Create carousel featuring all 15 partners. Ahnaf posts on LinkedIn and Instagram (10 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(7, 'Mar'),
    cp: post('10 Mar', [LI, IG]),
  },
  {
    title: 'Countdown Day 5: Mentor Graphic',
    description: 'Create countdown day 5 graphic featuring mentors. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (18 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF, ABDULLAH],
    ext: [],
    due: d(13, 'Mar'),
    cp: post('18 Mar', [LI, IG, TW]),
  },
  {
    title: 'Countdown Day 4: Prizes Graphic',
    description: 'Create countdown day 4 graphic featuring prizes. Ahnaf posts on LinkedIn, Instagram, Twitter (19 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(13, 'Mar'),
    cp: post('19 Mar', [LI, IG, TW]),
  },
  {
    title: 'Countdown Day 2: "Handful of Spots" Graphic',
    description: 'Create countdown day 2 graphic highlighting limited spots remaining. Abdullah and Ahnaf post on LinkedIn, Instagram, Twitter (21 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, ABDULLAH, AHNAF],
    ext: [],
    due: d(13, 'Mar'),
    cp: post('21 Mar', [LI, IG, TW]),
  },
  {
    title: 'Alumni Spotlight Graphic (50K Founder)',
    description: 'Create alumni spotlight graphic featuring the 50K founder. Ahnaf posts on LinkedIn, Instagram, Twitter (25 Feb).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(22, 'Feb'),
    cp: post('25 Feb', [LI, IG, TW]),
  },

  // ══ SECTION V — Videos (6) ════════════════════════════════════════════════

  {
    title: 'Uncooked Partnership Video',
    description: 'Create partnership video for Uncooked x OCF. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (23 Feb).',
    priority: 'HIGH',
    assignees: [AHNAF, ABDULLAH],
    ext: [],
    due: d(20, 'Feb'),
    cp: post('23 Feb', [LI, IG, TW]),
  },
  {
    title: '"Why We Built OCF" — Abdullah Personal Video',
    description: 'Abdullah films and posts a personal video explaining why OCF was built. Posted on LinkedIn and Instagram (4 Mar).',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(1, 'Mar'),
    cp: post('4 Mar', [LI, IG]),
  },
  {
    title: 'Lucas Games Video',
    description: 'Create partnership video for Lucas Games x OCF. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (2 Mar). External: Max Lucas to provide raw footage.',
    priority: 'MEDIUM',
    assignees: [AHNAF, ABDULLAH],
    ext: ['Max Lucas'],
    due: d(27, 'Feb'),
    cp: post('2 Mar', [LI, IG, TW]),
  },
  {
    title: 'EWOR Video (conditional — only if confirmed)',
    description: 'Partnership video for EWOR x OCF — only create if partnership is confirmed. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (6 Mar). External: Daniel (EWOR) to provide footage.',
    priority: 'MEDIUM',
    assignees: [AHNAF, ABDULLAH],
    ext: ['Daniel (EWOR)'],
    due: d(3, 'Mar'),
    cp: post('6 Mar', [LI, IG, TW]),
  },
  {
    title: 'Venue Walkthrough Videos (x2–3, Halkin + Oxford/Cambridge)',
    description: 'Film 2–3 venue walkthrough videos at Halkin offices and Oxford/Cambridge venues. Ahnaf posts on LinkedIn, Instagram, Twitter (17 Mar).',
    priority: 'MEDIUM',
    assignees: [ABDULLAH, AHNAF],
    ext: [],
    due: d(14, 'Mar'),
    cp: post('17 Mar', [LI, IG, TW]),
  },
  {
    title: 'Alumni Testimonial Videos (x2–3)',
    description: 'Collect 2–3 alumni testimonial videos from Cohort 1 fellows. External: Cohort 1 Alumni to record and submit.',
    priority: 'LOW',
    assignees: [],
    ext: ['Cohort 1 Alumni'],
    due: d(20, 'Mar'),
  },

  // ══ SECTION T/M — Templates & Physical (3) ═══════════════════════════════

  {
    title: 'Completion Certificate Template',
    description: 'Design completion certificate template for OCF fellows.',
    priority: 'LOW',
    assignees: [FABIHA],
    ext: [],
    due: d(22, 'Mar'),
  },
  {
    title: 'Completion Graphic Template',
    description: 'Design completion graphic template for fellows to share on social media.',
    priority: 'LOW',
    assignees: [FABIHA],
    ext: [],
    due: d(22, 'Mar'),
  },
  {
    title: 'OCF Merch — Quarter-Zip (Fellows x30 + Team x6–8)',
    description: 'Design and source OCF quarter-zip merch for 30 fellows and 6–8 team members. Abdullah designs with Fabiha; Abdullah sources. Milestones: design mockup → 1 Mar | supplier quote → 3 Mar | sizing confirmed → 5 Mar | order placed → 7 Mar. External: Kamdi to coordinate sizing with fellows.',
    priority: 'HIGH',
    assignees: [ABDULLAH, FABIHA],
    ext: ['Kamdi'],
    due: d(7, 'Mar'),
  },

  // ══ SECTION P — Post-Programme Assets & Posts (12) ═══════════════════════

  {
    title: 'Aftermovie B-Roll Capture (all 4 days, 30+ clips/day)',
    description: 'Capture B-roll footage across all 4 programme days (30+ clips per day) for use in the aftermovie. Abdullah and Annur responsible for capture.',
    priority: 'HIGH',
    assignees: [ABDULLAH, ANNUR],
    ext: [],
    due: d(26, 'Mar'),
  },
  {
    title: 'Fellow Completion WhatsApp Messages (x30 personalised)',
    description: 'Write and send 30 personalised WhatsApp messages to each fellow on completion of the programme.',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(26, 'Mar'),
  },
  {
    title: 'Fellow Spotlight Quotes Collection (x3 fellows)',
    description: 'Collect spotlight quotes from 3 selected fellows for post-programme social content.',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(2, 'Apr'),
  },
  {
    title: 'Aftermovie Teaser Clip (15–30s)',
    description: 'Edit a 15–30 second teaser clip from aftermovie footage. External: Pro Bono Editor to edit. Ahnaf posts on LinkedIn, Instagram, Twitter (5 Apr).',
    priority: 'HIGH',
    assignees: [AHNAF],
    ext: ['Pro Bono Editor'],
    due: d(2, 'Apr'),
    cp: post('5 Apr', [LI, IG, TW]),
  },
  {
    title: 'Full Aftermovie (3–5 min)',
    description: 'Edit full 3–5 minute aftermovie from programme footage. External: Pro Bono Editor to edit. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (7 Apr).',
    priority: 'HIGH',
    assignees: [AHNAF, ABDULLAH],
    ext: ['Pro Bono Editor'],
    due: d(4, 'Apr'),
    cp: post('7 Apr', [LI, IG, TW]),
  },
  {
    title: 'Stats and Impact Post (real numbers only)',
    description: 'Compile real statistics and impact data from the programme (real numbers only, no estimates). Ahnaf posts on LinkedIn, Instagram, Twitter (3 Apr).',
    priority: 'MEDIUM',
    assignees: [ABDULLAH, ANNUR, AHNAF],
    ext: [],
    due: d(31, 'Mar'),
    cp: post('3 Apr', [LI, IG, TW]),
  },
  {
    title: 'Cohort 3 Teaser Graphic',
    description: 'Create teaser graphic announcing OCF Cohort 3. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (10 Apr).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF, ABDULLAH],
    ext: [],
    due: d(7, 'Apr'),
    cp: post('10 Apr', [LI, IG, TW]),
  },
  {
    title: 'Partner Thank-You Graphic (all 18 logos)',
    description: 'Create thank-you graphic featuring all 18 partner logos. Ahnaf posts on LinkedIn, Instagram, Twitter (30 Mar).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(27, 'Mar'),
    cp: post('30 Mar', [LI, IG, TW]),
  },
  {
    title: 'Fellow Spotlight #1 Graphic',
    description: 'Create spotlight graphic for fellow #1. Ahnaf posts on LinkedIn, Instagram, Twitter (1 Apr).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(29, 'Mar'),
    cp: post('1 Apr', [LI, IG, TW]),
  },
  {
    title: 'Fellow Spotlight #2 Graphic',
    description: 'Create spotlight graphic for fellow #2. Ahnaf posts on LinkedIn, Instagram, Twitter (5 Apr).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(2, 'Apr'),
    cp: post('5 Apr', [LI, IG, TW]),
  },
  {
    title: 'Fellow Spotlight #3 Graphic',
    description: 'Create spotlight graphic for fellow #3. Ahnaf posts on LinkedIn, Instagram, Twitter (12 Apr).',
    priority: 'MEDIUM',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(9, 'Apr'),
    cp: post('12 Apr', [LI, IG, TW]),
  },
  {
    title: 'Fellow Completion Graphic + Caption Pack (for self-posting)',
    description: 'Create completion graphic and caption pack for fellows to self-post on social media. Ahnaf facilitates distribution. Post on LinkedIn and Instagram (27 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(24, 'Mar'),
    cp: post('27 Mar', [LI, IG]),
  },

  // ══ SECTION C — Content Calendar Only Posts (10) ═════════════════════════

  {
    title: 'Engagement Poll / Community Post',
    description: 'Post an engagement poll or community question. Ahnaf posts on Instagram and Twitter (1 Mar).',
    priority: 'MEDIUM',
    assignees: [AHNAF],
    ext: [],
    due: d(26, 'Feb'),
    cp: post('1 Mar', [IG, TW]),
  },
  {
    title: 'Brand Engagement Post',
    description: 'Post a brand engagement update. Ahnaf posts on LinkedIn and Twitter (4 Mar).',
    priority: 'LOW',
    assignees: [AHNAF],
    ext: [],
    due: d(1, 'Mar'),
    cp: post('4 Mar', [LI, TW]),
  },
  {
    title: 'Abdullah Personal — "Rooms Founders Never See"',
    description: 'Abdullah personal post — topic: "Rooms Founders Never See". Posted on LinkedIn and Twitter (9 Mar).',
    priority: 'MEDIUM',
    assignees: [ABDULLAH],
    ext: [],
    due: d(6, 'Mar'),
    cp: post('9 Mar', [LI, TW]),
  },
  {
    title: 'WhatsApp Broadcast #2 — "We\'re 70% full"',
    description: 'Abdullah sends WhatsApp broadcast to announce 70% capacity reached. WhatsApp only — no social posting.',
    priority: 'MEDIUM',
    assignees: [ABDULLAH],
    ext: [],
    due: d(9, 'Mar'),
  },
  {
    title: 'Scarcity Post — "Over 100 Applications"',
    description: 'Social proof post announcing over 100 applications received. Ahnaf and Abdullah post on LinkedIn, Instagram, Twitter (11 Mar).',
    priority: 'MEDIUM',
    assignees: [AHNAF, ABDULLAH],
    ext: [],
    due: d(8, 'Mar'),
    cp: post('11 Mar', [LI, IG, TW]),
  },
  {
    title: 'Abdullah Personal — Build-in-Public "Airport Calls"',
    description: 'Abdullah personal build-in-public post about making calls from airports. Posted on LinkedIn, Instagram, Twitter (11 Mar).',
    priority: 'MEDIUM',
    assignees: [ABDULLAH],
    ext: [],
    due: d(8, 'Mar'),
    cp: post('11 Mar', [LI, IG, TW]),
  },
  {
    title: 'Founders Around the World #1',
    description: 'First post in the Founders Around the World series. Ahnaf posts on LinkedIn and Instagram (7 Mar).',
    priority: 'MEDIUM',
    assignees: [AHNAF],
    ext: [],
    due: d(4, 'Mar'),
    cp: post('7 Mar', [LI, IG]),
  },
  {
    title: 'Founders Around the World #2',
    description: 'Second post in the Founders Around the World series. Ahnaf posts on LinkedIn and Instagram (14 Mar).',
    priority: 'MEDIUM',
    assignees: [AHNAF],
    ext: [],
    due: d(11, 'Mar'),
    cp: post('14 Mar', [LI, IG]),
  },
  {
    title: 'Annur Personal — "One Week From Now"',
    description: 'Annur personal post — "One Week From Now". Posted on LinkedIn and Twitter (20 Mar).',
    priority: 'MEDIUM',
    assignees: [ANNUR],
    ext: [],
    due: d(17, 'Mar'),
    cp: post('20 Mar', [LI, TW]),
  },
  {
    title: 'Countdown Day 1 — "Tomorrow, It Begins" (no graphic)',
    description: 'Countdown day 1 text-only post — "Tomorrow, It Begins". No graphic needed. Abdullah and Annur post on LinkedIn, Instagram, Twitter (22 Mar).',
    priority: 'HIGH',
    assignees: [ABDULLAH, ANNUR],
    ext: [],
    due: d(13, 'Mar'),
    cp: post('22 Mar', [LI, IG, TW]),
  },

  // ══ SECTION D — During Programme (12, live posts = due same day) ══════════

  {
    title: 'Day 1 IG Stories — venue, sessions, mixer',
    description: 'Live IG Stories coverage of Day 1: venue, sessions, and mixer. Ahnaf posts on Instagram and Twitter (23 Mar).',
    priority: 'HIGH',
    assignees: [AHNAF],
    ext: [],
    due: d(23, 'Mar'),
    cp: post('23 Mar', [IG, TW]),
  },
  {
    title: 'Day 1 Brand Recap — Ideas Forum, Proximo, YC Panel, Barclays',
    description: 'Day 1 brand recap post featuring Ideas Forum, Proximo, YC Panel, and Barclays sessions. Fabiha and Ahnaf post on LinkedIn, Instagram, Twitter (23 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(23, 'Mar'),
    cp: post('23 Mar', [LI, IG, TW]),
  },
  {
    title: 'Day 1 Abdullah Personal — "The room shifts at two hours in"',
    description: 'Abdullah personal post from Day 1 — "The room shifts at two hours in". LinkedIn only (23 Mar).',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(23, 'Mar'),
    cp: post('23 Mar', [LI]),
  },
  {
    title: 'Day 2 IG Stories — Lovable build, Kickstart, Incident.io, EWOR',
    description: 'Live IG Stories coverage of Day 2: Lovable build session, Kickstart, Incident.io, and EWOR. Ahnaf posts on Instagram and Twitter (24 Mar).',
    priority: 'HIGH',
    assignees: [AHNAF],
    ext: [],
    due: d(24, 'Mar'),
    cp: post('24 Mar', [IG, TW]),
  },
  {
    title: 'Day 2 Brand Recap — Lovable, Kickstart, Incident.io, EWOR',
    description: 'Day 2 brand recap post featuring Lovable, Kickstart, Incident.io, and EWOR sessions. Fabiha and Ahnaf post on LinkedIn, Instagram, Twitter (24 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(24, 'Mar'),
    cp: post('24 Mar', [LI, IG, TW]),
  },
  {
    title: 'Day 2 Annur Personal — "Something clicked today"',
    description: 'Annur personal post from Day 2 — "Something clicked today". LinkedIn only (24 Mar).',
    priority: 'HIGH',
    assignees: [ANNUR],
    ext: [],
    due: d(24, 'Mar'),
    cp: post('24 Mar', [LI]),
  },
  {
    title: 'Day 3 IG Stories — Oxford arrival, panel, mixer, Turf Tavern',
    description: 'Live IG Stories coverage of Day 3: Oxford arrival, panel, mixer, and Turf Tavern. Ahnaf posts on Instagram and Twitter (25 Mar).',
    priority: 'HIGH',
    assignees: [AHNAF],
    ext: [],
    due: d(25, 'Mar'),
    cp: post('25 Mar', [IG, TW]),
  },
  {
    title: 'Day 3 Brand Recap — Oxford ecosystem panel',
    description: 'Day 3 brand recap post featuring the Oxford ecosystem panel. Fabiha and Ahnaf post on LinkedIn, Instagram, Twitter (25 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(25, 'Mar'),
    cp: post('25 Mar', [LI, IG, TW]),
  },
  {
    title: 'Day 3 Abdullah Personal — "Oxford changes the energy"',
    description: 'Abdullah personal post from Day 3 — "Oxford changes the energy". LinkedIn only (25 Mar).',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(25, 'Mar'),
    cp: post('25 Mar', [LI]),
  },
  {
    title: 'Day 4 IG Stories — Cambridge, Anthropic, AWS, ceremony, dinner',
    description: 'Live IG Stories coverage of Day 4: Cambridge, Anthropic, AWS sessions, completion ceremony, and dinner. Ahnaf posts on Instagram and Twitter (26 Mar).',
    priority: 'HIGH',
    assignees: [AHNAF],
    ext: [],
    due: d(26, 'Mar'),
    cp: post('26 Mar', [IG, TW]),
  },
  {
    title: 'Day 4 Brand Wrap — Programme Complete (tag all partners + fellows)',
    description: 'Day 4 brand wrap post celebrating programme completion — tag all partners and fellows. Fabiha and Ahnaf post on LinkedIn, Instagram, Twitter (26 Mar).',
    priority: 'HIGH',
    assignees: [FABIHA, AHNAF],
    ext: [],
    due: d(26, 'Mar'),
    cp: post('26 Mar', [LI, IG, TW]),
  },
  {
    title: 'Day 4 Abdullah Personal — Emotional Closer',
    description: 'Abdullah personal emotional closer post from Day 4. LinkedIn only (26 Mar).',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(26, 'Mar'),
    cp: post('26 Mar', [LI]),
  },

  // ══ SECTION PP — Post-Programme Personal Posts (2) ═══════════════════════

  {
    title: 'Abdullah Personal Reflection',
    description: 'Abdullah personal reflection post after the programme. Posted on LinkedIn (28 Mar).',
    priority: 'HIGH',
    assignees: [ABDULLAH],
    ext: [],
    due: d(25, 'Mar'),
    cp: post('28 Mar', [LI]),
  },
  {
    title: 'Annur Personal Reflection',
    description: 'Annur personal reflection post after the programme. Posted on LinkedIn (29 Mar).',
    priority: 'HIGH',
    assignees: [ANNUR],
    ext: [],
    due: d(26, 'Mar'),
    cp: post('29 Mar', [LI]),
  },
]

// ─── Import ───────────────────────────────────────────────────────────────────
console.log(`Total tasks defined: ${TASKS.length}\n`)

let created = 0
let skipped = 0

for (const t of TASKS) {
  const existing = await Task.findOne({ title: t.title, project: OCF_PROJECT })
  if (existing) {
    console.log(`⏭️  Skipped (exists): ${t.title}`)
    skipped++
    continue
  }

  const now = new Date()
  await Task.create({
    title: t.title,
    description: t.description || '',
    status: 'TODO',
    priority: t.priority,
    assignees: t.assignees,
    creator: AHNAF,
    watchers: [AHNAF],
    project: OCF_PROJECT,
    tags: [],
    customFields: {},
    contentPost: t.cp ?? null,
    dates: {
      created: now,
      updated: now,
      due: t.due,
    },
    timeTracked: 0,
    attachments: [],
    commentCount: 0,
    externalAssignees: t.ext || [],
    deleted: false,
    archived: false,
  })

  console.log(`✅ Created: ${t.title}`)
  created++
}

console.log(`\n─── Done ────────────────────────────────`)
console.log(`Created: ${created}  |  Skipped: ${skipped}  |  Total: ${TASKS.length}`)

await mongoose.disconnect()
process.exit(0)
