import { Listener, ITicketCreatedEvent, Subjects } from "@vanguardo/common"
import { Message } from "node-nats-streaming"

import { Ticket } from "../../models/ticket"
import { queueGroupName } from "./queue-group-name"

export class TicketCreatedListener extends Listener<ITicketCreatedEvent> {
  subject: Subjects.TicketCreated = Subjects.TicketCreated
  queueGroupName: string = queueGroupName
  async onMessage(
    data: { id: string; title: string; price: number; userId: string },
    msg: Message
  ) {
    const { id, title, price } = data
    const ticket = Ticket.build({
      id,
      price,
      title
    })

    await ticket.save()

    msg.ack()
  }
}
