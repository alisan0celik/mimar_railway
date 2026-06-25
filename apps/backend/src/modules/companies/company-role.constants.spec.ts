import {
  ALL_PERMISSIONS,
  OFFICE_EMPLOYEE_PERMISSIONS,
  OFFICE_EMPLOYEE_RESTRICTED,
  OFFICE_ROLE_CODE_PREFIX,
} from "./company-role.constants";

describe("company-role.constants", () => {
  it("defines 23 permissions for office manager", () => {
    expect(ALL_PERMISSIONS).toHaveLength(23);
    expect(ALL_PERMISSIONS).toContain("project.task.manage");
    expect(ALL_PERMISSIONS).toContain("support.manage");
  });

  it("defines 10 permissions for office employee", () => {
    expect(OFFICE_EMPLOYEE_PERMISSIONS).toHaveLength(10);
    expect(OFFICE_EMPLOYEE_PERMISSIONS).toEqual([
      "project.view",
      "project.create",
      "project.update",
      "project.task.manage",
      "project.complete",
      "project.restore",
      "notification.view",
      "completed-project.view",
      "completed-project.restore",
      "company.join",
    ]);
  });

  it("excludes restricted permissions from office employee set", () => {
    for (const restricted of OFFICE_EMPLOYEE_RESTRICTED) {
      expect(OFFICE_EMPLOYEE_PERMISSIONS).not.toContain(restricted);
    }
    expect(OFFICE_EMPLOYEE_PERMISSIONS).toContain("project.task.manage");
    expect(OFFICE_EMPLOYEE_PERMISSIONS).not.toContain("user.view");
    expect(OFFICE_EMPLOYEE_PERMISSIONS).not.toContain("role.view");
  });

  it("maps approve role types to code prefixes", () => {
    expect(OFFICE_ROLE_CODE_PREFIX["office-manager"]).toBe("office-manager-");
    expect(OFFICE_ROLE_CODE_PREFIX["office-employee"]).toBe("office-employee-");
  });
});
