const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eggfarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  // List all collections
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log('Available collections:');
  collections.forEach(collection => {
    console.log('- ' + collection.name);
  });
  
  // Close connection
  mongoose.connection.close();
  console.log('Connection closed');
})
.catch(err => {
  console.error('Connection error:', err);
});