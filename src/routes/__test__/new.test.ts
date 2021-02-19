import request from "supertest"
import mongoose from "mongoose"

import { app } from "../../app"
import { Ticket } from "../../models/ticket"
import { Order } from "../../models/order"
import { natsWrapper } from "../../nats-wrapper"

it("has a route handler that listens on /api/orders for post requests", async () => {
  const response = await request(app).post("/api/orders").send()

  expect(response.status).not.toEqual(404)
})

it("rejects non-authenticated requests", async () => {
  await request(app).post("/api/orders").send().expect(401)
})

it("Should return any thing other than 401 if user is logged in", async () => {
  const cookie = global.signin()

  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({ test: "tes" })

  expect(response.status).not.toEqual(401)
})

it("returns error if no ticketId is provided", async () => {
  const cookie = global.signin()
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send()

  expect(response.body.errors).toBeDefined()

  let ticketIdHasError = response.body.errors.some(
    (error: any) => error.field === "ticketId"
  )
  expect(ticketIdHasError).toBeTruthy()
})

it("returns error if ticketId is provided is not an valid mongodb id", async () => {
  const cookie = global.signin()
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({
      ticketId: "123"
    })

  expect(response.body.errors).toBeDefined()

  let ticketIdHasError = response.body.errors.some(
    (error: any) => error.field === "ticketId"
  )
  expect(ticketIdHasError).toBeTruthy()
})

it("returns 404 if ticketId provided is not present in DB", async () => {
  const cookie = global.signin()
  const id = new mongoose.Types.ObjectId()
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({
      ticketId: id
    })
    .expect(404)
})

it("returns error if ticketId provided belongs to a reserved ticket", async () => {
  const ticket = Ticket.build({
    price: 3000,
    title: "concert"
  })
  await ticket.save()

  const expiresAt = new Date()
  expiresAt.setMinutes(expiresAt.getMinutes() + Order.orderExpiryWindow())
  const order = Order.build({
    ticket: ticket,
    userId: "1234567",
    expiresAt
  })
  await order.save()

  const cookie = global.signin()
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({
      ticketId: ticket._id
    })
    .expect(422)
})

it("returns the order if ticketId provided is valid", async () => {
  const ticket = Ticket.build({
    price: 3000,
    title: "concert"
  })
  await ticket.save()

  const cookie = global.signin()
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({
      ticketId: ticket._id
    })
    .expect(201)

  expect(response.body.ticket.id).toEqual(ticket._id.toString())
})

it("publishes an event", async () => {
  const ticket = Ticket.build({
    price: 3000,
    title: "concert"
  })
  await ticket.save()

  const cookie = global.signin()
  const response = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({
      ticketId: ticket._id
    })
    .expect(201)

  expect(natsWrapper.client.publish).toHaveBeenCalled()
})
