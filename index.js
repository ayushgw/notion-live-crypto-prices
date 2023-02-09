const axios = require('axios')
const cron = require('node-cron')
const { Client } = require('@notionhq/client')
const https = require('https');
const express = require("express");
require('dotenv').config();

const axiosClient = axios.create({
  timeout: 160000,
  maxContentLength: 500 * 1000 * 1000,
  httpsAgent: new https.Agent({ keepAlive: true }),
})

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const databaseId = process.env.NOTION_DATABASE_ID
const defaultCurrency = process.env.DEFAULT_CURRENCY

const refreshDB = async () => {
  const { results } = await notion.databases.query({ database_id: databaseId });
  updateCryptoData(results);
}

const updateCryptoData = async (notionPages) => {
  notionPages.map(async (page) => {
    const tokenId = page.properties.Id.rich_text[0]?.text.content || "EMPTY"
    if (tokenId != "EMPTY") {
      const currentPrice = await fetchPriceOnCoinGecko(tokenId, defaultCurrency)
      _updateNotionTable(page.id, currentPrice)
    }
  })
}

async function fetchPriceOnCoinGecko(coin, defaultCurrency) {
  try {
    const response = await axiosClient.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=${defaultCurrency}`);
    return response.data[`${coin}`][defaultCurrency.toLowerCase()]
  } catch (error) {
    console.error(error);
  }
}

async function _updateNotionTable(pageId, currentPrice) {
  notion.pages.update({
    page_id: pageId,
    properties: {
      Price: {
        number: currentPrice
      }
    }
  })
}

app = express(); // Initializing app

// Creating a cron job which runs on every 30 second
cron.schedule("*/30 * * * * *", function() {
  console.log("running a task every 10 second");
  refreshDB();
});

app.listen(3000);