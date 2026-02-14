FROM oven/bun:1.3.9

WORKDIR /app

COPY package.json ./
RUN bun install

COPY . .

ENV PORT=9000

EXPOSE 9000

CMD ["bun", "run", "start"]
