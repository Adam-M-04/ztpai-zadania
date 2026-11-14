const request = require("supertest");
const { createApp } = require("../../src/app");
const { createRepositories } = require("../../src/repositories");
const { createEventBus } = require("../../src/events/eventBus");
const { registerListeners } = require("../../src/events/registerListeners");
const { app, db, migrate, resetDb, closeDb, createUser, createRoom } = require("../support/testApp");

beforeAll(migrate);
beforeEach(resetDb);
afterAll(closeDb);

async function insertEntries() {
  await db("audit_log").insert([
    { event_type: "reservation.created", payload: { reservationId: 1 }, created_at: "2030-01-01T10:00:00Z" },
    { event_type: "reservation.created", payload: { reservationId: 2 }, created_at: "2030-01-01T11:00:00Z" },
    { event_type: "reservation.cancelled", payload: { reservationId: 1 }, created_at: "2030-01-01T12:00:00Z" },
  ]);
}

async function waitFor(check) {
  for (let i = 0; i < 50; i++) {
    if (await check()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
}

async function auditLogCount() {
  const [row] = await db("audit_log").count("id as count");
  return Number(row.count);
}

describe("GET /api/admin/audit-log", () => {
  test("returns entries from newest for ADMIN", async () => {
    const admin = await createUser("admin@example.com", "ADMIN");
    await insertEntries();

    const res = await request(app).get("/api/admin/audit-log").set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 1, limit: 20, total: 3, totalPages: 1 });
    expect(res.body.data.map((e) => e.eventType)).toEqual([
      "reservation.cancelled",
      "reservation.created",
      "reservation.created",
    ]);
    expect(res.body.data[0]).toMatchObject({ payload: { reservationId: 1 }, createdAt: "2030-01-01T12:00:00.000Z" });
  });

  test("filters by eventType and paginates", async () => {
    const admin = await createUser("admin@example.com", "ADMIN");
    await insertEntries();

    const res = await request(app)
      .get("/api/admin/audit-log?eventType=reservation.created&limit=1&page=2")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(200);
    expect(res.body.meta).toEqual({ page: 2, limit: 1, total: 2, totalPages: 2 });
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].payload).toEqual({ reservationId: 1 });
  });

  test("returns 400 for unknown eventType", async () => {
    const admin = await createUser("admin@example.com", "ADMIN");

    const res = await request(app)
      .get("/api/admin/audit-log?eventType=room.created")
      .set("Authorization", `Bearer ${admin.token}`);

    expect(res.status).toBe(400);
    expect(res.body.error.details[0]).toMatchObject({ location: "query", field: "eventType" });
  });

  test("returns 403 for USER", async () => {
    const user = await createUser("jan@example.com");

    const res = await request(app).get("/api/admin/audit-log").set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

describe("audit log with listeners", () => {
  test("saves only successful operations", async () => {
    const repositories = createRepositories(db);
    const eventBus = createEventBus();
    registerListeners(eventBus, repositories);
    const appWithListeners = createApp({ ...repositories, eventBus });
    const log = jest.spyOn(console, "log").mockImplementation(() => {});

    const owner = await createUser("jan@example.com");
    const other = await createUser("anna@example.com");
    const admin = await createUser("admin@example.com", "ADMIN");
    const roomId = await createRoom();
    const body = { roomId, participants: 5, startTime: "2030-01-10T10:00:00Z", endTime: "2030-01-10T12:00:00Z" };

    const created = await request(appWithListeners).post("/api/reservations").set("Authorization", `Bearer ${owner.token}`).send(body);
    const conflict = await request(appWithListeners).post("/api/reservations").set("Authorization", `Bearer ${other.token}`).send(body);
    const cancel = `/api/reservations/${created.body.id}/cancel`;
    await request(appWithListeners).patch(cancel).set("Authorization", `Bearer ${admin.token}`);
    await request(appWithListeners).patch(cancel).set("Authorization", `Bearer ${admin.token}`);
    await waitFor(async () => (await auditLogCount()) === 2 && log.mock.calls.length > 0);

    expect(conflict.status).toBe(409);

    const res = await request(appWithListeners).get("/api/admin/audit-log").set("Authorization", `Bearer ${admin.token}`);
    expect(res.body.data.map((e) => e.eventType)).toEqual(["reservation.cancelled", "reservation.created"]);
    expect(res.body.data[0].payload).toEqual({
      reservationId: created.body.id,
      roomId,
      userId: owner.id,
      cancelledBy: admin.id,
    });
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/^\[notification\] to: jan@example\.com /));

    log.mockRestore();
  });
});
