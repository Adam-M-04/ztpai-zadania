function createCancelNotificationListener({ usersRepository }) {
  return async (event) => {
    if (event.cancelledBy === event.userId) {
      return;
    }

    const [owner, cancelledBy] = await Promise.all([
      usersRepository.findById(event.userId),
      usersRepository.findById(event.cancelledBy),
    ]);

    if (!owner || !cancelledBy || cancelledBy.role !== "ADMIN") {
      return;
    }

    console.log(
      `[notification] to: ${owner.email} - your reservation #${event.reservationId} was cancelled by administrator ${cancelledBy.email}`
    );
  };
}

module.exports = { createCancelNotificationListener };
