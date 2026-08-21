import {
  defaultTemplateFor,
  getTemplateItems,
  isWorkItemTemplate,
} from "./work-item-templates";

describe("work item templates", () => {
  it("gives an architecture office its design disciplines", () => {
    expect(getTemplateItems("architecture")).toContain("Mimari");
    expect(getTemplateItems("architecture")).toContain("Jeoloji");
  });

  it("gives a contractor site works in build order", () => {
    const items = getTemplateItems("construction");
    expect(items[0]).toBe("Kaba İnşaat");
    expect(items).toContain("İnce İşler");
    expect(items).not.toContain("Mimari");
  });

  it("returns nothing for the empty template", () => {
    expect(getTemplateItems("empty")).toEqual([]);
  });

  it("picks the construction template for contractors", () => {
    expect(defaultTemplateFor("contractor")).toBe("construction");
  });

  it("falls back to architecture for offices, mixed firms and unknown values", () => {
    expect(defaultTemplateFor("architecture")).toBe("architecture");
    expect(defaultTemplateFor("both")).toBe("architecture");
    expect(defaultTemplateFor(null)).toBe("architecture");
    expect(defaultTemplateFor("nonsense")).toBe("architecture");
  });

  it("hands back a fresh array so callers cannot mutate the template", () => {
    const items = getTemplateItems("construction");
    items.push("Ekstra");
    expect(getTemplateItems("construction")).not.toContain("Ekstra");
  });

  it("recognises valid template names", () => {
    expect(isWorkItemTemplate("construction")).toBe(true);
    expect(isWorkItemTemplate("hakedis")).toBe(false);
  });
});
