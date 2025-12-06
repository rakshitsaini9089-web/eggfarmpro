const mongoose = require('mongoose');
const Client = require('./src/models/Client');
const Batch = require('./src/models/Batch');
const Payment = require('./src/models/Payment');
const Expense = require('./src/models/Expense');
const Vaccine = require('./src/models/Vaccine');
const Sale = require('./src/models/Sale');
const ScreenshotUpload = require('./src/models/ScreenshotUpload');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/eggfarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear all collections
    const result = await Promise.all([
      Client.deleteMany({}),
      Batch.deleteMany({}),
      Payment.deleteMany({}),
      Expense.deleteMany({}),
      Vaccine.deleteMany({}),
      Sale.deleteMany({}),
      ScreenshotUpload.deleteMany({})
    ]);
    
    console.log('All demo data cleared successfully!');
    console.log('Deleted documents:');
    console.log('- Clients:', result[0].deletedCount);
    console.log('- Batches:', result[1].deletedCount);
    console.log('- Payments:', result[2].deletedCount);
    console.log('- Expenses:', result[3].deletedCount);
    console.log('- Vaccines:', result[4].deletedCount);
    console.log('- Sales:', result[5].deletedCount);
    console.log('- ScreenshotUploads:', result[6].deletedCount);
  } catch (err) {
    console.error('Error clearing demo data:', err);
  }
  
  // Close connection
  mongoose.connection.close();
  console.log('Connection closed');
})
.catch(err => {
  console.error('Connection error:', err);
});