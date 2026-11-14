const request = require("supertest");
const { app, migrate, resetDb, closeDb } = require("../support/testApp");

beforeAll(migrate);
beforeEach(resetDb);
afterAll(closeDb);

describe("auth", () => {
  test("register, login and GET /api/auth/me", async () => {
    const credentials = { email: "jan@example.com", password: "haslo-testowe-1" };

    const registered = await request(app).post("/api/auth/register").send(credentials);
    expect(registered.status).toBe(201);
    expect(registered.body).toMatchObject({ email: "jan@example.com", role: "USER" });
    expect(registered.body).not.toHaveProperty("passwordHash");

    const login = await request(app).post("/api/auth/login").send(credentials);
    expect(login.status).toBe(200);
    expect(login.body.tokenType).toBe("Bearer");

    const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${login.body.accessToken}`);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({ id: registered.body.id, email: "jan@example.com", role: "USER" });
  });

  test("returns 401 without token", async () => {
    const res = await request(app).get("/api/reservations");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  test("returns 401 for wrong password", async () => {
    await request(app).post("/api/auth/register").send({ email: "jan@example.com", password: "haslo-testowe-1" });

    const res = await request(app).post("/api/auth/login").send({ email: "jan@example.com", password: "zle-haslo-123" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
