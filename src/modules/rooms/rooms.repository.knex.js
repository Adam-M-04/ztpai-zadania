function toRoom(row) {
  return {
    id: row.id,
    buildingId: row.building_id,
    name: row.name,
    capacity: row.capacity,
    createdAt: row.created_at,
    building: { id: row.building_id, name: row.building_name },
  };
}

function selectRooms(db) {
  return db("rooms as r")
    .join("buildings as b", "b.id", "r.building_id")
    .select("r.*", "b.name as building_name");
}

function createRoomsRepository(db) {
  async function findById(id) {
    const row = await selectRooms(db).where("r.id", id).first();
    return row ? toRoom(row) : null;
  }

  return {
    async findAll() {
      const rows = await selectRooms(db).orderBy("r.id");
      return rows.map(toRoom);
    },

    findById,

    async findByBuildingId(buildingId) {
      const rows = await selectRooms(db).where("r.building_id", buildingId).orderBy("r.id");
      return rows.map(toRoom);
    },

    async create(data) {
      const [row] = await db("rooms")
        .insert({ building_id: data.buildingId, name: data.name, capacity: data.capacity })
        .returning("id");
      return findById(row.id);
    },
  };
}

module.exports = { createRoomsRepository };
