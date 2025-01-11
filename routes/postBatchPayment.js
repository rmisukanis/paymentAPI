const { getQboInstance, getRealmId } = require('./oauth');
const request = require('request');

async function main() {
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

  // Function to dynamically generate the batch request
  function generateBatchRequest(payments) {
    return {
      "BatchItemRequest": payments.map((payment, index) => ({
        "bId": `bid${index + 1}`,
        "operation": "create",
        "Payment": {
          "CustomerRef": {
            "value": payment.customerId,
            "name": payment.customerName
          },
          "TxnDate": payment.txnDate,
          "TotalAmt": payment.amount,
          "Line": payment.invoices.map(invoice => ({
            "Amount": invoice.amount,
            "LinkedTxn": [
              {
                "TxnId": invoice.txnId,
                "TxnType": "Invoice"
              }
            ]
          }))
        }
      }))
    };
  }
  
  const payments = [
    {
      customerId: "27",
      customerName: "Video Games by Dan",
      amount: 1000.00,
      txnDate: '2024-10-21',
      invoices: [
        { amount: 100.00, txnId: "225" },
        { amount: 100.00, txnId: "226" },
        { amount: 100.00, txnId: "227" },
        { amount: 100.00, txnId: "228" },
        { amount: 100.00, txnId: "214" },
        { amount: 100.00, txnId: "215" },
        { amount: 100.00, txnId: "216" },
        { amount: 100.00, txnId: "217" },
        { amount: 100.00, txnId: "218" },
        { amount: 100.00, txnId: "219" },
        // Add more invoice objects here
      ]
    }
  ];

  const batchRequest = generateBatchRequest(payments);

    const options = {
      method: 'POST',
      url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/batch?${minorversion}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${qbo.token}`, // Use qbo.token
      },
      body: JSON.stringify(batchRequest),
    };

    console.log('Making API request with options:');

    request(options, (error, response, body) => {
      if (error) {
        console.error('Error:', error);
      } else if (!error && response.statusCode === 200) {
        try {
          const paymentsBody = JSON.parse(body);
          console.log('Success:', paymentsBody);

          const paymentBodyResponse = paymentsBody.BatchItemResponse.forEach((response) => {
          //  console.log(response.Fault)
        })
        
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
        }
      } else {
        console.error('Error:', response.statusCode, body);
      }
    });

  } catch (error) {
    console.error('Error processing:', error);
  }
}

main();