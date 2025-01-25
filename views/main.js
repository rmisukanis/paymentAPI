

function clearResultBox() {
    document.getElementById('result-box').innerHTML = ''; // Clear the result-box content
  }

  function parseCSV(csvData) {
    const rows = csvData.split('\n');  // Split the data into rows
  
    // Extract headers (first row) and trim any excess spaces
    const headers = rows[0].split(',').map(header => header.trim().replace(/['"]/g, ''));
  
    // Initialize an empty array to hold the parsed data
    const parsedData = [];
  
    // Loop through each row starting from index 1 (skip header row)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i].trim();
  
      if (row) { // Skip empty rows
        const columns = row.split(',').map(col => col.trim().replace(/['"]/g, ''));
  
        // Map the row data to an object using headers as keys
        const rowData = {};
        headers.forEach((header, index) => {
          let value = columns[index] || ''; // Avoid undefined errors if columns are missing
  
          // Perform custom logic to handle specific fields
          if (header === 'amount') {
            value = parseFloat(value);  // Convert the 'amount' field to a number
          } else if (header === 'TxnDate' && value) {
            value = new Date(value).toISOString().split('T')[0];  // Convert 'txnDate' to YYYY-MM-DD format
          }
  
          rowData[header] = value; // Assign the value to the corresponding header
        });
  
        // Push the formatted row data to the parsedData array
        parsedData.push(rowData);
      }
    }
  
    return parsedData;  // Return the final array of parsed data
  }
  
  
  
 
  //
  function consoleParseCSV(deposits) {
    // Iterate over the array
    deposits.forEach((item, index) => {
      // Create a new paragraph for each item in the array
      const itemElement = document.createElement('div'); // Use div instead of p for flexibility

      // Check if the item is an object
      if (typeof item === 'object' && item !== null) {
          // Iterate over the object's key-value pairs
          itemElement.innerHTML += '{'
          for (const key in item) {
              if (item.hasOwnProperty(key)) {
                  // Add each key-value pair with <br> after it
                  const logEntry = `${key}: <span class="key">${item[key]}</span><br>`;
                  itemElement.innerHTML += logEntry; // Append to item element
              }
          }
          itemElement.innerHTML += '}'
      } else {
          // For non-objects (just primitive values like strings, numbers), display them
          itemElement.innerHTML = `Item ${index + 1}: ${item}`;
      }
      // Append the item element to the result-box
      document.getElementById('result-box').appendChild(itemElement);
  });

  }

  