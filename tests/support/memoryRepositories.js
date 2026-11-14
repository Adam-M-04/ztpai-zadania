function copy(item) {
  return item ? { ...item } : null;
}

function createMemoryRoomsRepository(rooms = []) {
  const items = rooms.map(copy);

  async function findById(id) {
    return copy(items.find((room) => room.id === id));
  }

  return {
    findById,
    findByIdForUpdate: findById,
  };
}

function createMemoryReservationsRepository(reservations = []) {
  const items = reservations.map(copy);
  let nextId = Math.max(0, ...items.map((r) => r.id)) + 1;

  async function findById(id) {
    return copy(items.find((r) => r.id === id));
  }

  return {
    async findAll(filters) {
      const matching = items.filter((r) => filters.userId === undefined || r.userId === filters.userId);
      const offset = (filters.page - 1) * filters.limit;
      return { data: matching.slice(offset, offset + filters.limit).map(copy), total: matching.length };
    },

    findById,

    async findByRoomAndStatus(roomId, status) {
      return items.filter((r) => r.roomId === roomId && r.status === status).map(copy);
    },

    async create(data) {
      const reservation = { id: nextId++, ...data };
      items.push(reservation);
      return copy(reservation);
    },

    async update(id, changes) {
      const reservation = items.find((r) => r.id === id);
      Object.assign(reservation, changes);
      return copy(reservation);
    },
  };
}

function createMemoryTransaction(repositories) {
  return (work) => work(repositories);
}

module.exports = {
  createMemoryRoomsRepository,
  createMemoryReservationsRepository,
  createMemoryTransaction,
};
