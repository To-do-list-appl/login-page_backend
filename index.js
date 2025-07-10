const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const routes = require('./src/routes'); // Import your routes
require('dotenv').config(); // Load environment variables from .env file

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routes(app); // Initialize routes
app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
