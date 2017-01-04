var express = require("express");
var cors = require('cors')
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var MONGODB_URI = process.env.NODE_ENV === 'production' ? process.env.MONGODB_URI : 'mongodb://localhost:27017/todoapi';

var TODO_COLLECTION = "todos";

var app = express();

app.use(cors());

app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

app.get("/:studentID/todos", function(req, res) {
  db.collection(TODO_COLLECTION).find({ studentID: req.params.studentID }).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get ToDos.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/:studentID/todos", function(req, res) {
  if (!(req.body.text)) {
    handleError(res, "Invalid input", "Must provide a ToDo text.", 400);
  }

  var newToDo = {
    text: req.body.text,
    studentID: req.params.studentID,
    completed: false,
  };

  db.collection(TODO_COLLECTION).insertOne(newToDo, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new ToDo.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

app.put("/:studentID/todos/:id", function(req, res) {
  db.collection(TODO_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, { $set: { completed: req.body.completed } }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update ToDo");
    } else {
      res.status(204).end();
    }
  });
});
