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

async function updateEmails() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update Tanzim Ahmed's email
    const tanzim = await User.findOneAndUpdate(
      { name: 'Tanzim Ahmed' },
      { email: 'tanzimahmedshofficial@gmail.com' },
      { new: true }
    );

    if (tanzim) {
      console.log(`✓ Updated Tanzim Ahmed's email to: ${tanzim.email}`);
    } else {
      console.log('✗ Tanzim Ahmed not found');
    }

    // Update Fabiha Fairuz's email
    const fabiha = await User.findOneAndUpdate(
      { name: 'Fabiha Fairuz' },
      { email: 'fabihafairuz1502@gmail.com' },
      { new: true }
    );

    if (fabiha) {
      console.log(`✓ Updated Fabiha Fairuz's email to: ${fabiha.email}`);
    } else {
      console.log('✗ Fabiha Fairuz not found');
    }

    // Display all users
    console.log('\n=== All Users ===');
    const allUsers = await User.find({}, 'name email projectRoles').lean();
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

updateEmails();
