const express = require('express');
const router = express.Router();
const { verifyJwt } = require('../middleware/auth');
const StudyGroup = require('../models/StudyGroup');

// Get all public study groups
router.get('/', async (req, res) => {
  try {
    const {
      subject,
      tags,
      search,
      sortBy = 'recent',
      page = 1,
      limit = 20
    } = req.query;

    const offset = (page - 1) * limit;
    const groups = await StudyGroup.getAll({
      subject,
      tags: tags ? tags.split(',') : null,
      search,
      isPrivate: false,
      sortBy,
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: groups.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching study groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study groups'
    });
  }
});

// Get single study group
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const group = await StudyGroup.findById(id, userId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check access permissions for private groups
    if (group.is_private && userId) {
      const canAccess = await StudyGroup.canAccess(id, userId);
      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to private group'
        });
      }
    } else if (group.is_private && !userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get group stats
    const stats = await StudyGroup.getGroupStats(id);
    
    res.json({
      success: true,
      data: {
        ...group,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching study group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch study group'
    });
  }
});

// Create new study group
router.post('/', verifyJwt, async (req, res) => {
  try {
    const {
      name,
      description,
      subject,
      isPrivate = false,
      maxMembers = 20,
      tags
    } = req.body;

    if (!name || !subject) {
      return res.status(400).json({
        success: false,
        message: 'Name and subject are required'
      });
    }

    if (maxMembers < 2 || maxMembers > 100) {
      return res.status(400).json({
        success: false,
        message: 'Max members must be between 2 and 100'
      });
    }

    const groupData = {
      name,
      description,
      subject,
      isPrivate,
      maxMembers,
      creatorId: req.user.id,
      tags: Array.isArray(tags) ? tags : []
    };

    const group = await StudyGroup.create(groupData);
    res.status(201).json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('Error creating study group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create study group'
    });
  }
});

// Update study group
router.put('/:id', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, subject, isPrivate, maxMembers, tags } = req.body;

    const group = await StudyGroup.findById(id, req.user.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    // Check if user is admin of the group
    if (group.user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group admins can update group settings'
      });
    }

    if (maxMembers && (maxMembers < group.member_count || maxMembers > 100)) {
      return res.status(400).json({
        success: false,
        message: `Max members must be at least ${group.member_count} (current members) and at most 100`
      });
    }

    const updatedGroup = await StudyGroup.update(id, {
      name,
      description,
      subject,
      isPrivate,
      maxMembers,
      tags: Array.isArray(tags) ? tags : []
    });

    res.json({
      success: true,
      data: updatedGroup
    });
  } catch (error) {
    console.error('Error updating study group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update study group'
    });
  }
});

// Delete study group
router.delete('/:id', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;

    const group = await StudyGroup.findById(id, req.user.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    if (group.creator_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only group creator or admin can delete the group'
      });
    }

    await StudyGroup.delete(id);
    res.json({
      success: true,
      message: 'Study group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting study group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete study group'
    });
  }
});

// Get group members
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?.id;

    // Check access permissions
    if (userId) {
      const canAccess = await StudyGroup.canAccess(id, userId);
      if (!canAccess) {
        const group = await StudyGroup.findById(id);
        if (!group || group.is_private) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }
      }
    }

    const offset = (page - 1) * limit;
    const members = await StudyGroup.getMembers(id, parseInt(limit), offset);

    res.json({
      success: true,
      data: members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: members.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching group members:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch group members'
    });
  }
});

// Get pending join requests (admin/moderator only)
router.get('/:id/requests', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const group = await StudyGroup.findById(id, req.user.id);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Study group not found'
      });
    }

    if (!['admin', 'moderator'].includes(group.user_role)) {
      return res.status(403).json({
        success: false,
        message: 'Only admins and moderators can view join requests'
      });
    }

    const offset = (page - 1) * limit;
    const requests = await StudyGroup.getPendingRequests(id, parseInt(limit), offset);

    res.json({
      success: true,
      data: requests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: requests.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching join requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch join requests'
    });
  }
});

// Request to join group
router.post('/:id/join', verifyJwt, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    const result = await StudyGroup.requestToJoin(id, req.user.id, message);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error joining study group:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to join study group'
    });
  }
});

// Approve join request
router.post('/:id/requests/:userId/approve', verifyJwt, async (req, res) => {
  try {
    const { id, userId } = req.params;

    const member = await StudyGroup.approveRequest(id, parseInt(userId), req.user.id);
    res.json({
      success: true,
      data: member,
      message: 'Request approved successfully'
    });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve request'
    });
  }
});

// Reject join request
router.post('/:id/requests/:userId/reject', verifyJwt, async (req, res) => {
  try {
    const { id, userId } = req.params;

    await StudyGroup.rejectRequest(id, parseInt(userId), req.user.id);
    res.json({
      success: true,
      message: 'Request rejected successfully'
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reject request'
    });
  }
});

// Remove member or leave group
router.delete('/:id/members/:userId', verifyJwt, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const targetUserId = parseInt(userId);

    await StudyGroup.removeMember(id, targetUserId, req.user.id);
    
    const message = targetUserId === req.user.id ? 
      'Left group successfully' : 
      'Member removed successfully';

    res.json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to remove member'
    });
  }
});

// Update member role
router.put('/:id/members/:userId/role', verifyJwt, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const { role } = req.body;

    if (!['member', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    const member = await StudyGroup.updateMemberRole(id, parseInt(userId), role, req.user.id);
    res.json({
      success: true,
      data: member,
      message: 'Member role updated successfully'
    });
  } catch (error) {
    console.error('Error updating member role:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update member role'
    });
  }
});

// Get user's study groups
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const groups = await StudyGroup.getUserGroups(userId, parseInt(limit), offset);
    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: groups.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching user study groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user study groups'
    });
  }
});

module.exports = router;
