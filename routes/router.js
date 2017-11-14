var express = require('express');
var mongojs = require('mongojs');
var db = mongojs('testForAuth', ['Users']);
var router = express.Router();
var User = require('../models/user');
var Product = require('../models/product');
var ProductType = require('../models/producttype');
var Bill = require('../models/bill')
var jwt = require('jsonwebtoken');
var users =[];
var products=[];
var types=[];



// GET route for reading data
router.get('/', function (req, res, next) {
  res.render('index');
});


//POST route for updating data
router.post('/register', function (req, res, next) {
  // confirm that user typed same password twice
  if (req.body.password !== req.body.passwordConf) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }

  if (req.body.email &&
    req.body.name &&
    req.body.password &&
    req.body.passwordConf) {

    var userData = {
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        passwordConf: req.body.passwordConf,
        address:"",
        phone:""

    }

    User.create(userData, function (error, user) {
      if (error) {
        return res.send("KHONG_THANH_CONG");
      } else {
        return res.send("THANH_CONG");
      }
    });

  } 
});

router.post('/login', function(req, res, next){
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        var err = new Error('SAI_THONG_TIN_DANG_NHAP');
        err.status = 401;
        return next(err);
      } else {
        req.session.userId = user._id;
        User.findById(req.session.userId)
        .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          if (user === null) {
            var err = new Error('Not authorized! Go back!');
            err.status = 400;
            return next(err);
          } else {
            var token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60 * 60* 60*24),data: user.email,id:user._id}, 'secret');//HMAC SHA256
            return res.send({token:token,user:user});
          }
        }
      });
      }
    });
  } else {
    var err = new Error('SAI_THONG_TIN_DANG_NHAP');
    err.status = 400;
    return next(err);
  }
});

router.post('/check_login', function(req,res,next){
  if(req.body.token){
    try{
      var decoded = jwt.verify(req.body.token, 'secret');
      User.findById(decoded.id).exec((err,user)=>{
        if(err){
          return next(err);
        }else{
          return res.send({token:req.body.token,user:user});
        }
      }); 
  }catch(e){
    return res.send('TOKEN_KHONG_HOP_LE');
  }
    
  }else{
    var err = new Error('TOKEN_KHONG_HOP_LE');
    err.status = 400;
    return next(err);
  }
});

router.post('/refresh_token', function(req,res,next){
  if(req.body.token){
    try{
      var decoded = jwt.verify(req.body.token, 'secret');
    User.findById(decoded.id).exec((err,user)=>{
      if(err){
        return next(err)
      }else{
        var newToken = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60 * 60* 60),data: user.email,id:user._id}, 'secret');
      return res.send(newToken);
      }
    }) 
    }catch(e){
      return res.send('TOKEN_KHONG_HOP_LE');
  }
     
  }else{
    var err = new Error('TOKEN_KHONG_HOP_LE');
    err.status = 400;
    return next(err);
  }
});

router.post('/change_info', function(req,res,next){
  if(req.body.token){
    try{
      var decoded = jwt.verify(req.body.token, 'secret');
      User.findById(decoded.id).exec((err,user)=>{
        if(err){
          return next(err);
        }else{
          var name = req.body.name;
          var address = req.body.address;
          var phone = req.body.phone;
          User.findOneAndUpdate({_id:decoded.id}, {name:name, address:address,phone:phone},{ new: true }, function (err, user) {
            res.send(user);
          });
            
        }
      }); 
  }catch(e){
    return res.send('TOKEN_KHONG_HOP_LE');
  }
    
  }else{
    var err = new Error('TOKEN_KHONG_HOP_LE');
    err.status = 400;
    return next(err);
  }
});

// GET route after registering
router.get('/profile', function (req, res, next) {
  User.findById(req.session.userId)
    .exec(function (error, user) {
      if (error) {
        return next(error);
      } else {
        if (user === null) {
          var err = new Error('Not authorized! Go back!');
          err.status = 400;
          return next(err);
        } else {
          var token = jwt.sign({exp: Math.floor(Date.now() / 1000) + (60 * 60* 60),data: user.email}, 'secret');
          return res.send({token:token,user:user});
        }
      }
    });
});


router.get('/api',function(req, res, next){
  Product.find({new:1}).exec((err, product) => {
    if(err) return next(err);
    ProductType.find().exec((err, type) => {
      if(err) return next(err);
      res.send({type:type,product:product});
    })
  })
});

