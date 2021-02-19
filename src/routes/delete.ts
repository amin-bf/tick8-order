import { Router, Request, Response } from "express"
import {
  NotFoundError,
  requireAuth,
  validateRequest,
  NotAuthorizedError
} from "@vanguardo/common"
import { param } from "express-validator"
import mongoose from "mongoose"

import { Order, OrderStatus } from "../models/order"
import { OrderCancelledPublisher } from "../events/publishers/order-cancelled-publisher"
import { natsWrapper } from "../nats-wrapper"

const router = Router()

router.delete(
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

    order.status = OrderStatus.Cancelled

    await order.save()

    new OrderCancelledPublisher(natsWrapper.client).publish({
      id: order.id,
      ticket: {
        id: order.ticket.id
      }
    })

    res.json({ message: "Order Deleted!" })
  }
)

export { router as deleteOrdersRouter }
