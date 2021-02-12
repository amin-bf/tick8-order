import { Router, Request, Response } from "express"
import { requireAuth } from "@vanguardo/common"
import { Order } from "../models/order"

const router = Router()

router.get("/api/orders", requireAuth, async (req: Request, res: Response) => {
  const userId = req.currentUser!.id

  const orders = await Order.find({
    userId
  }).populate("ticket")

  res.json(orders)
})

export { router as listOrdersRouter }
