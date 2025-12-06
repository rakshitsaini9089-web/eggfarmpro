const mongoose = require('mongoose');
const Client = require('./src/models/Client');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eggfarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Create a test client
    const client = new Client({
      name: 'Test Client',
      phone: '1234567890',
      ratePerTray: 150
    });
    
    const savedClient = await client.save();
    console.log('Client saved successfully:', savedClient);
    
    // Retrieve the client to confirm it was saved
    const retrievedClient = await Client.findById(savedClient._id);
    console.log('Retrieved client:', retrievedClient);
    
    // Clean up - delete the test client
    await Client.findByIdAndDelete(savedClient._id);
    console.log('Test client cleaned up');
  } catch (err) {
    console.error('Error saving client:', err);
  }
  
  // Close connection
  mongoose.connection.close();
  console.log('Connection closed');
})
.catch(err => {
  console.error('Connection error:', err);
});