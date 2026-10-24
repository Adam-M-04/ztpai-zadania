function createBuildingsRepository(data) {
  let nextId = Math.max(0, ...data.buildings.map((b) => b.id)) + 1;

  function withRoomsCount(building) {
    return { ...building, roomsCount: data.rooms.filter((r) => r.buildingId === building.id).length };
  }

  return {
    async findAll() {
      return data.buildings.map(withRoomsCount);
    },

    async findById(id) {
      const building = data.buildings.find((b) => b.id === id);
      return building ? withRoomsCount(building) : null;
    },

    async create(input) {
      const building = { id: nextId++, name: input.name, address: input.address, createdAt: new Date() };
      data.buildings.push(building);
      return withRoomsCount(building);
    },
  };
}

module.exports = { createBuildingsRepository };
