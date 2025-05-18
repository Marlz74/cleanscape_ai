// src/app.js
require('dotenv').config();
const express = require('express');
const modelRoutes = require('./routes/modelRoutes'); // Import the model routes
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const cors = require("cors");
const { AppDataSource } = require('../ormconfig'); // Import the database connection

const app = express();
// Set up EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files (for JS, CSS, etc.)
app.use(express.static(path.join(__dirname, "public")));

// Allow all origins (for public API)
app.use(cors());
app.use(express.json()); // Enable JSON body parsing
app.use(express.urlencoded({ extended: true }));

// Swagger setup for API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Model Training API',
      version: '1.0.0',
      description: 'API to manage AI models for training, testing, and downloading.',
    },
    servers: (process.env.isProduction == 'true')
      ? [
        {
          url: 'https://api.example.com',
          description: 'Production server',
        },
      ]
      :
      [
        {
          url: 'http://localhost:5000',
          description: 'Local server',
        },
      ],
  },
  apis: ['./src/routes/*.js'],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


// Initialize the database connection using AppDataSource
AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
  })
  .catch((error) => {
    console.error('Database connection failed:', error);
  });

// Use the model routes
app.use('/models', modelRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the AI Model Training API');
});

// Route to render the visual data page
app.get('/visual-data', (req, res) => {
  res.render('visualData');
});

// Make the server listen on a specific port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
