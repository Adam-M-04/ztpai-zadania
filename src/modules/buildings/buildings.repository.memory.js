function createBuildingsRepository() {
  const buildings = [
    { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Kraków", createdAt: new Date("2026-09-01T08:00:00.000Z") },
    { id: 2, name: "Budynek B", address: "ul. Podchorążych 2, Kraków", createdAt: new Date("2026-09-01T08:00:00.000Z") },
  ];

  let nextId = Math.max(0, ...buildings.map((b) => b.id)) + 1;

  return {
    async findAll() {
      return buildings;
    },

    async findById(id) {
      return buildings.find((b) => b.id === id) ?? null;
    },

    async create(data) {
      const building = { id: nextId++, name: data.name, address: data.address, createdAt: new Date() };
      buildings.push(building);
      return building;
    },
  };
}

module.exports = { createBuildingsRepository };
