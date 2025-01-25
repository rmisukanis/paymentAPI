const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    multipleStatements: true,
    database: process.env.MYSQL_DATABASE,
}).promise();

async function testConnection() {
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS solution');
        console.log('Database connected, solution is:', rows[0].solution);
    } catch (error) {
        console.error('Error connecting to the database:', error);
    }
}

testConnection();


// Database Creation
async function ensureDatabaseExists() {
    const createDatabaseQuery = `CREATE DATABASE IF NOT EXISTS quickBooks_app;`;

    try {
        // Create database if it doesn't exist
        await pool.query(createDatabaseQuery);
        console.log('Database "quickBooks_app" ensured to exist.');

    } catch (error) {
        console.error('Error ensuring the database exists:', error);
        throw error;
    }
}

// Table Creation
async function ensurePaymentTableExists() {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS quickBooks_app.payments (
            PaymentId INT PRIMARY KEY,
            CustomerName VARCHAR(255) NOT NULL,
            CustomerId INT NOT NULL,
            TotalAmount DECIMAL(10, 2) NOT NULL,
            TransactionDate DATE NOT NULL,
            DepositToAccountId INT NOT NULL,
            UnappliedAmount DECIMAL(10, 2) NOT NULL,
            Currency VARCHAR(50) NOT NULL,
            LinkedTxnId INT NOT NULL,
            LinkedTxnType VARCHAR(50) NOT NULL
        );
            CREATE TABLE IF NOT EXISTS quickBooks_app.invoices (
            InvoiceId INT PRIMARY KEY, 
            CustomerName VARCHAR(255) NOT NULL, 
            CustomerId INT NOT NULL, 
            TotalAmount DECIMAL(10, 2) NOT NULL,
            TransactionDate DATE NOT NULL,
            Balance DECIMAL(10, 2) NOT NULL,
            LinkedTxnId INT NOT NULL,
            LinkedTxnType VARCHAR(50) NOT NULL,
            InvoiceDocNum INT NOT NULL, 
            DueDate DATE NOT NULL
        );
        CREATE TABLE IF NOT EXISTS quickBooks_app.deposits (
            DepositId INT PRIMARY KEY, 
            DepositToAccountId INT NOT NULL,
            DepositToAccountName VARCHAR(255) NOT NULL,
            TotalAmount DECIMAL(10, 2) NOT NULL,
            TransactionDate DATE NOT NULL
        );
    `;

    try {
        // Execute the query
        await pool.query(createTableQuery);
        console.log('Table "payments" ensured to exist.');
    } catch (error) {
        console.error('Error ensuring the table exists:', error);
        throw error;
    }
}

// Insert Payments
async function InsertPayments(payments) {
    const query = `
        INSERT INTO quickBooks_app.payments 
        (CustomerName, CustomerId, TotalAmount, TransactionDate, PaymentId, DepositToAccountId, UnappliedAmount, Currency, LinkedTxnId, LinkedTxnType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        for (const payment of payments) {
            // Log the current payment to debug
            console.log('Inserting payment:', payment);
            await pool.query(query, [
                payment.CustomerName,
                payment.CustomerId,
                payment.TotalAmount,
                payment.TransactionDate,
                payment.PaymentId,
                payment.DepositToAccountId,
                payment.UnappliedAmount,
                payment.Currency,
                payment.LinkedTxnId,
                payment.LinkedTxnType,
            ]);
        }
        console.log('All payments inserted successfully.');
    } catch (error) {
        console.error('Error inserting payments:', error);
        throw error;
    }
}

// Insert Invoice
async function InsertInvoices(invoices) {
    const query = `
        INSERT INTO quickBooks_app.invoices 
        (InvoiceId, CustomerName, CustomerId, TotalAmount, TransactionDate, Balance, LinkedTxnId, LinkedTxnType, InvoiceDocNum, DueDate)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    try {
        for (const invoice of invoices) {
            // Log the current payment to debug
            console.log('Inserting invoice:', invoice);
            await pool.query(query, [
                invoice.InvoiceId,
                invoice.CustomerName,
                invoice.CustomerId,
                invoice.TotalAmount,
                invoice.TransactionDate,
                invoice.Balance,
                invoice.LinkedTxnId,
                invoice.LinkedTxnType,
                invoice.InvoiceDocNum,
                invoice.DueDate,     
            ]);
        }
        console.log('All invoices inserted successfully.');
    } catch (error) {
        console.error('Error inserting invoices:', error);
        throw error;
    }
}

// Call the Functions
///*
ensureDatabaseExists()
    .then(() => console.log('Database setup complete.'))
    .catch(error => console.error('Error during database setup:', error));

ensurePaymentTableExists()
    .then(() => console.log('Table setup complete.'))
    .catch(error => console.error('Error during table setup:', error));
//*/
// Export the functions
module.exports = {
    ensureDatabaseExists,
    ensurePaymentTableExists,
    InsertPayments,
    InsertInvoices,
};
