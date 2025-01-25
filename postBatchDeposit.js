const request = require('request');

// postDeposit function which accepts qbo, realmId, and deposits as parameters
async function postDeposit(qbo, realmId, deposits) {
  try {
    if (!qbo) {
      throw new Error('QuickBooks Online instance (qbo) is not available.');
    }

    if (!realmId) {
      throw new Error('Realm ID is not available.');
    }

    console.log('Using Realm ID:', realmId);

    // Set minorversion for QuickBooks API
    const minorversion = 'minorversion=75';

    // Function to dynamically generate the batch request
    function generateBatchRequest(deposits) {
      return {
        "BatchItemRequest": deposits.map((deposit, index) => ({
          "bId": `bid${index + 1}`,
          "operation": "create",
          "Deposit": {
            "DepositToAccountRef": {
              "value": deposit.accountValue,
              "name": deposit.accountName
            },
            "TxnDate": deposit.TxnDate,
            "Line": [
              {
                "Amount": deposit.amount,
                "LinkedTxn": [
                  {
                    "TxnId": deposit.txnId,
                    "TxnType": "Invoice",
                    "TxnLineId": "0"
                  }
                ]
              }
            ]
          }
        }))
      };
    }

    // Generate batch request based on the deposits
    const batchRequest = generateBatchRequest(deposits);

    // Setup request options
    const options = {
      method: 'POST',
      url: `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}/batch?${minorversion}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${qbo.token}` // Use qbo.token
      },
      body: JSON.stringify(batchRequest)
    };

    console.log('Making API request with options:', options);

    // Make API request to QuickBooks
    request(options, (error, response, body) => {
      if (error) {
        console.error('Error:', error);
      } else if (!error && response.statusCode === 200) {
        try {
          const depositsBody = JSON.parse(body);
          console.log('Success:', depositsBody);
          if (depositsBody.BatchItemResponse) {
            const processedDeposits = depositsBody.BatchItemResponse.map(item => {
              const deposit = item.Deposit;

              // Extract Deposit ID and LinkedTxn information
              const depositId = deposit.Id;
              const linkedTxn = deposit.Line.map(line => line.LinkedTxn).flat(); // Flatten LinkedTxn arrays

              return { depositId, linkedTxn };
            });

            // Log the extracted information
            processedDeposits.forEach((deposit, index) => {
              console.log(`Deposit ${index + 1}:`);
              console.log(`  Deposit ID: ${deposit.depositId}`);
              console.log(`  Linked Transactions:`, deposit.linkedTxn);
            });
          } else {
            console.error('No BatchItemResponse found in the response.');
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
        }
      } else {
        console.error('Error:', response.statusCode, body);
      }
    });

  } catch (error) {
    console.error('Error processing deposit:', error);
  }
}

module.exports = { postDeposit };
