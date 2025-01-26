'use strict';
const dotenv = require('dotenv');
dotenv.config({ path: 'C:/Users/rmisu/OneDrive/Desktop/api/paymentApp/.env' });
const { queryInvoice } = require('./queryInvoice'); 
const { queryPayment } = require('./queryPayment'); 
const { postDeposit } = require('./postBatchDeposit'); 
const { createTables, sequelize, InsertPayments } = require('./dbconnect/post_database');
//const { InsertPayments,  InsertInvoices, ensureDatabaseExists,
//  ensurePaymentTableExists } = require('./dbconnect/database');
//reset
const consumerKey = process.env.consumerKey;
const consumerSecret = process.env.consumerSecret;
const callback = 'https://paymentapi-ot2f.onrender.com/callback' //dev`http://localhost:${port}/callback`

var http = require('http');
var port = process.env.PORT || 3000;
var request = require('request');
var qs = require('querystring');
var util = require('util');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var express = require('express');
var app = express();
var QuickBooks = require('./index');
var Tokens = require('csrf');
var csrf = new Tokens();
const path = require('path');
app.use(express.static(path.join(__dirname, 'views')));

QuickBooks.setOauthVersion('2.0');

// Generic Express config
app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('brad'));
app.use(session({ resave: false, saveUninitialized: false, secret: 'smith' }));

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

// Variables
let accessToken = null; 
let qbo = null;
let realmId = null; // Stores the Realm ID

// Home route
app.get('/', function (req, res) {
  res.redirect('/start');
});

// Render the start page
app.get('/start', function (req, res) {
  res.render('intuit.ejs', { port: port, appCenter: QuickBooks.APP_CENTER_BASE });
});

// Generate CSRF token for anti-forgery
function generateAntiForgery(session) {
  session.secret = csrf.secretSync();
  return csrf.create(session.secret);
}

// Step 1: Request token
app.get('/requestToken', function (req, res) {
  var redirecturl = QuickBooks.AUTHORIZATION_URL +
    '?client_id=' + consumerKey +
    '&redirect_uri=' + encodeURIComponent(callback) + // dev:('http://localhost:' + port + '/callback/') pro:'https://paymentapi-ot2f.onrender.com/callback'
    '&scope=com.intuit.quickbooks.accounting' +
    '&response_type=code' +
    '&state=' + generateAntiForgery(req.session);

  res.redirect(redirecturl);
});

// Step 2: Handle OAuth callback and exchange code for tokens
app.get('/callback', function (req, res) {
  if (!req.query.realmId) {
    console.error('Realm ID is missing from callback URL');
    res.status(400).send('Error: Realm ID is missing');
    return;
  }

  realmId = req.query.realmId; // Save the Realm ID
  console.log('Realm ID received:', realmId);

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    // Log the token endpoint and request body
    const tokenUrl = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';  // Confirm this is correct for production
    console.log('Token Endpoint URL:', tokenUrl); // Log the token endpoint
    console.log('Request Body:', {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: callback, // dev: 'http://localhost:{port}/callback', prod: 'https://paymentapi-ot2f.onrender.com/callback'
    }); // Log the request body

  const postBody = {
    url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: 'Basic ' + auth,
    },
    form: {
      grant_type: 'authorization_code',
      code: req.query.code,
      redirect_uri: callback, // dev`http://localhost:${port}/callback` pro: 'https://paymentapi-ot2f.onrender.com/callback'
    },
  };

  request.post(postBody, function (err, response, body) {
    if (err) {
      console.error('Error during token exchange:', err);
      res.status(500).send('Error exchanging tokens');
      return;
    }

    const parsedToken = JSON.parse(body);

    if (!parsedToken.access_token) {
      console.error('Access token is missing or invalid:', parsedToken);
      res.status(500).send('Error: Invalid access token');
      return;
    }

    accessToken = parsedToken;

    // Initialize QuickBooks instance
    qbo = new QuickBooks(
      consumerKey,
      consumerSecret,
      accessToken.access_token, // OAuth access token
      false, // No token secret for OAuth 2.0
      realmId, // Use the saved Realm ID
      false, // Use sandbox account //should be false
      true, // Enable debugging
      75, // Minor version (was 4)
      '2.0', // OAuth version
      accessToken.refresh_token, // Refresh token
    );

    console.log('QuickBooks instance initialized');
    res.redirect('/success');  // Redirect user to the launch URL (success page)
  });
});

