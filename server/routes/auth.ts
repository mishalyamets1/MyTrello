import express from 'express'
import * as authController from '../controllers/authController'

const router = express.Router();

router.post('/login', authController.login )
router.post('/register', authController.register)
router.post('/refresh', authController.refresh)
router.post('/logout', authController.logout)

export default router