const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '..', 'pages');

const replaceInFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  let newContent = content.replace(/hover:-translate-y-1/g, 'hover:scale-[1.02]');
  newContent = newContent.replace(/group-hover:-translate-y-2 group-hover:scale-110/g, 'group-hover:scale-[1.08]');
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
};

const walkSync = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkSync(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) {
      replaceInFile(filePath);
    }
  }
};

walkSync(directoryPath);
console.log('Translations upgraded to physical scales globally.');
