var express = require("express"),
    app = express(),
    mongoose = require("mongoose"),
    bodyParser = require('body-parser'),
    jwt = require('jsonwebtoken');

var config = require("./config");
//requiring models
var User = require("./models/user");

mongoose.connect(config.database ,{ useNewUrlParser: true});
app.set('superSecret', config.secret);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
middleware = function(req, res, next){
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token){
        jwt.verify(token , app.get("superSecret"), (err,decoded)=>{
            if(err)
                return res.status(403).json({success: false, message: "failed to authenticate token."});
            else{
                req.decoded = decoded;
                next();
            }
        })
    }else{
        return res.status(403).json({
            success: false,
            message: "NO token provided",
        });
    }
};

app.get('/dummyUser', (req, res) =>{
    var newUser = {
        name : "kriti dewangan",
        password: "password",
        admin: true,
    };
    User.create(newUser).then(()=> {
        console.log("new user added"),
        res.json({success: true});
    }).catch((err) =>{
        console.log(err);
    })
});
app.post("/api/authenticate", (req, res) =>{
    console.log(req.query.name);
    User.findOne({name : req.query.name}).then((user)=>{
        if(!user)
            res.status(404).json({success: false ,message: "authentication failed. User Not Found"});
        else{
            if(user.password == req.query.password){
                const payload = {
                    admin: user.admin,
                };
                var token = jwt.sign(payload, app.get('superSecret'), {
                    expiresIn: '24h' //  
                });
                //return the info including token as json
                res.json({
                    success: true,
                    message: 'token generated',
                    token: token,
                });
            }else
                res.json({success: false, message: 'authentication failed. Wrong Password'});
        }
    }).catch((err)=>{
        throw err;
    })
});
//potected route that shows a random message
app.get("/api", middleware ,(req, res)=>{
    res.json({message : 'Baba, you are beautiful!!'})
});
app.get("/api/users", (req, res) =>{
    User.find({}).then((result)=>{
        res.status(200).json(result);
    });
});


app.listen( process.env.PORT || 3000  , () => {
    console.log("Server Connected");
})