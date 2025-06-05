# Build stage
FROM node:20-alpine as builder

# Set build arguments for environment variables
ARG VITE_INFLUXDB_URL
ARG VITE_INFLUXDB_TOKEN

# Set environment variables for the build
ENV VITE_INFLUXDB_URL=${VITE_INFLUXDB_URL}
ENV VITE_INFLUXDB_TOKEN=${VITE_INFLUXDB_TOKEN}

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]