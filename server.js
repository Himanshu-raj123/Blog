const express = require('express')
const path = require('path')
const fs = require('fs')
let users = require('./user.json');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const app = express();
app.use(cookieParser());

const products = () => {
   let data = fs.readFileSync(__dirname + '/blogs.json', 'utf-8');
   return JSON.parse(data);
}

const Storage = multer.diskStorage({
   destination: (req, file, cb) => {
      cb(null, __dirname + "/uploads")
   },
   filename: (req, file, cb) => {
      cb(null, file.originalname);
   }
})

const upload = multer({ storage: Storage });

// middleWares
app.use(express.static(__dirname + '/static'))
app.use(express.static(__dirname + '/uploads'))
app.use(express.static(__dirname + '/uploads/videos'))
app.use(express.urlencoded({ extended: true }))

//Route handelling

app.get('/favicon', (req, res) => { res.send()})

app.get('/', (req, res) => {
   res.sendFile(__dirname + '/src/home.html')
})

app.get('/login', (req, res) => {
   const token = req.cookies.token;
   if (!token) {
      res.sendFile(path.join(__dirname, 'src', 'login.html'))
   }
   try {
      const decoded = jwt.verify(token, 'secretKey');
      res.redirect('/dashboard')
   } catch (err) {
      res.sendFile(path.join(__dirname, 'src', 'login.html'))
   }
})

app.get('/dashboard', (req, res) => {
   res.sendFile(path.join(__dirname, 'src', 'dashboard.html'))
})

app.get('/signup', (req, res) => {
   res.sendFile(path.join(__dirname, 'src', 'signup.html'))
})

app.get('/submitLogin', (req, res) => {
   fs.readFile(__dirname + '/user.json', 'utf-8', (err, data) => {
      if (!err) {
         data = JSON.parse(data);

         if (data.length != 0) {
            let exist = data.find((elm) => (elm.email === req.query.email && elm.password === req.query.password))

            if (exist) {
               const token = jwt.sign({ email: exist.email, role: exist.role }, 'secretKey', { expiresIn: '1h' })
               res.cookie('token', token, { maxAge: 3600000 });
               res.redirect('/dashboard')
            } else {
               res.redirect('/signup')
            }
         } else {
            res.redirect('/signup')
         }
      } else {
         res.send("server issues")
      }
   })
})

app.post('/submitSignup', (req, res) => {
   fs.readFile(__dirname + '/user.json', 'utf-8', (err, data) => {
      if (!err) {
         data = JSON.parse(data);

         let exist = data.some((elm) => (elm.email === req.body.email))

         if (exist) {
            res.redirect('/login');
         } else {
            let obj = {
               user: req.body.user,
               email: req.body.email,
               password: req.body.password,
               status: true,
               role: "user"
            }

            data.push(obj);
            fs.writeFile(__dirname + '/user.json', JSON.stringify(data), (err) => {
               if (err) {
                  res.send("Server issue")
               } else {
                  res.redirect('/login');
               }
            })
         }

      } else {
         res.send("server issues")
      }
   })
})

app.get('/dashboard/products', (req, res) => {
   const token = req.cookies.token;
   if (!token) {
      return res.status(401).json({ error: 'No token provided' });
   }
   try {
      const decoded = jwt.verify(token, 'secretKey');
      const prod = products();
      res.json({
         email: decoded.email,
         role: decoded.role,
         products: prod
      });
   } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
   }
})

app.post('/addBlog', upload.single("image"), (req, res) => {
   const token = req.cookies.token;
   if (!token) {
      return res.status(401).json({ error: 'No token provided' });
   }
   let decoded;
   try {
      decoded = jwt.verify(token, 'secretKey');
   } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
   }
   let obj = {
      id: Date.now(),
      user: decoded.email,
      title: req.body.title,
      description: req.body.description,
      video: req.file.filename,
      likes: [],
      dislikes: [],
      comments: []
   }

   console.log(req.file);
   let prod = products();
   prod.push(obj);
   fs.writeFile(__dirname + "/blogs.json", JSON.stringify(prod), (err) => {
      res.redirect('/dashboard');
   });
})

app.get('/changes/:activity/:id', (req, res) => {
   if (req.params.activity === 'likes') {
      let found = false;
      let prod = products()
      prod.forEach((elm) => {
         if (elm.id == req.params.id) {

            const token = req.cookies.token;
            if (!token) {
               return res.status(401).json({ error: 'No token provided' });
            }

            let decoded;
            try {
               decoded = jwt.verify(token, 'secretKey');
            } catch (err) {
               return res.status(401).json({ error: 'Invalid token' });
            }

            if (!elm.likes.includes(decoded.email)) {
               elm.likes.push(decoded.email);
               elm.dislikes = elm.dislikes.filter(e => e !== decoded.email);
               found = true;
            }
         }
      });

      if (!found) return res.status(404).send('Product not found');

      fs.writeFile(__dirname + '/blogs.json', JSON.stringify(prod), (err) => {
         if (err) return res.status(500).send('Error writing to file');
         res.send('Like updated and saved successfully');
      })

   } else if (req.params.activity === 'dislikes') {
      let found = false;
      let prod = products();
      prod.forEach((elm) => {
         if (elm.id == req.params.id) {
            const token = req.cookies.token;
            if (!token) {
               return res.status(401).json({ error: 'No token provided' });
            }
            let decoded;
            try {
               decoded = jwt.verify(token, 'secretKey');
            } catch (err) {
               return res.status(401).json({ error: 'Invalid token' });
            }
            if (!elm.dislikes.includes(decoded.email)) {
               elm.dislikes.push(decoded.email);
               // Remove from likes if present
               elm.likes = elm.likes.filter(e => e !== decoded.email);
               found = true;
            }
         }
      });

      if (!found) return res.status(404).send('Product not found or already disliked by user');

      fs.writeFile(__dirname + '/blogs.json', JSON.stringify(prod), (err) => {
         if (err) return res.status(500).send('Error writing to file');
         res.send('Dislike updated and saved successfully');
      });

   } else if (req.params.activity === 'delete') {
      let prod = products();
      deletedProducts = prod.filter((elm) => {
         if (elm.id != req.params.id) {
            return true;
         }
      });


      fs.writeFile(__dirname + '/blogs.json', JSON.stringify(deletedProducts), (err) => {
         if (err) return res.status(500).send('Error writing to file');
         res.send('Delete updated and saved successfully');
      })

   }
})

app.post('/addComments/:id', (req, res) => {

   let blogs = products();
   let data = blogs.find((ele) => ele.id == req.params.id)

   if (data && req.body.addcomment.trim() != '') {
      data.comments.push(req.body.addcomment)
   }

   blogs = blogs.map((elm) => {
      if (elm.id == req.params.id) {
         return data;
      }
      return elm;
   });

   fs.writeFileSync(__dirname + '/blogs.json', JSON.stringify(blogs))
   res.redirect('/dashboard')

})

app.get('/comments/:id', (req, res) => {

   let blogs = products();
   let data = blogs.find(elm => elm.id == req.params.id)

   if (data) {
      res.json(data.comments);
   } else {
      res.json({ msg: "error" })
   }
})

app.get('/logout', (req, res) => {
   res.clearCookie('token');
   res.redirect('/login');
})
// server listenning
app.listen(5000, (err) => {
   console.log(err ? "Server not created..." : "Server started at http://localhost:5000");
})
