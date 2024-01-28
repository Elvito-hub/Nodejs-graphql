FROM node:18-alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
# Install ffmpeg
RUN apk update && apk add ffmpeg
ENV HOSTNAME=0.0.0.0

CMD ["npm","run","start"]