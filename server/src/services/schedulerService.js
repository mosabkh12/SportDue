const cron = require('node-cron');
const Group = require('../models/group.model');
const Player = require('../models/player.model');
const Payment = require('../models/payment.model');
const { PAYMENT_STATUS } = require('../config/constants');
const { sendPaymentReminder } = require('./smsService');

// Track if scheduled job is running to prevent duplicates
let scheduledJobRunning = false;

const sendAutomaticPaymentReminders = async () => {
  // Prevent multiple instances from running simultaneously
  if (scheduledJobRunning) {
    console.log('⏰ Payment reminder job already running, skipping...');
    return;
  }

  scheduledJobRunning = true;
  
  try {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    console.log(`📅 Checking for payment reminders on day ${currentDay} for month ${currentMonth}...`);

    // Find all groups with payment due day matching today
    const groups = await Group.find({ paymentDueDay: currentDay });

    if (groups.length === 0) {
      console.log(`✓ No groups have payment due day set to ${currentDay}`);
      return;
    }

    console.log(`📧 Found ${groups.length} group(s) with payment due today. Processing...`);

    let totalSent = 0;
    let totalFailed = 0;

    for (const group of groups) {
      try {
        // Get all players in the group
        const players = await Player.find({ groupId: group._id });

        if (players.length === 0) {
          console.log(`   ⚠️  Group "${group.name}" has no players, skipping...`);
          continue;
        }

        const playerIds = players.map((p) => p._id);

        // Find payments for current month - get unpaid or partially paid players
        const payments = await Payment.find({
          playerId: { $in: playerIds },
          month: currentMonth,
          status: { $in: [PAYMENT_STATUS.UNPAID, PAYMENT_STATUS.PARTIAL] },
        });

        // Find players who haven't paid or are partially paid
        const unpaidPlayers = players.filter((player) => {
          const payment = payments.find((p) => String(p.playerId) === String(player._id));
          return !payment || payment.status !== PAYMENT_STATUS.PAID;
        });

        if (unpaidPlayers.length === 0) {
          console.log(`   ✓ Group "${group.name}": All players have paid for ${currentMonth}`);
          continue;
        }

        // Format month for display
        const [year, monthNum] = currentMonth.split('-');
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December',
        ];
        const monthDisplay = `${monthNames[parseInt(monthNum) - 1]} ${year}`;
        const dueDateDisplay = `${currentDay}${currentDay === 1 ? 'st' : currentDay === 2 ? 'nd' : currentDay === 3 ? 'rd' : 'th'}`;

        // Send reminders to unpaid players
        const results = await Promise.allSettled(
          unpaidPlayers.map(async (player) => {
            const payment = payments.find((p) => String(p.playerId) === String(player._id));
            const amountDue = payment ? payment.amountDue : player.monthlyFee;
            const amountPaid = payment ? payment.amountPaid : 0;
            const remaining = amountDue - amountPaid;

            const message = `Hi ${player.fullName.split(' ')[0]}, payment reminder from CoachPay. ${monthDisplay} payment due ${dueDateDisplay}. Amount: $${amountDue}, Paid: $${amountPaid}, Remaining: $${remaining}. Please pay soon. Thank you! -CoachPay`;

            await sendPaymentReminder(player.phone, message);
            return { playerId: player._id, playerName: player.fullName, phone: player.phone };
          })
        );

        const successful = results.filter((r) => r.status === 'fulfilled').length;
        const failed = results.filter((r) => r.status === 'rejected').length;

        totalSent += successful;
        totalFailed += failed;

        console.log(`   ✓ Group "${group.name}": Sent ${successful} reminder(s), ${failed} failed`);
      } catch (groupError) {
        console.error(`   ❌ Error processing group "${group.name}":`, groupError.message);
        totalFailed++;
      }
    }

    console.log(`✅ Automatic payment reminders completed. Total sent: ${totalSent}, Failed: ${totalFailed}`);
  } catch (error) {
    console.error('❌ Error in automatic payment reminder job:', error);
  } finally {
    scheduledJobRunning = false;
  }
};

// Schedule job to run daily at 9:00 AM
const startScheduledReminders = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', () => {
    console.log('⏰ Starting scheduled payment reminder job...');
    sendAutomaticPaymentReminders();
  });

  console.log('✅ Scheduled payment reminders initialized (runs daily at 9:00 AM)');
};

module.exports = {
  startScheduledReminders,
  sendAutomaticPaymentReminders,
};

