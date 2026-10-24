function createReservationsRepository() {
  const reservations = [
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
      internalNote: "seed",
    },
  ];

  let nextId = Math.max(0, ...reservations.map((r) => r.id)) + 1;

  return {
    async findAll(filters) {
      if (filters.roomId === undefined) {
        return reservations;
      }
      return reservations.filter((r) => r.roomId === filters.roomId);
    },

    async findById(id) {
      return reservations.find((r) => r.id === id) ?? null;
    },

    async findByRoomAndStatus(roomId, status) {
      return reservations.filter((r) => r.roomId === roomId && r.status === status);
    },

    async create(data) {
      const reservation = { id: nextId++, ...data };
      reservations.push(reservation);
      return reservation;
    },

    async update(id, changes) {
      const reservation = reservations.find((r) => r.id === id);
      Object.assign(reservation, changes);
      return reservation;
    },
  };
}

module.exports = { createReservationsRepository };
