const joi = require('joi');
const { auth } = require('./firebase'); // Import Firebase auth

const routes = (app) => {
  app.route('/login')
    .post((req, res) => {
      const { username, password } = req.body;

    });
};

module.exports = routes;