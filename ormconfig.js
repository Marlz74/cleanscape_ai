require('dotenv').config();
const { DataSource } = require("typeorm");
const path = require('path');

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'model_training',
  entities: [path.join(__dirname, 'src/entities/*.js')],
  synchronize: false, // Set to false in production
  logging: false,
  migrations: [path.join(__dirname, 'src/migrations/*.js')],
  subscribers: [],
}


);

module.exports = { AppDataSource };