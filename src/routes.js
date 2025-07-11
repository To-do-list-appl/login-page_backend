const { loginUser, registeruser, verifyEmail, resendVerificationEmail, logoutUser } = require('./controllers'); // Import login controller

const routes = (app) => {
  app.route('/login')
    .post(loginUser);
  app.route('/register')
    .post(registeruser);
  app.route('/verify-email')
    .get(verifyEmail);
  app.route('/resend-email-verification')
    .post(resendVerificationEmail);
  app.route('/logout')
    .post(logoutUser);
};

module.exports = routes;