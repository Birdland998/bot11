const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

const app = express();

const config = {
  channelAccessToken: '1CbM8LxsPpxZkA0HoEn29Fl5kz83AsgEhc/XtBbJfe10HHGYEN6fGj9Q8QYplZ6LvddKt5k/uR9/5ACwLxfrdgKbz2bqgYk0qNAZJ2wJD+qFDlfoThMuMDHq6N+lhCwYMNbJ0e+JXTFK0lHWLLhMVAdB04t89/1O/w1cDnyilFU=',
  channelSecret: '068853be54359302c3512a347f6c4121',
};

const AIRTABLE_API_KEY = 'key1gMTCJzvSbvJWo';
const AIRTABLE_BASE_ID = 'appMVwGc53L1tTUVv';
const AIRTABLE_TABLE_NAME = 'Expenses';

const client = new line.Client(config);

app.use(express.json());

app.post('/webhook', line.middleware(config), async (req, res) => {
  try {
    const events = req.body.events;
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const userId = event.source.userId;
        const message = event.message.text;

        // Parse the message to extract expense details
        const [date, category, amount, description] = message.split(',');

        // Store expense data in Airtable
        try {
          await createExpenseRecord(date, category, amount, description);
          await replyMessage(userId, 'Expense recorded successfully!');
        } catch (error) {
          console.error('Error creating expense record:', error);
          await replyMessage(userId, 'Error recording expense. Please try again.');
        }
      }
    }
  } catch (error) {
    console.error('Line webhook error:', error);
  }

  res.sendStatus(200);
});

async function createExpenseRecord(date, category, amount, description) {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_NAME}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_API_KEY}`,
    'Content-Type': 'application/json',
  };
  const data = {
    records: [
      {
        fields: {
          Date: date.trim(),
          Category: category.trim(),
          Amount: parseFloat(amount.trim()),
          Description: description.trim(),
        },
      },
    ],
  };

  try {
    await axios.post(url, data, { headers });
    console.log('Expense record created successfully.');
  } catch (error) {
    throw new Error('Failed to create expense record: ' + error);
  }
}

async function replyMessage(userId, message) {
  try {
    await client.pushMessage(userId, { type: 'text', text: message });
    console.log('Message sent successfully.');
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
