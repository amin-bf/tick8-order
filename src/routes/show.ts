import { Router, Request, Response } from "express"
import {
  NotFoundError,
  requireAuth,
  validateRequest,
  NotAuthorizedError
} from "@vanguardo/common"
import { param } from "express-validator"
import mongoose from "mongoose"

import { Order } from "../models/order"

const router = Router()

router.get(
  "/api/orders/:id",
  requireAuth,
  [
    param("id")
      .trim()
      .notEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("The id is not provided / valid.")
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { id } = req.params

    const order = await Order.findById(id).populate("ticket")
    if (!order) throw new NotFoundError()

    if (order.userId !== req.currentUser!.id) throw new NotAuthorizedError()

    res.json(order)
  }
)

export { router as showOrdersRouter }
