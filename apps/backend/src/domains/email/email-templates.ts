function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function registerOtpEmail(params: {
  code: string;
  brandName?: string;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const subject = `${brand}: your verification code`;
  const html = `<p>Your verification code is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:0.2em">${esc(params.code)}</p><p>This code expires in 15 minutes.</p>`;
  const text = `Your verification code is: ${params.code}\nThis code expires in 15 minutes.`;
  return { subject, html, text };
}

export function passwordResetEmail(params: {
  resetUrl: string;
  brandName?: string;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const subject = `${brand}: reset your password`;
  const url = esc(params.resetUrl);
  const html = `<p>We received a request to reset your password.</p><p><a href="${url}">Set a new password</a></p><p>If you did not request this, you can ignore this email.</p><p style="word-break:break-all;color:#666">${url}</p>`;
  const text = `Reset your password: ${params.resetUrl}\nIf you did not request this, ignore this email.`;
  return { subject, html, text };
}

export function emailChangeOtpEmail(params: {
  code: string;
  brandName?: string;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const subject = `${brand}: confirm your new email`;
  const html = `<p>Your verification code for the new email address is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:0.2em">${esc(params.code)}</p><p>This code expires in 15 minutes.</p>`;
  const text = `Your verification code for the new email is: ${params.code}\nThis code expires in 15 minutes.`;
  return { subject, html, text };
}

export function teamInviteEmail(params: {
  inviterName: string;
  workspaceName: string;
  inviteUrl: string;
  role: string;
  brandName?: string;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const subject = `${brand}: ${params.inviterName} invited you to "${params.workspaceName}"`;
  const url = esc(params.inviteUrl);
  const name = esc(params.inviterName);
  const ws = esc(params.workspaceName);
  const html = `<p>Hi,</p><p><strong>${name}</strong> has invited you to join <strong>${ws}</strong> on ${brand} as <strong>${esc(params.role)}</strong>.</p><p><a href="${url}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Accept invitation</a></p><p style="word-break:break-all;color:#666">${url}</p><p>This invitation expires in 7 days. If you don't have an account yet, you'll be asked to create one.</p>`;
  const text = `Hi,\n\n${params.inviterName} has invited you to join "${params.workspaceName}" on ${brand} as ${params.role}.\n\nAccept invitation: ${params.inviteUrl}\n\nThis invitation expires in 7 days. If you don't have an account yet, you'll be asked to create one.`;
  return { subject, html, text };
}

export function subscriptionReminderEmail(params: {
  fullName: string;
  brandName?: string;
  dashboardUrl?: string;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const subject = `${brand}: subscription reminder`;
  const name = esc(params.fullName);
  const dash = params.dashboardUrl
    ? `<p><a href="${esc(params.dashboardUrl)}">Open dashboard</a></p>`
    : '';
  const html = `<p>Hi ${name},</p><p>This is a friendly reminder about your ${brand} subscription. Please review billing in your dashboard.</p>${dash}`;
  const text = `Hi ${params.fullName},\n\nThis is a reminder about your ${brand} subscription. Please review billing in your dashboard.${
    params.dashboardUrl ? `\n\n${params.dashboardUrl}` : ''
  }`;
  return { subject, html, text };
}

export function welcomeEmail(params: {
  fullName: string;
  brandName?: string;
  dashboardUrl?: string;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const subject = `Welcome to ${brand}, ${params.fullName}!`;
  const name = esc(params.fullName);
  const dash = params.dashboardUrl
    ? `<p><a href="${esc(params.dashboardUrl)}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Go to your dashboard</a></p>`
    : '';
  const html = `<p>Hi ${name},</p><p>Welcome to <strong>${brand}</strong>! Your workspace is ready.</p><p>Here's how to get started:</p><ul><li>Add your first screen</li><li>Upload media content</li><li>Create a playlist</li><li>Schedule content to your screens</li></ul>${dash}<p style="color:#666;margin-top:24px">If you have any questions, just reply to this email.</p>`;
  const text = `Welcome to ${brand}, ${params.fullName}!\n\nYour workspace is ready. Here's how to get started:\n1. Add your first screen\n2. Upload media content\n3. Create a playlist\n4. Schedule content to your screens\n\n${params.dashboardUrl ? `Go to your dashboard: ${params.dashboardUrl}\n\n` : ''}If you have any questions, just reply to this email.`;
  return { subject, html, text };
}

export function onboardingTipsEmail(params: {
  fullName: string;
  brandName?: string;
  dashboardUrl?: string;
  day: number;
}): { subject: string; html: string; text: string } {
  const brand = params.brandName ?? 'Cloud Signage';
  const tips: Record<number, { title: string; body: string }> = {
    1: {
      title: 'Add your first screen',
      body: 'Pair a display by generating a 6-digit code in the Screens page and entering it on your device.',
    },
    3: {
      title: 'Upload your media',
      body: 'Drag and drop images and videos in the Media page. They will be available for use in playlists immediately.',
    },
    7: {
      title: 'Create a schedule',
      body: 'Use the Schedules page to control when your playlists appear on each screen — by day, time, or recurrence.',
    },
  };
  const tip = tips[params.day] ?? tips[1];
  const subject = `${brand}: ${tip.title}`;
  const name = esc(params.fullName);
  const dash = params.dashboardUrl
    ? `<p><a href="${esc(params.dashboardUrl)}" style="display:inline-block;padding:12px 28px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">Open dashboard</a></p>`
    : '';
  const html = `<p>Hi ${name},</p><p><strong>${esc(tip.title)}</strong></p><p>${esc(tip.body)}</p>${dash}<p style="color:#666;margin-top:24px">You are receiving this because you recently signed up for ${brand}.</p>`;
  const text = `Hi ${params.fullName},\n\n${tip.title}\n${tip.body}\n\n${params.dashboardUrl ? `Open dashboard: ${params.dashboardUrl}\n\n` : ''}You are receiving this because you recently signed up for ${brand}.`;
  return { subject, html, text };
}
