
/*
const { InsertPayments,  InsertInvoices, ensureDatabaseExists,
  ensurePaymentTableExists } = require('./dbconnect/database');
*/
const request = require('request');

//, insertInvoices
async function queryInvoice(qbo, realmId) {
  console.log("Querying invoices with realmId:", realmId);
  
  if (!qbo) {
    throw new Error('QuickBooks Online instance (qbo) is not available.');
  }

  if (!realmId) {
    throw new Error('Realm ID is not available.');
  }

  console.log('Using Realm ID:', realmId);

  const minorversion = 'minorversion=73';
  const url = `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/query?query=select * from Invoice where id = '228'&${minorversion}`;
  const headers = {
    Accept: 'application/json',
    Authorization: `Bearer ${qbo.token}`, // Use qbo.token directly
  };

  try {
    // Fetch invoices from QuickBooks API
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch invoice. Status: ${response.status}`);
    }

    const body = await response.json();
    const invoice = body.QueryResponse?.Invoice || [];

    if (!invoice.length) {
      console.warn('No invoices found in the API response.');
      return []; // Return an empty array if no invoices found
    }

    const invoiceSummary = invoice.map(invoice => ({
      InvoiceId: invoice.Id || 0,
      CustomerName: invoice.CustomerRef?.name || 'No',
      CustomerId: invoice.CustomerRef?.value || 0,
      TotalAmount: invoice.TotalAmt || 0,
      TransactionDate: invoice.TxnDate || '1970-12-12',
      Balance: invoice.Balance || 0,
      LinkedTxnId: invoice.LinkedTxn?.[0]?.TxnId || 0,
      LinkedTxnType: invoice.LinkedTxn?.[0]?.TxnType || 'No',
      InvoiceDocNum: invoice.DocNumber || 0,
      DueDate: invoice.DueDate || '1970-12-12',
    }));

    console.log(invoiceSummary);
    return invoiceSummary;
    
  } catch (err) {
    console.error('Error fetching invoices:', err);
    throw err; // Rethrow error to handle it upstream
  }
}

/*
  try {
    console.log('Fetching invoices from QBO...');
    const invoiceSummary = await fetchInvoices();

    if (invoiceSummary.length === 0) {
      console.warn('No invoice data to insert into the database.');
      return;
    }

    console.log('Inserting invoices into the database...');
    await insertInvoices(invoiceSummary); // Pass invoiceSummary to the provided database function
    console.log('Invoices inserted successfully.');
  } catch (err) {
    console.error('Error during invoice processing:', err.message);
  }
*/


module.exports = { queryInvoice };
