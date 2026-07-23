set -e
npm install
cd client && npm run build && cd ..
cd server && mkdir -p uploads && npx prisma generate && npm run build
echo "BUILD COMPLETE"
