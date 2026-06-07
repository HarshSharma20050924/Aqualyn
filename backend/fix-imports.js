const fs = require('fs');
const path = require('path');

const walkSync = function(dir, filelist) {
  files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else {
      if (file.endsWith('.ts')) filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const moduleFiles = walkSync('./src/modules');

moduleFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(/from '\.\.\/config\//g, "from '../../config/");
  content = content.replace(/from '\.\.\/middleware\//g, "from '../../middleware/");
  content = content.replace(/from '\.\.\/services\//g, "from '../../services/");
  content = content.replace(/from '\.\.\/server/g, "from '../../server");
  
  content = content.replace(/from '\.\.\/controllers\/authController'/g, "from './auth.controller'");
  content = content.replace(/from '\.\.\/controllers\/userController'/g, "from './user.controller'");

  fs.writeFileSync(file, content);
});

console.log("Imports fixed.");
