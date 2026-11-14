const bcrypt = require("bcryptjs");
const request = require("supertest");
const db = require("../../src/db");
const { createApp } = require("../../src/app");
const { createRepositories } = require("../../src/repositories");
const { createEventBus } = require("../../src/events/eventBus");

const PASSWORD = "test-password-123";

const eventBus = createEventBus();
const app = createApp({ ...createRepositories(db), eventBus });

async function migrate() {
  await db.migrate.latest();
}

async function resetDb() {
  await db.raw("TRUNCATE reservations, rooms, buildings, users RESTART IDENTITY CASCADE");
}

async function closeDb() {
  await db.destroy();
}

async function createUser(email, role = "USER") {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);
  const [user] = await db("users").insert({ email, password_hash: passwordHash, role }).returning(["id", "email", "role"]);

  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });

  return { ...user, token: res.body.accessToken };
}

async function createRoom(capacity = 10) {
  const [building] = await db("buildings").insert({ name: "Budynek A", address: "ul. Testowa 1" }).returning("id");
  const [room] = await db("rooms").insert({ building_id: building.id, name: "101", capacity }).returning("id");
  return room.id;
}

async function createReservation(roomId, userId, startTime, endTime) {
  const [row] = await db("reservations")
    .insert({ room_id: roomId, user_id: userId, participants: 5, start_time: startTime, end_time: endTime, status: "CONFIRMED" })
    .returning("id");
  return row.id;
}

module.exports = { app, db, migrate, resetDb, closeDb, createUser, createRoom, createReservation };
