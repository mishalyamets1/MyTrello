import express from 'express'
import * as userController from '../controllers/userController'

const router = express.Router()

router.get("/me", userController.getMe)
router.patch("/me", userController.updateMe)
router.get("/me/password", userController.changePassword)

export default router