const ZEPTO_URL = 'https://api.zeptomail.in/v1.1/email';
const ZEPTO_TOKEN = process.env.ZEPTOMAIL_TOKEN;
const FROM_EMAIL = process.env.ZEPTOMAIL_SENDER || 'alerts@okiedokiepay.com';
const FROM_NAME = 'Counselling Portal';

async function sendEmail({ to, toName, subject, html }) {
  const res = await fetch(ZEPTO_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ZEPTO_TOKEN,
    },
    body: JSON.stringify({
      from: { address: FROM_EMAIL, name: FROM_NAME },
      to: [{ email_address: { address: to, name: toName || to } }],
      subject,
      htmlbody: html,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Zeptomail error', res.status, err);
  }
  return res.ok;
}

export async function emailSessionRequested({ requesterName, requesterEmail, counsellorName, counsellorEmail, category, notes }) {
  await Promise.all([
    sendEmail({
      to: requesterEmail,
      toName: requesterName,
      subject: 'Your counselling session request has been submitted',
      html: `<p>Hi ${requesterName},</p>
<p>Your counselling session request under <strong>${category}</strong> has been submitted successfully.</p>
<p><strong>Your notes:</strong> ${notes || 'N/A'}</p>
<p>You will receive an update once the counsellor reviews your request.</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
    counsellorEmail && sendEmail({
      to: counsellorEmail,
      toName: counsellorName,
      subject: `New counselling request from ${requesterName}`,
      html: `<p>Hi ${counsellorName},</p>
<p>A new counselling session request has been submitted.</p>
<p><strong>From:</strong> ${requesterName}<br/>
<strong>Category:</strong> ${category}<br/>
<strong>Notes:</strong> ${notes || 'N/A'}</p>
<p>Please log in to review and respond to the request.</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
  ]);
}

export async function emailSessionAccepted({ requesterName, requesterEmail, counsellorName, counsellorEmail, scheduledAt, location, category }) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' });
  await Promise.all([
    sendEmail({
      to: requesterEmail,
      toName: requesterName,
      subject: 'Your counselling session has been confirmed',
      html: `<p>Hi ${requesterName},</p>
<p>Your counselling session has been <strong>confirmed</strong>.</p>
<p><strong>Counsellor:</strong> ${counsellorName}<br/>
<strong>Category:</strong> ${category}<br/>
<strong>Date & Time:</strong> ${dateStr}<br/>
<strong>Location:</strong> ${location || 'TBD'}</p>
<p>Please be on time. You'll receive a reminder 1 hour before the session.</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
    sendEmail({
      to: counsellorEmail,
      toName: counsellorName,
      subject: `Session confirmed with ${requesterName}`,
      html: `<p>Hi ${counsellorName},</p>
<p>You have accepted a counselling session.</p>
<p><strong>Student/Employee:</strong> ${requesterName}<br/>
<strong>Date & Time:</strong> ${dateStr}<br/>
<strong>Location:</strong> ${location || 'TBD'}</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
  ]);
}

export async function emailSessionDeclined({ requesterName, requesterEmail, counsellorName, reason }) {
  await sendEmail({
    to: requesterEmail,
    toName: requesterName,
    subject: 'Update on your counselling session request',
    html: `<p>Hi ${requesterName},</p>
<p>Your counselling session request has been reviewed by <strong>${counsellorName}</strong>.</p>
<p>Unfortunately, the session could not be confirmed at this time.</p>
${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
<p>You may re-open your request or contact the administration for assistance.</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
  });
}

export async function emailReminder({ requesterName, requesterEmail, counsellorName, counsellorEmail, scheduledAt, location }) {
  const dateStr = new Date(scheduledAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', timeStyle: 'short' });
  await Promise.all([
    sendEmail({
      to: requesterEmail,
      toName: requesterName,
      subject: `Reminder: Your counselling session is in 1 hour`,
      html: `<p>Hi ${requesterName},</p>
<p>This is a reminder that your counselling session is scheduled in <strong>1 hour</strong>.</p>
<p><strong>Time:</strong> ${dateStr}<br/>
<strong>Location:</strong> ${location || 'TBD'}<br/>
<strong>Counsellor:</strong> ${counsellorName}</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
    sendEmail({
      to: counsellorEmail,
      toName: counsellorName,
      subject: `Reminder: Session with ${requesterName} in 1 hour`,
      html: `<p>Hi ${counsellorName},</p>
<p>Reminder: You have a counselling session with <strong>${requesterName}</strong> in <strong>1 hour</strong>.</p>
<p><strong>Time:</strong> ${dateStr}<br/>
<strong>Location:</strong> ${location || 'TBD'}</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
  ]);
}

export async function emailReferral({ studentName, studentEmail, teacherName, counsellorName, counsellorEmail, category, notes }) {
  await Promise.all([
    studentEmail && sendEmail({
      to: studentEmail,
      toName: studentName,
      subject: 'You have been referred for a counselling session',
      html: `<p>Hi ${studentName},</p>
<p><strong>${teacherName}</strong> has referred you for a counselling session under <strong>${category}</strong>.</p>
${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
<p>A session request has been created. You will receive an update shortly.</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
    counsellorEmail && sendEmail({
      to: counsellorEmail,
      toName: counsellorName,
      subject: `Referral: ${studentName} referred by ${teacherName}`,
      html: `<p>Hi ${counsellorName},</p>
<p><strong>${teacherName}</strong> has referred <strong>${studentName}</strong> for a counselling session.</p>
<p><strong>Category:</strong> ${category}<br/>
${notes ? `<strong>Notes:</strong> ${notes}` : ''}</p>
<p>Please log in to review and respond.</p>
<br/><p>Regards,<br/>Counselling Team</p>`,
    }),
  ]);
}
