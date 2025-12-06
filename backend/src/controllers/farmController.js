const Farm = require('../models/Farm');

/**
 * Get all farms
 */
async function getFarms(req, res) {
  try {
    const farms = await Farm.find()
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ name: 1 });
    res.json(farms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get farm by ID
 */
async function getFarmById(req, res) {
  try {
    const farm = await Farm.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');
    
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }
    
    res.json(farm);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Create new farm
 */
async function createFarm(req, res) {
  try {
    // Validate required fields
    if (!req.body.name || !req.body.location || !req.body.owner) {
      return res.status(400).json({ message: 'Farm name, location, and owner/organization name are required' });
    }
    
    // Validate that contact phone is provided
    if (!req.body.contact || !req.body.contact.phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Validate partner details for partnerships
    if (req.body.businessType === 'partnership') {
      if (!req.body.numberOfPartners || req.body.numberOfPartners < 2) {
        return res.status(400).json({ message: 'Partnership must have at least 2 partners' });
      }
      
      if (!req.body.partnerDetails || req.body.partnerDetails.length !== req.body.numberOfPartners) {
        return res.status(400).json({ message: 'Partner details must match the number of partners specified' });
      }
      
      // Validate that partner percentages add up to 100
      const totalPercentage = req.body.partnerDetails.reduce((sum, partner) => sum + (partner.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ message: `Total partner percentages must equal 100%. Current total: ${totalPercentage}%` });
      }
    }
    
    const farm = new Farm(req.body);
    farm.createdBy = req.user.userId;
    farm.updatedBy = req.user.userId;
    
    const newFarm = await farm.save();
    res.status(201).json(newFarm);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Update farm
 */
async function updateFarm(req, res) {
  try {
    const farm = await Farm.findById(req.params.id);
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }
    
    // Validate required fields
    if (!req.body.name || !req.body.location || !req.body.owner) {
      return res.status(400).json({ message: 'Farm name, location, and owner/organization name are required' });
    }
    
    // Validate that contact phone is provided
    if (!req.body.contact || !req.body.contact.phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }
    
    // Validate partner details for partnerships
    if (req.body.businessType === 'partnership') {
      if (!req.body.numberOfPartners || req.body.numberOfPartners < 2) {
        return res.status(400).json({ message: 'Partnership must have at least 2 partners' });
      }
      
      if (!req.body.partnerDetails || req.body.partnerDetails.length !== req.body.numberOfPartners) {
        return res.status(400).json({ message: 'Partner details must match the number of partners specified' });
      }
      
      // Validate that partner percentages add up to 100
      const totalPercentage = req.body.partnerDetails.reduce((sum, partner) => sum + (partner.percentage || 0), 0);
      if (Math.abs(totalPercentage - 100) > 0.01) {
        return res.status(400).json({ message: `Total partner percentages must equal 100%. Current total: ${totalPercentage}%` });
      }
    }
    
    Object.keys(req.body).forEach(key => {
      farm[key] = req.body[key];
    });
    
    farm.updatedBy = req.user.userId;
    const updatedFarm = await farm.save();
    res.json(updatedFarm);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

/**
 * Delete farm
 */
async function deleteFarm(req, res) {
  try {
    const farm = await Farm.findByIdAndDelete(req.params.id);
    
    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }
    
    res.json({ message: 'Farm deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/**
 * Get active farms
 */
async function getActiveFarms(req, res) {
  try {
    const farms = await Farm.find({ isActive: true })
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ name: 1 });
    res.json(farms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  getFarms,
  getFarmById,
  createFarm,
  updateFarm,
  deleteFarm,
  getActiveFarms
};