const fs = require('fs');
const path = require('path');

const dirs = [
  path.join(process.cwd(), 'public', 'uploads'),
  path.join(process.cwd(), 'temp'),
  path.join(process.cwd(), 'public', 'subs')
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  } else {
    console.log(`Directory exists: ${dir}`);
  }
});
