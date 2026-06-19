import {
  membershipApprovedNotification,
  membershipRejectedNotification,
  projectTaskCreatedNotification,
  resolveNotificationLocale,
} from "./notification-templates";
import {
  MEMBERSHIP_ACTION,
  MEMBERSHIP_ROUTES,
  NOTIFICATION_TARGET,
  PROJECT_TASK_ACTION,
  projectTaskRoute,
} from "./notification-events.constants";

describe("notification-templates", () => {
  it("resolves locale", () => {
    expect(resolveNotificationLocale("en")).toBe("en");
    expect(resolveNotificationLocale("tr")).toBe("tr");
    expect(resolveNotificationLocale(null)).toBe("tr");
  });

  it("builds Turkish approved copy with company and role", () => {
    const copy = membershipApprovedNotification("tr", {
      companyName: "DeryaBalık",
      roleName: "Ofis Çalışanı",
    });
    expect(copy.title).toBe("Üyeliğiniz onaylandı");
    expect(copy.message).toContain("DeryaBalık");
    expect(copy.message).toContain("Ofis Çalışanı");
  });

  it("builds English rejected copy", () => {
    const copy = membershipRejectedNotification("en", { companyName: "Acme" });
    expect(copy.title).toBe("Membership request declined");
    expect(copy.message).toContain("Acme");
  });

  it("builds Turkish project task created copy", () => {
    const copy = projectTaskCreatedNotification("tr", {
      creatorName: "Ali",
      projectName: "Villa A",
      taskTitle: "Kontrol",
    });
    expect(copy.title).toBe("Yeni yapılacak");
    expect(copy.message).toContain("Villa A");
    expect(copy.message).toContain("Kontrol");
  });
});

describe("notification-events.constants", () => {
  it("exports membership routes and actions", () => {
    expect(NOTIFICATION_TARGET.MEMBERSHIP).toBe("membership");
    expect(MEMBERSHIP_ACTION.APPROVED).toBe("approved");
    expect(MEMBERSHIP_ACTION.REJECTED).toBe("rejected");
    expect(MEMBERSHIP_ROUTES.APPROVED).toContain("dashboard");
    expect(MEMBERSHIP_ROUTES.REJECTED).toContain("login");
  });

  it("exports project task notification constants", () => {
    expect(NOTIFICATION_TARGET.PROJECT_TASK).toBe("project_task");
    expect(PROJECT_TASK_ACTION.CREATED).toBe("created");
    expect(projectTaskRoute("proj-1")).toBe("/(main)/projects/proj-1?tab=todos");
  });
});
