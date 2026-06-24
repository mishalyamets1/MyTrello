import express from 'express'
import * as aiController from '../controllers/aiController'

const router = express.Router()

router.post('/enhance-description', aiController.enhanceDescription)

export default router