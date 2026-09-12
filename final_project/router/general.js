const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

async function getBooks() {
  return books;
}

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: "username or password cannot be empty"
    });
  }

  if (isValid(username)) {
    return res.status(409).json({
      success: false,
      message: "username already exists"
    });
  }

  users.push({ username, password });
  return res.status(201).json({
    success: true,
    message: "user successfully registered. Now you can login"
  });
});

// Get the book list available in the shop
public_users.get('/', async function (req, res) {
  const bookData = await getBooks();
  const available_books = Object.keys(bookData).map((isbn) => {
    return { isbn, ...bookData[isbn] };
  });

  return res.status(200).json(available_books);
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const bookData = await getBooks();
  const isbn=req.params.isbn;
  const book=bookData[isbn];
  return res.status(200).json(book);
 });
  
// Get book details based on author
public_users.get('/author/:author', async function (req, res) {
  const bookData = await getBooks();
  const author = req.params.author;
  const available_books = Object.keys(bookData)
    .filter((isbn) => bookData[isbn].author === author)
    .map((isbn) => ({ isbn, ...bookData[isbn] }));

  if (available_books.length === 0) {
    return res.status(400).json({ message: "Provide proper author name", success: false });
  }

  return res.status(200).json(available_books);
});

// Get all books based on title
public_users.get('/title/:title', async function (req, res) {
  const bookData = await getBooks();
  const title = req.params.title;
  const available_books = Object.keys(bookData)
    .filter((isbn) => bookData[isbn].title.startsWith(title))
    .map((isbn) => ({ isbn, ...bookData[isbn] }));
  return res.status(200).json(available_books);
});

//  Get book review
public_users.get('/review/:isbn', async function (req, res) {
  const bookData = await getBooks();
  const isbn=req.params.isbn;
  const reviews=bookData[isbn].reviews;
  console.log(reviews);
  if (Object.keys(reviews).length > 0) {
  return res.status(200).json(reviews);
  }
  return res.status(200).json({message:"No reviews found for this book"});
});

module.exports.general = public_users;
