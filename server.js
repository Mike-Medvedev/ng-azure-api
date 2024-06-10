const dotenv = require('dotenv');
const axios = require('axios');
const express = require('express');
const queryString = require('node:querystring');
const crypto = require('crypto');
const cors = require('cors');
const bodyParser = require('body-parser');

const { main } = require('./Completions')

const app = express();
dotenv.config();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const client_id = process.env.client_id;
const client_secret = process.env.client_secret;
const redirect_uri = process.env.redirect_uri ?? 'http://localhost:4200/callback';
const scope =  process.env.scope;
const state = crypto.randomBytes(16).toString('hex');

app.get('/login', (req, res) => {
  res.redirect('https://accounts.spotify.com/authorize?' +
    queryString.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    })
  );
});

app.get('/', (req, res) => {
  res.status(200).send('Hello World')
})

app.post('/exchangeCodeforToken', (req, res) => {
  const code = req.body.code;
  const code_verifier = req.body.code_verifier;

  const data = {
    client_id: client_id,
    code: code,
    redirect_uri: redirect_uri,
    grant_type: 'authorization_code',
    code_verifier: code_verifier
  };

  const encodedData = queryString.stringify(data);

  axios.post('https://accounts.spotify.com/api/token', encodedData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
      }
    })
    .then(response => {
      const accessToken = response.data.access_token;
    process.env.SPOTIFY_ACCESS_TOKEN = accessToken;
    console.log(process.env.SPOTIFY_ACCESS_TOKEN)
      res.json({ message: 'success' });
    })
    .catch(error => {
      console.error(error);
      res.status(500).send(error);
    });
});

app.post('/search', (req, res) => {
  const query = req.body.query;
  axios.get(`https://api.spotify.com/v1/search?` + query + '&type=album,track', {
    headers: {
      'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`
    }
  }).then((axiosRes) => { // Change variable name here
    console.log(axiosRes.data); // Output response data to console
    res.json(axiosRes.data); // Send response data to client
  }).catch((err) => {

    console.log('Spotify API error:', err.response.data.error.message);
    res.status(500).json({ error: 'Spotify API error', details: err.response.data.error.message });
  });
  
});


app.get('/profile', (req, res) => {
  axios.get('https://api.spotify.com/v1/me', {
    headers: { 
      'Authorization': `Bearer ${process.env.SPOTIFY_ACCESS_TOKEN}`
    }
  }).then((axiosRes) => {
    res.status(200).send(axiosRes.data); // Send only the data in the response
  }).catch((err) => {
    if (err.response && err.response.data && err.response.data.error) {
      res.status(500).json({ error: 'idk', details: err.response.data.error.message });
    } else {
      res.status(500).json({ error: 'Unknown error' });
    }
  });
});

app.post('/rec', async (req, res) => {
  const prompt = req.body.prompt;
  console.log('hit')
  console.log(prompt)

  try {
    if(typeof prompt === 'string' && prompt){
      console.log('sending to ai', prompt)
      const result = await main(prompt);
      console.log('success got result', result)
      res.status(200).send({prompt: result});

    }
    else throw new Error('Prompt is undefined or openai error')
  } catch (error) {
    res.status(500).send(error.message)
  }
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
