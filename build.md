```
npm install -g typescript
cd front
npm install
cd ../
cd server
npm install
```

windows
```powershell
 New-Item -ItemType SymbolicLink -Path D:\wwwroot\ -Name file -Target G:\file
 
```

docker build
```bash
docker init
    node
    22.9.0
    npm
    npm run dev
    8085

docker compose up --build

start.sh

docker build . -t dev:v20241005.05 -f Dockerfile
docker run -dit dev:v20241005.05 /bin/bash

docker run -dit debian:bookworm /bin/bash
docker run -dit linuxserver/ffmpeg:version-7.1-cli /bin/bash
docker run -dit ubuntu:oracular /bin/bash

docker-compose.exe up -d

@see https://github.com/cucker0/docker/blob/main/md/%E5%B0%86docker%E6%9C%AC%E5%9C%B0%E9%95%9C%E5%83%8F%E6%8E%A8%E9%80%81%E5%88%B0hub.docker.com.md
构建镜像
docker build -f DockerfilePATH -t <hub-user>/<repo-name>[:<tag>] PATH
对已经存在的镜像再加标签（取别名）
docker tag <existing-image> <hub-user>/<repo-name>[:<tag>]
提交已经存在的容器
docker commit <existing-container> <hub-user>/<repo-name>[:<tag>]

docker build -f .\Dockerfile -t 0xee/my_nas:2.0-alpha .
docker commit 0xee/my_nas 0xee/my_nas:2.0-alpha
docker push 0xee/my_nas:2.0-alpha


RUN cd $SRC &&\
     ./init.sh

# Run the application.
#CMD cd ${SRC}/front && npm run dev
#cd $SRC/front &&\
#    npm run dev &&\
#    cd $SRC/server &&\
#    npm run dev &&\
#    cd ../  &&\


tail -f /app/log/server_verbose.log /app/log/server_err.log
tail -f /var/log/nginx/localhost_error.log /var/log/nginx/localhost_access.log

ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC
RUN apt-get install -y tzdata







docker pull ubuntu:noble
docker run -dit ubuntu:noble /bin/bash
bash

env TZ=Etc/UTC
env DEBIAN_FRONTEND=noninteractive

apt update
cd /var/cache/apt/archives
apt install --download-only -y nginx-full
mkdir /opt/nginx
cp /var/cache/apt/archives/*.deb /opt/nginx
apt install -y nginx-full

apt install -y --download-only tzdata wget xz-utils xzip b3sum xxhash unzip
mkdir /opt/generic
cp /var/cache/apt/archives/*.deb /opt/generic
apt install -y tzdata wget xz-utils xzip b3sum xxhash unzip

apt install -y --download-only php-fpm php-cli php-pgsql php-gd php-curl php-mbstring php-json
mkdir /opt/php
cp /var/cache/apt/archives/*.deb /opt/php
apt install -y php-fpm php-cli php-pgsql php-gd php-curl php-mbstring php-json

apt install --download-only -y software-properties-common
mkdir /opt/software-properties-common
cp /var/cache/apt/archives/*.deb /opt/software-properties-common
apt install -y software-properties-common

add-apt-repository -y universe
add-apt-repository -y ppa:groonga/ppa
apt update

apt install --download-only -y -V postgresql-16-pgroonga
mkdir /opt/pgroonga
cp /var/cache/apt/archives/*.deb /opt/pgroonga
apt install -y -V postgresql-16-pgroonga

apt install --download-only -y ffmpeg
mkdir /opt/ffmpeg
cp /var/cache/apt/archives/*.deb /opt/ffmpeg
apt install -y ffmpeg

cd /opt
wget https://nodejs.org/dist/v20.18.1/node-v20.18.1-linux-x64.tar.xz
tar -xvf node-v20.18.1-linux-x64.tar.xz
ln -s /opt/node-v20.18.1-linux-x64/bin/node /usr/bin/node
ln -s /opt/node-v20.18.1-linux-x64/bin/npm /usr/bin/npm

apt install --download-only -y sudo
mkdir /opt/sudo
cp /var/cache/apt/archives/*.deb /opt/sudo
apt install -y sudo

sudo -u postgres -H psql --command 'CREATE DATABASE toshokan'
sudo -u postgres -H psql -d toshokan --command 'CREATE EXTENSION pgroonga'



# 基于某个基础镜像，比如Ubuntu
FROM ubuntu:latest
# 更新并安装需要的软件
RUN apt-get update && apt-get install -y nginx mysql
# 暴露端口
EXPOSE 80 3306
# 创建一个挂载目录
VOLUME /app
# 将应用程序复制到挂载目录
COPY . /app
# 配置Nginx和MySQL
# ...
# 指定容器启动时运行的命令
CMD ["nginx", "-g", "daemon off;"]

详细解释
EXPOSE 80 3306: 声明容器运行时应该监听80和3306端口。
VOLUME /app: 创建一个名为/app的挂载点。
COPY . /app: 将构建上下文中的所有文件复制到容器内的/app目录。
CMD ["nginx", "-g", "daemon off;"]: 指定容器启动时运行Nginx命令，并以非守护进程的方式运行，方便在容器内直接查看日志

# 构建镜像
docker build -t my-image .
# 运行容器，将容器的80端口映射到宿主机的80端口，并将宿主机的/data目录挂载到容器的/app目录
docker run -d -p 80:80 -v /data:/app my-image

docker build -t dev202411142236 .
docker run -dit -p 80:80 -p 5432:5433 -v /data:/app/file --name dev202411142236 /bin/bash
docker run -dit -p 88:80 -p 5434:5432 -v /data:/app/file dev202411142341

docker build -t dev202411271717 .
docker run -dit -p 88:80 -p 5434:5432 -v E:\app\file:/app/file dev202411271717
tail -f /app/log/server*


docker build -f .\Dockerfile -t 0xee/my_nas:2.0 .
docker run -dit -p 88:80 -p 5434:5432 -v /data:/app/file 0xee/my_nas:2.0
docker commit e34a43225b922e475b7d299c51b3715f937fda6dd48d7231367d5f5ec9f18b2e 0xee/my_nas:2.0
docker push 0xee/my_nas:2.0

注意事项
EXPOSE和-p的区别: EXPOSE只是声明，-p才是实际的端口映射。
VOLUME和-v的区别: VOLUME定义挂载点，-v指定实际的挂载路径。
多阶段构建: 对于大型应用，可以采用多阶段构建来减小镜像大小。
最佳实践:
使用明确的标签（tag）来标识镜像。
尽量使用较小的基础镜像。
遵循最佳实践来编写Dockerfile。
更多细节
端口映射:
可以使用多个-p参数来映射多个端口。
可以使用随机端口映射（-P）。
卷（Volume）:
卷可以是匿名卷或命名卷。
卷可以被多个容器共享。
Dockerfile指令:
除了EXPOSE和VOLUME，还有FROM、RUN、COPY、CMD等许多指令。
总结

通过在Dockerfile中使用EXPOSE和VOLUME指令，我们可以轻松地暴露容器的端口和挂载目录。在实际应用中，可以根据具体需求进行灵活配置。
