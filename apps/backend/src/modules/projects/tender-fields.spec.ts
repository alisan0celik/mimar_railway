import { tenderData } from "./tender-fields";

describe("tenderData", () => {
  it("leaves out every field that was not sent", () => {
    // Yalnızca süre uzatımını değiştiren bir istek diğer alanlara dokunmamalı.
    expect(tenderData({ extensionDays: 30 })).toEqual({
      tenderNumber: undefined,
      contractDate: undefined,
      siteDeliveryDate: undefined,
      workDurationDays: undefined,
      extensionDays: 30,
      provisionalAcceptanceDate: undefined,
      finalAcceptanceDate: undefined,
    });
  });

  it("writes the values that were sent", () => {
    const data = tenderData({
      tenderNumber: " 2026/123456 ",
      siteDeliveryDate: "2026-03-14",
      workDurationDays: 300,
    });

    expect(data.tenderNumber).toBe("2026/123456");
    expect(data.siteDeliveryDate).toEqual(new Date("2026-03-14"));
    expect(data.workDurationDays).toBe(300);
  });

  it("clears a field sent as null or blank", () => {
    const data = tenderData({
      tenderNumber: "   ",
      contractDate: null,
      provisionalAcceptanceDate: "",
      extensionDays: null,
    });

    expect(data.tenderNumber).toBeNull();
    expect(data.contractDate).toBeNull();
    expect(data.provisionalAcceptanceDate).toBeNull();
    expect(data.extensionDays).toBeNull();
  });
});
