// One constant drives the room list, the status modal and the Auto-Pilot room picker.
export const ROOM_COUNT = 12;
export const BASE_ROOM = "Room 04"; // the room this customer tablet is mounted in

export const ROOM = { AVAILABLE: "available", OCCUPIED: "occupied", RESERVED: "reserved" };

// Minutes each room has been occupied at baseline (rooms not listed start available)
const OCCUPIED_MINS = { 1: 14, 3: 6, 4: 1, 6: 22, 7: 9, 9: 3, 10: 17, 12: 11 };

export const initialRooms = (t) =>
  Array.from({ length: ROOM_COUNT }, (_, i) => {
    const mins = OCCUPIED_MINS[i + 1];
    return {
      name: `Room ${String(i + 1).padStart(2, "0")}`,
      status: mins != null ? ROOM.OCCUPIED : ROOM.AVAILABLE,
      since: mins != null ? t - mins * 60000 : null,
    };
  });

export const minsText = (ms) => {
  const mm = Math.floor(ms / 60000);
  return mm < 1 ? "less than 1 min" : `${mm} min${mm === 1 ? "" : "s"}`;
};
