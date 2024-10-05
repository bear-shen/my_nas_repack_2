# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

#ffmpeg 6.0才有av1_nvenc的编码
#因此至少需要ubuntu(nobel/24.04LTS)
FROM node:22-bookworm

# Use production node environment by default.
ENV NODE_ENV production
ENV SRC=/app


WORKDIR ${SRC}

# Copy the rest of the source files into the image.
COPY . .

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.npm to speed up subsequent builds.
# Leverage a bind mounts to package.json and package-lock.json to avoid having to copy them into
# into this layer.
RUN /app/docker/server_init.sh

# Run the application as a non-root user.
USER node

# Expose the port that the application listens on.
EXPOSE 8090

#ENTRYPOINT /app/docker/server_start.sh
