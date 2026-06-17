const fs = require('fs');
const path = require('path');

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

function processWebFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('animate-spin')) {
    let newContent = content.replace(/<div className="[^"]*animate-spin[^"]*"><\/div>/g, '<BubbleLoader width={24} height={24} />');
    if (newContent !== content) {
      if (!newContent.includes('BubbleLoader')) {
        const depth = filePath.split('src/')[1].split('/').length - 1;
        const prefix = depth === 0 ? './' : '../'.repeat(depth);
        newContent = `import BubbleLoader from '${prefix}components/ui/BubbleLoader';\n` + newContent;
      }
      fs.writeFileSync(filePath, newContent);
      console.log('Updated Web:', filePath);
    }
  }
}

function processMobileFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('ActivityIndicator')) {
    let newContent = content.replace(/<ActivityIndicator[^>]*\/>/g, (match) => {
      if (match.includes('large')) return '<BubbleLoader size={48} />';
      return '<BubbleLoader size={24} />';
    });
    if (newContent !== content) {
      if (!newContent.includes('BubbleLoader')) {
        const depth = filePath.split('src/')[1].split('/').length - 1;
        const prefix = depth === 0 ? './' : '../'.repeat(depth);
        newContent = `import BubbleLoader from '${prefix}components/ui/BubbleLoader';\n` + newContent;
      }
      fs.writeFileSync(filePath, newContent);
      console.log('Updated Mobile:', filePath);
    }
  }
}

walk('/home/harsh/Aqualyn/frontend/src', processWebFile);
walk('/home/harsh/Aqualyn/aqualyn-mobile/src', processMobileFile);
