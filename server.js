const express = require('express');
const { ConnectToDb, getDb } = require('./db');
const cors = require('cors');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const axios = require('axios');

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000'
}));

let otps = {};
app.use(bodyParser.json());

let db;

ConnectToDb(async (err) => {
    if (!err) {
        app.listen(5000, () => {
            console.log("Listening at port 5000");
        });
        db = await getDb();
    }
});

// Fetch best seller books
app.get('/fetchFiveBestSellerBooks', (req, res) => {
    let Books = [];
    db.collection('Books')
        .find()
        .sort({ SoldQty: -1 })
        .limit(5)
        .forEach(book => Books.push(book))
        .then(() => { res.status(200).json(Books) })
        .catch(() => { res.status(500).json({ error: "Could Not Fetch the documents" }) });
});

// Fetch books
app.get('/fetchBooks', (req, res) => {
    let Books = [];
    db.collection('Books')
        .find()
        .limit(5)
        .forEach(book => Books.push(book))
        .then(() => { res.status(200).json(Books) })
        .catch(() => { res.status(500).json({ error: "Could Not Fetch the documents" }) });
});

// Fetch all books
app.get('/fetchAllBooks', (req, res) => {
    let Books = [];
    db.collection('Books')
        .find()
        .forEach(book => Books.push(book))
        .then(() => { res.status(200).json(Books) })
        .catch(() => { res.status(500).json({ error: "Could Not Fetch the documents" }) });
});

// Fetch book by ID
app.get('/fetchBooks/:id', (req, res) => {
    let bookID = req.params.id;

    db.collection('Books')
        .findOne({ _id: new ObjectId(bookID) })
        .then((book) => { res.status(200).json(book) })
        .catch(() => { res.status(500).json({ error: "Could Not Fetch the documents" }) });
});

// Fetch books by uploader
app.get('/fetchBooksByUploader/:id', (req, res) => {
    let Books = [];
    db.collection('Books')
        .find({ Uploader: req.params.id })
        .forEach(book => Books.push(book))
        .then(() => { res.status(200).json(Books) })
        .catch(() => { res.status(500).json({ error: "Could Not Fetch the documents" }) });
});

// Delete book
app.delete('/deleteBook/:id', (req, res) => {
    let BookID = req.params.id;
    db.collection('Books')
        .deleteOne({ _id: new ObjectId(BookID) })
        .then((book) => { res.status(200).json(book) })
        .catch(() => { res.status(500).json({ error: "Could Not Fetch the documents" }) });
});

// Update book
app.patch('/updateBook/:id', (req, res) => {
    let UpdateObj = req.body;
    let bookID = req.params.id;

    db.collection('Books')
        .updateOne({ _id: new ObjectId(bookID) }, { $set: UpdateObj })
        .then((result) => { res.status(200).json(result) })
        .catch(() => { res.status(500).json({ error: "Could Not Update the documents" }) });
});

// Fetch token by email
app.get('/fetchToken/:id', (req, res) => {
    db.collection('Auth')
        .findOne({ email: req.params.id })
        .then((auth) => { res.status(200).json(auth) })
        .catch(() => { res.status(500).json({ error: "Could Not Auth the transaction" }) });
});

// Set token
app.post('/setToken', (req, res) => {
    db.collection('SessionTokens')
        .insertOne({ type: "LoginToken" })
        .then((auth) => { res.status(200).json(auth) })
        .catch(() => { res.status(500).json({ error: "Could Not Generate the token" }) });
});

// Get token by ID
app.get('/getToken/:tokenID', (req, res) => {
    const tokenid = req.params.tokenID;

    if (!ObjectId.isValid(tokenid)) {
        return res.status(400).json({ error: "Invalid Token ID" });
    }

    db.collection('SessionTokens')
        .findOne({ _id: new ObjectId(tokenid) })
        .then((auth) => { res.status(200).json(auth) })
        .catch(() => { res.status(500).json({ error: "Could Not Verify the token" }) });
});

// Fetch user by ID
app.get('/fetchUser/:id', (req, res) => {
    db.collection('Auth')
        .findOne({ _id: new ObjectId(req.params.id) })
        .then((auth) => { res.status(200).json(auth) })
        .catch(() => { res.status(500).json({ error: "Could Not Auth the transaction" }) });
});

// Add book
app.post('/addBook', (req, res) => {
    let newBookObj = req.body;
    db.collection('Books')
        .insertOne(newBookObj)
        .then((auth) => { res.status(200).json(auth) })
        .catch(() => { res.status(500).json({ error: "Could Not Insert the Book" }) });
});

// Add user
app.post('/addUser', async (req, res) => {
    let newUserObj = req.body;
    newUserObj.password = await bcrypt.hash(newUserObj.password, 10);
    db.collection('Auth')
        .insertOne(newUserObj)
        .then((auth) => { res.status(200).json(auth) })
        .catch(() => { res.status(500).json({ error: "Could Not Create the User" }) });
});

// Compare passwords
app.post('/compare', async (req, res) => {
    let passwordObjects = req.body;
    let passwordentered = passwordObjects.pEntered;
    let passwordfetched = passwordObjects.pFetched;

    if (await bcrypt.compare(passwordentered, passwordfetched) == true) {
        res.status(200).json({ status: true });
    } else {
        res.status(500).json({ status: false });
    }
});

// Send OTP
app.post('/sendOtp', (req, res) => {
    const { email } = req.body;

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    otps[email] = otp;

    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'nishunshetty94@gmail.com',
            pass: 'qtmd ipin mhfs xaxw',
        },
    });

    const mailOptions = {
        from: 'nishunshetty94@gmail.com',
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }
        res.status(200).json({ success: true });
    });
});

// Verify OTP
app.post('/verifyOtp', (req, res) => {
    const { email, otp } = req.body;

    if (otps[email] && otps[email] === otp) {
        delete otps[email];
        res.status(200).json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// Verify CAPTCHA
app.post('/verifyCaptcha', async (req, res) => {
    const { captchaToken } = req.body;

    try {
        const response = await axios.post(`https://www.google.com/recaptcha/api/siteverify`, null, {
            params: {
                secret: '6LesgWsqAAAAAMJxh6lGTeGIWgulSyadtpUVfqij',
                response: captchaToken,
            }
        });

        if (response.data.success) {
            res.status(200).json({ success: true });
        } else {
            res.status(400).json({ success: false, message: "CAPTCHA verification failed" });
        }
    } catch (error) {
        console.error("Error verifying CAPTCHA:", error);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await db.collection('Auth').findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        otps[email] = otp; // Store OTP temporarily

        // Send OTP via email
        const mailOptions = {
            from: 'nishunshetty94@gmail.com',
            to: email,
            subject: 'Your OTP Code',
            text: `Your OTP is: ${otp}`,
        };

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: 'nishunshetty94@gmail.com',
                pass: 'qtmd ipin mhfs xaxw',
            },
        });

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent to email' });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify OTP for login
app.post('/verifyLoginOtp', (req, res) => {
    const { email, otp } = req.body;

    if (otps[email] && otps[email] === otp) {
        delete otps[email]; // Remove OTP after successful verification
        res.status(200).json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid OTP' });
    }
});
