import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

import { CompanyScopeService } from "../../common/tenant/company-scope.service";
import { FieldReportsController } from "./field-reports.controller";
import { FieldReportsService } from "./field-reports.service";

/**
 * Uygulamanın sunucuyla sözleşmesi gerçek HTTP istekleriyle sınanıyor:
 * çok parçalı fotoğraf yükleme, alan doğrulaması ve fotoğrafın başlıklarıyla
 * akıtılması. Kimlik doğrulama burada yok; istek kullanıcısı elle konuyor.
 */
describe("FieldReportsController over HTTP", () => {
  const service = {
    list: jest.fn(),
    create: jest.fn(),
    addPhoto: jest.fn(),
    getPhoto: jest.fn(),
    remove: jest.fn(),
  };
  let app: INestApplication;
  let baseUrl: string;
  let dir: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FieldReportsController],
      providers: [
        { provide: FieldReportsService, useValue: service },
        { provide: CompanyScopeService, useValue: { requireCompanyId: (id: string) => id } },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = { sub: "u1", companyId: "c1" };
      next();
    });
    // main.ts'deki ayarların aynısı.
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.listen(0);
    baseUrl = `${(await app.getUrl()).replace("[::1]", "127.0.0.1")}/projects/p1/field-reports`;
    dir = await mkdtemp(join(tmpdir(), "field-report-http-"));
  });

  afterAll(async () => {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  });

  beforeEach(() => jest.clearAllMocks());

  it("accepts a photo as multipart and hands its bytes to the service", async () => {
    service.addPhoto.mockResolvedValue({ id: "ph1" });
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const form = new FormData();
    form.append("clientPhotoId", "client-photo-1");
    form.append("photo", new Blob([bytes], { type: "image/jpeg" }), "photo.jpg");

    const response = await fetch(`${baseUrl}/r1/photos`, { method: "POST", body: form });

    expect(response.status).toBe(201);
    const [companyId, projectId, reportId, userId, clientPhotoId, file] = service.addPhoto.mock.calls[0];
    expect([companyId, projectId, reportId, userId, clientPhotoId]).toEqual([
      "c1",
      "p1",
      "r1",
      "u1",
      "client-photo-1",
    ]);
    expect(Buffer.from(file.buffer)).toEqual(Buffer.from(bytes));
  });

  it("rejects a photo upload without a valid client photo id", async () => {
    const form = new FormData();
    form.append("clientPhotoId", "x");
    form.append("photo", new Blob([new Uint8Array([0xff, 0xd8, 0xff])]), "photo.jpg");

    const response = await fetch(`${baseUrl}/r1/photos`, { method: "POST", body: form });

    expect(response.status).toBe(400);
    expect(service.addPhoto).not.toHaveBeenCalled();
  });

  it("creates a report from JSON", async () => {
    service.create.mockResolvedValue({ id: "r1" });

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: "client-report-1",
        note: "Kazı kontrolü",
        latitude: 38.42,
        longitude: 27.14,
        observedAt: "2026-11-25T08:30:00.000Z",
      }),
    });

    expect(response.status).toBe(201);
    expect(service.create).toHaveBeenCalledWith(
      "c1",
      "p1",
      "u1",
      expect.objectContaining({ clientId: "client-report-1", latitude: 38.42 }),
    );
  });

  it("rejects a report with an out-of-range location", async () => {
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: "client-report-1",
        note: "Kazı kontrolü",
        latitude: 123,
        observedAt: "2026-11-25T08:30:00.000Z",
      }),
    });

    expect(response.status).toBe(400);
    expect(service.create).not.toHaveBeenCalled();
  });

  it("streams a photo with private caching and no type sniffing", async () => {
    const path = join(dir, "photo.jpg");
    const bytes = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 9, 8, 7]);
    await writeFile(path, bytes);
    service.getPhoto.mockResolvedValue({ path, mimeType: "image/jpeg", size: bytes.length });

    const response = await fetch(`${baseUrl}/r1/photos/ph1`);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("private");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
  });
});
