/**
 * Rol adlarının ekranda görünen hali.
 *
 * Rol kayıtları şirket oluşturulurken yazıldıkları dille veritabanına
 * giriyor, dolayısıyla uygulamanın dili değiştirilse bile olduğu gibi
 * kalıyorlar; Türkçe arayüzde "Project Engineer" görünmesinin sebebi buydu.
 * Yerleşik üç rolü kodundan tanıyıp adını çeviriden okuyoruz.
 *
 * Şirketin kendi oluşturduğu roller için çeviri yok — onlarda kullanıcının
 * yazdığı ad neyse o gösterilir, çevirmeye çalışmak yanlış olur.
 */

/** Yerleşik roller `<tür>-<şirket kısaltması>` biçiminde kodlanıyor. */
const BUILT_IN_ROLE_KEYS: ReadonlyArray<{ prefix: string; key: string }> = [
  { prefix: "owner-", key: "roles.builtIn.owner" },
  { prefix: "office-manager-", key: "roles.builtIn.officeManager" },
  { prefix: "office-employee-", key: "roles.builtIn.officeEmployee" },
];

export type NamedRole = {
  name: string;
  code?: string | null;
};

type Translate = (key: string) => string;

/** Tek bir rolün görünen adı. */
export function roleLabel(role: NamedRole, t: Translate): string {
  const code = role.code ?? "";
  const builtIn = BUILT_IN_ROLE_KEYS.find((entry) => code.startsWith(entry.prefix));
  return builtIn ? t(builtIn.key) : role.name;
}

/** Bir kullanıcının rollerinin virgülle ayrılmış görünen adı. */
export function roleLabels(
  roles: readonly NamedRole[],
  t: Translate,
  emptyLabel = "—",
): string {
  if (roles.length === 0) return emptyLabel;
  return roles.map((role) => roleLabel(role, t)).join(", ");
}
