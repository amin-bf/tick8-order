import { Listener, ITicketUpdatedEvent, Subjects } from "@vanguardo/common"
import { Message } from "node-nats-streaming"

import { Ticket } from "../../models/ticket"
import { queueGroupName } from "./queue-group-name"

export class TicketUpdatedListener extends Listener<ITicketUpdatedEvent> {
  subject: Subjects.TicketUpdated = Subjects.TicketUpdated
  queueGroupName: string = queueGroupName
  async onMessage(
    data: { id: string; title: string; price: number; userId: string },
    msg: Message
  ) {
    const { id, title, price } = data

    const ticket = await Ticket.findById(id)

    if (!ticket) throw new Error("Ticket not found.")

    ticket.set({ title, price })
    await ticket.save()

    msg.ack()
  }
}
