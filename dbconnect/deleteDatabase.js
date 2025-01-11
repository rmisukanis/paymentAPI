const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config({ path: '../.env'});

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,

}).promise();

// Drop Table and Database if they exist
async function dropDatabaseAndTable() {
    const dropTableQuery = `DROP TABLE IF EXISTS payments; DROP TABLE IF EXISTS invoice; DROP TABLE IF EXISTS deposit;`;
    const dropDatabaseQuery = `DROP DATABASE IF EXISTS quickBooks_app;`;

    try {
        // Drop the table if it exists
        await pool.query(dropTableQuery);
        console.log('Table dropped if it existed.');

        // Drop the database if it exists
        await pool.query(dropDatabaseQuery);
        console.log('Database "quickBooks_app" dropped if it existed.');
    } catch (error) {
        console.error('Error dropping table or database:', error);
        throw error; // Re-throw error for further handling
    }
}

//Call The Drop Funciton
dropDatabaseAndTable()
    .then(() => console.log('Database & table dropped.'))
    .catch(error => console.error('Error during database and table drop:', error));

