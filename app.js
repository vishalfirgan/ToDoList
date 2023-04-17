//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();

const app = express();

app.use((req, res, next) => {
  if (req.originalUrl && req.originalUrl.split("/").pop() === "favicon.ico") {
    return res.sendStatus(204);
  }
  return next();
});

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.get("/favicon.ico", (req, res) => {
  res.sendStatus(204);
});

console.log(process.env.CONN);
mongoose.connect(process.env.CONN, { useNewUrlParser: true })
.then(() => {
  console.log('Connected to MongoDB database')
})
.catch((error) => {
  console.log('Error connecting to MongoDB database:', error.message)
})

const itemSchema = {
  name: String
};
const Item = mongoose.model("Item", itemSchema);

const Item1 = new Item({
  name: "welcome to to-do list."
});
const Item2 = new Item({
  name: "click the + button to add new items."
});
const Item3 = new Item({
  name: "click the --> button to delete the items."
});

const listSchema = {
  name: String,
  items: [Item.schema]   //[itemSchema]
};

const List = mongoose.model("List", listSchema);

const defaultitems = [Item1, Item2, Item3];



app.get("/", function(req, res) {

  Item.find({}).then(function (foundItems) {
    if (foundItems.length == 0)
    {
      Item.insertMany(defaultitems)
     .then(function () {
      console.log("the elements are added to the db successfuly.");
     })
    .catch(function (err) {
     console.log(err);
      });
      res.redirect("/");
    }
    else
    {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
  .catch(function(err){
    console.log(err);
  });
});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today")
  { 
    item.save();
    res.redirect("/"); 
  }
  else {
    List.findOne({ name: listName })
      .then((foundlist) => {
        foundlist.items.push(item);
        foundlist.save();
        res.redirect("/" + listName);
      })
  }
});


app.post("/delete", (req, res) => {
    
  const chekeditemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(chekeditemId)
    .then(() => {
      console.log("the item is deleted succesfully")
      res.redirect("/");  })
    .catch((err) => { console.log(err) }); 
  }
  else {
  
    List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: chekeditemId } } })
      .then((foundList) => {
        res.redirect("/" + listName);
      })
  }

  
})
app.get("/about", function(req, res){
  res.render("about");
});
const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log("Server started on port 3000");
});
//dynamic name of lists
// gpt codenonic
app.get("/:userGivenName", function (req, res) {
  const userGivenName = _.capitalize( req.params.userGivenName);

  List.findOne({ name: userGivenName }).exec()
    .then(function (foundList) {
      if (!foundList) {
        const list = new List({
          name: userGivenName,
          items: defaultitems
        });

        list.save();
        console.log("saved");
        res.redirect("/" + userGivenName);
      }
      else {
        res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
      }
    })
    .catch(function (err) {
      console.log(err);
    });
});
