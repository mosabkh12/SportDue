import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const STORAGE_KEY = 'sportdue:serverIP';
const NETWORK_IPS_KEY = 'sportdue:networkIPs'; // Store IP per network
const DEFAULT_PORT = 5000;
let currentIP = null;
let currentNetworkId = null;
let listeners = [];
let hasLoggedConnection = false;

// Get network identifier (SSID or type)
const getNetworkId = async () => {
  try {
    const networkState = await NetInfo.fetch();
    if (networkState.type === 'wifi' && networkState.details?.ssid) {
      return networkState.details.ssid;
    }
    // Use IP address as network identifier if SSID not available
    if (networkState.details?.ipAddress) {
      const ip = networkState.details.ipAddress;
      const parts = ip.split('.');
      if (parts.length === 4) {
        return `${parts[0]}.${parts[1]}.${parts[2]}`; // Network base as ID
      }
    }
    return networkState.type || 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

// Get device's local IP address
const getDeviceIP = async () => {
  try {
    const networkState = await NetInfo.fetch();
    
    if (networkState.type === 'wifi' && networkState.details?.ipAddress) {
      return networkState.details.ipAddress;
    }
    
    // Fallback: try to get IP from network details
    if (networkState.details?.ipAddress) {
      return networkState.details.ipAddress;
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Get network base from device IP (e.g., 192.168.68.132 -> 192.168.68)
const getNetworkBase = (deviceIP) => {
  if (!deviceIP) return null;
  const parts = deviceIP.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }
  return null;
};

// Test if an IP can reach the backend server
const testIPConnection = async (ip, silent = false, timeout = 300) => {
  try {
    const url = `http://${ip}:${DEFAULT_PORT}/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    clearTimeout(timeoutId);
    if (response.ok) {
      if (!silent) {
        console.log(`✅ [IP Detection] Connected to server at ${ip}:${DEFAULT_PORT}`);
        hasLoggedConnection = true;
      }
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

// Get IPs to test based on device's network - optimized for speed
const getIPsToTest = async () => {
  const ips = [];
  
  // Get device IP first
  const deviceIP = await getDeviceIP();
  const networkBase = getNetworkBase(deviceIP);
  
  // Add localhost for development (test first)
  if (__DEV__) {
    ips.push('localhost', '127.0.0.1');
  }
  
  // Add Android emulator IP
  if (Platform.OS === 'android') {
    ips.push('10.0.2.2');
  }
  
  // If we have device IP, test IPs in the same network range (priority)
  if (networkBase) {
    // Get device's last octet to test nearby IPs first
    const deviceParts = deviceIP.split('.');
    const deviceLastOctet = parseInt(deviceParts[3]) || 100;
    
    // Test router IP first (usually .1)
    ips.push(`${networkBase}.1`);
    
    // Test IPs close to device IP (most likely to be on same network)
    const nearbyIPs = [];
    for (let offset = 1; offset <= 10; offset++) {
      // Test IPs before and after device IP
      const before = deviceLastOctet - offset;
      const after = deviceLastOctet + offset;
      if (before > 0 && before <= 254) nearbyIPs.push(before);
      if (after > 0 && after <= 254) nearbyIPs.push(after);
    }
    // Sort by proximity to device IP
    nearbyIPs.sort((a, b) => Math.abs(a - deviceLastOctet) - Math.abs(b - deviceLastOctet));
    for (const lastOctet of nearbyIPs) {
      const ip = `${networkBase}.${lastOctet}`;
      if (ip !== deviceIP && !ips.includes(ip)) {
        ips.push(ip);
      }
    }
    
    // Then test common server IPs in the same network
    const commonLastOctets = [2, 10, 20, 50, 100, 101, 102, 200];
    for (const lastOctet of commonLastOctets) {
      const ip = `${networkBase}.${lastOctet}`;
      if (ip !== deviceIP && !ips.includes(ip)) {
        ips.push(ip);
      }
    }
  }
  
  // Add common fallback IPs (tested last, only if network base not found)
  if (!networkBase) {
    const fallbackIPs = [
      '192.168.1.100',
      '192.168.1.1',
      '192.168.0.100',
      '192.168.0.1',
    ];
    ips.push(...fallbackIPs);
  }
  
  return ips;
};

// Detect server IP - optimized for speed
const detectServerIP = async (showLogs = false) => {
  try {
    const networkState = await NetInfo.fetch();
    
    if (!networkState.isConnected) {
      if (showLogs) console.log(`⚠️ [IP Detection] Network not connected`);
      return null;
    }
    
    if (showLogs) console.log(`🔍 [IP Detection] Starting fast IP detection...`);
    const startTime = Date.now();
    
    const ipsToTest = await getIPsToTest();
    if (showLogs) console.log(`📡 [IP Detection] Testing ${ipsToTest.length} IPs (priority: ${Math.min(10, ipsToTest.length)})`);
    
    // Test first 10 IPs in parallel (most likely ones) with very fast timeout
    const priorityIPs = ipsToTest.slice(0, 10);
    const priorityResults = await Promise.allSettled(
      priorityIPs.map(ip => testIPConnection(ip, !showLogs, 250).then(works => ({ ip, works })))
    );
    
    for (const result of priorityResults) {
      if (result.status === 'fulfilled' && result.value.works) {
        const detectedIP = result.value.ip;
        const elapsed = Date.now() - startTime;
        console.log(`✅ [IP Detection] Server IP detected: ${detectedIP}:${DEFAULT_PORT} (${elapsed}ms)`);
        return detectedIP;
      }
    }
    
    // If priority IPs didn't work, test next batch in parallel
    const nextBatch = ipsToTest.slice(10, 20);
    if (nextBatch.length > 0) {
      if (showLogs) console.log(`🔍 [IP Detection] Testing next batch (${nextBatch.length} IPs)...`);
      const nextResults = await Promise.allSettled(
        nextBatch.map(ip => testIPConnection(ip, !showLogs, 300).then(works => ({ ip, works })))
      );
      
      for (const result of nextResults) {
        if (result.status === 'fulfilled' && result.value.works) {
          const detectedIP = result.value.ip;
          const elapsed = Date.now() - startTime;
          console.log(`✅ [IP Detection] Server IP detected: ${detectedIP}:${DEFAULT_PORT} (${elapsed}ms)`);
          return detectedIP;
        }
      }
    }
    
    // Last resort: test remaining IPs in parallel batches
    const remainingIPs = ipsToTest.slice(20);
    if (remainingIPs.length > 0) {
      if (showLogs) console.log(`🔍 [IP Detection] Testing remaining IPs (${remainingIPs.length})...`);
      const batchSize = 10;
      for (let i = 0; i < remainingIPs.length; i += batchSize) {
        const batch = remainingIPs.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(ip => testIPConnection(ip, !showLogs, 400).then(works => ({ ip, works })))
        );
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.works) {
            const detectedIP = result.value.ip;
            const elapsed = Date.now() - startTime;
            console.log(`✅ [IP Detection] Server IP detected: ${detectedIP}:${DEFAULT_PORT} (${elapsed}ms)`);
            return detectedIP;
          }
        }
      }
    }
    
    const elapsed = Date.now() - startTime;
    if (showLogs) console.log(`❌ [IP Detection] No server found after ${elapsed}ms`);
    return null;
  } catch (error) {
    if (showLogs) console.log(`❌ [IP Detection] Error: ${error.message}`);
    return null;
  }
};

// Get server IP (with caching per network)
export const getServerIP = async (silent = false, forceRefresh = false) => {
  try {
    const networkId = await getNetworkId();
    const networkChanged = networkId !== currentNetworkId;
    currentNetworkId = networkId;
    
    // If network changed, clear stored IP for this network
    if (networkChanged && currentIP) {
      console.log(`🔄 [IP Detection] Network changed detected! Old network: ${currentNetworkId || 'unknown'}, New network: ${networkId}`);
      hasLoggedConnection = false;
      const oldIP = currentIP;
      currentIP = null;
      // Clear stored IPs for old network
      const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
      if (networkIPsJson) {
        const networkIPs = JSON.parse(networkIPsJson);
        delete networkIPs[networkId];
        await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
      }
      console.log(`🔄 [IP Detection] Cleared old IP: ${oldIP}`);
    }
    
    // If force refresh, skip cache
    if (!forceRefresh) {
      // Try to get IP stored for this specific network
      const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
      const networkIPs = networkIPsJson ? JSON.parse(networkIPsJson) : {};
      
      if (networkIPs[networkId]) {
        const storedIP = networkIPs[networkId];
        const isWorking = await testIPConnection(storedIP, silent, 200);
        if (isWorking) {
          if (currentIP !== storedIP) {
            console.log(`✅ [IP Detection] Using cached IP for network: ${storedIP}:${DEFAULT_PORT}`);
            currentIP = storedIP;
          }
          return storedIP;
        } else {
          console.log(`⚠️ [IP Detection] Cached IP ${storedIP} is not working, detecting new IP...`);
        }
      }
      
      // Also try general stored IP
      const generalStoredIP = await AsyncStorage.getItem(STORAGE_KEY);
      if (generalStoredIP && generalStoredIP !== networkIPs[networkId]) {
        const isWorking = await testIPConnection(generalStoredIP, silent, 200);
        if (isWorking) {
          // Save it for this network
          networkIPs[networkId] = generalStoredIP;
          await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
          if (currentIP !== generalStoredIP) {
            console.log(`✅ [IP Detection] Using general cached IP: ${generalStoredIP}:${DEFAULT_PORT}`);
            currentIP = generalStoredIP;
          }
          return generalStoredIP;
        }
      }
    }
    
    // Detect new IP for this network
    console.log(`🔍 [IP Detection] Detecting new server IP for network: ${networkId}...`);
    const newIP = await detectServerIP(!silent);
    
    if (newIP) {
      // Store for this specific network
      const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
      const networkIPs = networkIPsJson ? JSON.parse(networkIPsJson) : {};
      networkIPs[networkId] = newIP;
      await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
      // Also store as general fallback
      await AsyncStorage.setItem(STORAGE_KEY, newIP);
      
      if (currentIP !== newIP) {
        const oldIP = currentIP;
        currentIP = newIP;
        console.log(`🎉 [IP Detection] NEW IP DETECTED: ${oldIP || 'none'} -> ${newIP}:${DEFAULT_PORT}`);
        notifyListeners(newIP);
      } else {
        console.log(`✅ [IP Detection] IP confirmed: ${newIP}:${DEFAULT_PORT}`);
      }
      return newIP;
    }
    
    // Fallback
    console.log(`⚠️ [IP Detection] No server found, using localhost fallback`);
    return 'localhost';
  } catch (error) {
    console.log(`❌ [IP Detection] Error getting server IP: ${error.message}`);
    return 'localhost';
  }
};

// Subscribe to network changes
export const subscribeToNetworkChanges = (callback) => {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter(listener => listener !== callback);
  };
};

// Notify listeners
const notifyListeners = (newIP) => {
  listeners.forEach(callback => {
    try {
      callback(newIP);
    } catch (error) {
      console.error('Error in network change listener:', error);
    }
  });
};

// Get current IP
export const getCurrentIP = () => currentIP;

// Start network monitoring
export const startNetworkMonitoring = async () => {
  console.log(`🚀 [IP Detection] Starting network monitoring...`);
  await getServerIP();
  
  if (Platform.OS !== 'web') {
    let lastNetworkId = null;
    let isDetecting = false;
    
    NetInfo.addEventListener(async (networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        // Prevent multiple simultaneous detections
        if (isDetecting) return;
        
        const networkId = await getNetworkId();
        
        // Network changed (different WiFi)
        if (lastNetworkId !== null && networkId !== lastNetworkId) {
          isDetecting = true;
          console.log(`\n🔄 [Network Change] WiFi network changed!`);
          console.log(`   Old network: ${lastNetworkId}`);
          console.log(`   New network: ${networkId}`);
          console.log(`   Detecting new server IP...\n`);
          hasLoggedConnection = false;
          const oldIP = currentIP;
          currentIP = null;
          currentNetworkId = null;
          
          // Clear stored IPs for old network
          const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
          if (networkIPsJson) {
            const networkIPs = JSON.parse(networkIPsJson);
            delete networkIPs[lastNetworkId];
            await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
          }
          
          // Detect new IP for new network (force refresh, show logs)
          const newIP = await getServerIP(false, true); // Show logs, force refresh
          if (newIP && newIP !== oldIP) {
            console.log(`\n🎉 [Network Change] Successfully connected to new network!`);
            console.log(`   IP changed: ${oldIP || 'none'} -> ${newIP}:${DEFAULT_PORT}\n`);
            // Notify all listeners immediately
            notifyListeners(newIP);
          }
          isDetecting = false;
        } else if (currentIP) {
          // Same network, verify IP still works (quick check)
          const stillWorks = await testIPConnection(currentIP, true, 200);
          if (!stillWorks) {
            isDetecting = true;
            console.log(`\n⚠️ [Network Change] Current IP ${currentIP} is not responding, detecting new IP...\n`);
            hasLoggedConnection = false;
            const oldIP = currentIP;
            
            // Clear stored IP for this network
            const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
            if (networkIPsJson) {
              const networkIPs = JSON.parse(networkIPsJson);
              delete networkIPs[networkId];
              await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
            }
            
            // Detect new IP (force refresh, show logs)
            const newIP = await getServerIP(false, true); // Show logs, force refresh
            if (newIP && newIP !== oldIP) {
              console.log(`\n🔄 [Network Change] Server IP changed: ${oldIP} -> ${newIP}:${DEFAULT_PORT}\n`);
              // Notify all listeners immediately
              notifyListeners(newIP);
            }
            isDetecting = false;
          }
        } else {
          // No IP, detect one
          isDetecting = true;
          const newIP = await getServerIP(false, true); // Show logs, force refresh
          if (newIP) {
            notifyListeners(newIP);
          }
          isDetecting = false;
        }
        
        lastNetworkId = networkId;
      } else if (!networkState.isConnected) {
        // Network disconnected
        console.log(`⚠️ [Network Change] Network disconnected`);
        lastNetworkId = null;
        currentNetworkId = null;
      }
    });
  }
};
