# Email-to-SMS Gateway Guide

## ⚠️ WARNING: Very Unreliable Method

Email-to-SMS gateways are **NOT recommended** for production use because:

- **Many carriers have discontinued this service** (AT&T ended it in June 2025)
- **Very unreliable** - messages may not be delivered
- **Carrier-dependent** - requires knowing recipient's carrier
- **No delivery confirmation** - you can't verify if message was received
- **Rate limiting** - carriers may block emails that look like spam
- **Message truncation** - emails may be cut off or rejected
- **Regional limitations** - formats vary by country/region

**Recommendation:** Use Twilio or another professional SMS service for production. Use Email-to-SMS **only for testing** or as a last resort.

---

## How Email-to-SMS Works

Instead of sending SMS directly, you send an **email** to a special carrier email address, and the carrier converts it to SMS.

**Format:** `PHONENUMBER@CARRIER_GATEWAY.com`

**Example:** To send SMS to phone `1234567890` on Verizon:
- Email to: `1234567890@vtext.com`
- Subject: Your SMS message subject
- Body: Your SMS message (keep under 160 characters)

---

## US Carrier Email-to-SMS Formats

### ⚠️ Note: Many carriers have discontinued or limited this service

| Carrier | Format | Status | Notes |
|---------|--------|--------|-------|
| **Verizon** | `PHONENUMBER@vtext.com` | ⚠️ Limited | May require verification |
| **T-Mobile** | `PHONENUMBER@tmomail.net` | ⚠️ Limited | Works inconsistently |
| **Sprint** | `PHONENUMBER@messaging.sprintpcs.com` | ❌ Discontinued | No longer supported |
| **AT&T** | `PHONENUMBER@txt.att.net` | ❌ Discontinued | Ended June 17, 2025 |
| **US Cellular** | `PHONENUMBER@email.uscc.net` | ⚠️ Limited | Not guaranteed |
| **Cricket** | `PHONENUMBER@sms.cricketwireless.net` | ⚠️ Limited | Works inconsistently |
| **Boost Mobile** | `PHONENUMBER@sms.myboostmobile.com` | ⚠️ Limited | Not guaranteed |

### International Formats (Examples)

| Country | Carrier Examples |
|---------|------------------|
| **Canada** | `PHONENUMBER@txt.bell.ca` (Bell), `PHONENUMBER@sms.rogers.com` (Rogers) |
| **UK** | `PHONENUMBER@sms.vodafone.co.uk` (Vodafone), `PHONENUMBER@txt.o2.co.uk` (O2) |
| **Australia** | `PHONENUMBER@sms.vodafone.com.au` (Vodafone) |

---

## Requirements to Use Email-to-SMS

### 1. You need an email account
- Gmail, Outlook, Yahoo, or any SMTP email service
- Must be able to send emails programmatically

### 2. You need to know the recipient's carrier
- This is the biggest problem - you usually don't know the carrier
- You can try guessing or asking users, but it's not practical

### 3. Phone number format
- Extract 10-digit US number from any format
- Example: `(123) 456-7890` → `1234567890`
- Remove country code if present: `+11234567890` → `1234567890`

---

## How to Try Email-to-SMS (Manual Test)

### Option 1: Using Your Email Client

1. **Find recipient's carrier** (ask them or guess)

2. **Format the email address:**
   - US Verizon: `1234567890@vtext.com`
   - US T-Mobile: `1234567890@tmomail.net`

3. **Send email:**
   - **To:** `1234567890@vtext.com`
   - **Subject:** (keep short, may appear in SMS)
   - **Body:** Your message (keep under 160 characters)
   - **Send:** Click send!

4. **Check recipient's phone** - they should receive SMS (maybe)

### Option 2: Using Gmail/Outlook Web

Same as Option 1, but using web email client.

---

## Limitations & Problems

### 1. **Carrier Detection**
   - You must know recipient's carrier
   - No reliable way to detect carrier from phone number
   - Users must tell you their carrier

### 2. **Message Length**
   - SMS limit: 160 characters
   - Longer messages may be truncated or rejected
   - Email subject may be included in SMS (uses characters)

### 3. **Delivery Issues**
   - Messages may not arrive
   - No delivery confirmation
   - No error messages if delivery fails
   - Carriers may block emails that look like spam

### 4. **Rate Limiting**
   - Sending too many emails may trigger spam filters
   - Your email account could be blocked
   - Carriers may block your email domain

### 5. **Security**
   - Email-to-SMS gateways are less secure
   - No encryption guarantee
   - Message content visible in email logs

---

## Better Alternatives

### 1. **Twilio** (Recommended for Production)
   - ✅ Reliable delivery
   - ✅ Delivery confirmation
   - ✅ Works with any phone number (no carrier detection needed)
   - ✅ Professional service
   - ❌ Costs money (~$0.0075 per SMS + $1/month for number)

### 2. **TEST MODE** (Recommended for Development)
   - ✅ Free
   - ✅ Works for testing
   - ✅ Messages logged to console
   - ❌ No real SMS delivery

### 3. **WhatsApp Business API**
   - ✅ Free for business use
   - ✅ Reliable delivery
   - ❌ Requires WhatsApp account
   - ❌ More complex setup

---

## Conclusion

**Email-to-SMS is NOT recommended for production use** because:
- Very unreliable
- Many carriers discontinued it
- Requires knowing recipient's carrier
- No delivery confirmation

**Use TEST MODE for development** (free, works perfectly for testing)

**Use Twilio for production** (reliable, professional, low cost)

---

## Example: Manual Email-to-SMS Test

**If you want to try it manually:**

1. Find out your friend's carrier (e.g., Verizon)

2. If their phone is `123-456-7890` and carrier is Verizon:
   - Email to: `1234567890@vtext.com`
   - Subject: `Test`
   - Body: `Hello, this is a test SMS from email!`
   - Send from your Gmail/Outlook

3. Check their phone - they might receive it (no guarantee)

**Remember:** This is unreliable. Use at your own risk!