// ** Launch URL ** - Success page after OAuth authentication
app.get('/success', (req, res) => {
  res.send('Authentication successful! You can now access your QuickBooks data.');
});

// Disconnect route
app.get('/disconnect', function (req, res) {
  req.session.destroy(function (err) {
    if (err) {
      console.error('Error clearing session:', err);
      res.status(500).send('Error during disconnect');
      return;
    }
    res.send(`
      <!DOCTYPE html><html><head></head><body>
        <h1>You have been successfully disconnected from QuickBooks.</h1>
        <script>window.opener.location.reload();window.close();</script>
      </body></html>
    `);
  });
});

//Database Creating
createTables()
  .then(() => {
    console.log('App is ready to start');
  })
  .catch((err) => {
    console.error('Error during table creation:', err);
    process.exit(1); // Exit the process if table creation fails
  });

// Following are interacting with get and post with backend
app.post('/queryInvoice', async (req, res) => {
 
  const { query } = req.body; // Extract SQL query from request body

  if (!query) {
    return res.status(400).send('Error: No query provided.');
  }

  try {
    if (!qbo || !realmId) {
      console.error('QBO instance or Realm ID not available');  // Added log for missing QBO or Realm ID
      return res.status(400).send('Error: QBO instance or Realm ID is not available.');
    }

    console.log('Executing query:', query);
    const invoiceSummary = await queryInvoice(qbo, realmId, query); // Pass query to the function

    if (!invoiceSummary || invoiceSummary.length === 0) {
      console.warn('No data found for the given query.');
      return res.json({ message: 'No data found.' }); // Ensure this is JSON
    }

    res.json(invoiceSummary); // Send the fetched data as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Error executing query.');
  }
});

// SQL for payment query
app.post('/queryPayment', async (req, res) => {
  const { query } = req.body; // Extract SQL query from request body

  if (!query) {
    return res.status(400).send('Error: No query provided.');
  }

  try {
    if (!qbo || !realmId) {
      return res.status(400).send('Error: QBO instance or Realm ID is not available.');
    }

    console.log('Executing query:', query);
    const paymentSummary = await queryPayment(qbo, realmId, query); // Pass query to the function

    if (!paymentSummary || paymentSummary.length === 0) {
      console.warn('No data found for the payment query.');
      return res.send('No data found.');
    }

    res.json(paymentSummary); // Send the fetched data as JSON
  } catch (err) {
    console.error('Error executing query:', err);
    res.status(500).send('Error executing query.');
  }
});

//post payments into the database
app.post('/postPayments', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).send('Error: No query provided.');
  }

  try {
    if (!qbo || !realmId) {
      return res.status(400).send('Error: QBO instance or Realm ID is not available.');
    }

    console.log('Executing query:', query);
    const paymentSummary = await queryPayment(qbo, realmId, query);

    if (!paymentSummary || paymentSummary.length === 0) {
      console.warn('No data found for the payment query.');
      return res.send('No data found.');
    }

    console.log('Payment Summary:', paymentSummary);

    // Insert payments into the database
    const sendPayment = await InsertPayments(paymentSummary);

    console.log('Insert Payments Response:', sendPayment);

    if (sendPayment) {
      return res.json({ message: 'Payment successfully posted!' });
    } else {
      return res.status(500).json({ message: 'Failed to insert payments into the database.' });
    }
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).json({ message: 'Error executing query.', error: err.message });
  }
});


//post deposit to Quickbooks
app.post('/postDeposit', async (req, res) => {
  const deposits = req.body.deposits;
  console.log('PostDeposit: ', deposits)
  try {
    // Insert payments data into the database
    await postDeposit(qbo, realmId, deposits); // Posts the deposit
    res.json({ message: 'Deposits posted successfully!' });
  } catch (error) {
    console.error("Error positing deposits:", error);
    res.status(500).send('Error posting deposits.');
  }
});





/*
module.exports = {
  getQboInstance: () => qbo,
  getRealmId: () => realmId,
};
*/
