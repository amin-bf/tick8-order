import mongoose from "mongoose"
import request from "supertest"

import { app } from "../../app"
import { Ticket } from "../../models/ticket"

const createTicket = async () => {
  const ticket = Ticket.build({
    price: 3000,
    title: "concert"
  })
  await ticket.save()
  return ticket
}

it("has a route handler that listens on /api/orders/:id for delete requests", async () => {
  const id = new mongoose.Types.ObjectId()
  const response = await request(app).delete(`/api/orders/${id}`).send()

  expect(response.status).not.toEqual(404)
})

it("rejects non-authenticated requests", async () => {
  const id = new mongoose.Types.ObjectId()
  await request(app).delete(`/api/orders/${id}`).send().expect(401)
})

it("Should return any thing other than 401 if user is logged in", async () => {
  const cookie = global.signin()
  const id = new mongoose.Types.ObjectId()

  const response = await request(app)
    .delete(`/api/orders/${id}`)
    .set("Cookie", cookie)
    .send()

  expect(response.status).not.toEqual(401)
})

it("Should return error provided invalid orderId", async () => {
  const cookie = global.signin()

  const response = await request(app)
    .delete(`/api/orders/1234567`)
    .set("Cookie", cookie)
    .send()
    .expect(422)

  expect(response.body.errors).toBeDefined()

  const hasIdError = response.body.errors.some(
    (error: any) => (error.field = "id")
  )

  expect(hasIdError).toBeTruthy()
})

it("Should return 401 provided orderId belongs to someone else", async () => {
  const cookie = global.signin()
  const ticket = await createTicket()

  const { body: order } = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({ ticketId: ticket._id })

  const newCookie = global.signin()
  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set("Cookie", newCookie)
    .send()
    .expect(401)
})

it("Should return 404 provided orderId that dose not exist", async () => {
  const id = new mongoose.Types.ObjectId()

  const newCookie = global.signin()
  const response = await request(app)
    .delete(`/api/orders/${id}`)
    .set("Cookie", newCookie)
    .send()
    .expect(404)
})

it("Should delete a order related to the user", async () => {
  const cookie = global.signin()
  const ticket = await createTicket()

  const { body: order } = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({ ticketId: ticket._id })

  let response = await request(app)
    .get(`/api/orders/${order.id}`)
    .set("Cookie", cookie)
    .send()
    .expect(200)

  expect(response.body.id).toEqual(order.id)
  expect(response.body.ticket.id).toEqual(ticket._id.toString())

  await request(app)
    .delete(`/api/orders/${order.id}`)
    .set("Cookie", cookie)
    .send()
    .expect(200)

  response = await request(app)
    .get(`/api/orders/${order.id}`)
    .set("Cookie", cookie)
    .send()
    .expect(404)
})
