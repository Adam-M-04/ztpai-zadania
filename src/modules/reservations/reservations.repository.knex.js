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
    room: {
      id: row.room_id,
      name: row.room_name,
      building: { id: row.building_id, name: row.building_name },
    },
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

function selectReservations(db) {
  return db("reservations as res")
    .join("rooms as r", "r.id", "res.room_id")
    .join("buildings as b", "b.id", "r.building_id")
    .select("res.*", "r.name as room_name", "b.id as building_id", "b.name as building_name");
}

function createReservationsRepository(db) {
  async function findById(id) {
    const row = await selectReservations(db).where("res.id", id).first();
    return row ? toReservation(row) : null;
  }

  return {
    async findAll(filters) {
      const query = selectReservations(db).orderBy("res.id");
      if (filters.roomId !== undefined) {
        query.where("res.room_id", filters.roomId);
      }
      const rows = await query;
      return rows.map(toReservation);
    },

    findById,

    async findByRoomAndStatus(roomId, status) {
      const rows = await selectReservations(db).where({ "res.room_id": roomId, "res.status": status });
      return rows.map(toReservation);
    },

    async create(data) {
      const [row] = await db("reservations").insert(toRow(data)).returning("id");
      return findById(row.id);
    },

    async update(id, changes) {
      await db("reservations").where({ id }).update(toRow(changes));
      return findById(id);
    },
  };
}

module.exports = { createReservationsRepository };
