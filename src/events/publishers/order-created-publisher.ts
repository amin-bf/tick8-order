import { IOrderCreatedEvent, Publisher, Subjects } from "@vanguardo/common"

export class OrderCreatedPublisher extends Publisher<IOrderCreatedEvent> {
  subject: Subjects.OrderCreated = Subjects.OrderCreated
}
