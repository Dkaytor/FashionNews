//setting up dependencies for express
var express = require("express");

var router = express.Router();
var mongoose = require("mongoose");
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("../models");

// Create all required routes and set up logic
router.get("/", function(req, res) {
  db.Article.find({})
  .then(function(dbArticle) {
    var hbsObject = {
      articles: dbArticle
    };
    console.log(hbsObject);
    res.render("index", hbsObject);
  })
  .catch(function(err) {
    res.json(err);
  });
});

// A GET route for scraping the echoJS website
router.get("/scrape", function(req, res) {
  // First, we grab the body of the html with axios
  axios.get("https://www.vogue.com/fashion/").then(function(response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);

    // Now, we grab every h2 within an article tag, and do the following:
    $(".feed-card--container").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this) 
      .children(".feed-card--info")
      .children("h2")
      .children("a")
        .text();
      result.link = $(this) 
      .children(".feed-card--info")
      .children("h2")
      .children("a")
        .attr("href");
      result.img = $(this)
        .children(".feed-card--image")
        .children("a")
        .children("picture")
        .children("source")
        .attr("srcset");

        console.log($(this)
        .children(".feed-card--image"))

      // Create a new Article using the `result` object built from scraping
      db.Article.create(result)
        .then(function(dbArticle) {
          // View the added result in the console
          console.log(dbArticle);
        })
        .catch(function(err) {
          // If an error occurred, log it
          console.log(err);
        });
    });
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
router.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
     // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
      console.log("id " + _id);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
router.get("/:id", function(req, res) {
  db.Article.findById(req.params.id)
  .populate("note")
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
  
});

// Route for saving/updating an Article's associated Note
router.post("/articles/:id", function(req, res) {
    db.Note.create(req.body)
    .then(function(dbNote) {
      return db.Article.findByIdAndUpdate(req.params.id, { $push: {note: dbNote._id}},
        {new: true})
        
    });

  });



// Making this function accessible to other files
module.exports = router;
    