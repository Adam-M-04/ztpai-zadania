const { NotFoundError } = require("../../errors/AppError");

function createBuildingsService({ buildingsRepository }) {
  async function listBuildings() {
    return buildingsRepository.findAll();
  }

  async function getBuilding(id) {
    const building = await buildingsRepository.findById(id);

    if (!building) {
      throw new NotFoundError("Building");
    }

    return building;
  }

  async function createBuilding(input) {
    return buildingsRepository.create(input);
  }

  return { listBuildings, getBuilding, createBuilding };
}

module.exports = { createBuildingsService };
