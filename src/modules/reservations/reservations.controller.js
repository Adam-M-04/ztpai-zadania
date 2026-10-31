const { toReservationResponse } = require("./reservations.mapper");

function createReservationsController(reservationsService) {
  return {
    async list(req, res) {
      const result = await reservationsService.listReservations(req.validated.query);
      res.json({ data: result.data.map(toReservationResponse), meta: result.meta });
    },

    async getById(req, res) {
      const reservation = await reservationsService.getReservation(req.validated.params.id);
      res.json(toReservationResponse(reservation));
    },

    async create(req, res) {
      const reservation = await reservationsService.createReservation(req.validated.body, req.user);
      res
        .status(201)
        .location(`/api/reservations/${reservation.id}`)
        .json(toReservationResponse(reservation));
    },

    async cancel(req, res) {
      const reservation = await reservationsService.cancelReservation(req.validated.params.id);
      res.json(toReservationResponse(reservation));
    },
  };
}

module.exports = { createReservationsController };
