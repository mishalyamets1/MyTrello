import express from 'express';
import * as columnController from '../controllers/columnController'
const router = express.Router();

router.get('/', columnController.getAllColumns )
router.post('/', columnController.createColumn)
router.post('/:id/move', columnController.moveColumns)
router.delete('/:id', columnController.deleteColumn)


export default router;