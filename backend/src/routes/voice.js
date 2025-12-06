const express = require('express');
const router = express.Router();
const { 
  processCommand,
  startListening,
  stopListening,
  getListeningStatus,
  getAvailableCommands
} = require('../controllers/voiceCommandController');

// Process a voice command
router.post('/process', processCommand);

// Start voice recognition
router.post('/start', startListening);

// Stop voice recognition
router.post('/stop', stopListening);

// Get voice recognition status
router.get('/status', getListeningStatus);

// Get available voice commands
router.get('/commands', getAvailableCommands);

module.exports = router;