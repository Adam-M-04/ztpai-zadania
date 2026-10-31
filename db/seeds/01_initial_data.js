const bcrypt = require("bcryptjs");
const config = require("../../src/config");

exports.seed = async function (knex) {
  if (!config.seed.adminPassword || !config.seed.userPassword) {
    throw new Error("SEED_ADMIN_PASSWORD and SEED_USER_PASSWORD must be set in .env");
  }

  await knex.raw("TRUNCATE reservations, rooms, buildings, users RESTART IDENTITY CASCADE");

  const adminHash = await bcrypt.hash(config.seed.adminPassword, 12);
  const userHash = await bcrypt.hash(config.seed.userPassword, 12);

  await knex("users").insert([
    { email: "admin@example.com", password_hash: adminHash, role: "ADMIN", created_at: "2026-09-01T08:00:00Z" },
    { email: "piotr.wisniewski@example.com", password_hash: userHash, role: "USER", created_at: "2026-09-10T08:00:00Z" },
    { email: "jan.kowalski@example.com", password_hash: userHash, role: "USER", created_at: "2026-09-10T08:00:00Z" },
    { email: "anna.nowak@example.com", password_hash: userHash, role: "USER", created_at: "2026-09-10T08:00:00Z" },
    { email: "tomasz.zielinski@example.com", password_hash: userHash, role: "USER", created_at: "2026-09-10T08:00:00Z" },
    { email: "katarzyna.lewandowska@example.com", password_hash: userHash, role: "USER", created_at: "2026-09-10T08:00:00Z" },
  ]);

  await knex("buildings").insert([
    { name: "Budynek A", address: "ul. Warszawska 24, Kraków", created_at: "2026-09-01T08:00:00Z" },
    { name: "Budynek B", address: "ul. Podchorążych 2, Kraków", created_at: "2026-09-01T08:00:00Z" },
    { name: "Budynek C", address: "ul. Długa 5, Kraków", created_at: "2026-09-01T08:00:00Z" },
  ]);

  await knex("rooms").insert([
    { building_id: 1, name: "101", capacity: 30, created_at: "2026-09-02T08:00:00Z" },
    { building_id: 1, name: "102", capacity: 20, created_at: "2026-09-02T08:00:00Z" },
    { building_id: 1, name: "201", capacity: 50, created_at: "2026-09-02T08:00:00Z" },
    { building_id: 2, name: "101", capacity: 12, created_at: "2026-09-02T08:00:00Z" },
    { building_id: 2, name: "202", capacity: 40, created_at: "2026-09-02T08:00:00Z" },
  ]);

  await knex("reservations").insert([
    {
      room_id: 3,
      user_id: 2,
      participants: 25,
      start_time: "2026-10-15T08:00:00Z",
      end_time: "2026-10-15T10:00:00Z",
      status: "CONFIRMED",
      created_at: "2026-10-01T12:00:00Z",
    },
    {
      room_id: 1,
      user_id: 3,
      participants: 20,
      start_time: "2026-11-10T10:00:00Z",
      end_time: "2026-11-10T12:00:00Z",
      status: "CONFIRMED",
      created_at: "2026-10-20T08:00:00Z",
    },
    {
      room_id: 1,
      user_id: 4,
      participants: 15,
      start_time: "2026-11-12T09:00:00Z",
      end_time: "2026-11-12T11:00:00Z",
      status: "CANCELLED",
      cancelled_at: "2026-10-22T10:00:00Z",
      created_at: "2026-10-21T09:00:00Z",
    },
    {
      room_id: 4,
      user_id: 5,
      participants: 10,
      start_time: "2026-11-13T12:00:00Z",
      end_time: "2026-11-13T14:00:00Z",
      status: "CONFIRMED",
      created_at: "2026-10-22T14:30:00Z",
    },
    {
      room_id: 5,
      user_id: 6,
      participants: 35,
      start_time: "2026-11-20T08:00:00Z",
      end_time: "2026-11-20T12:00:00Z",
      status: "CONFIRMED",
      created_at: "2026-10-23T11:15:00Z",
    },
  ]);
};
