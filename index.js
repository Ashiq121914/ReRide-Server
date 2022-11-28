const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const port = process.env.PORT || 5000;

const app = express();

require("dotenv").config();

//stripe key
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
console.log(process.env.STRIPE_SECRET_KEY);

//middle were
app.use(cors());
app.use(express.json());

//database connection

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kryxy3e.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

//jwt function
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const categoryCollection = client.db("ReRide").collection("categories");
    const categoryProductCollection = client
      .db("ReRide")
      .collection("allCategoryProducts");
    const usersCollection = client.db("ReRide").collection("users");
    const bookingsCollection = client.db("ReRide").collection("bookings");

    const advertiseCollection = client.db("ReRide").collection("advertise");
    const paymentsCollection = client
    .db("ReRide")
    .collection("payments");
    const wishlistCollection = client
    .db("ReRide")
    .collection("wishlists");

    //verify seller
    const verifySeller = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.userType !== "seller") {
        return res.status(403).status({ message: "forbidden" });
      }
      next();
    };
    //verify admin
    const verifyAdmin = async (req, res, next) => {
      const decodedEmail = req.decoded.email;
      const query = { email: decodedEmail };
      const user = await usersCollection.findOne(query);

      if (user?.userType !== "admin") {
        return res.status(403).status({ message: "forbidden" });
      }
      next();
    };

    //jwt
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, {
          expiresIn: "2d",
        });
        return res.send({ accessToken: token });
      }

      res.status(403).send({ accessToken: " " });
    });

    //categories
    app.get("/categories", async (req, res) => {
      const query = {};
      const categories = await categoryCollection.find(query).toArray();
      res.send(categories);
    });

    // geting advertised items
    app.get("/advertisedItems", async (req, res) => {
      const query = {advertised:true};
      const categories = await categoryProductCollection.find(query).toArray();
      res.send(categories);
    });

    //getting all users
    app.get("/users",verifyJWT, async (req, res) => {
      const query = {};
      const categories = await usersCollection.find(query).toArray();
      res.send(categories);
    });

    //getting a particular user
    app.get("/users/:email",verifyJWT, async (req, res) => {
      const email = req.params.email;
      console.log(email)
      const query = { email: email };
      const user = await usersCollection.find(query);
      
      res.send(user);
    });

    // for admin check
    app.get("/users/admin/:email",async (req, res) => {
      const email = req.params.email;

      const query = { email: email };
      const user = await usersCollection.findOne(query);

      res.send({ idAdmin: user?.userType === "admin" });
    });
    // for Seller check
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      res.send({ idSeller: user?.userType === "seller" });
    });

    // geting data for each category
    app.get("/category/:id", async (req, res) => {
      const id = req.params.id;

      const query = { category_id: id };

      const CategoryProducts = await categoryProductCollection
        .find(query)
        .toArray();
      res.send(CategoryProducts);
    });


    

    app.get("/bookings", verifyJWT, async (req, res) => {
      const email = req.query.email;

      

      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { userEmail: email };

      const bookings = await bookingsCollection.find(query).toArray();
      

      res.send(bookings);
    });
    //wishlist
    app.get("/wishlists", verifyJWT, async (req, res) => {
      const email = req.query.email;
      

      const decodedEmail = req.decoded.email;
      
      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { userEmail: email };

      const wishlists = await wishlistCollection.find(query).toArray();
      res.send(wishlists);
    });

    // getting seller products
    app.get("/products", verifyJWT, verifySeller, async (req, res) => {
      const email = req.query.email;

      const decodedEmail = req.decoded.email;

      if (email !== decodedEmail) {
        return res.status(403).send({ message: "forbidden access" });
      }
      const query = { seller_email: email };

      const products = await categoryProductCollection.find(query).toArray();
      res.send(products);
    });

    //getting all buyers
    app.get("/allbuyer", verifyJWT, verifyAdmin, async (req, res) => {
      const filter = { userType: "user" };
      const allbuyers = await usersCollection.find(filter).toArray();
      res.send(allbuyers);
    });
    //getting all seller
    app.get("/allseller", verifyJWT, verifyAdmin, async (req, res) => {
      const filter = { userType: "seller" };
      const allseller = await usersCollection.find(filter).toArray();
      res.send(allseller);
    });

    // getting a bookings
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });
    // getting a wishlist
    app.get("/wishlists/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const wishlist = await wishlistCollection.findOne(query);
      res.send(wishlist);
    });

    // updating user info
    app.put("/users/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;
      

      const filter = { seller_email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          seller_state: "verified",
        },
      };
      const result = await categoryProductCollection.updateMany(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // wishlist
    app.post("/wishlist", async (req, res) => {
      const wishlist = req.body;
      const result = await wishlistCollection.insertOne(wishlist);
      res.send(result);
    });

    // posting a product
    app.post("/products", verifyJWT, verifySeller, async (req, res) => {
      const product = req.body;
      const result = await categoryProductCollection.insertOne(product);
      res.send(result);
    });

    // posting a advertise
    app.post("/advertiseProduct", verifyJWT, verifySeller, async (req, res) => {
      const product = req.body;

      
      
      const id = product._id;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          advertised: true,
        },
      };
      const updatedResult = await categoryProductCollection.updateOne(
        filter,
        updatedDoc
      );
      
      



      
      res.send({result:"updated"});
    });

    app.post("/users", async (req, res) => {
      const user = req.body;

      const filter = { email: user.email };
      const email = await usersCollection.findOne(filter);
      if (email) {
        res.send({ message: "already have account with this email" });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });

    //bookings
    app.post("/bookings", async (req, res) => {
      const booking = req.body;

      const query = {
        userEmail: booking.userEmail,
        productName: booking.productName,
      };

      const alreadyBooked = await bookingsCollection.find(query).toArray();

      if (alreadyBooked.length) {
        const message = `you already book ${booking.productName}`;
        return res.send({ acknowledged: false, message });
      }

      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    // payment with stripe for orders
    app.post("/create-payment-intent", async (req, res) => {
      const booking = req.body;
      
      const productPrice = booking.productPrice;
      
      const amount = productPrice * 100;

      const paymentIntent = await stripe.paymentIntents.create({  
        currency: "usd",
        amount: amount,
        "payment_method_types": ["card"],   
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });
    // payment with stripe for wishlist
    app.post("/create-payment-intent-wishlist", async (req, res) => {
      const wishlist = req.body;
      console.log(wishlist)
      
      const resale_price = wishlist.resale_price;
      
      const amount = resale_price * 100;

      const paymentIntent = await stripe.paymentIntents.create({  
        currency: "usd",
        amount: amount,
        "payment_method_types": ["card"],     
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // updating payments info for my order
    app.post("/payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      const updatedResult2 = await categoryProductCollection.updateOne(
        filter,
        updatedDoc
      );
      
      res.send(result);
    });
  
    // updating payments info for wishlist
    app.post("/wishlist-payments", async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await wishlistCollection.updateOne(
        filter,
        updatedDoc
      );
      
      res.send(result); 
    });

    // deleting product category
    app.delete("/products/:id", verifyJWT, verifySeller, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await categoryProductCollection.deleteOne(filter);
      res.send(result);
    });

    // deleting particular user
    app.delete("/users/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };
      const result = await usersCollection.deleteOne(filter);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.log);

app.get("/", async (req, res) => {
  res.send("Resale webite server is running");
});

app.listen(port, () => console.log(`resale website running on:${port}`));
