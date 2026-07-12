const fs = require('fs');
let data = fs.readFileSync('resolvers.js', 'utf8');

// Replace NOW() with CURRENT_TIMESTAMP
data = data.replace(/NOW\(\)/g, 'CURRENT_TIMESTAMP');

// Replace x.toISOString() with (x ? new Date(x).toISOString() : null)
// We match word characters and dots before .toISOString()
data = data.replace(/([\w.]+)\.toISOString\(\)/g, (match, p1) => {
  return `(${p1} ? new Date(${p1}).toISOString() : null)`;
});

fs.writeFileSync('resolvers.js', data);
console.log("Resolvers fixed!");
