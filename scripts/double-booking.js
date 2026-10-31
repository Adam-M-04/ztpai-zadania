const db = require("../src/db");
const config = require("../src/config");

const URL = "http://localhost:3000/api/reservations";
const LOGIN_URL = "http://localhost:3000/api/auth/login";
const REQUESTS = 10;

const body = {
  roomId: 2,
  participants: 10,
  startTime: "2026-12-01T10:00:00.000Z",
  endTime: "2026-12-01T12:00:00.000Z",
};

async function main() {
  const loginResponse = await fetch(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "jan.kowalski@example.com", password: config.seed.userPassword }),
  });
  const { accessToken } = await loginResponse.json();

  await db.raw("DELETE FROM reservations WHERE room_id = ? AND start_time < ? AND end_time > ?", [
    body.roomId,
    body.endTime,
    body.startTime,
  ]);

  const requests = [];
  for (let i = 0; i < REQUESTS; i++) {
    requests.push(
      fetch(URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(body),
      })
    );
  }

  const responses = await Promise.all(requests);
  const counts = {};

  for (let i = 0; i < responses.length; i++) {
    const status = responses[i].status;
    counts[status] = (counts[status] || 0) + 1;
    console.log(`request ${i + 1}: ${status}`);
  }

  console.log("summary:", counts);

  const result = await db.raw(
    "SELECT count(*) AS count FROM reservations WHERE room_id = ? AND status = 'CONFIRMED' AND start_time < ? AND end_time > ?",
    [body.roomId, body.endTime, body.startTime]
  );

  console.log(`CONFIRMED reservations in DB for room ${body.roomId} (${body.startTime} - ${body.endTime}): ${result.rows[0].count}`);

  await db.destroy();
}

main();
