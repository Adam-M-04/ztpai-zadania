const request = require("supertest");
const {
  app,
  db,
  migrate,
  resetDb,
  closeDb,
  createUser,
  createRoom,
  createReservation,
} = require("../support/testApp");

beforeAll(migrate);
beforeEach(resetDb);
afterAll(closeDb);

function at(day, time) {
  return `2030-01-${day}T${time}:00.000Z`;
}

describe("POST /api/reservations", () => {
  test("returns 201 with Location header and saves reservation", async () => {
    const user = await createUser("jan@example.com");
    const roomId = await createRoom();

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ roomId, participants: 5, startTime: at("10", "10:00"), endTime: at("10", "12:00") });

    expect(res.status).toBe(201);
    expect(res.headers.location).toBe(`/api/reservations/${res.body.id}`);
    expect(res.body).toMatchObject({ status: "CONFIRMED", user: { id: user.id, email: user.email } });

    const row = await db("reservations").where({ id: res.body.id }).first();
    expect(row).toMatchObject({ room_id: roomId, user_id: user.id, participants: 5, status: "CONFIRMED" });
    expect(row.start_time.toISOString()).toBe(at("10", "10:00"));
  });

  test("returns 400 with details for invalid body", async () => {
    const user = await createUser("jan@example.com");

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ participants: -1, startTime: "jutro", endTime: at("10", "12:00"), userId: 2 });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");

    const fields = res.body.error.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["roomId", "participants", "startTime"]));
    expect(res.body.error.details).toContainEqual(expect.objectContaining({ location: "body", field: "roomId" }));
    expect(await db("reservations").count("id as count").first()).toEqual({ count: "0" });
  });

  test("returns 409 ROOM_ALREADY_BOOKED for overlapping reservation", async () => {
    const owner = await createUser("jan@example.com");
    const other = await createUser("anna@example.com");
    const roomId = await createRoom();
    await createReservation(roomId, owner.id, at("10", "10:00"), at("10", "12:00"));

    const res = await request(app)
      .post("/api/reservations")
      .set("Authorization", `Bearer ${other.token}`)
      .send({ roomId, participants: 5, startTime: at("10", "11:00"), endTime: at("10", "13:00") });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("ROOM_ALREADY_BOOKED");
    expect(await db("reservations").count("id as count").first()).toEqual({ count: "1" });
  });
});

describe("GET /api/reservations", () => {
  test("returns 404 for USER reading someone else's reservation", async () => {
    const owner = await createUser("jan@example.com");
    const other = await createUser("anna@example.com");
    const roomId = await createRoom();
    const id = await createReservation(roomId, owner.id, at("10", "10:00"), at("10", "12:00"));

    const res = await request(app).get(`/api/reservations/${id}`).set("Authorization", `Bearer ${other.token}`);

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  test("ADMIN reads someone else's reservation", async () => {
    const owner = await createUser("jan@example.com");
    const admin = await createUser("admin@example.com", "ADMIN");
    const roomId = await createRoom();
    const id = await createReservation(roomId, owner.id, at("10", "10:00"), at("10", "12:00"));

    const res = await request(app).get(`/api/reservations/${id}`).set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(owner.id);
  });

  test("paginates results with meta.total", async () => {
    const user = await createUser("jan@example.com");
    const roomId = await createRoom();
    for (const day of ["11", "12", "13", "14", "15"]) {
      await createReservation(roomId, user.id, at(day, "10:00"), at(day, "12:00"));
    }

    const res = await request(app)
      .get("/api/reservations?limit=2&page=2")
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.meta).toEqual({ page: 2, limit: 2, total: 5, totalPages: 3 });
    expect(res.body.data.map((r) => r.startTime)).toEqual([at("13", "10:00"), at("14", "10:00")]);
  });
});

describe("PATCH /api/reservations/:id/cancel", () => {
  test("owner cancels reservation and second cancel keeps cancelledAt", async () => {
    const user = await createUser("jan@example.com");
    const roomId = await createRoom();
    const id = await createReservation(roomId, user.id, at("10", "10:00"), at("10", "12:00"));

    const first = await request(app).patch(`/api/reservations/${id}/cancel`).set("Authorization", `Bearer ${user.token}`);
    const second = await request(app).patch(`/api/reservations/${id}/cancel`).set("Authorization", `Bearer ${user.token}`);

    expect(first.status).toBe(200);
    expect(first.body.status).toBe("CANCELLED");
    expect(second.status).toBe(200);
    expect(second.body.cancelledAt).toBe(first.body.cancelledAt);
  });
});
