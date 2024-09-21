const {MongoClient} = require('mongodb')

let dBConnection;

module.exports = {
    ConnectToDb : (callBackFn)=>{
        MongoClient.connect("mongodb://localhost:27017/BookNExt")
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