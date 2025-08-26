const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { MongoClient, ReadPreference } = require("mongodb");

if (process.env.MONGODB_BINDING === 'mongodb-credentials.json') {
    process.env.MONGODB_BINDING = fs.readFileSync('mongodb-credentials.json');
}

const credentials = JSON.parse(process.env.MONGODB_BINDING);
const uri = credentials.connection.mongodb.composed[0];
const ca = [Buffer.from(credentials.connection.mongodb.certificate.certificate_base64, 'base64')];
const options = {
    tls: true,
    ca,
    readPreference: 'primary',
}

const client = new MongoClient(uri, options);
client.connect()
  .then(() => {
    console.log('✅ MongoDB connection successful');
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
const database = client.db(credentials.connection.mongodb.database);
const collection = database.collection('applications');

console.log('MongoDB URI:', uri);
console.log('MongoDB database:', database.databaseName);
console.log('MongoDB collection:', collection.collectionName);

class Application {
    constructor(obj) {
        this._id = uuidv4();
        this.history = [];
        Object.assign(this, obj);
    }

    async save() {
        try {
            const res = await collection.insertOne(this);
            console.log('Inserted: ', res);
            return res;
        } catch (err) {
            console.error('MongoDB insert failed:', err);
            throw err;
        }
    }

    delete() {
        // Optionally implement if to support deletes in MongoDB
        return collection.deleteOne({ _id: this._id });
    }

    static async find(id) {
        console.log('Looking for application with _id:', id, 'type:', typeof id);
        let app = await collection.findOne({ _id: id });
        if (app) {
            return app;
        }
        console.error(`[FIND] Not found in MongoDB for _id=${id}`);
        return null;
    }

    static async update(id, step, status, data = null) {
        const app = await Application.find(id);
        if (!app) return null;

        if (step in app.status.steps) {
            app.status.steps[step].status = status;
            let t = 0, c = 0;
            for (const s in app.status.steps) {
                t += 1;
                if (app.status.steps[s].status !== 'pending') c += 1;
            }
            app.status.percentComplete = Math.round(100 * c / t);
        } else if (step === 'STOP') {
            app.status.completed = true;
            app.status.percentComplete = 100;
        }

        const updateFields = { status: app.status };
        if (data) {
            for (const f in data) {
                app[f] = data[f];
                updateFields[f] = data[f];
            }
        }

        await collection.updateOne(
            { _id: app._id },
            { $set: updateFields }
        ).then(res => {
            console.log('Updated: ', res);
        }).catch(err => {
            console.error(err);
        });

        return app;
    }
}

module.exports = { Application }
