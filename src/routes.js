const { loginUser } = require('./controllers'); // Import login controller

const routes = (app) => {
  app.route('/login')
    .post(loginUser);
};

module.exports = routes;