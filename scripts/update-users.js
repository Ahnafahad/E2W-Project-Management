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

const User = mongoose.models.User || mongoose.model('User', UserSchema);

// Define Project and Task schemas
const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  owner: String,
  members: [String],
  status: String,
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
  title: String,
  description: String,
  status: String,
  priority: String,
  project: String,
  assignees: [String],
  creator: String,
  watchers: [String],
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

async function updateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Delete Tanzim Ahmed
    console.log('\n=== Step 1: Removing Tanzim Ahmed ===');
    const tanzim = await User.findOne({ email: 'tanzimahmedsh.official@gmail.com' });

    if (tanzim) {
      const tanzimId = tanzim._id.toString();

      // Remove from projects
      await Project.updateMany(
        { members: tanzimId },
        { $pull: { members: tanzimId } }
      );

      // Remove from tasks (assignees and watchers)
      await Task.updateMany(
        { assignees: tanzimId },
        { $pull: { assignees: tanzimId } }
      );

      await Task.updateMany(
        { watchers: tanzimId },
        { $pull: { watchers: tanzimId } }
      );

      // Delete the user
      await User.deleteOne({ _id: tanzimId });
      console.log(`✓ Removed Tanzim Ahmed (${tanzim.email}) from database`);
    } else {
      console.log('✗ Tanzim Ahmed not found');
    }

    // 2. Update Annur's name
    console.log('\n=== Step 2: Updating Annur\'s name ===');
    const annur = await User.findOneAndUpdate(
      { email: 'annurababil37@gmail.com' },
      { name: 'Annur Ababil' },
      { new: true }
    );

    if (annur) {
      console.log(`✓ Updated name to: ${annur.name}`);
    } else {
      console.log('✗ Annur not found');
    }

    // 3. Add Fabiana with similar access to Ahnaf
    console.log('\n=== Step 3: Adding Fabiana Mesbah ===');

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Get all projects
    const allProjects = await Project.find({});
    console.log(`Found ${allProjects.length} project(s)`);

    // Check if user already exists
    const existingFabiana = await User.findOne({ email: 'fabianamesbah@gmail.com' });

    if (existingFabiana) {
      console.log('✗ Fabiana Mesbah already exists');
    } else {
      // Create project roles for all projects as MEMBER
      const projectRoles = allProjects.map(project => ({
        project: project._id.toString(),
        role: 'MEMBER'
      }));

      // Create user
      const fabiana = await User.create({
        email: 'fabianamesbah@gmail.com',
        name: 'Fabiana Mesbah',
        password: hashedPassword,
        projectRoles: projectRoles
      });

      console.log(`✓ Created user: ${fabiana.name} (${fabiana.email})`);

      // Add to all projects as member
      const fabianaId = fabiana._id.toString();
      for (const project of allProjects) {
        await Project.findByIdAndUpdate(
          project._id,
          { $addToSet: { members: fabianaId } }
        );

        // Add as watcher to all tasks in the project
        await Task.updateMany(
          { project: project._id.toString() },
          { $addToSet: { watchers: fabianaId } }
        );
      }

      console.log(`  Added to ${allProjects.length} project(s) as MEMBER`);
      console.log(`  Added as watcher to all tasks`);
    }

    // Display summary
    console.log('\n=== Summary of All Users ===');
    const allUsers = await User.find({}, 'name email projectRoles').lean();
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.projectRoles.length} project role(s)`);
    });

    // Disconnect
    await mongoose.connection.close();
    console.log('\n✅ All updates completed successfully!');
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updateUsers();
