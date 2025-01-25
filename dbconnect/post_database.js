 require('dotenv').config();
const express = require("express");
const { Sequelize, DataTypes } = require("sequelize");

const app = express();
const port = process.env.DB_PORT || 3001;
app.use(express.json());

console.log(process.env.DB_URL);

const sequelize = new Sequelize(process.env.DB_URL, {
    dialect: "sqlite",
    storage: './database.sqlite',
    logging: false,
    dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
});

sequelize.sync().then(() => {console.log('Database connected')}).catch((err) => {console.log(err)});

//model schema
const post = sequelize.define('post', {
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    content: {
        type: DataTypes.STRING,
        allowNull: false
    }
})

/*
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post('/create-post', async(req, res) => {
    const {title, content} = req.body;
    try {
        const newPost = await post.create({ title, content});
        res.json(newPost);
    } catch (err) {
        console.log(err);
    }
})

app.get("/get-posts", async (req, res) => {
    try {
      const allPosts = await post.findAll();
      res.json(allPosts);
    } catch (err) {
      console.log(err);
    }
  });
*/

/*
  app.post('/create-tables', async (req, res) => {
    try {
        // Call the function to create tables
        await createTables();
        res.status(200).send('Tables created successfully or already exist.');
    } catch (err) {
        console.error('Error in table creation process:', err);
        res.status(500).send('Error creating tables');
    }
});
*/



  //SQL Functions
// Function to create the tables
// Define the Payments model
const Payment = sequelize.define('Payment', {
    PaymentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CustomerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CustomerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TotalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    TransactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    DepositToAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    UnappliedAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    Currency: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    LinkedTxnId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    LinkedTxnType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
  }, {
    tableName: 'payments', // Explicitly specify the table name (optional)
    timestamps: false, // Disable Sequelize's automatic createdAt/updatedAt columns
  });
  
  // Define the Invoices model
  const Invoice = sequelize.define('Invoice', {
    InvoiceId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    CustomerName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    CustomerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    TotalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    TransactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    Balance: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    LinkedTxnId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    LinkedTxnType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    InvoiceDocNum: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    DueDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'invoices', // Explicitly specify the table name (optional)
    timestamps: false, // Disable Sequelize's automatic createdAt/updatedAt columns

  });
  
  // Define the Deposits model
  const Deposit = sequelize.define('Deposit', {
    DepositId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    DepositToAccountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    DepositToAccountName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    TotalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    TransactionDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  }, {
    tableName: 'deposits', // Explicitly specify the table name (optional)
    timestamps: false, // Disable Sequelize's automatic createdAt/updatedAt columns
  });
  
  // Function to create tables (now Sequelize-managed)
  async function createTables() {
    try {
      // Sync all models (create tables if they don't exist)
      await sequelize.sync(); // This will create the tables based on the defined models
      console.log('Tables created successfully or already exist.');
    } catch (err) {
      console.error('Error creating tables:', err);
      throw err; // Rethrow the error to be handled by the route
    }
  }

createTables();

// Insert Payments using Sequelize
async function InsertPayments(payments) {
    try {
        // Log the current payments array to debug
        console.log('Inserting payments:', payments);

        // Use bulkCreate for batch insert
        await Payment.bulkCreate(payments, {
            validate: true, // Optional: validates the payments before inserting
            ignoreDuplicates: true, // Optional: ignore duplicate entries (based on unique keys, if necessary)
        });

        console.log('All payments inserted successfully.');
        return true;
    } catch (error) {
        console.error('Error inserting payments:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    createTables,
    InsertPayments,
};
/*
app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
*/