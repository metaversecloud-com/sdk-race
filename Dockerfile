FROM --platform=linux/arm64 node:20.10-alpine3.19
WORKDIR /app
ARG REF
ARG SHA
ADD build ./build
ADD server ./server
ADD client ./client
ADD package* ./
ADD node_modules ./node_modules
RUN echo REF=$REF >> ref.txt && echo SHA=$SHA >> ref.txt
EXPOSE 3000
ENTRYPOINT [ "npm", "start" ]
