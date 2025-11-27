const express = require('express');
const cors = require('cors');
const gameManager = require('./gameManager');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// GET /api/state
app.get('/api/state', (req, res) => {
    res.json({
        waitingQueue: gameManager.getQueue(),
        currentSession: gameManager.getSession(),
        finishedList: gameManager.history, // Accessing history directly for now
        // Add other settings if needed, but for now state is most important
    });
});

// POST /api/join
app.post('/api/join', (req, res) => {
    const { name, id } = req.body;
    // If ID is not provided (e.g. from manual entry), generate one
    const userId = id || `manual-${Date.now()}`;

    const result = gameManager.addPlayer(userId, name);
    res.json(result);
});

// POST /api/remove
app.post('/api/remove', (req, res) => {
    const { id } = req.body;
    const result = gameManager.removePlayer(id);
    res.json(result);
});

// POST /api/next
app.post('/api/next', (req, res) => {
    const { size } = req.body;
    const result = gameManager.pickSession(size || 1);
    res.json(result);
});

// POST /api/finish
app.post('/api/finish', (req, res) => {
    const result = gameManager.finishSession();
    res.json(result);
});

// POST /api/reset
app.post('/api/reset', (req, res) => {
    const result = gameManager.reset();
    res.json(result);
});

function startServer() {
    app.listen(PORT, () => {
        console.log(`API Server running on http://localhost:${PORT}`);
    });
}

module.exports = { startServer };
