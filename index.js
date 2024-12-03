const express = require("express");
const cors = require("cors");
const fs = require("fs");
const app = express();


app.use(express.json());
app.use(cors());


const articles = [];


const searchKeywords = new Map();


function calculateRelevance(query, content) {
  const words = content.split(" ");
  const frequency = words.filter(word => word.toLowerCase() === query.toLowerCase()).length;
  return frequency;
}



app.post("/articles", (request, response) => {
  const { title, content, tags } = request.body;
  
  if (!title || !content) {
    return response.status(400).send({ error: "Title and content are required." });
  }

  
  const article = {
    id: articles.length + 1,
    title,
    content,
    tags: tags || [],
    date: new Date().toISOString(),
  };

  articles.push(article);

  const words = article.content.split(" ").concat(article.title.split(" "));
  words.forEach((word) => {
    const lower = word.toLowerCase();
    if (!searchKeywords.has(lower)) {
      searchKeywords.set(lower, []);
    }
    searchKeywords.get(lower).push(article);
  });


  fs.writeFileSync("articles.json", JSON.stringify(articles));

  response.status(201).send({ message: "Article added successfully", article });
});


app.get("/articles/search", (request, response) => {
  const { input, sortBy = "relevance" } = request.query;

  if (!input) {
    return response.status(400).send({ error: "Query parameter 'input' is required" });
  }

  const query = input.toLowerCase();
  let results = searchKeywords.get(query) || [];

  
  if (sortBy === "relevance") {
    results.sort((a, b) => {
      const relevanceA = calculateRelevance(query, a.title + " " + a.content);
      const relevanceB = calculateRelevance(query, b.title + " " + b.content);
      return relevanceB - relevanceA; 
    });
  } else if (sortBy === "date") {
    results.sort((a, b) => new Date(b.date) - new Date(a.date)); 
  }

  response.send(results);
});


app.get("/articles/:id", (request, response) => {
  const { id } = request.params;
  const article = articles.find((article) => article.id === parseInt(id));

  if (!article) {
    return response.status(404).send({ error: "Article not found" });
  }

  response.send(article);
});


app.listen(1234, () => console.log("Server started on port 1234"));
