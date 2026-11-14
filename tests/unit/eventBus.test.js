const { createEventBus } = require("../../src/events/eventBus");

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("eventBus", () => {
  test("delivers payload to all listeners of the event", async () => {
    const bus = createEventBus();
    const first = jest.fn();
    const second = jest.fn();
    const other = jest.fn();
    bus.subscribe("reservation.created", first);
    bus.subscribe("reservation.created", second);
    bus.subscribe("reservation.cancelled", other);

    bus.publish("reservation.created", { reservationId: 1 });
    await flush();

    expect(first).toHaveBeenCalledWith({ reservationId: 1 }, "reservation.created");
    expect(second).toHaveBeenCalledWith({ reservationId: 1 }, "reservation.created");
    expect(other).not.toHaveBeenCalled();
  });

  test("failing listener does not break publish or other listeners", async () => {
    const bus = createEventBus();
    const working = jest.fn();
    const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
    bus.subscribe("reservation.created", () => {
      throw new Error("sync error");
    });
    bus.subscribe("reservation.created", async () => {
      throw new Error("async error");
    });
    bus.subscribe("reservation.created", working);

    expect(() => bus.publish("reservation.created", { reservationId: 1 })).not.toThrow();
    await flush();

    expect(working).toHaveBeenCalledTimes(1);
    expect(errorLog).toHaveBeenCalledTimes(2);
    errorLog.mockRestore();
  });
});
