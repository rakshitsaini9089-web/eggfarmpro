const mongoose = require('mongoose');
require('dotenv').config();

// Import the User model
const User = require('./src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eggfarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Create admin user
async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create new admin user
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'owner',
      isActive: true
    });
    
    await adminUser.save();
    
    console.log('Admin user created successfully');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('Role: owner');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

// Run the function
createAdminUser();