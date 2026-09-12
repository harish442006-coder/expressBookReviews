const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return users.some((user) => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
//check if username and password match the one we have in records.
  let valid_user=users.filter((user)=>{
    return (user.username===username && user.password===password)
  });

  if(valid_user.length>0){
    return true;
  }else{
    return false;
  }

}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username=req.body.username;
  const password=req.body.password;

  if(!username || !password){
    return res.status(404).json({success:false,message:"Error! missing username or password"});
  }
  if(authenticatedUser(username,password)){
    //assign jwt token to authencated user
    let token=jwt.sign({
      data:username
    },"reviewAccess",{expiresIn:60*60});

    //store token in the session
    req.session.authorization={
      token
    }
    res.status(200).send(`Successfully logged in as ${username}`);
  }else{
    res.status(208).json({ success:false,message: "Invalid Login. Check username and password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn=req.params.isbn;
  const review=req.body.review;
  const username=req.user.data;
  if(!books[isbn]){
    return res.status(404).json({message:"Book not found",success:false})
  }
  if(!review){
    return res.status(400).json({message:"Review must be required",success:false})
  }
  
  books[isbn].reviews[username]=review;
  return res.status(200).json({
    message: "Review added or updated successfully",
    review: {
      username,
      text: review
    }
  });
});
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn=req.params.isbn;
  const username=req.user.data;
  if(!books[isbn]){
    return res.status(404).json({message:"Book not found",success:false})
  }
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({
      message: "Your review was not found",
      success: false
    });
  }
  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: "Review deleted successfully",
    success:true
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
