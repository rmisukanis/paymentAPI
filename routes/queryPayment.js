//grabs paymnets and places them into the database

const { getQboInstance, getRealmId } = require('./oauth');;
const { InsertPayments } = require('../dbconnect/database');
const request = require('request');

async function queryPayment() {
  const checkQboInstance = () =>
    new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        const qbo = getQboInstance();
        if (qbo) {
          clearInterval(interval);
          resolve(qbo);
        }
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timeout waiting for QBO instance.'));
      }, 10000); // 10-second timeout
    });

  try {
    console.log('Waiting for QBO instance to initialize...');
    const qbo = await checkQboInstance();
    console.log('QBO instance initialized. Ready to make API requests.');

    const realmId = getRealmId();
    if (!realmId) {
      throw new Error('Realm ID is not available.');
    }

    console.log('Using Realm ID:', realmId);

    const minorversion = 'minorversion=73';


    //select * from Payment Where Metadata.LastUpdatedTime>'2024-11-24' old query, TxnDate >'2024-09-28'
    const options = {
      url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Payment Where id = '231' Order By Metadata.LastUpdatedTime&${minorversion}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${qbo.token}`, // Use qbo.token
      },
    };

    console.log('Making API request with options:');

    function fetchPayments() {
      return new Promise((resolve, reject) => {
        console.log('Initializing API request for payments...');
        request.get(options, function (error, response, body) {
          if (error) {
            console.error('Error fetching payment:', error);
            return reject(error);
          }
          if (response.statusCode !== 200) {
            console.error('Failed to fetch payment. Status:', response.statusCode, body);
            return reject(new Error('Failed to fetch payment.'));
          }

          try {
            const paymentBody = JSON.parse(body);
            const payments = paymentBody.QueryResponse?.Payment || [];

            if (!payments.length) {
              console.warn('No payments found in the API response.');
              return resolve([]);
            }


            //payment summary
            const paymentSummary = payments.map(payment => ({
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

            console.log('Payments fetched successfully:', paymentSummary);
            resolve(paymentSummary);
          } catch (err) {
            console.error('Error parsing payment data:', err);
            reject(err);
          }
        });
      });
    }

    try {
      console.log('Fetching payments from QBO...');
      const paymentSummary = await fetchPayments();

      if (paymentSummary.length === 0) {
        console.warn('No payment data to insert into the database.');
        return;
      }

      console.log('Inserting payments into the database...');
     // await InsertPayments(paymentSummary);

      console.log('Payments inserted successfully.');
    } catch (err) {
      console.error('Error during payment processing:', err.message);
    }
  } catch (err) {
    console.error('Error in queryPayment function:', err.message);
  }
}

module.exports = queryPayment();
