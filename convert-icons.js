const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'client/static/tabbar');
const files = ['home', 'home-active', 'health', 'health-active', 'hospital', 'hospital-active', 'mine', 'mine-active'];

(async () => {
  for (const name of files) {
    const svgPath = path.join(dir, `${name}.svg`);
    const pngPath = path.join(dir, `${name}.png`);
    if (fs.existsSync(svgPath)) {
      await sharp(svgPath).resize(81, 81).png().toFile(pngPath);
      console.log(`✓ ${name}.svg → ${name}.png`);
    }
  }
  console.log('转换完成！');
})();
