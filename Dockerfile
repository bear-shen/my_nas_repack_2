# Filename: Dockerfile
FROM nginx:1.27-bookworm

WORKDIR /workdir
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]