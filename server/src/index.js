require('dotenv').config();
const http = require('http');
const os = require('os');
const app = require('./app');
const connectDB = require('./config/db');
const { startScheduledReminders } = require('./services/schedulerService');

const PORT = process.env.PORT || 5000;

// Get all network IP addresses
const getNetworkIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push({
          interface: name,
          address: iface.address,
        });
      }
    }
  }
  
  return ips;
};

const startServer = async () => {
  await connectDB();

  // Start scheduled payment reminders
  startScheduledReminders();

  const server = http.createServer(app);

  // Listen on all network interfaces (0.0.0.0) to allow connections from other devices
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`🌐 Server is listening on ALL network interfaces (0.0.0.0:${PORT})`);
    
    const networkIPs = getNetworkIPs();
    if (networkIPs.length > 0) {
      console.log(`\n📡 Your computer's IP addresses:`);
      networkIPs.forEach(({ interface: name, address }) => {
        console.log(`   ${name}: http://${address}:${PORT}`);
      });
      console.log(`\n💡 Use one of these IPs to connect from your phone`);
      console.log(`💡 Make sure Windows Firewall allows connections on port ${PORT}\n`);
    } else {
      console.log(`⚠️  Could not detect network IP addresses`);
      console.log(`💡 Run 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) to find your IP\n`);
    }
  });
};

startServer();



