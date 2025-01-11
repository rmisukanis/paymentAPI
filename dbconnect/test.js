const response = {
    "Payment": {
        "CustomerRef": {
            "value": "27",
            "name": "Video Games by Dan"
        },
        "DepositToAccountRef": {
            "value": "4"
        },
        "TotalAmt": 200.00,
        "UnappliedAmt": 0,
        "ProcessPayment": false,
        "domain": "QBO",
        "sparse": false,
        "Id": "223",
        "SyncToken": "0",
        "MetaData": {
            "CreateTime": "2025-01-05T05:47:06-08:00",
            "LastUpdatedTime": "2025-01-05T05:47:06-08:00"
        },
        "TxnDate": "2025-01-05",
        "CurrencyRef": {
            "value": "USD",
            "name": "United States Dollar"
        },
        "Line": [
            {
                "Amount": 100.00,
                "LinkedTxn": [
                    {
                        "TxnId": "210",
                        "TxnType": "Invoice"
                    }
                ],
                "LineEx": {
                    "any": [
                        {
                            "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            "value": {
                                "Name": "txnId",
                                "Value": "210"
                            },
                            "nil": false,
                            "globalScope": true,
                            "typeSubstituted": false
                        },
                        {
                            "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            "value": {
                                "Name": "txnOpenBalance",
                                "Value": "100.00"
                            },
                            "nil": false,
                            "globalScope": true,
                            "typeSubstituted": false
                        },
                        {
                            "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            "value": {
                                "Name": "txnReferenceNumber",
                                "Value": "1067"
                            },
                            "nil": false,
                            "globalScope": true,
                            "typeSubstituted": false
                        }
                    ]
                }
            },
            {
                "Amount": 100.00,
                "LinkedTxn": [
                    {
                        "TxnId": "211",
                        "TxnType": "Invoice"
                    }
                ],
                "LineEx": {
                    "any": [
                        {
                            "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            "value": {
                                "Name": "txnId",
                                "Value": "211"
                            },
                            "nil": false,
                            "globalScope": true,
                            "typeSubstituted": false
                        },
                        {
                            "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            "value": {
                                "Name": "txnOpenBalance",
                                "Value": "100.00"
                            },
                            "nil": false,
                            "globalScope": true,
                            "typeSubstituted": false
                        },
                        {
                            "name": "{http://schema.intuit.com/finance/v3}NameValue",
                            "declaredType": "com.intuit.schema.finance.v3.NameValue",
                            "scope": "javax.xml.bind.JAXBElement$GlobalScope",
                            "value": {
                                "Name": "txnReferenceNumber",
                                "Value": "1068"
                            },
                            "nil": false,
                            "globalScope": true,
                            "typeSubstituted": false
                        }
                    ]
                }
            }
        ]
    },
    "time": "2025-01-05T05:47:55.413-08:00"
}