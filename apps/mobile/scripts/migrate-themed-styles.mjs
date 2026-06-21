import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src");
const SKIP = new Set([
  path.join(ROOT, "shared", "theme", "useThemedStyles.ts"),
  path.join(ROOT, "shared", "theme", "ThemeProvider.tsx"),
  path.join(ROOT, "shared", "ui", "Screen.tsx"),
  path.join(ROOT, "features", "settings", "screens", "ThemeScreen.tsx"),
]);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith(".tsx")) files.push(full);
  }
  return files;
}

function themeImportPath(file) {
  let rel = path.relative(path.dirname(file), path.join(ROOT, "shared", "theme"));
  rel = rel.split(path.sep).join("/");
  if (!rel.startsWith(".")) rel = `./${rel}`;
  return rel;
}

function migrate(file) {
  if (SKIP.has(file)) return false;
  let content = fs.readFileSync(file, "utf8");
  if (content.includes("useThemedStyles")) return false;
  if (!content.includes("StyleSheet.create")) return false;
  if (!/\bcolors\b/.test(content)) return false;
  if (!/from\s+["'][^"']*theme["']/.test(content)) return false;

  const themePath = themeImportPath(file);

  content = content.replace(
    /import\s*\{([^}]+)\}\s*from\s*["']([^"']*theme)["']\s*;/g,
    (match, imports) => {
      if (!imports.includes("colors")) return match;
      const parts = imports
        .split(",")
        .map((s) => s.trim())
        .filter((p) => p && p !== "colors");
      const themeImport = parts.length
        ? `import { ${parts.join(", ")} } from "${themePath}";\n`
        : "";
      return `${themeImport}import { useThemedStyles, type AppColors } from "${themePath}";`;
    },
  );

  content = content.replace(
    /const\s+styles\s*=\s*StyleSheet\.create\(\{/,
    "function createStyles(colors: AppColors) {\n  return StyleSheet.create({",
  );

  const lastStyleSheetEnd = content.lastIndexOf("});");
  if (lastStyleSheetEnd === -1) return false;

  content =
    content.slice(0, lastStyleSheetEnd + 3) +
    "\n}" +
    content.slice(lastStyleSheetEnd + 3);

  const fnMatch = content.match(
    /export\s+function\s+(\w+)\s*\([^)]*\)\s*\{/,
  );
  if (!fnMatch) return false;

  const fnName = fnMatch[1];
  const fnStart = fnMatch.index + fnMatch[0].length;
  content =
    content.slice(0, fnStart) +
    "\n  const styles = useThemedStyles(createStyles);" +
    content.slice(fnStart);

  fs.writeFileSync(file, content);
  return true;
}

const files = walk(ROOT);
let count = 0;
for (const file of files) {
  if (migrate(file)) {
    count += 1;
    console.log("migrated:", path.relative(process.cwd(), file));
  }
}
console.log(`Done. ${count} files migrated.`);
