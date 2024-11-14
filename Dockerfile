# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/


#ffmpeg 6.0才有av1_nvenc的编码
#因此至少需要ubuntu(nobel/24.04LTS)
FROM ubuntu:noble
#FROM node:22-bookworm

#因为json和搜索的一些问题，切去pg以后应该没法回到mysql了
#先扔着吧
ENV NAS_DRIVER=postgresql
ENV NAS_PORT=5432
ENV NAS_DB=toshokan
ENV NAS_USER=postgres
ENV NAS_PASSWORD=1

# Use production node environment by default.
ENV NODE_ENV=production
ENV SRC=/app
#https://serverfault.com/questions/949991/how-to-install-tzdata-on-a-ubuntu-docker-image
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

WORKDIR ${SRC}

# Copy the rest of the source files into the image.
COPY . .

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN /app/docker/server_init.sh

VOLUME ["/var/lib/postgresql/16/main"]

# Expose the port that the application listens on.
EXPOSE 80
EXPOSE 5432

# Run the application as a non-root user.
USER root

ENTRYPOINT /app/docker/server_start.sh
