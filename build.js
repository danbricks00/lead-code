import fs from 'fs';
import path from 'path';

console.log('Build starting...');

// Create public directory
if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
  console.log('Created public directory');
}

// Copy HTML files
const htmlFiles = fs.readdirSync('.').filter(f => f.endsWith('.html'));
htmlFiles.forEach(f => {
  fs.copyFileSync(f, path.join('public', f));
  console.log(`Copied ${f}`);
});

// Copy API directory
if (fs.existsSync('api')) {
  fs.mkdirSync('public/api', { recursive: true });
  fs.readdirSync('api').forEach(f => {
    const src = path.join('api', f);
    const dest = path.join('public/api', f);
    if (fs.statSync(src).isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      fs.readdirSync(src).forEach(sf => {
        fs.copyFileSync(path.join(src, sf), path.join(dest, sf));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  });
  console.log('Copied API directory');
}

console.log('Build complete!');
