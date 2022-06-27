var express = require('express')
var session = require('express-session')

var multer = require('multer')
var upload = multer({ dest: 'public/' })

const { MongoClient } = require('mongodb')
var mongoClient = require('mongodb').MongoClient
var url = 'mongodb+srv://tungnmgch:01274277604@cluster0.hxlsr.mongodb.net/test'


var app = express()

var publicDir = require('path').join(__dirname, '/public');
app.use(express.static(publicDir));

app.set('view engine', 'hbs')
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'Toy',
    resave: false
}))

function isAuthenticated(req, res, next) {
    let login = !req.session.userName
    if (login)
        res.redirect('/login')
    else
        next()
}

app.get('/login', (req, res) => {
    res.render('login')
})
app.post('/checkLogin', async(req, res) => {
    let name = req.body.user
    let pass = req.body.pass
    let server = await MongoClient.connect(url)
    let dbo = server.db("Toy")
    req.session.userName = name
    let user = await dbo.collection("account").find({ $and: [{ 'username': name }, { 'password': pass }] }).toArray()
    if (user.length > 0) {
        res.redirect('/home')
    } else {
        let mes = "Username or password is invalid"
        res.render('login', { "message": mes, "username": name, "password": pass })
    }
})

app.get('/home', isAuthenticated, async(req, res) => {
    let server = await MongoClient.connect(url)
    let dbo = server.db("Toy")
    let user = await dbo.collection("account").find({ 'username': req.session.userName }).toArray()
    res.render('home', { "user": user[0] })
})

app.get('/logout', (req, res) => {
    req.session.userName = null
    req.session.save((err) => {
        req.session.regenerate((err2) => {
            res.redirect('/login')
        })
    })
})

app.get('/signup', (req, res) => {
    res.render('signup')
})
app.post('/login', async(req, res) => {
    let user = req.body.user
    let pass = req.body.pass
    let name = req.body.name
    let phone = req.body.phone
    if (user.length < 3) {
        res.render('signup', { 'error': ">, right" })
        return
    }
    let server = await MongoClient.connect(url)
    let dbo = server.db("Toy")

    let check = await dbo.collection("account").find({ 'username': user }).toArray()
    if (check.length > 0) {
        let mes = "Username is existed"
        res.render('signup', { 'user': user, 'name': name, 'phone': phone, 'mes': mes })
    } else {
        let account = {
            'username': user,
            'password': pass,
            'name': name,
            'phone': phone
        }

        await dbo.collection("account").insertOne(account)
        res.redirect('/login')
    }
})

app.get('/ViewProduct', isAuthenticated, async(req, res) => {
    let server = await MongoClient.connect(url)
    let dbo = server.db("Toy")
    let products = await dbo.collection('product').find().toArray()
    res.render('pro/AllProduct', { 'products': products })
})

app.get('/add', isAuthenticated, (req, res) => {
    res.render('pro/addNew')
})

app.post('/insert', isAuthenticated, upload.single('img'), async(req, res) => {
    let name = req.body.name
    let pub = req.body.pub
    let price = req.body.price
    let cate = req.body.cate
    if (name == "" || pub == "" || price == "" || cate == "") {
        res.render('pro/addNew', { 'error': "Please enter full information", 'name': name, 'pub': pub, 'price': price, 'cate': cate })
        return

    } else if (name.length < 3) {
        res.render('pro/addNew', { 'error': "The name is so short", 'name': name, 'pub': pub, 'price': price, 'cate': cate })
        return
    }
    let product = {
        'name': name,
        'price': price,
        'category': cate,
        'publisher': pub,
        'url': req.file.path.slice(7)
    }
    let server = await MongoClient.connect(url)
    let dbo = server.db("Toy")
    await dbo.collection("product").insertOne(product)
    res.redirect('/ViewProduct')
})
app.post('/search', async(req, res) => {
    let key = req.body.key
    let server = await MongoClient.connect(url)
    let dbo = server.db("Toy")
    let products = await dbo.collection('product').find({ 'name': new RegExp(key, 'i') }).toArray()
    res.render('pro/AllProduct', { 'products': products, "key": key })
})

// app.get('/updateToy/:_id', async(req, res) => {
//     //transform your param into an ObjectId
//     var id = req.params._id;
//     var good_id = new ObjectId(id);
//     //1. kết nối đến server có địa chỉ trong url
//     let server = await MongoClient.connect(url) // await là đợi công việc này hoàn thành mới làm công việc tiếp theo. 
//         //phải có async mới dùng được await 
//         //2. truy cập database ATNToys
//     let dbo = server.db("MyKingdom")
//     let toys = await dbo.collection('toy').find({ '_id': good_id }).limit(1).toArray()
//     console.log(toys[0])
//     res.render('updateToy', { 'toys': toys[0] })
// })

// app.post('/editToy/:_id', async(req, res) => {
//     let nameToy = req.body.nameToy
//     let imgToy = req.body.imgToy
//     let priceToy = req.body.priceToy
//     let desToy = req.body.desToy

//     //transform your param into an ObjectId
//     var id = req.params._id;
//     var good_id = new ObjectId(id);

//     // let toy = {
//     //     'nameToy': nameToy,
//     //     'imgToy': imgToy,
//     //     'priceToy': priceToy,
//     //     'desToy': desToy
//     // }
//     //1. kết nối đến server có địa chỉ trong url
//     let server = await MongoClient.connect(url) // await là đợi công việc này hoàn thành mới làm công việc tiếp theo. 
//         //phải có async mới dùng được await 
//         //2. truy cập database ATNToys
//     let dbo = server.db("MyKingdom")
//     await dbo.collection('toy').updateOne({ '_id': good_id }, { $set: { '_id': good_id, 'nameToy': nameToy, 'imgToy': imgToy, 'priceToy': priceToy, 'desToy': desToy } })
//     res.redirect('/toy')
// })
const PORT = process.env.PORT || 5000
app.listen(PORT)
console.log('Runningggg')