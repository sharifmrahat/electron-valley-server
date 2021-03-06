const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion } = require("mongodb");
const objectId = require("mongodb").ObjectId;
const port = process.env.PORT || 5000;
require("dotenv").config();

const app = express();

//--------------Middleware--------------\\

app.use(express.json());
app.use(cors());

function verifyToken(req, res, next) {
  const authHeader = req?.headers?.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  const userToken = authHeader.split(" ")[1];
  jwt.verify(userToken, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
    if (error) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    req.decoded = decoded;
  });
  next();
}

//--------------MongoDB : Database--------------\\

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.6olzz.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    console.log("Database: MongoDB is connected");

    const productCollection = client
      .db("ElectronValley")
      .collection("products");

    //--------------AUTH : TOKEN-------------\\

    app.post("/getToken", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });

    //--------------POST : CREATE---------------\\

    app.post("/products", async (req, res) => {
      const newProduct = req.body;
      const result = await productCollection.insertOne(newProduct);
      res.send(result);
    });

    //--------------GET : READ--------------\\

    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });

    //------------PUT : UPDATE-------------\\

    app.put("/update/:id", async (req, res) => {
      const id = req?.params?.id;
      const updateProduct = req.body;
      const filter = { _id: objectId(id) };

      const options = { upsert: true };
      const updateDoc = {
        $set: updateProduct,
      };
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send(result);
    });

    //---------------DELETE---------------\\
    app.delete("/products/:id", async (req, res) => {
      const id = req?.params?.id;
      const query = { _id: objectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    //--------------GET : READ--------------\\

    app.get("/userItems", verifyToken, async (req, res) => {
      const decodedEmail = req?.decoded?.email;
      const ownerEmail = req?.query?.owner;
      if (decodedEmail === ownerEmail) {
        const query = { owner: ownerEmail };
        const cursor = productCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      } else {
        return res.status(403).send({ message: "Forbidden access" });
      }
    });
  } finally {
  }
}

run().catch(console.dir);

//--------------Root API--------------\\

app.get("/", (req, res) => {
  res.send("Node server is running");
});

app.listen(port, () => {
  console.log("Server: Port is connected at", port);
});
