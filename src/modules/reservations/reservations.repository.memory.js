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
      let result = data.reservations.map(withRoom);

      if (filters.roomId !== undefined) {
        result = result.filter((r) => r.roomId === filters.roomId);
      }
      if (filters.buildingId !== undefined) {
        result = result.filter((r) => r.room.building.id === filters.buildingId);
      }
      if (filters.status !== undefined) {
        result = result.filter((r) => r.status === filters.status);
      }
      if (filters.from !== undefined) {
        result = result.filter((r) => r.endTime > new Date(filters.from));
      }
      if (filters.to !== undefined) {
        result = result.filter((r) => r.startTime < new Date(filters.to));
      }

      const desc = filters.sort.startsWith("-");
      const field = desc ? filters.sort.slice(1) : filters.sort;

      result.sort((a, b) => {
        const diff = a[field] - b[field];
        if (diff !== 0) {
          return desc ? -diff : diff;
        }
        return a.id - b.id;
      });

      const start = (filters.page - 1) * filters.limit;
      return { data: result.slice(start, start + filters.limit), total: result.length };
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
