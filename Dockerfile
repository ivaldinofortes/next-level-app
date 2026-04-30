FROM node:20-slim

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libgtk-3-dev \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libx11-xcb-dev \
    libxcb-dri3-dev \
    libxtst-dev \
    libxss-dev \
    libasound2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
EXPOSE 3000
CMD ["bash"]