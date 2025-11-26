const { Vonage } = require('@vonage/server-sdk');

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

  // Get Vonage credentials
  const vonageApiKey = process.env.VONAGE_API_KEY;
  const vonageApiSecret = process.env.VONAGE_API_SECRET;
  const vonageFromNumber = process.env.VONAGE_FROM_NUMBER || process.env.VONAGE_BRAND_NAME;

  if (!vonageApiKey || !vonageApiSecret) {
    throw new Error('Vonage credentials not configured. Set VONAGE_API_KEY and VONAGE_API_SECRET in .env');
  }

  try {
    // Initialize Vonage client
    const vonage = new Vonage({
      apiKey: vonageApiKey,
      apiSecret: vonageApiSecret,
    });

    // Normalize phone number (remove spaces, dashes, etc.)
    let phoneNumber = phone.replace(/[\s\-\(\)]/g, '');

    // Format phone number with country code
    if (!phoneNumber.startsWith('+')) {
      // Detect if Israeli number (starts with 05)
      if (phoneNumber.startsWith('05') && phoneNumber.length === 10) {
        // Israeli mobile number - convert to +972
        phoneNumber = `+972${phoneNumber.substring(1)}`;
      } else {
        // Use default country code from env or default to +972 for Israel
        const defaultCountryCode = process.env.DEFAULT_COUNTRY_CODE || '+972';
        phoneNumber = `${defaultCountryCode}${phoneNumber}`;
      }
    }

    // Send SMS via Vonage
    const responseData = await vonage.sms.send({
      to: phoneNumber,
      from: vonageFromNumber || 'CoachPay',
      text: message,
    });

    console.log(`📤 [VONAGE] Response:`, JSON.stringify(responseData, null, 2));

    // Check if SMS was sent successfully
    if (responseData.messages && responseData.messages.length > 0) {
      const messageResult = responseData.messages[0];
      
      if (messageResult.status === '0' || messageResult.status === 0) {
        console.log(`✅ [VONAGE SMS SENT] To: ${phoneNumber} | Message ID: ${messageResult['message-id'] || messageResult.messageId}`);
        return {
          success: true,
          method: 'vonage',
          phone: phoneNumber,
          messageId: messageResult['message-id'] || messageResult.messageId,
          status: messageResult.status,
          message: 'SMS sent successfully via Vonage',
        };
      } else {
        const errorMessage = messageResult['error-text'] || messageResult.errorText || 'Unknown error';
        throw new Error(`Vonage SMS failed: ${errorMessage}`);
      }
    } else {
      throw new Error('Vonage SMS failed: No response messages');
    }
  } catch (error) {
    console.error(`❌ [VONAGE SMS ERROR] to ${phone}: ${error.message}`);
    throw new Error(`Failed to send SMS via Vonage: ${error.message}`);
  }
};

module.exports = {
  sendPaymentReminder,
};
