const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

async function getBooks() {
  // Keep the lookup async so the data source can be replaced later without changing the routes.
  return books;
}

// Express 4 will not forward a rejected async handler on its own.
const asyncHandler = (handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch book data"
    });
  }
};

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

// Return the full catalog in the format expected by the client.
public_users.get('/', asyncHandler(async function (req, res) {
  const bookData = await getBooks();
  const available_books = Object.keys(bookData).map((isbn) => {
    return { isbn, ...bookData[isbn] };
  });

  return res.status(200).json(available_books);
}));

// ISBNs are the most direct way to look up a single book.
public_users.get('/isbn/:isbn', asyncHandler(async function (req, res) {
  const bookData = await getBooks();
  const isbn=req.params.isbn;
  const book=bookData[isbn];
  if (!book) {
    return res.status(404).json({ message: "Book not found", success: false });
  }
  return res.status(200).json(book);
}));
  
// Author and title searches return the ISBN with each matching book.
public_users.get('/author/:author', asyncHandler(async function (req, res) {
  const bookData = await getBooks();
  const author = req.params.author;
  const available_books = Object.keys(bookData)
    .filter((isbn) => bookData[isbn].author === author)
    .map((isbn) => ({ isbn, ...bookData[isbn] }));

  if (available_books.length === 0) {
    return res.status(400).json({ message: "Provide proper author name", success: false });
  }

  return res.status(200).json(available_books);
}));

public_users.get('/title/:title', asyncHandler(async function (req, res) {
  const bookData = await getBooks();
  const title = req.params.title;
  const available_books = Object.keys(bookData)
    .filter((isbn) => bookData[isbn].title.startsWith(title))
    .map((isbn) => ({ isbn, ...bookData[isbn] }));
  return res.status(200).json(available_books);
}));

// Reviews belong to a book, so check that the ISBN exists before reading them.
public_users.get('/review/:isbn', asyncHandler(async function (req, res) {
  const bookData = await getBooks();
  const isbn=req.params.isbn;
  if (!bookData[isbn]) {
    return res.status(404).json({ message: "Book not found", success: false });
  }
  const reviews=bookData[isbn].reviews;
  if (Object.keys(reviews).length > 0) {
  return res.status(200).json(reviews);
  }
  return res.status(200).json({message:"No reviews found for this book"});
}));

module.exports.general = public_users;
