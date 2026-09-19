import "reflect-metadata";
import { PERMISSIONS_KEY } from "../../common/decorators/permissions.decorator";
import { PERMISSIONS_ANY_KEY } from "../../common/decorators/permissions-any.decorator";
import { ProjectsController } from "./projects.controller";

function getMethodPermissions(
  controller: object,
  methodName: string,
): string[] | undefined {
  const method = (controller as Record<string, unknown>)[methodName];
  return Reflect.getMetadata(PERMISSIONS_KEY, method as object);
}

function getMethodPermissionsAny(
  controller: object,
  methodName: string,
): string[] | undefined {
  const method = (controller as Record<string, unknown>)[methodName];
  return Reflect.getMetadata(PERMISSIONS_ANY_KEY, method as object);
}

describe("ProjectsController project permissions", () => {
  const controller = ProjectsController.prototype;

  it("lets anyone who can update a project edit it", () => {
    expect(getMethodPermissions(controller, "update")).toEqual(["project.update"]);
  });

  it("requires finance rights on top of project rights to delete, since finance records go too", () => {
    // Ofis çalışanında project.update var ama finance.update yok: silemez.
    expect(getMethodPermissions(controller, "remove")).toEqual([
      "project.update",
      "finance.update",
    ]);
  });
});

describe("ProjectsController task permissions", () => {
  const controller = ProjectsController.prototype;

  it("allows project viewers to create tasks while keeping update/delete managed", () => {
    expect(getMethodPermissionsAny(controller, "addTask")).toEqual([
      "project.task.manage",
      "project.update",
      "project.view",
    ]);
    expect(getMethodPermissions(controller, "updateTask")).toEqual([
      "project.task.manage",
    ]);
    expect(getMethodPermissions(controller, "removeTask")).toEqual([
      "project.task.manage",
    ]);
  });

  it("allows project viewers to add notes and keeps project.update for team mutations", () => {
    expect(getMethodPermissionsAny(controller, "addNote")).toEqual([
      "project.update",
      "project.view",
    ]);
    expect(getMethodPermissions(controller, "addTeamMember")).toEqual([
      "project.update",
    ]);
    expect(getMethodPermissions(controller, "addTeamMembers")).toEqual([
      "project.update",
    ]);
    expect(getMethodPermissions(controller, "getAvailableTeamMembers")).toEqual([
      "project.update",
    ]);
  });

  it("allows project.view for listing tasks", () => {
    expect(getMethodPermissions(controller, "getTasks")).toEqual([
      "project.view",
    ]);
  });

  it("allows project.task.manage, project.complete, or project.view for task status updates", () => {
    expect(getMethodPermissionsAny(controller, "updateTaskStatus")).toEqual([
      "project.task.manage",
      "project.complete",
      "project.view",
    ]);
  });

  it("requires project.task.manage for full task updates", () => {
    expect(getMethodPermissions(controller, "updateTask")).toEqual([
      "project.task.manage",
    ]);
    expect(getMethodPermissions(controller, "updateTaskStatus")).toBeUndefined();
  });
});
