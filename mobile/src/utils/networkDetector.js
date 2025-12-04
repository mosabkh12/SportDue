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
const testIPConnection = async (ip, silent = false, timeout = 800) => {
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
      if (!silent && !hasLoggedConnection) {
        console.log(`✅ Connected to server at ${ip}:${DEFAULT_PORT}`);
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
const detectServerIP = async () => {
  try {
    const networkState = await NetInfo.fetch();
    
    if (!networkState.isConnected) {
      return null;
    }
    
    const ipsToTest = await getIPsToTest();
    
    // Test first 5 IPs immediately (most likely ones) with fast timeout
    const priorityIPs = ipsToTest.slice(0, 5);
    const priorityResults = await Promise.allSettled(
      priorityIPs.map(ip => testIPConnection(ip, true, 500).then(works => ({ ip, works })))
    );
    
    for (const result of priorityResults) {
      if (result.status === 'fulfilled' && result.value.works) {
        return result.value.ip;
      }
    }
    
    // If priority IPs didn't work, test next batch with slightly longer timeout
    const nextBatch = ipsToTest.slice(5, 15);
    if (nextBatch.length > 0) {
      const nextResults = await Promise.allSettled(
        nextBatch.map(ip => testIPConnection(ip, true, 800).then(works => ({ ip, works })))
      );
      
      for (const result of nextResults) {
        if (result.status === 'fulfilled' && result.value.works) {
          return result.value.ip;
        }
      }
    }
    
    // Last resort: test remaining IPs in smaller batches
    const remainingIPs = ipsToTest.slice(15);
    if (remainingIPs.length > 0) {
      const batchSize = 5;
      for (let i = 0; i < remainingIPs.length; i += batchSize) {
        const batch = remainingIPs.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(ip => testIPConnection(ip, true, 1000).then(works => ({ ip, works })))
        );
        
        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.works) {
            return result.value.ip;
          }
        }
      }
    }
    
    return null;
  } catch (error) {
    return null;
  }
};

// Get server IP (with caching per network)
export const getServerIP = async (silent = false) => {
  try {
    const networkId = await getNetworkId();
    const networkChanged = networkId !== currentNetworkId;
    currentNetworkId = networkId;
    
    // If network changed, clear stored IP for this network
    if (networkChanged && currentIP) {
      hasLoggedConnection = false;
      currentIP = null;
      // Clear stored IPs for old network
      const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
      if (networkIPsJson) {
        const networkIPs = JSON.parse(networkIPsJson);
        delete networkIPs[networkId];
        await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
      }
    }
    
    // Try to get IP stored for this specific network
    const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
    const networkIPs = networkIPsJson ? JSON.parse(networkIPsJson) : {};
    
    if (networkIPs[networkId]) {
      const storedIP = networkIPs[networkId];
      const isWorking = await testIPConnection(storedIP, silent);
      if (isWorking) {
        if (currentIP !== storedIP) {
          currentIP = storedIP;
          if (!silent) {
            console.log(`✅ Connected to server: ${storedIP}:${DEFAULT_PORT}`);
          }
        }
        return storedIP;
      }
    }
    
    // Also try general stored IP
    const generalStoredIP = await AsyncStorage.getItem(STORAGE_KEY);
    if (generalStoredIP && generalStoredIP !== networkIPs[networkId]) {
      const isWorking = await testIPConnection(generalStoredIP, silent);
      if (isWorking) {
        // Save it for this network
        networkIPs[networkId] = generalStoredIP;
        await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
        if (currentIP !== generalStoredIP) {
          currentIP = generalStoredIP;
          if (!silent) {
            console.log(`✅ Connected to server: ${generalStoredIP}:${DEFAULT_PORT}`);
          }
        }
        return generalStoredIP;
      }
    }
    
    // Detect new IP for this network
    const newIP = await detectServerIP();
    
    if (newIP) {
      // Store for this specific network
      networkIPs[networkId] = newIP;
      await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
      // Also store as general fallback
      await AsyncStorage.setItem(STORAGE_KEY, newIP);
      
      if (currentIP !== newIP) {
        currentIP = newIP;
        notifyListeners(newIP);
        if (!silent) {
          console.log(`✅ Connected to server: ${newIP}:${DEFAULT_PORT}`);
        }
      }
      return newIP;
    }
    
    // Fallback
    return 'localhost';
  } catch (error) {
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
  await getServerIP();
  
  if (Platform.OS !== 'web') {
    let lastNetworkId = null;
    
    NetInfo.addEventListener(async (networkState) => {
      if (networkState.isConnected && networkState.isInternetReachable) {
        const networkId = await getNetworkId();
        
        // Network changed (different WiFi)
        if (lastNetworkId !== null && networkId !== lastNetworkId) {
          console.log(`WiFi network changed, detecting new server IP...`);
          hasLoggedConnection = false;
          currentIP = null;
          currentNetworkId = null;
          // Clear stored IPs for old network
          const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
          if (networkIPsJson) {
            const networkIPs = JSON.parse(networkIPsJson);
            delete networkIPs[lastNetworkId];
            await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
          }
          // Detect new IP for new network
          await getServerIP();
        } else if (currentIP) {
          // Same network, verify IP still works
          const stillWorks = await testIPConnection(currentIP, true);
          if (!stillWorks) {
            hasLoggedConnection = false;
            // Clear stored IP for this network
            const networkIPsJson = await AsyncStorage.getItem(NETWORK_IPS_KEY);
            if (networkIPsJson) {
              const networkIPs = JSON.parse(networkIPsJson);
              delete networkIPs[networkId];
              await AsyncStorage.setItem(NETWORK_IPS_KEY, JSON.stringify(networkIPs));
            }
            await getServerIP();
          }
        } else {
          // No IP, detect one
          await getServerIP();
        }
        
        lastNetworkId = networkId;
      }
    });
  }
};
