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

// Test users
async function testUsers() {
  try {
    // Find all users
    const users = await User.find({});
    console.log('All users in database:');
    console.log(users);
    
    // Find admin user specifically
    const adminUser = await User.findOne({ email: 'admin@example.com' });
    console.log('\nAdmin user:');
    console.log(adminUser);
    
    if (adminUser) {
      console.log('\nAdmin user exists:');
      console.log('Email:', adminUser.email);
      console.log('Username:', adminUser.username);
      console.log('Role:', adminUser.role);
      console.log('Active:', adminUser.isActive);
    } else {
      console.log('\nAdmin user does not exist');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error testing users:', error);
    process.exit(1);
  }
}

// Run the function
testUsers();