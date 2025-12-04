const axios = require('axios');

const sendPaymentReminder = async (phone, message) => {
  if (!phone) {
    throw new Error('Phone number is required to send reminders');
  }

  // Check if SMS is enabled
  const smsEnabled = process.env.SMS_ENABLED === 'true';
  
  if (!smsEnabled) {
    // Test mode - just log the message
    console.log(`📱 [TEST MODE] SMS to ${phone}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
    return {
      success: true,
      phone,
      method: 'test',
      message: 'SMS logged to console (SMS not enabled)',
    };
  }

  // Get BulkGate credentials from environment variables (support multiple naming conventions)
  const bulkgateAppId = process.env.BULKGATE_APP_ID || process.env.BULKGATE_APPLICATION_ID;
  const bulkgateToken = process.env.BULKGATE_TOKEN || 
                       process.env.BULKGATE_APP_TOKEN || 
                       process.env.BULKGATE_APPLICATION_TOKEN;
  const bulkgateSenderId = process.env.BULKGATE_SENDER_ID || process.env.SMS_SENDER_ID;

  if (!bulkgateAppId || !bulkgateToken) {
    throw new Error('BulkGate credentials not configured. Set BULKGATE_APP_ID (or BULKGATE_APPLICATION_ID) and BULKGATE_TOKEN (or BULKGATE_APP_TOKEN or BULKGATE_APPLICATION_TOKEN) in .env');
  }

  try {
    // Normalize phone number (remove spaces, dashes, parentheses, and any non-numeric characters except +)
    let phoneNumber = phone.trim().replace(/[\s\-\(\)]/g, '');

    // Validate phone number is not empty after normalization
    if (!phoneNumber || phoneNumber.length < 8) {
      throw new Error(`Invalid phone number format: ${phone}`);
    }

    // Format phone number - BulkGate expects international format with country code
    if (!phoneNumber.startsWith('+')) {
      // Detect if Israeli number (starts with 05)
      if (phoneNumber.startsWith('05') && phoneNumber.length === 10) {
        // Israeli mobile number - convert to +972
        phoneNumber = `+972${phoneNumber.substring(1)}`;
      } else if (phoneNumber.startsWith('972') && phoneNumber.length >= 12) {
        // Already has country code but missing +
        phoneNumber = `+${phoneNumber}`;
      } else {
        // Use default country code from env or default to +972 for Israel
        const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '+972';
        // Remove leading 0 if present
        if (phoneNumber.startsWith('0')) {
          phoneNumber = phoneNumber.substring(1);
        }
        phoneNumber = `${defaultCountryCode}${phoneNumber}`;
      }
    }

    // BulkGate API endpoint
    const apiUrl = process.env.BULKGATE_API_URL || 'https://portal.bulkgate.com/api/1.0/simple/transactional';

    // Check if message contains non-ASCII characters (Unicode)
    const hasUnicode = /[^\x00-\x7F]/.test(message);
    const unicode = hasUnicode ? 1 : 0;

    // BulkGate API request payload
    const requestBody = {
      application_id: bulkgateAppId,
      application_token: bulkgateToken,
      number: phoneNumber,
      text: message,
      unicode: unicode,
    };

    // Add sender_id if provided
    if (bulkgateSenderId) {
      requestBody.sender_id = bulkgateSenderId;
    }

    console.log(`📤 [BULKGATE] Attempting to send SMS to ${phoneNumber}`);
    console.log(`📤 [BULKGATE] Message length: ${message.length} characters`);
    console.log(`📤 [BULKGATE] Unicode: ${unicode === 1 ? 'Yes' : 'No'}`);
    console.log(`📤 [BULKGATE] App ID: ${bulkgateAppId?.substring(0, 8)}...`);

    // Send SMS via BulkGate API
    const response = await axios.post(apiUrl, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });

    console.log(`📤 [BULKGATE] Response Status: ${response.status}`);
    console.log(`📤 [BULKGATE] Response Data:`, JSON.stringify(response.data, null, 2));

    // Check if SMS was sent successfully
    // BulkGate API can return success in various formats
    const responseData = response.data;
    
    // Check for success indicators
    // BulkGate returns "accepted" status when SMS is queued for delivery
    const isSuccess = 
      response.status === 200 &&
      (
        responseData?.status === 'success' || 
        responseData?.status === 'accepted' ||
        responseData?.data?.status === 'success' ||
        responseData?.data?.status === 'accepted' ||
        responseData?.response === 'success' ||
        responseData?.data?.response === 'success' ||
        (responseData?.data && !responseData?.data?.error && !responseData?.error) ||
        (responseData && !responseData?.error && response.status === 200)
      );

    // Check for error indicators
    const hasError = 
      responseData?.status === 'error' ||
      responseData?.data?.status === 'error' ||
      responseData?.response === 'error' ||
      responseData?.error ||
      responseData?.data?.error;

    if (isSuccess && !hasError) {
      const messageId = responseData?.data?.sms_id || 
                       responseData?.data?.id || 
                       responseData?.sms_id || 
                       responseData?.id ||
                       responseData?.data?.message_id ||
                       'N/A';
      // Check if in test/demo mode (price and credit are 0)
      const isTestMode = responseData?.data?.price === 0 && responseData?.data?.credit === 0;
      const statusMessage = responseData?.data?.status || 'unknown';
      
      if (isTestMode) {
        console.log(`⚠️ [BULKGATE SMS ACCEPTED - TEST MODE] To: ${phoneNumber} | Message ID: ${messageId} | Status: ${statusMessage}`);
        console.log(`⚠️ [BULKGATE] Price: ${responseData?.data?.price}, Credit: ${responseData?.data?.credit} - This may indicate test/demo mode`);
      } else {
        console.log(`✅ [BULKGATE SMS SENT] To: ${phoneNumber} | Message ID: ${messageId} | Status: ${statusMessage}`);
      }
      
      return {
        success: true,
        method: 'bulkgate',
        phone: phoneNumber,
        messageId: messageId,
        message: isTestMode 
          ? `SMS accepted by BulkGate (TEST MODE - may not deliver). Status: ${statusMessage}` 
          : `SMS sent successfully via BulkGate. Status: ${statusMessage}`,
        testMode: isTestMode,
        status: statusMessage,
      };
    } else {
      const errorMessage = responseData?.data?.error?.message || 
                          responseData?.data?.message || 
                          responseData?.message || 
                          responseData?.error || 
                          responseData?.data?.error || 
                          'Unknown error';
      console.error(`❌ [BULKGATE SMS FAILED] Response indicates failure: ${errorMessage}`);
      console.error(`❌ [BULKGATE SMS FAILED] Full response:`, JSON.stringify(responseData, null, 2));
      throw new Error(`BulkGate SMS failed: ${errorMessage}`);
    }
  } catch (error) {
    // Handle axios errors with detailed logging
    if (error.response) {
      // The request was made and the server responded with a status code outside 2xx
      const status = error.response.status;
      const statusText = error.response.statusText;
      const responseData = error.response.data;
      let errorMessage = responseData?.message || responseData?.error || responseData?.data?.message || statusText || 'Unknown error';
      
      console.error(`❌ [BULKGATE SMS ERROR] HTTP ${status} ${statusText}`);
      console.error(`❌ [BULKGATE SMS ERROR] Response:`, JSON.stringify(responseData, null, 2));
      console.error(`❌ [BULKGATE SMS ERROR] Phone: ${phone}`);
      
      // Handle specific BulkGate error cases
      if (status === 402 || status === 403) {
        errorMessage = 'Insufficient balance or invalid credentials in BulkGate account. Please check your account balance and credentials.';
      } else if (status === 401) {
        errorMessage = 'Invalid BulkGate credentials. Please check your BULKGATE_APP_ID and BULKGATE_TOKEN.';
      } else if (status === 400) {
        errorMessage = responseData?.message || 'Invalid request format. Please check phone number format.';
      } else if (status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait before sending more messages.';
      }
      
      throw new Error(`Failed to send SMS via BulkGate (HTTP ${status}): ${errorMessage}`);
    } else if (error.request) {
      // The request was made but no response was received
      console.error(`❌ [BULKGATE SMS ERROR] No response received`);
      console.error(`❌ [BULKGATE SMS ERROR] Phone: ${phone}`);
      console.error(`❌ [BULKGATE SMS ERROR] Error: ${error.message}`);
      throw new Error(`Failed to send SMS via BulkGate: No response from server - ${error.message}`);
    } else {
      // Something else happened
      console.error(`❌ [BULKGATE SMS ERROR] ${error.message}`);
      console.error(`❌ [BULKGATE SMS ERROR] Phone: ${phone}`);
      if (error.stack) {
        console.error(`❌ [BULKGATE SMS ERROR] Stack:`, error.stack);
      }
      throw new Error(`Failed to send SMS via BulkGate: ${error.message}`);
    }
  }
};

module.exports = {
  sendPaymentReminder,
};
