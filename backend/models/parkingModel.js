const db = require('../config/db');

const getAllLots = (callback) => {
    db.query('SELECT * FROM parking_lots', callback);
};

const getSlotsByLot = (lotId, callback) => {
    db.query('SELECT * FROM parking_slots WHERE lot_id = ?', [lotId], callback);
};

const getAllSlots = (callback) => {
    db.query('SELECT * FROM parking_slots', callback);
};

module.exports = { getAllLots, getSlotsByLot, getAllSlots };