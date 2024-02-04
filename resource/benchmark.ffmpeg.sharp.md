```javascript
async function run() {
  const sharp = require('sharp');
  const util  = require('util');
  const exec  = util.promisify(require('child_process').exec);

  const fPathLs    = [
    __dirname + '/img/500K.jpg',
    __dirname + '/img/1M.jpg',
    __dirname + '/img/2M.png',
    __dirname + '/img/8M.png',
    __dirname + '/img/13M.png',
    __dirname + '/img/26M.png',
  ];
  const round      = 100;
  const qualityLs  = [
    65, 75, 80
  ];
  const targetPath = __dirname + '/output.webp';

  for (let i1 = 0; i1 < fPathLs.length; i1++) {
    const tFPath = fPathLs[i1];
    for (let i2 = 0; i2 < qualityLs.length; i2++) {
      //
      console.info('exec:', tFPath, ':', qualityLs[i2], ':rounds:', round);
      const fr1 = new Date();
      for (let i3 = 0; i3 < round; i3++) {
        await sharp(tFPath).webp(
          {
            quality: qualityLs[i2]
          }).toFile(targetPath);
      }
      const fr2 = new Date();
      console.info('sharp:', fr2.valueOf() - fr1.valueOf());
      const ffStr = `ffmpeg -hide_banner -v quiet -y -i ${tFPath} -ss 0 -vframes 1 -c:v webp -quality ${qualityLs[i2]} ${targetPath}`;
      const fr3   = new Date();
      for (let i3 = 0; i3 < round; i3++) {
        const {stdout, stderr} = await exec(ffStr);
      }
      const fr4 = new Date();
      //
      console.info('ffmpeg:', fr4.valueOf() - fr3.valueOf());
    }
  }
}

run();
```

res:
Ubuntu 22.04.2 LTS on Windows 10 x86_64
5.15.90.1-microsoft-standard-WSL2
12th Gen Intel i7-12700H

| file     | quality | round | time:sharp | time:ffmpeg | r    | time:ffmpeg hwAccel |
|----------|---------|-------|------------|-------------|------|---------------------|
| 500K.jpg | 65      | 100   | 6276       | 9586        | 153% |                     |
| 500K.jpg | 75      | 100   | 6456       | 9586        | 148% |                     |
| 500K.jpg | 80      | 100   | 6452       | 9904        | 154% |                     |
| 1M.jpg   | 65      | 100   | 13278      | 16896       | 127% |                     |
| 1M.jpg   | 75      | 100   | 12857      | 17145       | 133% |                     |
| 1M.jpg   | 80      | 100   | 13711      | 18575       | 135% |                     |
| 2M.png   | 65      | 100   | 16915      | 24096       | 142% |                     |
| 2M.png   | 65      | 500   | 82364      | 120392      | 146% | 119925              |
| 2M.png   | 75      | 100   | 17059      | 24840       | 146% |                     |
| 2M.png   | 80      | 100   | 18689      | 25442       | 136% |                     |
| 8M.png   | 65      | 100   | 54746      | 87465       | 160% |                     |
| 8M.png   | 75      | 100   | 60797      | 78944       | 130% |                     |
| 8M.png   | 80      | 100   | 66244      | 82164       | 124% |                     |
| 13M.png  | 65      | 100   | 67579      | 83057       | 123% |                     |
| 13M.png  | 75      | 100   | 67894      | 86246       | 127% |                     |
| 13M.png  | 80      | 100   | 71193      | 89636       | 126% |                     |
| 26M.png  | 65      | 100   | 140175     | 166703      | 119% |                     |
| 26M.png  | 75      | 100   | 144065     | 177800      | 123% |                     |
| 26M.png  | 80      | 100   | 154778     | 182866      | 118% |                     |























