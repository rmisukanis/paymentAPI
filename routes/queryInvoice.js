//query ivoice and places into database
const { getQboInstance, getRealmId } = require('../oauth');
const { InsertPayments,  InsertInvoices, ensureDatabaseExists,
  ensurePaymentTableExists } = require('../dbconnect/database');
const request = require('request');

async function queryInvoice() {
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
      }, 1000000); // 10-second timeout
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

    //TxnDate >= '2024-09-28'
    const options = {
      url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Invoice where id = '228'&${minorversion}`,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${qbo.token}`, // Use qbo.token
      },
    };

    console.log('Making API request with options:');

    function fetchInvoices() {
      return new Promise((resolve, reject) => {
        console.log('Initializing API request for invoice...');
        request.get(options, function (error, response, body) {
          if (error) {
            console.error('Error fetching invoice:', error);
            return reject(error);
          }
          if (response.statusCode !== 200) {
            console.error('Failed to fetch invoice. Status:', response.statusCode, body);
            return reject(new Error('Failed to fetch invoice.'));
          }

          try {
            
            const invoiceBody = JSON.parse(body);
            const invoice = invoiceBody.QueryResponse?.Invoice || [];
            

            if (!invoice.length) {
              console.warn('No payments found in the API response.');
              return resolve([]);
            }
           
            const invoiceSummary = invoice.map(invoice => ({
              InvoiceId: invoice.Id || 0,
              CustomerName: invoice.CustomerRef.name || 'No',
              CustomerId: invoice.CustomerRef.value || 0,
              TotalAmount: invoice.TotalAmt || 0,
              TransactionDate: invoice.TxnDate || '1970-12-12',
              Balance: invoice.Balance || 0,
              LinkedTxnId: invoice.LinkedTxn?.[0]?.TxnId || 0,
              LinkedTxnType: invoice.LinkedTxn?.[0]?.TxnType || 'No',
              InvoiceDocNum: invoice.DocNumber || 0,
              DueDate: invoice.DueDate || '1970-12-12',       
            }))
            
            console.log(invoiceSummary)
            resolve(invoiceSummary)
       
          } catch (err) {
            console.error('Error parsing payment data:', err);
            reject(err);
          }
        });
      });
    }

    ///*
    try {
      console.log('Fetching invoices from QBO...');
      const invoiceSummary = await fetchInvoices();

      if (invoiceSummary.length === 0) {
        console.warn('No invoice data to insert into the database.');
        return;
      }

      console.log('Inserting invoices into the database...');
      //await InsertInvoices(invoiceSummary);
    

      console.log('Invoices inserted successfully.');
    } catch (err) {
      console.error('Error during payment processing:', err.message);
    }
    //*/
  } catch (err) {
    console.error('Error in queryInvoice function:', err.message);
  }
  
}

module.exports = queryInvoice();

