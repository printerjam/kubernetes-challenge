const express = require('express');
const port = 4000;
const app = express();

app.listen(port);

console.log(`Server running at http://localhost: ${port}`);

app.get('/', (req, res) => {
  
  if (!process.env.NAME || !process.env.NODE_NAME || !process.env.POD_NAME) {
    res.send('configuration incomplete');
  } else {
    res.send(`Hello ${process.env.NAME}! From ${process.env.POD_NAME} on ${process.env.NODE_NAME}`);
  }
});
