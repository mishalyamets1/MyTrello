import express from "express"
import * as tasksController from '../controllers/tasksController'
const router = express.Router()

router.get('/inbox', tasksController.getTasks)
router.post('/inbox', tasksController.addTask)
router.put('/:id', tasksController.updateTask)
router.delete('/:id', tasksController.deleteTask)
router.post('/:id/move', tasksController.moveTask)

export default router;