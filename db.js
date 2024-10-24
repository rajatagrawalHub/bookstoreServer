const {MongoClient} = require('mongodb')

let dBConnection;

module.exports = {
    ConnectToDb : (callBackFn)=>{
        MongoClient.connect("mongodb+srv://dbUser01:k1fWY3Ty3CS0Og0q@mainclusterm0.wec8a.mongodb.net/BookNExt")
        .then((client)=>{
            dBConnection = client.db()
            return callBackFn()
        })
        .catch((err)=>{
            console.log(err)
            return callBackFn(err)
        })
    },
    getDb : ()=> dBConnection
}