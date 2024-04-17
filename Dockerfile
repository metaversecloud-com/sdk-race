FROM --platform=linux/arm64 node:20.10-alpine3.19
WORKDIR /app
ARG REF
ADD build ./build
ADD server ./server
ADD client ./client
ADD package* ./
ADD node_modules ./node_modules
echo REF=$REF >> ref.txt
EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]