router.get('/get_collection/',function(req, res, next){
  var limit=3;
  var page = req.query.page ? req.query.page :1;
  var offset = limit*(page-1);
  Product.find({inCollection:1}).skip(offset).limit(limit).exec((err, product) => {
    if(err){
      return next(err);
    }else{
      res.send({product:product})
    }
  })
});

router.get('/product_by_type/',function(req, res, next){
  var limit =3;
  var id = req.query.id_type;
  var page = req.query.page ? req.query.page :1;
  var offset = (page-1)*limit+(id-1)*10;
  Product.find({id_type:id,_id:{$gt:offset}}).limit(limit).exec((err, product) => {
    if(err){
      return next(err);
    }
    return res.send({product:product});
  })
  
});

router.get('/search/',function(req, res, next){
  var textSearch = req.query.key.toUpperCase();
  if(textSearch.length>=2){
    Product.find({'name': {'$regex': textSearch}}).exec((err, product) => {
      if(err){
        return next(err);
      }
      return res.send({product:product});
    })
  }else{
    return res.send("NHAP_TU_KHOA");
  }
});

router.post('/cart', function(req,res,next){
  if(req.body.token){
    try{
      var decoded = jwt.verify(req.body.token, 'secret');
      User.findById(decoded.id).exec((err,user)=>{
        if(err)
          return next(err);
      }); 
      const arrTotal = req.body.bill_detail.map(e => e.price*e.quantity);
      const total = arrTotal.length ? arrTotal.reduce((a, b) => a + b) :0;
      console.log(total);
      var BillData = {
        id_customer:decoded.id,
        date_order: new Date(),
        total:total,
        note: "",
        status: 0,
        bill_detail:req.body.bill_detail
      }
      var detail = req.body.bill_detail;
      console.log(detail);
      Bill.create(BillData, function (error, user) {
        if (error) {
          return res.send("KHONG_THANH_CONG");
        } else {
          return res.send("THANH_CONG");
        }
      });

  }catch(e){
    return res.send('TOKEN_KHONG_HOP_LE');
  }
    
  }else{
    var err = new Error('TOKEN_KHONG_HOP_LE');
    err.status = 400;
    return next(err);
  }
});

router.post('/order_history', function(req,res,next){
  if(req.body.token){
    try{
      var decoded = jwt.verify(req.body.token, 'secret');
      User.findById(decoded.id).exec((err,user)=>{
        if(err)
          return next(err);
      }); 
      Bill.find({'id_customer':decoded.id}).exec((err, detail) => {
        if(err){
          return next(err);
        }
        return res.send({detail});
      })
    }catch(e){
      return res.send('TOKEN_KHONG_HOP_LE');
    }
    
  }else{
    var err = new Error('TOKEN_KHONG_HOP_LE');
    err.status = 400;
    return next(err);
  }
});

// GET for logout logout
router.get('/logout', function (req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function (err) {
      if (err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

router.get('/contactlist', function (req, res) {
  console.log('I received a GET request');
  User.find(function (err, docs) {
    console.log(docs);
    res.json(docs);

  });
});

router.post('/contactlist', function (req, res) {
  console.log(req.body);
  if (req.body.passwordConf==null) {
    var err = new Error('Passwords do not match.');
    err.status = 400;
    res.send("passwords dont match");
    return next(err);
  }

  if (req.body.email &&
    req.body.name &&
    req.body.passwordConf) {

    var userData = {
        email: req.body.email,
        name: req.body.name,
        password: req.body.passwordConf,
        passwordConf: req.body.passwordConf,
        address:req.body.address,
        phone:req.body.phone

    }

    User.create(userData, function (error, user) {
      res.json(user);
    });
  }
});

router.delete('/contactlist/:id', function (req, res) {
  var id = req.params.id;
  console.log(id);
  User.remove({_id: mongojs.ObjectId(id)}, function (err, doc) {
    res.json(doc);
  });
});

router.get('/contactlist/:id', function (req, res) {
  var id = req.params.id;
  console.log(id);
  User.findOne({_id: mongojs.ObjectId(id)}, function (err, doc) {
    res.json(doc);
  });
});

router.put('/contactlist/:id', function (req, res) {
  var id = req.params.id;
  console.log(req.body.name);
  User.findOneAndUpdate({_id: mongojs.ObjectId(id)}, {name:req.body.name, password:req.body.passwordConf, passwordConf:req.body.passwordConf, address:req.body.address,phone:req.body.phone},{ new: true }, function (err, user) {
    res.json(user);
  });
});

module.exports = router;