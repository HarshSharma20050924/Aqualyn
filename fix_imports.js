const fs = require('fs');

function walk(dir, fileCallback) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = dir + '/' + file;
    if (fs.statSync(filePath).isDirectory()) {
      walk(filePath, fileCallback);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileCallback(filePath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('<BubbleLoader') && !content.includes('import BubbleLoader from')) {
    const depth = filePath.split('src/')[1].split('/').length - 1;
    const prefix = depth === 0 ? './' : '../'.repeat(depth);
    const importStatement = `import BubbleLoader from '${prefix}components/ui/BubbleLoader';\n`;
    content = importStatement + content;
    fs.writeFileSync(filePath, content);
    console.log('Added import to:', filePath);
  }
}

walk('/home/harsh/Aqualyn/frontend/src', processFile);
walk('/home/harsh/Aqualyn/aqualyn-mobile/src', processFile);
