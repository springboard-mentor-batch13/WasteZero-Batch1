const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const routes = require('./routes/index');
const errorMiddleware = require('./middlewares/errorMiddleware');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    data: {
      status: 'UP',
      timestamp: new Date().toISOString()
    },
    timestamp: new Date().toISOString()
  });
});

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    errors: [`${req.method} ${req.originalUrl} not found`],
    timestamp: new Date().toISOString()
  });
});

app.use(errorMiddleware);

module.exports = app;
