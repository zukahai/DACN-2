import mysql from 'mysql2/promise';
require('dotenv').config();
let host = process.env.HOSTDATABASE;
let user = process.env.USERDATABASE;
let password = process.env.PASSDATABASE;
let database = process.env.NAMEDATABASE;
const pool = mysql.createPool({ host: host, user: user, password: password, database: database });

export default pool;
