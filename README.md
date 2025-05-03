# my_nas_repack_2

a simple net disk frontend for nas

support tagging, favourite, and user group

-- --
nodejs

postgresql with [pgroonga engine](https://pgroonga.github.io/), nginx, ffmpeg required

nginx modules required:
  - http_auth_request
  - http_proxy

php optional

onlyoffice support (optional)
  - work with config.toml
  - in docker, use
    - `-e onlyoffice_enabled=false`
    - `-e onlyoffice_jwt_secret=[onlyoffice_jwt_secret]`
    - `-e onlyoffice_origin=[onlyoffice_host ex:http://172.16.1.240:8001]`
      - (from onlyoffice server/docker)
    - `-e pg_host=[postgres_host ex:127.0.0.1]`
    - `-e pg_port=[postgres_port ex:5432]`
    - `-e pg_account=[postgres_account]`
    - `-e pg_password=[postgres_password]`
    - `-e pg_database=[database_name]`
  - for self-signed https fe
    - mod `container:/etc/onlyoffice/documentserver/default.json`
      - set `services.CoAuthoring.requestDefaults.rejectUnauthorized=true`

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
- `ctrl + x` cut
- `ctrl + c` copy
- `ctrl + v` paste

## directory list :
- `ctrl + U` upload
- `ctrl + M` mkdir

## popup window :
- `Escape` close
- ### browser :
  - `left` `a` go prev 
  - `right` `d` go next
  - `pageup` go prev
  - `pagedown` go next
  - `[` `w` prev directory
  - `]` `s` next directory
- ### audio/video browser :
  - `left` - 5s
  - `right` + 5s
  - `up` volume + 5
  - `down` volume - 5
  - `space` pause/play
- ### image browser :
  - `q` rotate left 
  - `e` rotate right 
