import mongoose from "mongoose"
import { Order, OrderStatus } from "./order"

// An interface to describe the properties of new user
interface ITicketAttrs {
  id?: string
  title: string
  price: number
}

// An interface to describe the properties of User Model
interface TicketModel extends mongoose.Model<ITicketDoc> {
  build(ticketAttrs: ITicketAttrs): ITicketDoc
}

// An interface to describe properties of UserDoc
interface ITicketDoc extends mongoose.Document {
  title: string
  price: number
  isReserved(): Promise<boolean>
}

const ticketSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    toJSON: {
      transform: (doc, ret, options) => {
        ret.id = ret._id
        delete ret._id
      }
    }
  }
)

ticketSchema.statics.build = (ticketAttrs: ITicketAttrs): ITicketDoc => {
  return new Ticket({
    ...ticketAttrs,
    _id: ticketAttrs.id || null
  })
}
ticketSchema.methods.isReserved = async function () {
  const existingOrder = await Order.findOne({
    ticket: this as ITicketDoc,
    status: {
      $in: [
        OrderStatus.AwaitingPayment,
        OrderStatus.Complete,
        OrderStatus.Created
      ]
    }
  })

  return !!existingOrder
}

const Ticket = mongoose.model<ITicketDoc, TicketModel>("Ticket", ticketSchema)

export { Ticket, ITicketDoc }
