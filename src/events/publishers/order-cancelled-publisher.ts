import { IOrderCancelledEvent, Publisher, Subjects } from "@vanguardo/common"

export class OrderCancelledPublisher extends Publisher<IOrderCancelledEvent> {
  subject: Subjects.OrderCancelled = Subjects.OrderCancelled
}
