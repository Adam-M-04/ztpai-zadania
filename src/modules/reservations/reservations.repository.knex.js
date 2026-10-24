const columns = {
  roomId: "room_id",
  reservedBy: "reserved_by",
  participants: "participants",
  startTime: "start_time",
  endTime: "end_time",
  status: "status",
  createdAt: "created_at",
  cancelledAt: "cancelled_at",
};

function toReservation(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    reservedBy: row.reserved_by,
    participants: row.participants,
    startTime: row.start_time,
    endTime: row.end_time,
    status: row.status,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
  };
}

function toRow(data) {
  const row = {};
  for (const key of Object.keys(data)) {
    if (columns[key]) {
      row[columns[key]] = data[key];
    }
  }
  return row;
}

function createReservationsRepository(db) {
  return {
    async findAll(filters) {
      const query = db("reservations").orderBy("id");
      if (filters.roomId !== undefined) {
        query.where("room_id", filters.roomId);
      }
      const rows = await query;
      return rows.map(toReservation);
    },

    async findById(id) {
      const row = await db("reservations").where({ id }).first();
      return row ? toReservation(row) : null;
    },

    async findByRoomAndStatus(roomId, status) {
      const rows = await db("reservations").where({ room_id: roomId, status });
      return rows.map(toReservation);
    },

    async create(data) {
      const [row] = await db("reservations").insert(toRow(data)).returning("*");
      return toReservation(row);
    },

    async update(id, changes) {
      const [row] = await db("reservations").where({ id }).update(toRow(changes)).returning("*");
      return toReservation(row);
    },
  };
}

module.exports = { createReservationsRepository };
