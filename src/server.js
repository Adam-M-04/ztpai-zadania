const { createApp } = require("./app");
const { createRoomsRepository } = require("./modules/rooms/rooms.repository.memory");
const { createReservationsRepository } = require("./modules/reservations/reservations.repository.memory");

const PORT = 3000;

const app = createApp({
  roomsRepository: createRoomsRepository(),
  reservationsRepository: createReservationsRepository(),
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
