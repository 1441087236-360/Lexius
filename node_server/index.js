require('dotenv').config();
const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const fetch      = require('node-fetch');
const { Client: ESClient } = require('@elastic/elasticsearch');
const OpenAI     = require('openai');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const session = require('express-session');

const app  = express();
const port = process.env.PORT || 3000;

// ─── OpenAI Client ─────────────────────────────────────────────────────────────
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// ─── MongoDB Setup ─────────────────────────────────────────────────────────────
mongoose.connect('mongodb://localhost:27017/legal_chatbot', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const messageSchema = new mongoose.Schema({
  text:      String,
  sender:    String,
  user:      String,
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// ─── Elasticsearch Setup ──────────────────────────────────────────────────────
const esClient = new ESClient({ node: 'http://localhost:9200' });
esClient.ping()
  .then(() => console.log('✅ Elasticsearch reachable'))
  .catch(err => console.error('❌ ES connection failed:', err));

// ─── Express Setup ─────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({ secret: 'your_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// ─── Passport Configuration ────────────────────────────────────────────────────
passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((obj, done) => done(null, obj));

// Google OAuth
passport.use(new GoogleStrategy({
  clientID: 'YOUR_GOOGLE_CLIENT_ID',
  clientSecret: 'YOUR_GOOGLE_CLIENT_SECRET',
  callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// Microsoft OAuth
passport.use(new MicrosoftStrategy({
  clientID: 'YOUR_MICROSOFT_CLIENT_ID',
  clientSecret: 'YOUR_MICROSOFT_CLIENT_SECRET',
  callbackURL: '/auth/microsoft/callback',
  scope: ['user.read']
}, (accessToken, refreshToken, profile, done) => done(null, profile)));

// ─── /chat Endpoint ────────────────────────────────────────────────────────────
app.post('/chat', async (req, res) => {
  const userInput = (req.body.text || '').trim();
  const user = req.body.user || 'anonymous';
  if (!userInput) {
    return res.status(400).json({ error: 'No text provided' });
  }

  // 1) Detect single‐year or year‐range in the query
  const singleMatch = userInput.match(/\b(?:19|20)\d{2}\b/);
  const rangeMatch  = userInput.match(/\b((?:19|20)\d{2})\b\s*(?:and|to|-)\s*\b((?:19|20)\d{2})\b/);

  // 2) Build ES query & size
  let esQuery, size;
  if (singleMatch && !rangeMatch) {
    const year = singleMatch[0];
    esQuery = { prefix: { 'date.keyword': year } };
    size = 50;
  } else if (rangeMatch) {
    const y1 = parseInt(rangeMatch[1], 10);
    const y2 = parseInt(rangeMatch[2], 10);
    const from = String(Math.min(y1, y2));
    const to   = String(Math.max(y1, y2));
    esQuery = { range: { 'date.keyword': { gte: from, lte: to } } };
    size = 100;
  } else {
    esQuery = {
      multi_match: {
        query:  userInput,
        fields: ['Summary200','title','legal_key']
      }
    };
    size = 5;
  }

  try {
    // 3) Query Elasticsearch
    const esRes = await esClient.search({
      index: 'cases',
      size,
      query: esQuery
    });
    const hits = esRes.hits?.hits || [];
    console.log(`🔍 ES returned ${hits.length} hits for "${userInput}"`);

    // 4) Format ES summaries
    const docs = hits.map((h,i) => {
      const d = h._source;
      return `${i+1}. [${d.date}] ${d.title}\n   → ${d.Summary200}`;
    });

    let combined;
    // 5) If it’s strictly a date query, respond with ES only
    if (singleMatch || rangeMatch) {
      combined = docs.length
        ? `🗂 Found ${hits.length} case(s):\n\n${docs.join('\n\n')}`
        : `❌ No cases found for "${userInput}".`;
    } else {
      // 6) Semantic fallback: retrieve last 6 messages
      const historyDocs = await Message.find({ user }).sort({ timestamp:-1 }).limit(6);
      const history = historyDocs.reverse()
        .map(m => `${m.sender==='user'?'User':'Assistant'}: ${m.text}`)
        .join('\n');
      // 7) Prepare Chat messages
      const chatMessages = [
        { role:'system', content:
            'You are a knowledgeable legal assistant. ' +
            'Answer using ONLY the provided case summaries. ' +
            'Do NOT hallucinate.' }
      ];
      if (history)   chatMessages.push({ role:'system', content:`History:\n${history}` });
      if (docs.length) chatMessages.push({ role:'system', content:`Cases:\n${docs.join('\n\n')}` });
      chatMessages.push({ role:'user', content: userInput });

      // 8) Call OpenAI with graceful fallback
      let aiReply;
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: chatMessages,
          temperature: 0.0
        });
        aiReply = completion.choices[0].message.content.trim();
      } catch (e) {
        console.warn('⚠️ OpenAI error, falling back to ES-only:', e.code||e.message);
        aiReply = docs.length
          ? `ℹ️ (AI unavailable, showing cases only)\n\n${docs.join('\n\n')}`
          : `❌ No cases found for "${userInput}".`;
      }
      // 9) Combine AI reply + ES citations
      combined = aiReply;
      if (docs.length && !aiReply.includes('cases only')) {
        combined += `\n\n📚 Relevant cases:\n${docs.map(d=>`- ${d}`).join('\n')}`;
      }
    }

    // 10) Persist chat
    await Message.insertMany([
      { text: userInput, sender: 'user', user },
      { text: combined,  sender: 'bot',  user }
    ]);
    return res.json({ response: combined });
  }
  catch(err) {
    console.error('❌ Error in /chat:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─── History Endpoints ──────────────────────────────────────────────────────────
app.get('/history', async (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: 'No user specified' });
  const msgs = await Message.find({ user }).sort({ timestamp: 1 });
  res.json(msgs);
});
app.delete('/history', async (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: 'No user specified' });
  await Message.deleteMany({ user });
  res.sendStatus(200);
});

// ─── Auth Endpoints ─────────────────────────────────────────────────────────────
// Google OAuth
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login.html' }),
  (req, res) => {
    req.session.user = req.user;
    res.redirect('/chat.html');
  }
);

// Microsoft OAuth
app.get('/auth/microsoft', passport.authenticate('microsoft'));
app.get('/auth/microsoft/callback', passport.authenticate('microsoft', { failureRedirect: '/login.html' }),
  (req, res) => {
    req.session.user = req.user;
    res.redirect('/chat.html');
  }
);

// Expose current user info
app.get('/api/me', (req, res) => {
  if (req.isAuthenticated() && req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.status(401).json({ user: null });
  }
});

// ─── Admin Endpoints ───────────────────────────────────────────────────────────
// List all users who have messages
app.get('/admin/users', async (req, res) => {
  const users = await Message.distinct('user');
  res.json(users);
});

// Get a user's chat history
app.get('/admin/history', async (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: 'No user specified' });
  const msgs = await Message.find({ user }).sort({ timestamp: 1 });
  res.json(msgs);
});

// Delete a user's chat history
app.delete('/admin/history', async (req, res) => {
  const user = req.query.user;
  if (!user) return res.status(400).json({ error: 'No user specified' });
  await Message.deleteMany({ user });
  res.sendStatus(200);
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(port, () => {
  console.log(`🟢 Node.js server listening on http://localhost:${port}`);
});