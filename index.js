
//import
const express = require('express');
const cors = require('cors')
const app = express();
const bodyParser = require('body-parser')
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId
const port = process.env.PORT || 4000
const jwt = require('jsonwebtoken');

//middleware
app.use(bodyParser.json())
app.use(cors())
app.use(express.json())

// check jwt token


function verifyJwt(req, res, next) {
    const hederAuth = req.headers.authorization
    if (!hederAuth) {
        return res.status(401).send({ message: 'unauthorized access.try again' })
    }
    else {
        const token = hederAuth.split(' ')[1]
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                return res.status(403).send({ message: 'forbidden access' })
            }
            console.log('decoded', decoded);
            req.decoded = decoded;
            next()
        })
    }
    console.log(hederAuth, 'inside verifyjwt');
   
}


//get,post
app.get('/', (req, res) => {
    res.send('genius car---runnig!')

})



//connect to db

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.eowzq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {

        await client.connect();
        const serviceCollection = client.db('Genius-Car').collection('service')
        const orderCollection = client.db('Genius-Car').collection('order');
        console.log("genius db connected")

        //auth

        //get secret key : require('crypto').randomBytes(64).toString('hex')
        app.post('/login', async (req, res) => {
            const user = req.body;
            // console.log(process.env.ACCESS_TOKEN_SECRET,'token');
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });

        })




        // services api
        //get from DB
        app.get('/service', async (req, res) => {
            const query = {}
            const cursor = serviceCollection.find(query)

            const services = await cursor.toArray()
            res.send(services)
        })

        // get by id
        app.get('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const service = await serviceCollection.findOne(query)
            res.send(service)
        })


        //post to
        app.post('/service', async (req, res) => {
            const newService = req.body
            const result = await serviceCollection.insertOne(newService)
            res.send(result)
        })

        //delete 
        app.delete('/service/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: ObjectId(id) }
            const result = await serviceCollection.deleteOne(query)
            res.send(result)
        })


        // order collection api
        //post order DB

        app.post('/order', async (req, res) => {

            const order = req.body;
            const result = await orderCollection.insertOne(order)
            res.send(result)
        })

        // get all order from db
        app.get('/order', async (req, res) => {
            const query = {}
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
        })
        // get orders by email 
        app.get('/singleOrder', verifyJwt, async (req, res) => {
            const decodedEmail = req.decoded.email
            const email = req.query.email
            if (email === decodedEmail) {
                const query = { email: email }
            const cursor = orderCollection.find(query)
            const orders = await cursor.toArray()
            res.send(orders)
            }
            else {
                return res.status(403).send({ message: 'forbidden access' })
            }
        })
    }
    finally {

    }
}
run().catch(console.dir);




//check 
app.listen(port, () => {
    console.log(`server is running ${port}`)
})