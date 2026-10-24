const { NotFoundError } = require("../../errors/AppError");

function createRoomsService({ roomsRepository, buildingsRepository }) {
  async function listRooms() {
    return roomsRepository.findAll();
  }

  async function getRoom(id) {
    const room = await roomsRepository.findById(id);

    if (!room) {
      throw new NotFoundError("Room");
    }

    return room;
  }

  async function createRoom(input) {
    const building = await buildingsRepository.findById(input.buildingId);

    if (!building) {
      throw new NotFoundError("Building");
    }

    return roomsRepository.create(input);
  }

  return { listRooms, getRoom, createRoom };
}

module.exports = { createRoomsService };
