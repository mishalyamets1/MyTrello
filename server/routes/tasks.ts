import express from "express"
import * as tasksController from '../controllers/tasksController'
const router = express.Router()

router.get('/inbox', tasksController.getTasks)
router.post('/inbox', tasksController.addTask)
router.put('/:id', tasksController.updateTask)
router.delete('/:id', tasksController.deleteTask)
router.post('/:id/move', tasksController.moveTask)

router.get('/archive', tasksController.getArchive)
router.post('/:id/complete', tasksController.completeTasks)
router.post('/:id/restore', tasksController.restoreTask)

export default router;