/*
CREATE DATABASE "toshokan"
    WITH
    OWNER = "postgres"
    ENCODING = 'UTF8'
;
*/
/*
-- tran fmt
update node set node_id_list = CONCAT('[',node_id_list,']'),tag_id_list = CONCAT('[',tag_id_list,']');
update queue set result = CONCAT('"',result,'"');
*/
-- ---------------------------------------------------------------------------------------- --
-- pg似乎有对跨数据库操作的限制
-- 因此需要先建表后选择数据库，再执行
-- ---------------------------------------------------------------------------------------- --

-- @see https://pgroonga.github.io/install/windows.html
CREATE EXTENSION IF NOT EXISTS pgroonga;

-- @see https://stackoverflow.com/questions/1035980/update-timestamp-when-row-is-updated-in-postgresql
CREATE OR REPLACE FUNCTION update_time_update()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.time_update = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ---------------------------------------------------------------------------------------- --

CREATE TABLE IF NOT EXISTS "auth"
(
    "id"          bigserial NOT NULL,
    "uid"         bigint    DEFAULT NULL,
    "token"       varchar   DEFAULT NULL,
    "time_create" timestamp DEFAULT current_timestamp,
    "time_update" timestamp DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "cache"
(
    "code" varchar NOT NULL,
    "val"  text DEFAULT NULL,
    PRIMARY KEY ("code")
);

CREATE TABLE IF NOT EXISTS "favourite"
(
    "id"          bigserial NOT NULL,
    "id_user"     bigint    DEFAULT NULL,
    "id_group"    bigint    DEFAULT NULL,
    "id_node"     bigint    DEFAULT NULL,
    "status"      smallint  DEFAULT NULL,
    "time_create" timestamp DEFAULT current_timestamp,
    "time_update" timestamp DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "favourite_group"
(
    "id"          bigserial NOT NULL,
    "id_user"     bigint    DEFAULT NULL,
    "title"       text      DEFAULT NULL,
    "status"      smallint  DEFAULT NULL,
    "auto"        smallint  DEFAULT NULL,
    "meta"        jsonb     DEFAULT NULL,
    "time_create" timestamp DEFAULT current_timestamp,
    "time_update" timestamp DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

DROP TYPE IF EXISTS NodeType;
CREATE TYPE NodeType as ENUM ('audio', 'video', 'image', 'binary', 'text', 'directory', 'subtitle', 'pdf');

CREATE TABLE IF NOT EXISTS "node"
(
    "id"             bigserial NOT NULL,
    "id_parent"      bigint    NOT NULL DEFAULT 0,
    "type"           NodeType  NOT NULL DEFAULT 'directory',
    "title"          varchar   NOT NULL,
    "description"    text      NOT NULL DEFAULT '',
    -- node id tree, ex: [1,2,3,4]
    "node_id_list"   jsonb              DEFAULT '[]',
    -- 'node1/node2/node3'
    "node_path"      text      NOT NULL DEFAULT '',
    -- {origin:file1,raw:file2,preview:file3}
    "file_index"     jsonb              DEFAULT NULL,
    -- 1 normal 0 recycle -1 delete
    "status"         smallint  NOT NULL DEFAULT 1,
    "cascade_status" smallint  NOT NULL DEFAULT 1,
    -- 0 complete 1 waiting  -1 error
    "building"       smallint  NOT NULL DEFAULT 1,
    -- tag id ls, ex: 1,2,3
    "tag_id_list"    jsonb              DEFAULT NULL,
    -- {title:"",description:"",tag:["","",],}
    "node_index"     text,
    "time_create"    timestamp NOT NULL DEFAULT current_timestamp,
    "time_update"    timestamp NOT NULL DEFAULT current_timestamp,
    "rel_node_id"    bigint GENERATED ALWAYS AS (("file_index" -> 'rel')::bigint) STORED,
    PRIMARY KEY ("id")
);

CREATE INDEX if not EXISTS "node_index_node_id_list" ON "node" using GIN ("node_id_list" jsonb_path_ops);
CREATE INDEX if not EXISTS "node_index_file_index" ON "node" using GIN ("file_index" jsonb_path_ops);
CREATE INDEX if not EXISTS "node_index_tag_id_list" ON "node" using GIN ("tag_id_list" jsonb_path_ops);
-- CREATE INDEX if not EXISTS "node_index_node_index" ON "node" USING GIN (to_tsvector('english', "node_index"));
CREATE INDEX if not EXISTS "node_index_node_index_pgroonga" ON "node" USING pgroonga ("node_index");

CREATE TABLE IF NOT EXISTS "queue"
(
    "id"          bigserial NOT NULL,
    "type"        varchar   DEFAULT NULL,
    "payload"     jsonb     DEFAULT NULL,
    "status"      smallint  DEFAULT 1,
    "result"      jsonb     DEFAULT NULL,
    "time_create" timestamp DEFAULT current_timestamp,
    "time_update" timestamp DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "rate"
(
    "id"          bigserial NOT NULL,
    "id_user"     bigint    DEFAULT NULL,
    "id_node"     bigint    DEFAULT NULL,
    "rate"        smallint  DEFAULT NULL,
    "time_create" timestamp DEFAULT current_timestamp,
    "time_update" timestamp DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "settings"
(
    "id"          bigserial NOT NULL,
    "name"        varchar   DEFAULT NULL,
    "value"       jsonb     DEFAULT NULL,
    "status"      smallint  DEFAULT NULL,
    "time_create" timestamp DEFAULT current_timestamp,
    "time_update" timestamp DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tag"
(
    "id"          bigserial NOT NULL,
    "id_group"    bigint             DEFAULT NULL,
    "title"       varchar            DEFAULT NULL,
    "alt"         jsonb              DEFAULT NULL,
    "description" text               DEFAULT NULL,
    "index_tag"   jsonb              DEFAULT NULL,
    "status"      smallint           DEFAULT 1,
    "time_create" timestamp NOT NULL DEFAULT current_timestamp,
    "time_update" timestamp NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "tag_group"
(
    "id"          bigserial NOT NULL,
    "title"       varchar   NOT NULL,
    "description" varchar   NOT NULL DEFAULT '',
    "sort"        bigint    NOT NULL DEFAULT 0,
    "status"      smallint  NOT NULL DEFAULT 1,
    "id_node"     bigint    NOT NULL DEFAULT 0,
    "time_create" timestamp NOT NULL DEFAULT current_timestamp,
    "time_update" timestamp NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user"
(
    "id"          bigserial NOT NULL,
    "id_group"    bigint    NOT NULL,
    "name"        varchar   NOT NULL,
    "mail"        varchar   NOT NULL,
    "password"    varchar   NOT NULL,
    "status"      smallint  NOT NULL DEFAULT 1,
    "time_create" timestamp NOT NULL DEFAULT current_timestamp,
    "time_update" timestamp NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "user_group"
(
    "id"          bigserial NOT NULL,
    "title"       varchar   NOT NULL,
    "description" varchar   NOT NULL DEFAULT '',
    "admin"       smallint  NOT NULL DEFAULT 0,
    "status"      smallint  NOT NULL DEFAULT 1,
    "auth"        jsonb              DEFAULT NULL,
    "time_create" timestamp NOT NULL DEFAULT current_timestamp,
    "time_update" timestamp NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------------------- --

CREATE TRIGGER update_auth_time_update
    BEFORE UPDATE
    ON "auth"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_cache_time_update
    BEFORE UPDATE
    ON "cache"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_favourite_time_update
    BEFORE UPDATE
    ON "favourite"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_favourite_group_time_update
    BEFORE UPDATE
    ON "favourite_group"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_node_time_update
    BEFORE UPDATE
    ON "node"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_queue_time_update
    BEFORE UPDATE
    ON "queue"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_rate_time_update
    BEFORE UPDATE
    ON "rate"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_settings_time_update
    BEFORE UPDATE
    ON "settings"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_tag_time_update
    BEFORE UPDATE
    ON "tag"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_tag_group_time_update
    BEFORE UPDATE
    ON "tag_group"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_user_time_update
    BEFORE UPDATE
    ON "user"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();

CREATE TRIGGER update_user_group_time_update
    BEFORE UPDATE
    ON "user_group"
    FOR EACH ROW
EXECUTE PROCEDURE update_time_update();
















































