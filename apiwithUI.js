const express = require('express');
const app = express();
const { MongoClient } = require('mongodb');
const Mongo = require('mongodb');
const url = "mongodb+srv://vamsiuser:1234@cluster0.3allhe5.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(url);

async function main() {
    await client.connect();
}

const collection = client.db('vamsi').collection('users');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 1234;

const swaggerUi = require('swagger-ui-express');
const swaggerDocuments = require('./swagger.json');
const package = require('./package.json');

swaggerDocuments.info.version = package.version;
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerDocuments));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

app.use(express.static(__dirname+'/public'))
app.set('views','./src/views');
app.set('view engine','ejs');


app.get('/health', (req, res) => {
    res.send('Health ok');
});

app.get('/', async (req, res) => {
    const output = [];
    const cursor  = collection.find();
    for await (const doc of cursor){
        output.push(doc);
    }
    cursor.closed;
    res.render('index', {data: output});
});

app.get('/new', (req, res) => {
    res.render('forms');
})


app.post('/addUser', async (req, res) => {
    let data = {
        name : req.body.name,
        city : req.body.city,
        phone : req.body.phone,
        role : req.body.role ? req.body.role : 'User',
        isActive : true
    }
    await collection.insertOne(data);
    res.send('data added');
});

//get users
app.get('/users', async (req, res) => {
    console.log("calling/...");
    const output = [];
    let query = {};
    if(req.query.city && req.query.role){
        query = {
            city:req.query.city,
            role:req.query.role,
            isActive:true
        }
    }
    else if(req.query.city){
        query = {
            city:req.query.city,
            isActive:true
        }
    }else if(req.query.role){
        query = {
            role:req.query.role,
            isActive:true
        }
    }else if(req.query.isActive){
        let isActive = req.query.isActive;
        if(isActive == "false"){
            isActive = false
        }else{
            isActive = true
        }
        query = {isActive}
    }else{
        query = {isActive:true}
    }
    const cursor = collection.find(query);
    for await(const data of cursor){
        output.push(data);
    }
    cursor.closed;
    res.send(output);
});

//get particular user
app.get('/user/:id',async (req,res) => {
    const output = [];
    let query = {_id:new Mongo.ObjectId(req.params.id)}
    const cursor = collection.find(query);
    for await (const data of cursor){
        output.push(data)
    }
    cursor.closed;
    res.send(output)
});



//update user
app.put('/updateUser',async(req,res) => {
    await collection.updateOne(
        {_id:new Mongo.ObjectId(req.body._id)},
        {
            $set:{
                name:req.body.name,
                city: req.body.city,
                phone: req.body.phone,
                role: req.body.role,
                isActive: true  
            }
        }
    )
    res.send('Record Updated')
});

/* Delete User */
app.delete('/deleteUser',async(req,res) => {
    await collection.deleteOne({
        _id:new Mongo.ObjectId(req.body._id)
    })
    res.send('User Deleted')
});

//softdelete user
app.put('/deactivateUser',async(req,res) => {
    await collection.updateOne(
        {_id:new Mongo.ObjectId(req.body._id)},
        {
            $set:{
                isActive: false  
            }
        }
    )
    res.send('User Deactivated')
});

//softdelete user
app.put('/activateUser',async(req,res) => {
    await collection.updateOne(
        {_id:new Mongo.ObjectId(req.body._id)},
        {
            $set:{
                isActive: true  
            }
        }
    )
    res.send('User Activated')
});

app.listen(port, (err) => {
    main();
    if (err) throw err;
    console.log('listening on port', port);
});