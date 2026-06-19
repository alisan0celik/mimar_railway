import fs from "fs";
import path from "path";

const ROOT = path.join(process.cwd(), "src");

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

function fix(file) {
  let content = fs.readFileSync(file, "utf8");
  if (!content.includes("colors.")) return false;

  const themePath = themeImportPath(file);

  if (!content.includes("useThemeColors")) {
    const hookImport = `import { useThemeColors } from "${themePath}/ThemeProvider";\n`;
    const themedImport = content.match(/import \{ useThemedStyles[^}]+\} from ["'][^"']+["'];\n/);
    if (themedImport) {
      content = content.replace(themedImport[0], themedImport[0] + hookImport);
    } else {
      content = hookImport + content;
    }
  }

  // Module-level maps using colors -> function
  content = content.replace(
    /^const (\w+)(?::[^=]+)? = \{[\s\S]*?colors\.[\s\S]*?\};\n\n/m,
    (block, name) => {
      if (block.includes("function get")) return block;
      const fn = block
        .replace(/^const (\w+)/, "function get$1(colors: AppColors)")
        .replace(/= \{/, "{ return {")
        .replace(/};\n\n$/, " }; }\n\n");
      if (!content.includes("type AppColors") && !fn.includes("AppColors")) {
        return block;
      }
      return fn;
    },
  );

  // Rename getTYPEMap usages - too risky, skip module level fix manually for key files

  const fnRegex = /export function (\w+)\([^)]*\)\s*\{/g;
  let match;
  let changed = false;
  const inserts = [];

  while ((match = fnRegex.exec(content)) !== null) {
    const fnStart = match.index + match[0].length;
    const fnName = match[1];
    const nextFn = content.indexOf("export function", fnStart + 1);
    const nextCreate = content.indexOf("function createStyles", fnStart + 1);
    const end = [nextFn, nextCreate].filter((i) => i > 0).sort((a, b) => a - b)[0] ?? content.length;
    const body = content.slice(fnStart, end);

    if (!body.includes("colors.")) continue;
    if (body.includes("useThemeColors()")) continue;

    const stylesIdx = body.indexOf("const styles = useThemedStyles");
    const insertAt = stylesIdx >= 0 ? fnStart + stylesIdx + body.slice(stylesIdx).indexOf(";") + 1 : fnStart;

    inserts.push({
      at: insertAt,
      line: "\n  const colors = useThemeColors();",
    });
    changed = true;
  }

  inserts.sort((a, b) => b.at - a.at);
  for (const ins of inserts) {
    content = content.slice(0, ins.at) + ins.line + content.slice(ins.at);
  }

  // Fix references like variantStyles[variant] -> getVariantStyles(colors)[variant]
  // Manual for DesignStatusBadge etc.

  if (changed || content.includes("useThemeColors")) {
    fs.writeFileSync(file, content);
    return true;
  }
  return false;
}

let n = 0;
for (const file of walk(ROOT)) {
  if (fix(file)) {
    n++;
    console.log("fixed:", path.relative(process.cwd(), file));
  }
}
console.log(`Fixed ${n} files.`);
