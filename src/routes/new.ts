import { Router, Request, Response } from "express"
import {
  NotFoundError,
  requireAuth,
  validateRequest,
  RequestValidationError
} from "@vanguardo/common"
import { body } from "express-validator"
import mongoose from "mongoose"

import { Ticket } from "../models/ticket"
import { Order } from "../models/order"
import { OrderCreatedPublisher } from "../events/publishers/order-created-publisher"
import { natsWrapper } from "../nats-wrapper"

const router = Router()

router.post(
  "/api/orders",
  requireAuth,
  [
    body("ticketId")
      .trim()
      .notEmpty()
      .custom((input: string) => mongoose.Types.ObjectId.isValid(input))
      .withMessage("The ticketId is not provided / valid.")
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { ticketId } = req.body
    const ticket = await Ticket.findById(ticketId)
    if (!ticket) throw new NotFoundError()

    if (await ticket.isReserved()) {
      throw new RequestValidationError([
        {
          msg: "Ticket is reserved",
          param: "ticketId",
          location: "body",
          value: ticketId
        }
      ])
    }

    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + Order.orderExpiryWindow())
    const order = Order.build({
      ticket,
      userId: req.currentUser!.id,
      expiresAt
    })
    await order.save()

    new OrderCreatedPublisher(natsWrapper.client).publish({
      expiresAt: order.expiresAt.toISOString(),
      ticket: {
        id: ticket.id,
        price: ticket.price
      },
      userId: order.userId,
      id: order.id,
      status: order.status
    })

    res.status(201).json(order)
  }
)

export { router as newOrdersRouter }
