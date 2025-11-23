# CoachPay Web

Full-stack web platform for coaches and admins to manage groups, players, payments, and attendance.

## Backend (server/)

### Environment Variables

Copy `server/env.sample` to `server/.env` and adjust values:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/coachpay
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
SMS_SENDER_NAME=CoachPay
CLIENT_URL=http://localhost:5173
```

### Install & Run

```bash
cd server
npm install
npm run dev   # starts nodemon on http://localhost:5000
```

### Seed Admin & Coach Accounts

Optional helper script to create default users (Admin `admin@coachpay.test / AdminPass123`, Coach `coach@coachpay.test / CoachPass123`):

```bash
cd server
npm run seed:users
```

You can override the default credentials by setting `SEED_ADMIN_EMAIL`, `SEED_ADMIN_USERNAME`, `SEED_ADMIN_PASSWORD`, `SEED_COACH_EMAIL`, `SEED_COACH_USERNAME`, or `SEED_COACH_PASSWORD` in `.env` before running the script. Both login endpoints accept either the email or username as the identifier.

Lint / formatting is not enforced yet, but you can run `npm start` for a plain Node process.

## Frontend (client/)

Environment variables: copy `client/env.sample` to `client/.env` (adjust `VITE_API_URL` if your backend differs).

```bash
cd client
npm install
npm run dev   # starts Vite dev server (default http://localhost:5173)
```

The React app calls the backend defined in `VITE_API_URL`.

## CORS

The Express server enables CORS in `src/app.js`, allowing requests from the origin set in `CLIENT_URL`. Update that value if you serve the frontend from a different host/port.

## SMS Testing & Configuration

### Test Mode (Default)

By default, SMS is in **TEST MODE** - messages are logged to the console but not actually sent. This is useful for development.

To test SMS functionality:

1. **Via Player Details Page**:
   - Go to any player's details page
   - Use the "Send SMS reminder" section
   - Enter a phone number and message
   - Click "Send SMS reminder"
   - Check the server console for the logged message

2. **Via Group Details Page**:
   - Go to a group's details page
   - Use the "Send payment reminders" section to send to all unpaid players
   - Select a month and click "Send reminders to unpaid players"
   - Check the server console for the logged messages

### Enable Real SMS with Twilio

To send **real SMS messages**, you need to configure Twilio:

1. **Get Twilio Account**:
   - Sign up at https://www.twilio.com (free trial available)
   - Get your Account SID and Auth Token from https://console.twilio.com/
   - Purchase a phone number (or use a trial number)

2. **Configure Environment Variables**:
   - Open `server/.env`
   - Add your Twilio credentials:
   ```env
   SMS_ENABLED=true
   TWILIO_ACCOUNT_SID=your_account_sid_here
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_PHONE_NUMBER=+1234567890
   ```
   - Make sure `TWILIO_PHONE_NUMBER` includes the `+` and country code (e.g., `+14155551234`)

3. **Restart Server**:
   - Stop your server (Ctrl+C)
   - Run `npm run dev` again

4. **Test Real SMS**:
   - Use the Player Details page or Group Details page to send reminders
   - Enter or select a phone number (with country code)
   - You should receive a real SMS message!

### Phone Number Format

- Phone numbers are automatically formatted:
  - If no `+` prefix, the system adds `+1` (US) by default
  - Spaces, dashes, and parentheses are removed automatically
  - Example: `123-456-7890` → `+11234567890`

**Note**: For international numbers, always include the country code (e.g., `+44` for UK, `+971` for UAE).

### Verifying Phone Numbers in Database

To verify if phone numbers in your database work:

1. Go to a player's details page
2. Use the "Send SMS reminder" section
3. Enter the phone number (or use the player's existing phone)
4. Send a test message
5. Check if it arrives (in TEST MODE, check console; in real mode, check your phone)

