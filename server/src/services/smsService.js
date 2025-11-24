// Track if warning has been shown to avoid repetition
let testModeWarningShown = false;
let twilioNotInstalledWarningShown = false;

const sendPaymentReminder = async (phone, message) => {
  if (!phone) {
    throw new Error('Phone number is required to send reminders');
  }

  // Check if SMS is enabled first
  const smsEnabled = process.env.SMS_ENABLED === 'true';

  // If SMS is not enabled, use test mode (don't try to use Twilio at all)
  if (!smsEnabled) {
    // Fallback to console logging (for development/testing)
    console.log(`📱 [TEST MODE] SMS to ${phone}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
    
    // Only show warning once
    if (!testModeWarningShown) {
      console.log(
        '\n⚠️  SMS is in TEST MODE (messages logged only). To enable real SMS:',
        '\n   1. Get Twilio credentials from https://www.twilio.com',
        '\n   2. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env',
        '\n   3. Set SMS_ENABLED=true in .env\n'
      );
      testModeWarningShown = true;
    }
    
    return {
      success: true,
      phone,
      method: 'test',
      message: 'SMS logged to console (Twilio not configured)',
    };
  }

  // Only try to use Twilio if SMS is explicitly enabled
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

  // Check if values are not placeholders/default values
  const hasValidCredentials =
    twilioAccountSid &&
    twilioAuthToken &&
    twilioPhoneNumber &&
    !twilioAccountSid.includes('your_') &&
    !twilioAuthToken.includes('your_') &&
    !twilioPhoneNumber.includes('1234567890') &&
    twilioAccountSid.trim().length > 10 &&
    twilioAuthToken.trim().length > 10 &&
    twilioPhoneNumber.trim().length > 5;

  // If Twilio credentials are valid, send real SMS
  if (hasValidCredentials) {
    try {
      // Try to require Twilio - if it's not installed, catch the error
      let twilio;
      try {
        const Twilio = require('twilio');
        twilio = Twilio(twilioAccountSid, twilioAuthToken);
      } catch (requireError) {
        // Twilio module not installed - fall back to test mode
        console.log(`📱 [TEST MODE] SMS to ${phone}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
        
        // Only show warning once
        if (!twilioNotInstalledWarningShown) {
          console.log('\n⚠️  Twilio module not installed. Install it: npm install twilio\n');
          twilioNotInstalledWarningShown = true;
        }
        
        return {
          success: true,
          phone,
          method: 'test',
          message: 'SMS logged to console (Twilio module not installed)',
        };
      }

      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

      // Ensure phone number starts with country code (if it doesn't already)
      let formattedPhone = normalizedPhone;
      if (!formattedPhone.startsWith('+')) {
        // If phone doesn't start with +, add +1 for US (you may need to adjust this)
        formattedPhone = `+1${formattedPhone}`;
      }

      const result = await twilio.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: formattedPhone,
      });

      console.log(`✅ [SMS SENT] to ${formattedPhone} | SID: ${result.sid}`);
      return {
        success: true,
        sid: result.sid,
        status: result.status,
        phone: formattedPhone,
        method: 'twilio',
      };
    } catch (error) {
      console.error(`❌ [SMS ERROR] to ${phone}: ${error.message}`);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  } else {
    // SMS enabled but invalid credentials - fall back to test mode
    console.log(`📱 [TEST MODE] SMS to ${phone}: ${message.substring(0, 80)}${message.length > 80 ? '...' : ''}`);
    
    // Only show warning once
    if (!testModeWarningShown) {
      console.log(
        '\n⚠️  SMS_ENABLED=true but Twilio credentials are invalid or missing.',
        '\n   Please check your .env file:',
        '\n   1. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER are set',
        '\n   2. Remove placeholder values (your_xxx_here)',
        '\n   3. Install Twilio: npm install twilio',
        '\n   4. Restart server\n'
      );
      testModeWarningShown = true;
    }
    
    return {
      success: true,
      phone,
      method: 'test',
      message: 'SMS logged to console (invalid Twilio credentials)',
    };
  }
};

module.exports = {
  sendPaymentReminder,
};



