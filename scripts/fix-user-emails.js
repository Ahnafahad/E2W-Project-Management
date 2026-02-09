const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Define User Schema
const ProjectRoleSchema = new mongoose.Schema(
  {
    project: { type: String, required: true },
    role: {
      type: String,
      enum: ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'],
      required: true,
    },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
    },
    projectRoles: [ProjectRoleSchema],
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: String, required: true },
    members: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String },
    priority: { type: String },
    project: { type: String },
    assignees: [{ type: String }],
    creator: { type: String },
    watchers: [{ type: String }],
    tags: [{ type: String }],
    dates: { type: Object },
    attachments: [{ type: Object }],
    dependencies: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function fixUserEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Fix Tanzim Ahmed's email (add period after "sh")
    const tanzim = await User.findOneAndUpdate(
      { email: 'tanzimahmedshofficial@gmail.com' },
      { email: 'tanzimahmedsh.official@gmail.com' },
      { new: true }
    );

    if (tanzim) {
      console.log(`✓ Fixed Tanzim Ahmed's email to: ${tanzim.email}`);
    } else {
      console.log('✗ Tanzim Ahmed not found with old email');
    }

    // Update Annur's email from "annur" to "annurababil37@gmail.com"
    const annur = await User.findOneAndUpdate(
      { email: 'annur' },
      { email: 'annurababil37@gmail.com' },
      { new: true }
    );

    if (annur) {
      console.log(`✓ Updated Annur's email to: ${annur.email}`);

      // Get all projects
      const allProjects = await Project.find({});
      console.log(`\nFound ${allProjects.length} projects`);

      // Add Annur to all projects if not already a member
      for (const project of allProjects) {
        const annurId = annur._id.toString();
        if (!project.members.includes(annurId)) {
          project.members.push(annurId);
          await project.save();
          console.log(`  ✓ Added Annur to project: ${project.name}`);
        } else {
          console.log(`  - Annur already in project: ${project.name}`);
        }
      }

      // Add Annur to all task watchers if not already watching
      const allTasks = await Task.find({});
      console.log(`\nFound ${allTasks.length} tasks`);

      let tasksUpdated = 0;
      for (const task of allTasks) {
        const annurId = annur._id.toString();
        if (!task.watchers.includes(annurId)) {
          task.watchers.push(annurId);
          await task.save();
          tasksUpdated++;
        }
      }

      if (tasksUpdated > 0) {
        console.log(`  ✓ Added Annur as watcher to ${tasksUpdated} tasks`);
      } else {
        console.log(`  - Annur already watching all tasks`);
      }
    } else {
      console.log('✗ Annur user not found with old email');
    }

    // Display all users
    console.log('\n=== All Users ===');
    const allUsers = await User.find({}, 'name email').lean();
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} - ${user.email}`);
    });

    // Disconnect
    await mongoose.connection.close();
    console.log('\n✅ All updates completed successfully!');
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

fixUserEmails();
