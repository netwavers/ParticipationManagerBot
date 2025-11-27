const { loadData, saveData } = require('./storage');

class GameManager {
    constructor() {
        const data = loadData();
        this.queue = data.queue || [];
        this.session = data.session || [];
        this.history = data.history || [];
        this.recruitmentMessage = data.recruitmentMessage || null;
    }

    _save() {
        saveData({
            queue: this.queue,
            session: this.session,
            history: this.history,
            recruitmentMessage: this.recruitmentMessage
        });
    }

    addPlayer(id, name) {
        // Check if already in queue
        if (this.queue.some(p => p.id === id)) {
            return { success: false, message: '既に待機リストにいます。' };
        }
        // Check if currently in session
        if (this.session.some(p => p.id === id)) {
            return { success: false, message: '現在プレイ中です。' };
        }

        // Check history for existing stats
        let playerStats = this.history.find(p => p.id === id);
        if (!playerStats) {
            playerStats = { id, name, playCount: 0, lastPlayed: null };
            // We don't add to history yet, just tracking stats conceptually
        }

        this.queue.push({
            id,
            name,
            joinedAt: new Date().toISOString(),
            playCount: playerStats.playCount // Keep track of play count for sorting
        });
        this._save();
        return { success: true, queueLength: this.queue.length };
    }

    removePlayer(id) {
        const index = this.queue.findIndex(p => p.id === id);
        if (index === -1) {
            return { success: false, message: '待機リストに含まれていません。' };
        }
        const removed = this.queue.splice(index, 1)[0];
        this._save();
        return { success: true, name: removed.name, queueLength: this.queue.length };
    }

    getQueue() {
        return this.queue;
    }

    getSession() {
        return this.session;
    }

    pickSession(size) {
        if (this.queue.length === 0) {
            return { success: false, message: '待機リストが空です。' };
        }

        // Sort queue: Play Count (asc) -> Join Time (asc)
        this.queue.sort((a, b) => {
            if (a.playCount !== b.playCount) {
                return a.playCount - b.playCount;
            }
            return new Date(a.joinedAt) - new Date(b.joinedAt);
        });

        const picked = this.queue.splice(0, size);
        this.session = picked;
        this._save();

        return { success: true, players: picked };
    }

    finishSession() {
        if (this.session.length === 0) {
            return { success: false, message: '現在進行中のセッションはありません。' };
        }

        const finishedPlayers = [...this.session];

        // Update history
        finishedPlayers.forEach(p => {
            let histPlayer = this.history.find(h => h.id === p.id);
            if (!histPlayer) {
                histPlayer = { id: p.id, name: p.name, playCount: 0 };
                this.history.push(histPlayer);
            }
            histPlayer.playCount++;
            histPlayer.lastPlayed = new Date().toISOString();
        });

        this.session = [];
        this._save();
        return { success: true, players: finishedPlayers };
    }

    reset() {
        this.queue = [];
        this.session = [];
        this.recruitmentMessage = null;
        // History is usually kept, but maybe we want a hard reset?
        // For now, let's just reset queue and session as per original !reset
        this._save();
        return { success: true };
    }

    setRecruitmentMessage(message) {
        this.recruitmentMessage = message;
        this._save();
    }

    getRecruitmentMessage() {
        return this.recruitmentMessage;
    }
}

module.exports = new GameManager();
