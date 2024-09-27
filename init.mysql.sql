SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for auth
-- ----------------------------
DROP TABLE IF EXISTS `auth`;
CREATE TABLE `auth`
(
    `id`          int(10) UNSIGNED                                             NOT NULL AUTO_INCREMENT,
    `uid`         int(10) UNSIGNED                                             NULL DEFAULT NULL,
    `token`       varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `time_create` datetime                                                     NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                     NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 33
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for cache
-- ----------------------------
DROP TABLE IF EXISTS `cache`;
CREATE TABLE `cache`
(
    `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci  NOT NULL,
    `val`  varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    PRIMARY KEY (`code`) USING HASH
) ENGINE = MEMORY
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Fixed;

-- ----------------------------
-- Table structure for favourite
-- ----------------------------
DROP TABLE IF EXISTS `favourite`;
CREATE TABLE `favourite`
(
    `id`          bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_user`     bigint(20) UNSIGNED NULL DEFAULT NULL,
    `id_group`    bigint(20)          NULL DEFAULT NULL,
    `id_node`     bigint(20) UNSIGNED NULL DEFAULT NULL,
    `status`      tinyint(1)          NULL DEFAULT NULL,
    `time_create` datetime            NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime            NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for favourite_group
-- ----------------------------
DROP TABLE IF EXISTS `favourite_group`;
CREATE TABLE `favourite_group`
(
    `id`          bigint(20) UNSIGNED                                       NOT NULL AUTO_INCREMENT,
    `id_user`     bigint(20) UNSIGNED                                       NULL DEFAULT NULL,
    `title`       text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci     NULL DEFAULT NULL,
    `status`      tinyint(1)                                                NULL DEFAULT NULL,
    `auto`        tinyint(1)                                                NULL DEFAULT NULL,
    `meta`        longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `time_create` datetime                                                  NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                  NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 2
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for file
-- ----------------------------
DROP TABLE IF EXISTS `file`;
CREATE TABLE `file`
(
    `id`          bigint(15) UNSIGNED                                          NOT NULL AUTO_INCREMENT,
    `uuid`        char(64) CHARACTER SET ascii COLLATE ascii_bin               NOT NULL,
    `suffix`      varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL     DEFAULT NULL,
    `size`        bigint(15) UNSIGNED                                          NOT NULL DEFAULT 0,
    `status`      tinyint(1) UNSIGNED                                          NOT NULL DEFAULT 1,
    `checksum`    varchar(200) CHARACTER SET ascii COLLATE ascii_bin           NULL     DEFAULT NULL,
    `time_create` datetime                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    UNIQUE INDEX `hash` (`uuid`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1583236
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for node
-- ----------------------------
DROP TABLE IF EXISTS `node`;
CREATE TABLE `node`
(
    `id`            bigint(15) UNSIGNED                                                                                                          NOT NULL AUTO_INCREMENT,
    `id_parent`     bigint(15) UNSIGNED                                                                                                          NOT NULL DEFAULT 0,
    `type`          enum ('audio','video','image','binary','text','directory','subtitle','pdf') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'directory',
    `title`         varchar(240) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci                                                                NOT NULL,
    `description`   text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci                                                                        NOT NULL DEFAULT '',
    `status`        tinyint(1)                                                                                                                   NOT NULL DEFAULT 1 COMMENT '1 normal 0 recycle -1 delete',
    `building`      tinyint(1)                                                                                                                   NOT NULL DEFAULT 1 COMMENT '0 complete 1 waiting  -1 error',
    `node_id_list`     text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci                                                                        NOT NULL DEFAULT '' COMMENT 'node tree, ex: node1,node2,node3 ',
    `list_tag_id`   text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci                                                                        NOT NULL DEFAULT '' COMMENT 'tag ls, ex: tag1,tag2,tag3',
    `index_file_id` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin                                                                           NOT NULL CHECK (json_valid(`index_file_id`)) COMMENT '{origin:file1,raw:file2,preview:file3}',
    `index_node`    longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin                                                                           NOT NULL CHECK (json_valid(`index_node`)) COMMENT '{title:\"\",description:\"\",tag:[\"\",\"\",],}',
    `time_create`   datetime                                                                                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update`   datetime                                                                                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`, `id_parent`) USING BTREE,
    INDEX `id_parent` (`id_parent`, `status`, `time_update`) USING BTREE,
    FULLTEXT INDEX `index` (`index_node`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 1240609
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci COMMENT = '基本文件表'
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for queue
-- ----------------------------
DROP TABLE IF EXISTS `queue`;
CREATE TABLE `queue`
(
    `id`          bigint(15) UNSIGNED                                          NOT NULL AUTO_INCREMENT,
    `type`        varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `payload`     text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci        NULL DEFAULT NULL,
    `status`      tinyint(1)                                                   NULL DEFAULT 1 COMMENT '-2 unknown -1 failed 0 success 1 new',
    `result`      text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci        NULL DEFAULT NULL,
    `time_create` datetime                                                     NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                     NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `status` (`status`, `id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 3445153
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for rate
-- ----------------------------
DROP TABLE IF EXISTS `rate`;
CREATE TABLE `rate`
(
    `id`          bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    `id_user`     bigint(20) UNSIGNED NULL DEFAULT NULL,
    `id_node`     bigint(20) UNSIGNED NULL DEFAULT NULL,
    `rate`        tinyint(2) UNSIGNED NULL DEFAULT NULL,
    `time_create` datetime            NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime            NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `node` (`id_user`, `id_node`) USING BTREE,
    INDEX `rate` (`id_user`, `rate`, `id_node`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 1
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for settings
-- ----------------------------
DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings`
(
    `id`          int(10) UNSIGNED                                              NOT NULL AUTO_INCREMENT,
    `name`        varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
    `value`       text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci         NULL DEFAULT NULL,
    `status`      tinyint(1)                                                    NULL DEFAULT NULL,
    `time_create` datetime                                                      NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                      NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 11
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for tag
-- ----------------------------
DROP TABLE IF EXISTS `tag`;
CREATE TABLE `tag`
(
    `id`          bigint(15) UNSIGNED                                           NOT NULL AUTO_INCREMENT,
    `id_group`    bigint(15) UNSIGNED                                           NOT NULL,
    `title`       varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `alt`         varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `description` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `index_tag`   text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci         NOT NULL DEFAULT '',
    `status`      tinyint(1) UNSIGNED                                           NOT NULL DEFAULT 1,
    `time_create` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `id_group` (`id_group`, `status`) USING BTREE,
    FULLTEXT INDEX `index` (`index_tag`)
) ENGINE = InnoDB
  AUTO_INCREMENT = 24509
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for tag_group
-- ----------------------------
DROP TABLE IF EXISTS `tag_group`;
CREATE TABLE `tag_group`
(
    `id`          bigint(15) UNSIGNED                                           NOT NULL AUTO_INCREMENT,
    `title`       varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci  NOT NULL,
    `description` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
    `sort`        bigint(15)                                                    NOT NULL DEFAULT 0,
    `status`      tinyint(1) UNSIGNED                                           NOT NULL DEFAULT 1,
    `id_node`     bigint(15) UNSIGNED                                           NOT NULL DEFAULT 0,
    `time_create` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `id_node` (`status`, `sort`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 13
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Compact;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user`
(
    `id`          int(10) UNSIGNED                                             NOT NULL AUTO_INCREMENT,
    `id_group`    int(10) UNSIGNED                                             NOT NULL,
    `name`        varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `mail`        varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
    `password`    varchar(32) CHARACTER SET latin1 COLLATE latin1_bin          NOT NULL,
    `status`      tinyint(1) UNSIGNED                                          NOT NULL,
    `time_create` datetime                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                     NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 4
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for user_group
-- ----------------------------
DROP TABLE IF EXISTS `user_group`;
CREATE TABLE `user_group`
(
    `id`          int(10) UNSIGNED                                              NOT NULL AUTO_INCREMENT,
    `title`       varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci  NOT NULL,
    `description` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '',
    `admin`       tinyint(1) UNSIGNED                                           NOT NULL DEFAULT 0,
    `status`      tinyint(1) UNSIGNED                                           NOT NULL,
    `auth`        text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci         NULL     DEFAULT NULL,
    `time_create` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP(),
    `time_update` datetime                                                      NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB
  AUTO_INCREMENT = 4
  CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_general_ci
  ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
