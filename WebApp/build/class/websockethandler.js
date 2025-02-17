"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reset = reset;
exports.add = add;
exports.remove = remove;
exports.onConnect = onConnect;
exports.onDisconnect = onDisconnect;
exports.onOffer = onOffer;
exports.onAnswer = onAnswer;
exports.onCandidate = onCandidate;
var offer_1 = require("./offer");
var answer_1 = require("./answer");
var candidate_1 = require("./candidate");
var isPrivate;
// [{sessonId:[connectionId,...]}]
var clients = new Map();
// [{connectionId:[sessionId1, sessionId2]}]
var connectionPair = new Map();
function getOrCreateConnectionIds(session) {
    var connectionIds = null;
    if (!clients.has(session)) {
        connectionIds = new Set();
        clients.set(session, connectionIds);
    }
    connectionIds = clients.get(session);
    return connectionIds;
}
function reset(mode) {
    isPrivate = mode == "private";
}
function add(ws) {
    clients.set(ws, new Set());
}
function remove(ws) {
    var connectionIds = clients.get(ws);
    connectionIds.forEach(function (connectionId) {
        var pair = connectionPair.get(connectionId);
        if (pair) {
            var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
            if (otherSessionWs) {
                otherSessionWs.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
            }
        }
        connectionPair.delete(connectionId);
    });
    clients.delete(ws);
}
function onConnect(ws, connectionId) {
    var polite = true;
    if (isPrivate) {
        if (connectionPair.has(connectionId)) {
            var pair = connectionPair.get(connectionId);
            if (pair[0] != null && pair[1] != null) {
                ws.send(JSON.stringify({ type: "error", message: "".concat(connectionId, ": This connection id is already used.") }));
                return;
            }
            else if (pair[0] != null) {
                connectionPair.set(connectionId, [pair[0], ws]);
            }
        }
        else {
            connectionPair.set(connectionId, [ws, null]);
            polite = false;
        }
    }
    var connectionIds = getOrCreateConnectionIds(ws);
    connectionIds.add(connectionId);
    ws.send(JSON.stringify({ type: "connect", connectionId: connectionId, polite: polite }));
}
function onDisconnect(ws, connectionId) {
    var connectionIds = clients.get(ws);
    connectionIds.delete(connectionId);
    if (connectionPair.has(connectionId)) {
        var pair = connectionPair.get(connectionId);
        var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
        if (otherSessionWs) {
            otherSessionWs.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
        }
    }
    connectionPair.delete(connectionId);
    ws.send(JSON.stringify({ type: "disconnect", connectionId: connectionId }));
}
function onOffer(ws, message) {
    var connectionId = message.connectionId;
    var newOffer = new offer_1.default(message.sdp, Date.now(), false);
    if (isPrivate) {
        if (connectionPair.has(connectionId)) {
            var pair = connectionPair.get(connectionId);
            var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
            if (otherSessionWs) {
                newOffer.polite = true;
                otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "offer", data: newOffer }));
            }
        }
        return;
    }
    connectionPair.set(connectionId, [ws, null]);
    clients.forEach(function (_v, k) {
        if (k == ws) {
            return;
        }
        k.send(JSON.stringify({ from: connectionId, to: "", type: "offer", data: newOffer }));
    });
}
function onAnswer(ws, message) {
    var connectionId = message.connectionId;
    var connectionIds = getOrCreateConnectionIds(ws);
    connectionIds.add(connectionId);
    var newAnswer = new answer_1.default(message.sdp, Date.now());
    if (!connectionPair.has(connectionId)) {
        return;
    }
    var pair = connectionPair.get(connectionId);
    var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
    if (!isPrivate) {
        connectionPair.set(connectionId, [otherSessionWs, ws]);
    }
    otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "answer", data: newAnswer }));
}
function onCandidate(ws, message) {
    var connectionId = message.connectionId;
    var candidate = new candidate_1.default(message.candidate, message.sdpMLineIndex, message.sdpMid, Date.now());
    if (isPrivate) {
        if (connectionPair.has(connectionId)) {
            var pair = connectionPair.get(connectionId);
            var otherSessionWs = pair[0] == ws ? pair[1] : pair[0];
            if (otherSessionWs) {
                otherSessionWs.send(JSON.stringify({ from: connectionId, to: "", type: "candidate", data: candidate }));
            }
        }
        return;
    }
    clients.forEach(function (_v, k) {
        if (k === ws) {
            return;
        }
        k.send(JSON.stringify({ from: connectionId, to: "", type: "candidate", data: candidate }));
    });
}
//# sourceMappingURL=websockethandler.js.map