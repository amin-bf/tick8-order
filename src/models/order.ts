import { OrderStatus } from "@vanguardo/common"
import mongoose from "mongoose"

import { ITicketDoc } from "./ticket"

export { OrderStatus }

interface IOrderAttrs {
  userId: string
  status?: OrderStatus
  expiresAt: Date
  ticket: ITicketDoc
}

interface IOrderDoc extends mongoose.Document {
  userId: string
  status: OrderStatus
  expiresAt: Date
  ticket: ITicketDoc
  updatedAt: string
  createdAt: string
}

interface IOrderModel extends mongoose.Model<IOrderDoc> {
  build(attrs: IOrderAttrs): IOrderDoc
  orderExpiryWindow(): number
}

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OrderStatus),
      default: OrderStatus.Created
    },
    expiresAt: {
      type: mongoose.Schema.Types.Date
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket"
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
      }
    }
  }
)

orderSchema.statics.orderExpiryWindow = () => 15
orderSchema.statics.build = (attrs: IOrderAttrs) => {
  return new Order(attrs)
}

const Order = mongoose.model<IOrderDoc, IOrderModel>("Order", orderSchema)
export { Order }
