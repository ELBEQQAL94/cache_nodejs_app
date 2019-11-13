// DEPENDENCIES
const express = require('express');
const redis = require('redis');
const fetch = require('node-fetch');

// PORT
const port = process.env.PORT || 8000;
const redis_port = process.env.PORT || 6379;

// CREATE REDIS CLIENT
const client = redis.createClient(redis_port)

// Init App
const app = express();

// MAKE REQUEST TO GITHUB FOR DATA
async function getRepos(req, res){
     try{
       console.log('Fetching data...');

       const { username } = req.params;

       const response = await fetch(`https://api.github.com/users/${username}`);

       const data = await response.json();

       const repos = data.public_repos;

       // set to redis cache
       client.setex(username, 3600, repos);

       res.send(setResponse(username, repos));

     } catch(err){
         console.log('Error:', err);
         res.status(500);
     }
}

function setResponse(username, repos) {
    return `<h1>${username} has ${repos} repos </h1>`
};

// cache middleware
function cache(req, res, next){
    const {username} = req.params;
    client.get(username, (err, data) => {
        if(err) console.log(err);
        if(data !== null){
            res.send(setResponse(username, data))
        } else {
            next();
        }
    });
};


app.get('/repos/:username', cache, getRepos);

app.listen(port , () => console.log(`Server running at ${port} port`));