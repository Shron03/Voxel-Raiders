import dgram from 'dgram';

export const LAN_DISCOVERY_PORT = 48888;
export const LAN_BEACON_MAGIC = 'VOXEL_RAIDERS_LAN_BEACON';

export class LanDiscoveryHost {
  constructor(port = 10000, hostName = 'Local Player', roomCode = 'VR-LAN1') {
    this.port = port;
    this.hostName = hostName;
    this.roomCode = roomCode;
    this.socket = null;
    this.interval = null;
  }

  start() {
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.socket.bind(() => {
      this.socket.setBroadcast(true);
      this.interval = setInterval(() => this.broadcast(), 1500);
    });
  }

  broadcast() {
    if (!this.socket) return;
    const message = JSON.stringify({
      magic: LAN_BEACON_MAGIC,
      hostName: this.hostName,
      roomCode: this.roomCode,
      port: this.port,
      timestamp: Date.now()
    });

    this.socket.send(message, 0, message.length, LAN_DISCOVERY_PORT, '255.255.255.255', (err) => {
      if (err) {
        // Silently ignore broadcast interface errors on isolated networks
      }
    });
  }

  stop() {
    if (this.interval) clearInterval(this.interval);
    if (this.socket) {
      try { this.socket.close(); } catch (e) {}
      this.socket = null;
    }
  }
}

export class LanDiscoveryClient {
  constructor(onServerFound) {
    this.onServerFound = onServerFound;
    this.socket = null;
  }

  start() {
    this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    this.socket.on('message', (msg, rinfo) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.magic === LAN_BEACON_MAGIC) {
          this.onServerFound({
            hostName: data.hostName,
            roomCode: data.roomCode,
            port: data.port,
            ip: rinfo.address
          });
        }
      } catch (e) {}
    });

    this.socket.bind(LAN_DISCOVERY_PORT);
  }

  stop() {
    if (this.socket) {
      try { this.socket.close(); } catch (e) {}
      this.socket = null;
    }
  }
}
