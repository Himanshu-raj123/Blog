const express = require("express");
const app = express();
const fs = require("fs");
const session = require("express-session");

app.use(session({
    saveUninitialized:true,
    resave:false,
    secret:"keyboard@2025",
}))
app.use(express.urlencoded({extended:true}));

app.get("/login",(req,res)=>{
    if(req.session.username){
        res.redirect("/home");
    }else{
    res.sendFile(__dirname+"/src/login.html");
    }
})
app.get("/signup",(req,res)=>{
    if(req.session.username){
        res.redirect("/home")
    }else{
    res.sendFile(__dirname+"/src/signup.html");
    }
})

app.get("/login1",(req,res)=>{
    // console.log(req.query);
    fs.readFile(__dirname+"/user.json","utf-8",(err,data)=>{
        if(err) res.send("try again later");
        else{
            data = JSON.parse(data);
            let user = data.filter((ele)=>{
               if(ele.email==req.query.email&&ele.pass==req.query.pass)
                return true;
            })
            if(user.length>0){
                req.session.username = req.query.email;
               res.redirect("/home");
            }else{
                res.sendFile(__dirname+"/src/signup.html");
            }
        }
    })
})

app.post("/signup",(req,res)=>{
    // console.log(req.body);
    // res.send("data recive");
     fs.readFile(__dirname+"/user.json","utf-8",(err,data)=>{
        if(err) res.send("try again later");
        else{
            data = JSON.parse(data);
            let user = data.filter((ele)=>{
               if(ele.email==req.body.email&&ele.pass==req.body.pass)
                return true;
            })
            if(user.length>0){
              res.send("already exist");
            }else{
                data.push(req.body);
                fs.writeFile(__dirname+"/user.json",JSON.stringify(data),(err)=>{
                      if(err) res.send("try again later");
                      else res.send("user created succ");
                })
            }
        }
    })
})

app.get("/home",(req,res)=>{
    if(req.session.username){
    res.sendFile(__dirname+"/src/home.html");
    }else{
        res.sendFile(__dirname+"/src/login.html");
    }
})
app.get("/logout",(req,res)=>{
    req.session.destroy();
    
    res.redirect("/login");
})

app.listen(3000);