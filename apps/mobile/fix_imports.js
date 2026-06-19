const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      fixImports(full);
    } else if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      let original = content;
      
      // First let's reset all previously messed up relative imports that start with ../ and have /src/ to @/src/
      content = content.replace(/(?:\.\.\/)+src\//g, '@/src/');
      content = content.replace(/(?:\.\.\/)+assets\//g, '@/assets/');
      
      // Now replace @/src/ with the exact relative path
      content = content.replace(/@\/src\/(.+?)(['"`])/g, (match, p1, p2) => {
        const targetPath = path.resolve(process.cwd(), 'src', p1);
        let rel = path.relative(path.dirname(full), targetPath).replace(/\\/g, '/');
        if (!rel.startsWith('.')) rel = './' + rel;
        return rel + p2;
      });

      // Same for @/assets/
      content = content.replace(/@\/assets\/(.+?)(['"`])/g, (match, p1, p2) => {
        const targetPath = path.resolve(process.cwd(), 'assets', p1);
        let rel = path.relative(path.dirname(full), targetPath).replace(/\\/g, '/');
        if (!rel.startsWith('.')) rel = './' + rel;
        return rel + p2;
      });
      
      if (content !== original) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Fixed:', full);
      }
    }
  }
}

fixImports('app');
fixImports('src');
