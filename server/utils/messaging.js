const twilio = require('twilio');

const client = new twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

async function sendWhatsAppMessage(to, body) {
  try {
    const fromEnv = process.env.TWILIO_WHATSAPP_NUMBER || '';
    const from = fromEnv.startsWith('whatsapp:') ? fromEnv : `whatsapp:${fromEnv}`;
    const toAddr = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const res = await client.messages.create({
      body,
      from,
      to: toAddr
    });
    console.log("WhatsApp message sent successfully to", to);
    return res;
  } catch (err) {
    console.error("Error sending WhatsApp message:", err.message);
  }
}

module.exports = { sendWhatsAppMessage };


