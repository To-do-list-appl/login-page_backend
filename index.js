const express = require('express');
const port = process.env.PORT || 3000;
const app = express();
const CORS = require('cors');
const routes = require('./src/routes'); // Import your routes
require('dotenv').config(); // Load environment variables from .env file

const corsOptions = {
  origin: 'http://localhost:5173/'
};

app.use(CORS(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routes(app); // Initialize routes
app.get('/', (req, res) => {
  res.send('Server is running');
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
