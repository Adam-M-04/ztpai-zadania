function createRoomsRepository() {
  const rooms = [
    { id: 1, name: "A101", capacity: 30 },
    { id: 2, name: "A102", capacity: 20 },
    { id: 3, name: "B201", capacity: 50 },
    { id: 4, name: "C305", capacity: 12 },
  ];

  return {
    async findAll() {
      return rooms;
    },

    async findById(id) {
      return rooms.find((r) => r.id === id) ?? null;
    },
  };
}

module.exports = { createRoomsRepository };
