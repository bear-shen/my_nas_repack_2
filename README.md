# my_nas_repack_2

a simple nas frontend for nas

support tagging, favourite, and sharing

-- --
nodejs

postgresql with [pgroonga engine](https://pgroonga.github.io/), nginx, ffmpeg required

nginx modules required:

- http_auth_request
- http_proxy

php optional

-- --

work with config.toml

in docker, use env:

| key                   | default          |
|-----------------------|------------------|
| onlyoffice_enabled    | false            |
| onlyoffice_jwt_secret | YOUR_JWT_SECRET  |
| onlyoffice_origin     | http://127.0.0.1 |
| pg_host               | 127.0.0.1        |
| pg_port               | 5432             |
| pg_account            |                  |
| pg_password           |                  |
| pg_database           | toshokan         |

> for self-signed https fe
>
> mod `container:/etc/onlyoffice/documentserver/default.json`
>
> set `services.CoAuthoring.requestDefaults.rejectUnauthorized=true`

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
