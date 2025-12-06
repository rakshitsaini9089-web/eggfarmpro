const VoiceCommandService = require('../services/voiceCommandService');

const voiceCommandService = new VoiceCommandService();

/**
 * Process a voice command
 */
async function processCommand(req, res) {
  try {
    const { command } = req.body;
    
    if (!command) {
      return res.status(400).json({ 
        message: 'Missing required field: command' 
      });
    }
    
    const result = await voiceCommandService.processCommand(command);
    
    res.json({
      message: 'Command processed successfully',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to process command',
      error: err.message 
    });
  }
}

/**
 * Start voice recognition
 */
async function startListening(req, res) {
  try {
    const result = await voiceCommandService.startListening();
    
    res.json({
      message: 'Voice recognition started',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to start voice recognition',
      error: err.message 
    });
  }
}

/**
 * Stop voice recognition
 */
async function stopListening(req, res) {
  try {
    const result = await voiceCommandService.stopListening();
    
    res.json({
      message: 'Voice recognition stopped',
      result
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to stop voice recognition',
      error: err.message 
    });
  }
}

/**
 * Get voice recognition status
 */
function getListeningStatus(req, res) {
  try {
    const status = voiceCommandService.getListeningStatus();
    
    res.json({
      message: 'Voice recognition status retrieved',
      status
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to get voice recognition status',
      error: err.message 
    });
  }
}

/**
 * Get available voice commands
 */
function getAvailableCommands(req, res) {
  try {
    const commands = voiceCommandService.getAvailableCommands();
    
    res.json({
      message: 'Available voice commands retrieved',
      commands
    });
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to get available voice commands',
      error: err.message 
    });
  }
}

module.exports = {
  processCommand,
  startListening,
  stopListening,
  getListeningStatus,
  getAvailableCommands
};