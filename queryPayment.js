
/*
//query=select * from Payment where id = '228'
const { InsertPayments,  Insertpayments, ensureDatabaseExists,
  ensurePaymentTableExists } = require('./dbconnect/database');
*/
const request = require('request');

// Function to query payments from QuickBooks
async function queryPayment(qbo, realmId, sqlQuery = "SELECT * FROM Payment") {
  let conlog = [];
  console.log("Querying payments with realmId:", realmId);

  if (!qbo) {
    throw new Error('QuickBooks Online instance (qbo) is not available.');
  }

  if (!realmId) {
    throw new Error('Realm ID is not available.');
  }

  console.log('Using Realm ID:', realmId);
  console.log('SQL Query:', sqlQuery);
  

  const minorversion = 'minorversion=73';
  const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=${encodeURIComponent(sqlQuery)}&${minorversion}`;
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${qbo.token}`, // Use qbo.token directly
  };

  try {
    // Fetch payments from QuickBooks API
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Failed to fetch Payment. Status: ${response.status}`);
    }

    const body = await response.json();
    const payments = body.QueryResponse?.Payment || [];

    if (!payments.length) {
      console.warn('No payments found in the API response.');
      return []; // Return an empty array if no payments found
    }

    // Summarize Payment data
    const paymentSummary = payments.map((payment) => ({
      CustomerName: payment.CustomerRef.name || 'No',
      CustomerId: payment.CustomerRef.value || 0,
      TotalAmount: payment.TotalAmt || 0,
      TransactionDate: payment.TxnDate || '1970-12-12',
      PaymentId: payment.Id || 0,
      DepositToAccountId: payment.DepositToAccountRef?.value || 0,
      UnappliedAmount: payment.UnappliedAmt || 0,
      Currency: payment.CurrencyRef.name || 'No',
      LinkedTxnId: payment.LinkedTxn?.[0]?.TxnId || 0,
      LinkedTxnType: payment.LinkedTxn?.[0]?.TxnType || 'No',
    }));

    console.log('Payment Summary:', paymentSummary);
    return paymentSummary;
  } catch (err) {
    console.error('Error fetching payments:', err);
    throw err; // Rethrow error to handle it upstream
  }
}


/*
  try {
    console.log('Fetching payments from QBO...');
    const paymentSummary = await fetchpayments();

    if (paymentSummary.length === 0) {
      console.warn('No Payment data to insert into the database.');
      return;
    }

    console.log('Inserting payments into the database...');
    await insertpayments(paymentSummary); // Pass paymentSummary to the provided database function
    console.log('payments inserted successfully.');
  } catch (err) {
    console.error('Error during Payment processing:', err.message);
  }
*/


module.exports = { queryPayment };
