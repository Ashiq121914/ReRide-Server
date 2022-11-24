const express = require("express");
const cors = require("cors");

const port = process.env.PORT || 5000;

const app = express();

//middle were
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Resale webite server is running");
});

app.listen(port, () => console.log(`resale website running on:${port}`));
