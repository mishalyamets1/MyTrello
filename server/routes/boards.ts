import express from "express";
import * as boardController from '../controllers/boardController'

const router = express.Router()

router.get('/', boardController.getBoards)
router.get('/:id', boardController.getBoard)
router.post('/', boardController.createBoard)
router.delete('/:id', boardController.deleteBoard)

router.post('/:id/members', boardController.addMember)
router.delete('/:id/members/:userId', boardController.removeMember)
router.patch('/:id/members/:userId', boardController.changeMemberRole)
router.get('/:id/members', boardController.getBoardMembers)
export default router;