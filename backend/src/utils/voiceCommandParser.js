// Voice command parser scaffold
class VoiceCommandParser {
  constructor() {
    // Define command patterns and their corresponding actions
    this.commands = {
      // Client management commands
      addClient: {
        patterns: [
          /add client (.+) with phone (.+) and rate (.+)/i,
          /create client (.+) phone (.+) rate (.+)/i,
          /new client (.+) (.+) (.+)/i
        ],
        action: 'addClient',
        params: ['name', 'phone', 'rate']
      },
      
      // Sale management commands
      addSale: {
        patterns: [
          /add (\d+) trays for client (.+)/i,
          /sell (\d+) trays to (.+)/i,
          /create sale (\d+) trays (.+)/i
        ],
        action: 'addSale',
        params: ['trays', 'client']
      },
      
      // Payment management commands
      addPayment: {
        patterns: [
          /add payment of (.+) from (.+)/i,
          /record payment (.+) from (.+)/i,
          /client (.+) paid (.+)/i
        ],
        action: 'addPayment',
        params: ['amount', 'client']
      },
      
      // Expense management commands
      addExpense: {
        patterns: [
          /add expense (.+) for (.+)/i,
          /record expense (.+) (.+)/i,
          /spent (.+) on (.+)/i
        ],
        action: 'addExpense',
        params: ['amount', 'description']
      },
      
      // Batch management commands
      addBatch: {
        patterns: [
          /add batch (.+) with (\d+) chicks/i,
          /create batch (.+) quantity (\d+)/i,
          /new batch (.+) (.+)/i
        ],
        action: 'addBatch',
        params: ['name', 'quantity']
      },
      
      // Vaccine management commands
      addVaccine: {
        patterns: [
          /add vaccine (.+) for batch (.+)/i,
          /schedule vaccine (.+) (.+)/i,
          /vaccinate batch (.+) with (.+)/i
        ],
        action: 'addVaccine',
        params: ['vaccine', 'batch']
      },
      
      // Report commands
      generateReport: {
        patterns: [
          /generate (.+) report/i,
          /create (.+) report/i,
          /show me (.+) report/i
        ],
        action: 'generateReport',
        params: ['type']
      },
      
      // Dashboard commands
      showDashboard: {
        patterns: [
          /show dashboard/i,
          /open dashboard/i,
          /go to dashboard/i
        ],
        action: 'showDashboard',
        params: []
      },
      
      // Navigation commands
      navigateTo: {
        patterns: [
          /go to (.+)/i,
          /open (.+)/i,
          /navigate to (.+)/i
        ],
        action: 'navigateTo',
        params: ['page']
      }
    };
  }

  /**
   * Parse a voice command and extract action and parameters
   * @param {string} command - The voice command to parse
   * @returns {Object|null} - Parsed command with action and parameters, or null if not matched
   */
  parseCommand(command) {
    // Normalize the command
    const normalizedCommand = command.trim().toLowerCase();
    
    // Try to match the command against each pattern
    for (const [commandKey, commandConfig] of Object.entries(this.commands)) {
      for (const pattern of commandConfig.patterns) {
        const match = normalizedCommand.match(pattern);
        
        if (match) {
          // Extract parameters from the match
          const params = {};
          commandConfig.params.forEach((param, index) => {
            // Skip the first match group (entire match) and start from index 1
            params[param] = match[index + 1];
          });
          
          return {
            action: commandConfig.action,
            params: params,
            confidence: this.calculateConfidence(match, pattern)
          };
        }
      }
    }
    
    // No match found
    return null;
  }

  /**
   * Calculate confidence score for a matched command
   * @param {Array} match - The regex match result
   * @param {RegExp} pattern - The pattern that matched
   * @returns {number} - Confidence score between 0 and 1
   */
  calculateConfidence(match, pattern) {
    // Simple confidence calculation based on match length and pattern complexity
    const matchLength = match[0].length;
    const patternLength = pattern.toString().length;
    
    // Higher confidence for longer matches relative to pattern complexity
    return Math.min(1, matchLength / (patternLength * 0.5));
  }

  /**
   * Add a new command pattern
   * @param {string} commandKey - Unique key for the command
   * @param {Object} commandConfig - Configuration for the command
   */
  addCommand(commandKey, commandConfig) {
    this.commands[commandKey] = commandConfig;
  }

  /**
   * Get all available commands
   * @returns {Object} - All available commands
   */
  getCommands() {
    return this.commands;
  }

  /**
   * Validate command parameters
   * @param {string} action - The action to validate
   * @param {Object} params - The parameters to validate
   * @returns {Object} - Validation result
   */
  validateParams(action, params) {
    const result = {
      valid: true,
      errors: []
    };

    // Add validation logic based on action type
    switch (action) {
      case 'addClient':
        if (!params.name || params.name.length < 2) {
          result.valid = false;
          result.errors.push('Client name is required and must be at least 2 characters');
        }
        if (!params.phone || !/^\d{10,15}$/.test(params.phone)) {
          result.valid = false;
          result.errors.push('Valid phone number is required (10-15 digits)');
        }
        if (!params.rate || isNaN(parseFloat(params.rate))) {
          result.valid = false;
          result.errors.push('Valid rate is required');
        }
        break;
        
      case 'addSale':
        if (!params.trays || isNaN(parseInt(params.trays)) || parseInt(params.trays) <= 0) {
          result.valid = false;
          result.errors.push('Valid tray quantity is required');
        }
        if (!params.client || params.client.length < 2) {
          result.valid = false;
          result.errors.push('Client name is required');
        }
        break;
        
      case 'addPayment':
        if (!params.amount || isNaN(parseFloat(params.amount)) || parseFloat(params.amount) <= 0) {
          result.valid = false;
          result.errors.push('Valid payment amount is required');
        }
        if (!params.client || params.client.length < 2) {
          result.valid = false;
          result.errors.push('Client name is required');
        }
        break;
        
      case 'addExpense':
        if (!params.amount || isNaN(parseFloat(params.amount)) || parseFloat(params.amount) <= 0) {
          result.valid = false;
          result.errors.push('Valid expense amount is required');
        }
        if (!params.description || params.description.length < 3) {
          result.valid = false;
          result.errors.push('Expense description is required');
        }
        break;
        
      case 'addBatch':
        if (!params.name || params.name.length < 2) {
          result.valid = false;
          result.errors.push('Batch name is required');
        }
        if (!params.quantity || isNaN(parseInt(params.quantity)) || parseInt(params.quantity) <= 0) {
          result.valid = false;
          result.errors.push('Valid batch quantity is required');
        }
        break;
        
      case 'addVaccine':
        if (!params.vaccine || params.vaccine.length < 2) {
          result.valid = false;
          result.errors.push('Vaccine name is required');
        }
        if (!params.batch || params.batch.length < 2) {
          result.valid = false;
          result.errors.push('Batch name is required');
        }
        break;
    }

    return result;
  }
}

module.exports = VoiceCommandParser;