const express = require('express');
const {
  listGroups,
  createGroup,
  getGroupDetails,
  updateGroup,
  deleteGroup,
} = require('../controllers/group.controller');
const { listGroupPlayers, addPlayer } = require('../controllers/player.controller');
const { authenticate, requireRole, USER_ROLES } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireRole(USER_ROLES.COACH));

router.route('/').get(listGroups).post(createGroup);
router.route('/:groupId').get(getGroupDetails).put(updateGroup).delete(deleteGroup);
router.route('/:groupId/players').get(listGroupPlayers).post(addPlayer);

module.exports = router;



