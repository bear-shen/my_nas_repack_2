--
INSERT INTO `user` VALUES (1, 1, 'admin', 'admin@hentai.gov', 'c3284d0f94606de1fd2af172aba15bf3', 1, '2021-02-15 15:41:34', '2023-07-11 20:52:05');
--
INSERT INTO `user_group` VALUES (1, 'admin', 'admin group', 1, 1, '{\"allow\":[],\"deny\":[]}', '2020-11-08 03:47:11', '2024-02-20 17:03:59');
--
INSERT INTO `settings` VALUES (12, 'suffix.video', '[\"mp4\",\"avi\",\"mkv\",\"m4a\",\"3gp\",\"flv\",\"hlv\",\"rm\",\"rmvb\"]', 1, '2024-03-02 19:45:39', '2024-03-02 19:45:41');
INSERT INTO `settings` VALUES (13, 'suffix.audio', '[\"wav\",\"flac\",\"mp3\",\"aac\"]', 1, '2024-03-02 19:45:52', '2024-03-02 19:47:16');
INSERT INTO `settings` VALUES (14, 'suffix.image', '[\"jpg\",\"png\",\"jpeg\",\"tif\",\"tiff\",\"bmp\",\"gif\",\"webp\"]', 1, '2024-03-02 19:45:54', '2024-03-02 19:47:13');
INSERT INTO `settings` VALUES (15, 'suffix.text', '[\"txt\",\"html\",\"json\",\"sql\",\"csv\",\"htm\",\"conf\",\"md\",\"log\"]', 1, '2024-03-02 19:45:56', '2024-03-02 19:47:20');
INSERT INTO `settings` VALUES (16, 'suffix.subtitle', '[\"vtt\",\"ass\",\"ssa\",\"sub\",\"srt\",\"pjs\"]', 1, '2024-03-02 19:46:10', '2024-03-02 19:47:24');
INSERT INTO `settings` VALUES (17, 'suffix.pdf', '[\"pdf\"]', 1, '2024-03-02 19:46:17', '2024-03-02 19:47:25');
INSERT INTO `settings` VALUES (18, 'import_ignore', '[\"thumbs.db\",\"_MACOSX\",\"desktop.ini\"]', 1, '2024-03-02 19:59:02', '2024-03-02 19:59:02');
INSERT INTO `settings` VALUES (19, 'parser.ffProgram', '\"ffmpeg -v quiet -hide_banner\"', 1, '2024-03-02 20:05:42', '2024-03-02 20:08:55');
INSERT INTO `settings` VALUES (20, 'parser.subtitle.format', '\"vtt\"', 1, '2024-03-02 20:08:54', '2024-03-02 20:10:11');
INSERT INTO `settings` VALUES (21, 'parser.subtitle.allow_container', '[\"webvtt\"]', 1, '2024-03-02 20:08:56', '2024-03-02 20:10:11');
INSERT INTO `settings` VALUES (22, 'parser.subtitle.allow_codec', '[\"ass\", \"ssa\", \"vtt\", \"srt\", \"subrip\", \"mov_text\", \"webvtt\"]', 1, '2024-03-02 20:09:06', '2024-03-02 20:10:11');
INSERT INTO `settings` VALUES (23, 'parser.subtitle.priority_kw', '[\"cht\", \"chs\", \"chin\", \"zh-\", \"中\",\"jpn\", \"jps\", \"japan\", \"jp\", \"日\",\"us\", \"en\", \"英\"]', 1, '2024-03-02 20:09:07', '2024-03-02 20:10:11');
INSERT INTO `settings` VALUES (24, 'parser.cover.format', '\"webp\"', 1, '2024-03-02 20:09:08', '2024-03-02 20:11:27');
INSERT INTO `settings` VALUES (25, 'parser.cover.max_length', '320', 1, '2024-03-02 20:09:08', '2024-03-02 20:11:27');
INSERT INTO `settings` VALUES (26, 'parser.cover.allow_size', '131072', 1, '2024-03-02 20:09:08', '2024-03-02 20:11:27');
INSERT INTO `settings` VALUES (27, 'parser.cover.allow_container', '[\"jpg\", \"jpeg\", \"image2\", \"png\", \"gif\", \"webp\"]', 1, '2024-03-02 20:09:08', '2024-03-02 20:11:27');
INSERT INTO `settings` VALUES (28, 'parser.cover.ff_encoder', '\"-c:v webp -quality 65\"', 1, '2024-03-02 20:09:09', '2024-03-02 20:11:27');
INSERT INTO `settings` VALUES (29, 'parser.preview.format', '\"webp\"', 1, '2024-03-02 20:09:09', '2024-03-02 20:12:06');
INSERT INTO `settings` VALUES (30, 'parser.preview.max_length', '1280', 1, '2024-03-02 20:09:09', '2024-03-02 20:12:06');
INSERT INTO `settings` VALUES (31, 'parser.preview.allow_size', '65536', 1, '2024-03-02 20:09:09', '2024-03-02 20:12:06');
INSERT INTO `settings` VALUES (32, 'parser.preview.allow_container', '[\"jpg\", \"jpeg\", \"image2\", \"png\", \"gif\", \"webp\"]', 1, '2024-03-02 20:09:10', '2024-03-02 20:12:06');
INSERT INTO `settings` VALUES (33, 'parser.preview.ff_encoder', '\"-c:v webp -quality 75\"', 1, '2024-03-02 20:09:10', '2024-03-02 20:12:06');
INSERT INTO `settings` VALUES (34, 'parser.image.format', '\"webp\"', 1, '2024-03-02 20:09:10', '2024-03-03 08:28:55');
INSERT INTO `settings` VALUES (35, 'parser.image.max_length', '2560', 1, '2024-03-02 20:09:10', '2024-03-02 20:17:17');
INSERT INTO `settings` VALUES (36, 'parser.image.allow_size', '2097152', 1, '2024-03-02 20:09:10', '2024-03-02 20:17:17');
INSERT INTO `settings` VALUES (37, 'parser.image.allow_container', '[\"jpg\", \"jpeg\", \"image2\", \"png\", \"gif\", \"webp\"]', 1, '2024-03-02 20:09:11', '2024-03-02 20:17:17');
INSERT INTO `settings` VALUES (38, 'parser.image.ff_encoder', '\"-c:v webp -quality 80\"', 1, '2024-03-02 20:09:11', '2024-03-02 20:17:17');
INSERT INTO `settings` VALUES (39, 'parser.video.length', '1920', 1, '2024-03-02 20:09:11', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (40, 'parser.video.length_small', '1280', 1, '2024-03-02 20:09:11', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (41, 'parser.video.format', '\"mp4\"', 1, '2024-03-02 20:17:20', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (42, 'parser.video.allow_codec', '[\"vp8\", \"vp9\", \"h264\", \"hevc\", \"av1\", \"vp10\"]', 1, '2024-03-02 20:17:21', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (43, 'parser.video.allow_rate', '917504', 1, '2024-03-02 20:17:21', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (44, 'parser.video.allow_container', '[\"mp4\", \"ogg\", \"webm\", \"m4a\"]', 1, '2024-03-02 20:17:23', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (45, 'parser.video.ff_encoder', '\"-c:v av1_nvenc -profile:v main10 -preset slow -tune hq -qp 40 -bf 3 -pix_fmt p010le -multipass qres -rc-lookahead 32\"', 1, '2024-03-02 20:17:24', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (46, 'parser.audio.quality', '1.5', 1, '2024-03-02 20:17:24', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (47, 'parser.audio.format', '\"aac\"', 1, '2024-03-02 20:17:24', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (48, 'parser.audio.codec_lib', '\"aac\"', 1, '2024-03-02 20:17:24', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (49, 'parser.audio.allow_codec', '[\"flac\", \"mp3\", \"aac\", \"wav\", \"vorbis\", \"ogg\", \"opus\"]', 1, '2024-03-02 20:17:25', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (50, 'parser.audio.allow_container', '[\"flac\", \"mp3\", \"aac\", \"wav\", \"vorbis\", \"ogg\"]', 1, '2024-03-02 20:17:25', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (51, 'parser.audio.allow_rate', '120000', 1, '2024-03-02 20:17:25', '2024-03-03 08:28:42');
INSERT INTO `settings` VALUES (52, 'parser.audio.allow_rate', '131072', 1, '2024-03-02 20:17:25', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (53, 'parser.audio.priority_kw', '[\"jpn\", \"jps\", \"japan\", \"jp\", \"日\",\"cht\", \"chs\", \"chin\", \"zh-\", \"中\",\"us\", \"en\", \"英\"]', 1, '2024-03-02 20:17:25', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (54, 'parser.audio.ff_encoder', '\"-c:a aac -q:a 1.3\"', 1, '2024-03-02 20:17:26', '2024-03-02 20:21:07');
INSERT INTO `settings` VALUES (61, 'ftp.port', '2121', 1, '2024-03-03 08:34:42', '2024-03-03 08:34:42');
INSERT INTO `settings` VALUES (62, 'ftp.host', '\"0.0.0.0\"', 1, '2024-03-03 08:34:46', '2024-03-03 08:35:16');
INSERT INTO `settings` VALUES (63, 'ftp.pasv', '[12000,15000]', 1, '2024-03-03 08:35:05', '2024-03-03 08:35:16');
INSERT INTO `settings` VALUES (64, 'path.local', '\"/home/wwwroot/file\"', NULL, '2024-03-03 08:43:40', '2024-03-03 08:43:47');


