function createReservationsRepository(data) {
  let nextId = Math.max(0, ...data.reservations.map((r) => r.id)) + 1;

  function withRoom(reservation) {
    const room = data.rooms.find((r) => r.id === reservation.roomId);
    const building = data.buildings.find((b) => b.id === room.buildingId);
    return {
      ...reservation,
      room: { id: room.id, name: room.name, building: { id: building.id, name: building.name } },
    };
  }

  return {
    async findAll(filters) {
      let result = data.reservations;
      if (filters.roomId !== undefined) {
        result = result.filter((r) => r.roomId === filters.roomId);
      }
      return result.map(withRoom);
    },

    async findById(id) {
      const reservation = data.reservations.find((r) => r.id === id);
      return reservation ? withRoom(reservation) : null;
    },

    async findByRoomAndStatus(roomId, status) {
      return data.reservations.filter((r) => r.roomId === roomId && r.status === status).map(withRoom);
    },

    async create(input) {
      const reservation = {
        id: nextId++,
        roomId: input.roomId,
        reservedBy: input.reservedBy,
        participants: input.participants,
        startTime: input.startTime,
        endTime: input.endTime,
        status: input.status,
        createdAt: input.createdAt,
        cancelledAt: input.cancelledAt,
      };
      data.reservations.push(reservation);
      return withRoom(reservation);
    },

    async update(id, changes) {
      const reservation = data.reservations.find((r) => r.id === id);
      Object.assign(reservation, changes);
      return withRoom(reservation);
    },
  };
}

module.exports = { createReservationsRepository };
