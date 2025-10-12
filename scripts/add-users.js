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

// Define Project Schema to fetch existing projects
const ProjectSchema = new mongoose.Schema({
  name: String,
  description: String,
  owner: String,
  members: [String],
  status: String,
}, { timestamps: true });

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

async function addUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find existing projects
    const projects = await Project.find({});
    console.log(`Found ${projects.length} project(s)`);

    // Hash password (simple hash for now - in production should use bcrypt)
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Users to add
    const newUsers = [
      {
        name: 'Tanzim Ahmed',
        email: 'tanzim.ahmed@temp.com', // Placeholder email
        password: hashedPassword,
        projectRoles: []
      },
      {
        name: 'Fabiha Fairuz',
        email: 'fabiha.fairuz@temp.com', // Placeholder email
        password: hashedPassword,
        projectRoles: []
      }
    ];

    // Add project roles if projects exist
    if (projects.length > 0) {
      for (const project of projects) {
        newUsers.forEach(user => {
          user.projectRoles.push({
            project: project._id.toString(),
            role: 'MEMBER'
          });
        });
      }
    }

    // Create users
    for (const userData of newUsers) {
      try {
        const user = await User.create(userData);
        console.log(`✓ Created user: ${user.name} (${user.email})`);

        // Add user to project members if projects exist
        if (projects.length > 0) {
          for (const project of projects) {
            await Project.findByIdAndUpdate(
              project._id,
              { $addToSet: { members: user._id.toString() } }
            );
          }
          console.log(`  Added to ${projects.length} project(s) as MEMBER`);
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`✗ User ${userData.name} already exists`);
        } else {
          throw error;
        }
      }
    }

    // Display summary
    console.log('\n=== Summary ===');
    const totalUsers = await User.countDocuments();
    console.log(`Total users in system: ${totalUsers}`);

    const allUsers = await User.find({}, 'name email projectRoles');
    console.log('\nAll users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.projectRoles.length} project role(s)`);
    });

    // Disconnect
    await mongoose.connection.close();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addUsers();
