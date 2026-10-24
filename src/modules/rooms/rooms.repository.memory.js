function createRoomsRepository() {
  const rooms = [
    { id: 1, buildingId: 1, name: "101", capacity: 30, createdAt: new Date("2026-09-02T08:00:00.000Z") },
    { id: 2, buildingId: 1, name: "102", capacity: 20, createdAt: new Date("2026-09-02T08:00:00.000Z") },
    { id: 3, buildingId: 1, name: "201", capacity: 50, createdAt: new Date("2026-09-02T08:00:00.000Z") },
    { id: 4, buildingId: 2, name: "101", capacity: 12, createdAt: new Date("2026-09-02T08:00:00.000Z") },
    { id: 5, buildingId: 2, name: "202", capacity: 40, createdAt: new Date("2026-09-02T08:00:00.000Z") },
  ];

  let nextId = Math.max(0, ...rooms.map((r) => r.id)) + 1;

  return {
    async findAll() {
      return rooms;
    },

    async findById(id) {
      return rooms.find((r) => r.id === id) ?? null;
    },

    async create(data) {
      const room = {
        id: nextId++,
        buildingId: data.buildingId,
        name: data.name,
        capacity: data.capacity,
        createdAt: new Date(),
      };
      rooms.push(room);
      return room;
    },
  };
}

module.exports = { createRoomsRepository };
