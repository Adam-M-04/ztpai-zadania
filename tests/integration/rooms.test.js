const request = require("supertest");
const { app, db, migrate, resetDb, closeDb, createUser } = require("../support/testApp");

beforeAll(migrate);
beforeEach(resetDb);
afterAll(closeDb);

describe("POST /api/rooms", () => {
  test("returns 403 for USER", async () => {
    const user = await createUser("jan@example.com");
    const [building] = await db("buildings").insert({ name: "Budynek A", address: "ul. Testowa 1" }).returning("id");

    const res = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ buildingId: building.id, name: "101", capacity: 10 });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
    expect(await db("rooms").count("id as count").first()).toEqual({ count: "0" });
  });

  test("ADMIN creates room", async () => {
    const admin = await createUser("admin@example.com", "ADMIN");
    const [building] = await db("buildings").insert({ name: "Budynek A", address: "ul. Testowa 1" }).returning("id");

    const res = await request(app)
      .post("/api/rooms")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ buildingId: building.id, name: "101", capacity: 10 });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ name: "101", capacity: 10 });
  });
});
