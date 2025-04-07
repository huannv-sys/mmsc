#!/bin/bash

# Tạo thư mục cho repository nếu nó chưa tồn tại
mkdir -p ato

# Clone repository ATO từ GitHub
if [ ! -d "ato/.git" ]; then
  echo "Cloning repository from GitHub..."
  git clone https://github.com/huannv-sys/ato.git ato_temp
  # Copy nội dung sang thư mục ato
  cp -a ato_temp/. ato/
  rm -rf ato_temp
else
  echo "Repository đã được clone trước đó. Bỏ qua bước clone."
fi

# Di chuyển vào thư mục dự án
cd ato

# Cài đặt dependencies với npm
echo "Cài đặt các dependencies..."
npm install --legacy-peer-deps

# Tạo file .env nếu nó chưa tồn tại
if [ ! -f ".env" ]; then
  echo "Tạo file .env..."
  echo "DATABASE_URL=\"$DATABASE_URL\"" > .env
  echo "PORT=5000" >> .env
  echo "HOST=0.0.0.0" >> .env
else
  echo "File .env đã tồn tại. Bỏ qua bước tạo file."
fi

# Đẩy schema Drizzle vào database
echo "Đẩy schema Drizzle vào database..."
npm run db:push

echo "Quá trình thiết lập hoàn tất. Bạn có thể chạy máy chủ với lệnh: cd ato && npm run dev"