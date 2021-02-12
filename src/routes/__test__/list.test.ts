import request from "supertest"
import { app } from "../../app"
import { Order } from "../../models/order"
import { Ticket } from "../../models/ticket"

const createTicket = async () => {
  const ticket = Ticket.build({
    price: 3000,
    title: "concert"
  })
  await ticket.save()
  return ticket
}

it("has a route handler that listens on /api/orders for get requests", async () => {
  const response = await request(app).get("/api/orders").send()

  expect(response.status).not.toEqual(404)
})

it("rejects non-authenticated requests", async () => {
  await request(app).get("/api/orders").send().expect(401)
})

it("Should return any thing other than 401 if user is logged in", async () => {
  const cookie = global.signin()

  const response = await request(app)
    .get("/api/orders")
    .set("Cookie", cookie)
    .send({ test: "tes" })

  expect(response.status).not.toEqual(401)
})

it("should return list of orders of a authenticated user", async () => {
  const cookie = global.signin()
  let response = await request(app)
    .get("/api/orders")
    .set("Cookie", cookie)
    .send()
    .expect(200)

  expect(response.body.length).toEqual(0)

  let ticket = await createTicket()
  await request(app).post("/api/orders").set("Cookie", cookie).send({
    ticketId: ticket._id
  })

  ticket = await createTicket()
  await request(app).post("/api/orders").set("Cookie", cookie).send({
    ticketId: ticket._id
  })

  ticket = await createTicket()
  const res = await request(app)
    .post("/api/orders")
    .set("Cookie", cookie)
    .send({
      ticketId: ticket._id
    })

  response = await request(app)
    .get("/api/orders")
    .set("Cookie", cookie)
    .send()
    .expect(200)

  expect(response.body.length).toEqual(3)
})
