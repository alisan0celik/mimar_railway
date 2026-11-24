import { BadRequestException } from "@nestjs/common";

import { locationData } from "./project-location";

describe("locationData", () => {
  it("writes a point and the cadastral details", () => {
    expect(
      locationData({
        latitude: 38.423734,
        longitude: 27.142826,
        neighbourhood: " Alsancak ",
        cadastralBlock: "1234",
        cadastralParcel: "12/3",
      }),
    ).toEqual({
      latitude: 38.423734,
      longitude: 27.142826,
      neighbourhood: "Alsancak",
      cadastralBlock: "1234",
      cadastralParcel: "12/3",
    });
  });

  it("leaves everything alone when nothing is sent", () => {
    expect(locationData({})).toEqual({
      latitude: undefined,
      longitude: undefined,
      neighbourhood: undefined,
      cadastralBlock: undefined,
      cadastralParcel: undefined,
    });
  });

  it("clears the point when both halves are sent as null", () => {
    const data = locationData({ latitude: null, longitude: null });
    expect(data.latitude).toBeNull();
    expect(data.longitude).toBeNull();
  });

  it("refuses a latitude without its longitude", () => {
    // Eski boylamla birleşip projeyi haritada başka bir yere koyardı.
    expect(() => locationData({ latitude: 38.4 })).toThrow(BadRequestException);
  });

  it("refuses clearing only one half of the point", () => {
    expect(() => locationData({ latitude: null, longitude: 27.1 })).toThrow(BadRequestException);
  });

  it("clears a cadastral field sent blank", () => {
    expect(locationData({ cadastralParcel: "  " }).cadastralParcel).toBeNull();
  });
});
