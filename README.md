# my_nas_repack_2

a simple net disk frontend for nas

support tagging, favourite, and user group 

-- --

protocol supported: ftp, webdav

mysql/mariadb, nginx, ffmpeg required

php optional

```bash
npm install -g pm2

git clone my_nas_repack_2

cd front
npm install
cd ../server
npm install

pm2 start
cd ../front
npm run build
npm run dev

```

-- --

![sample](/resource/readme/img.png)

# keymaps

## generic file list :
- `ctrl + mousedown` select multi file
- `shift + mousedown` select multi file
- `F2` rename
- `Delete` delete file
- `Enter` open browser
- `alt + Enter` enter dir
- `↑ ↓ ← →` nav

## directory list :
- `ctrl + U` upload
- `ctrl + M` mkdir

## popup window :
- `Escape` close
- ### browser :
  - `left` go prev 
  - `right` go next
  - `pageup` go prev
  - `pagedown` go next
  - `[` prev directory
  - `]` next directory
- ### audio/video browser :
  - `left` - 5s
  - `right` + 5s
  - `up` volume + 5
  - `down` volume - 5
  - `space` pause/play
- ### image browser :
  - `q` rotate left 
  - `e` rotate right 