# Server Connection Troubleshooting

## Quick Fix Steps:

### 1. **RESTART YOUR SERVER** (IMPORTANT!)
After the code change, you MUST restart the server:
```bash
# Stop the current server (Ctrl+C)
# Then restart it:
cd server
npm run dev
```

When the server starts, it will now show your computer's IP addresses like this:
```
🚀 Server running on port 5000
🌐 Server is listening on ALL network interfaces (0.0.0.0:5000)

📡 Your computer's IP addresses:
   Wi-Fi: http://192.168.68.XXX:5000
   Ethernet: http://192.168.68.XXX:5000

💡 Use one of these IPs to connect from your phone
💡 Make sure Windows Firewall allows connections on port 5000
```

### 2. **Check Windows Firewall**
Windows Firewall might be blocking port 5000. To allow it:

**Option A: PowerShell (Run as Administrator)**
```powershell
New-NetFirewallRule -DisplayName "SportDue Server Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
```

**Option B: Windows Firewall GUI**
1. Open "Windows Defender Firewall"
2. Click "Advanced settings"
3. Click "Inbound Rules" → "New Rule"
4. Select "Port" → Next
5. Select "TCP" and enter port "5000"
6. Select "Allow the connection"
7. Apply to all profiles
8. Name it "SportDue Server"

### 3. **Verify Server is Running**
Open a browser on your computer and go to:
- `http://localhost:5000/health`
- Should show: `{"status":"OK"}`

### 4. **Test from Phone**
Once you see the IP address in the server logs (e.g., `192.168.68.132`), test it from your phone's browser:
- `http://192.168.68.132:5000/health`
- Should show: `{"status":"OK"}`

If this works, the app should automatically detect it!

### 5. **Common Issues**

**"Network request failed" on all IPs:**
- Server not restarted after code change
- Windows Firewall blocking port 5000
- Server not running

**"Connection timeout":**
- Phone and computer on different WiFi networks
- Firewall blocking the connection
- Server IP changed

**"Works on Samsung but not other phones":**
- Samsung might have cached the IP
- Other phones need fresh detection
- Try clearing app data/cache on the phone

## Still Not Working?

1. Check server logs show the IP addresses
2. Verify firewall rule is active
3. Make sure phone and computer are on the SAME WiFi
4. Try manually entering the IP in the app (if there's a settings screen)

