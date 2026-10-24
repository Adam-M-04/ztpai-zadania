function createMemoryDb() {
  return {
    buildings: [
      { id: 1, name: "Budynek A", address: "ul. Warszawska 24, Kraków", createdAt: new Date("2026-09-01T08:00:00.000Z") },
      { id: 2, name: "Budynek B", address: "ul. Podchorążych 2, Kraków", createdAt: new Date("2026-09-01T08:00:00.000Z") },
      { id: 3, name: "Budynek C", address: "ul. Długa 5, Kraków", createdAt: new Date("2026-09-01T08:00:00.000Z") },
    ],
    rooms: [
      { id: 1, buildingId: 1, name: "101", capacity: 30, createdAt: new Date("2026-09-02T08:00:00.000Z") },
      { id: 2, buildingId: 1, name: "102", capacity: 20, createdAt: new Date("2026-09-02T08:00:00.000Z") },
      { id: 3, buildingId: 1, name: "201", capacity: 50, createdAt: new Date("2026-09-02T08:00:00.000Z") },
      { id: 4, buildingId: 2, name: "101", capacity: 12, createdAt: new Date("2026-09-02T08:00:00.000Z") },
      { id: 5, buildingId: 2, name: "202", capacity: 40, createdAt: new Date("2026-09-02T08:00:00.000Z") },
    ],
    reservations: [
      {
        id: 1,
        roomId: 3,
        reservedBy: "Piotr Wiśniewski",
        participants: 25,
        startTime: new Date("2026-10-15T08:00:00.000Z"),
        endTime: new Date("2026-10-15T10:00:00.000Z"),
        status: "CONFIRMED",
        createdAt: new Date("2026-10-01T12:00:00.000Z"),
        cancelledAt: null,
      },
    ],
  };
}

module.exports = { createMemoryDb };
