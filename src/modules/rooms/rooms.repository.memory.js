function createRoomsRepository(data) {
  let nextId = Math.max(0, ...data.rooms.map((r) => r.id)) + 1;

  function withBuilding(room) {
    const building = data.buildings.find((b) => b.id === room.buildingId);
    return { ...room, building: { id: building.id, name: building.name } };
  }

  return {
    async findAll() {
      return data.rooms.map(withBuilding);
    },

    async findById(id) {
      const room = data.rooms.find((r) => r.id === id);
      return room ? withBuilding(room) : null;
    },

    async findByIdForUpdate(id) {
      const room = data.rooms.find((r) => r.id === id);
      return room ? withBuilding(room) : null;
    },

    async findByBuildingId(buildingId) {
      return data.rooms.filter((r) => r.buildingId === buildingId).map(withBuilding);
    },

    async create(input) {
      const room = {
        id: nextId++,
        buildingId: input.buildingId,
        name: input.name,
        capacity: input.capacity,
        createdAt: new Date(),
      };
      data.rooms.push(room);
      return withBuilding(room);
    },
  };
}

module.exports = { createRoomsRepository };
