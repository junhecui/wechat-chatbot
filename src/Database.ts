const mysql = require('mysql2/promise');
const fs = require('fs');
import * as path from 'path';

const certPath = path.resolve(__dirname, '../config/DigiCertGlobalRootG2.crt.pem'); // can replace with '../config/DigiCertGlobalRootCA.crt.pem'

async function connectToDatabase() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: '3306',
        ssl: {
            ca: fs.readFileSync(certPath, 'utf8'), 
            rejectUnauthorized: false
        }
    });

    console.log('Connected to the database.');
    return connection;
}

export default connectToDatabase;
