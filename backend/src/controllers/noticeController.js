const Notice = require('../models/Notice');

// @desc    Create a new notice
// @route   POST /api/notices
// @access  Private (admin/municipal authority)
const createNotice = async (req, res) => {
  try {
    const { title, department, description, priority } = req.body;

    // Validate required fields
    if (!title || !department || !description) {
      return res.status(400).json({
        message: 'Missing required fields: title, department, description',
      });
    }

    // Create new notice
    const notice = new Notice({
      title,
      department,
      description,
      priority: priority || 'medium',
      municipalityId: req.user.municipalityId || req.user.userId, // Use user's municipality or user ID as fallback
      createdBy: req.user.userId,
    });

    const savedNotice = await notice.save();
    console.log(`Notice created: ${savedNotice.title} by user ${req.user.email}`);
    
    res.status(201).json({
      message: 'Notice created successfully',
      notice: savedNotice,
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all notices for user's municipality
// @route   GET /api/notices
// @access  Private
const getNotices = async (req, res) => {
  try {
    const municipalityId = req.user.municipalityId || req.user.userId;
    
    const notices = await Notice.find({ municipalityId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Fetched ${notices.length} notices for municipality ${municipalityId}`);
    res.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get notice by ID
// @route   GET /api/notices/:id
// @access  Private
const getNoticeById = async (req, res) => {
  try {
    const municipalityId = req.user.municipalityId || req.user.userId;
    
    const notice = await Notice.findOne({ 
      _id: req.params.id, 
      municipalityId 
    }).populate('createdBy', 'name email');

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    res.json(notice);
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update notice
// @route   PUT /api/notices/:id
// @access  Private (admin/municipal authority)
const updateNotice = async (req, res) => {
  try {
    const { title, department, description, priority } = req.body;
    const municipalityId = req.user.municipalityId || req.user.userId;

    const notice = await Notice.findOneAndUpdate(
      { _id: req.params.id, municipalityId },
      {
        title,
        department,
        description,
        priority,
      },
      { new: true }
    ).populate('createdBy', 'name email');

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    console.log(`Notice updated: ${notice.title} by user ${req.user.email}`);
    res.json({
      message: 'Notice updated successfully',
      notice,
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete notice
// @route   DELETE /api/notices/:id
// @access  Private (admin/municipal authority)
const deleteNotice = async (req, res) => {
  try {
    const municipalityId = req.user.municipalityId || req.user.userId;

    const notice = await Notice.findOneAndDelete({
      _id: req.params.id,
      municipalityId
    });

    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    console.log(`Notice deleted: ${notice.title} by user ${req.user.email}`);
    res.json({
      message: 'Notice deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotice,
  getNotices,
  getNoticeById,
  updateNotice,
  deleteNotice,
};
