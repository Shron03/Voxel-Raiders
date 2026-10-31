# DEPLOYMENT GUIDE: VOXEL RAIDERS
**Target Deployment**: Render Cloud (Web Service) + Standalone PC Binary + Android APK

---

## 1. Render Cloud Deployment

### Architecture
The project backend is designed for one-click deployment on Render's Web Service environment using Node.js.

### Build and Start Commands
- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**:
  - `PORT`: Automatically assigned by Render (default: `10000`)
  - `NODE_ENV`: `production`
  - `SAVE_HMAC_SECRET`: Cryptographic key for tamper-proof save signing
  - `CORS_ORIGIN`: `*` (or specific production domain)

### Health Checks
- **Health Check Path**: `/healthz` (Returns HTTP 200 with server status, uptime, and active room metrics).

---

## 2. PC Standalone Application (LAN & Local Saves)
- Packages the client runtime with native local network UDP broadcaster on port 48888.
- Reads and writes to `%APPDATA%/VoxelRaiders/saves/` for zero-friction local storage.

---

## 3. Android Distribution
- Packaged as a lightweight responsive PWA / Cordova / Capacitor APK with hardware-accelerated WebGL canvas, virtual dual-stick controls, and vibration feedback.
