async function sendPasswordResetEmail({ to, resetToken, resetUrl }) {
  void to;
  void resetToken;
  void resetUrl;

  // TODO: integrate email sending service from notification module when available.
  return;
}

module.exports = {
  sendPasswordResetEmail,
};
