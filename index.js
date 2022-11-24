const express = require("express");
const cors = require("cors");

const port = process.env.PORT || 5000;

const app = express();

require("dotenv").config();

//middle were
app.use(cors());
app.use(express.json());

//database connection

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kryxy3e.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const categoryCollection = client.db("ReRide").collection("categories");

    //categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoryCollection.find(query).toArray();
      res.send(categories);
    });
  } finally {
  }
}

run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Resale webite server is running");
});

app.listen(port, () => console.log(`resale website running on:${port}`));
