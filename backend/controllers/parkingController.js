const parkingModel = require('../models/parkingModel');

const getLots = (req, res) => {
    parkingModel.getAllLots((err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const getSlots = (req, res) => {
    parkingModel.getAllSlots((err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

const getSlotsByLotId = (req, res) => {
    const { lotId } = req.params;
    parkingModel.getSlotsByLot(lotId, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
};

module.exports = { getLots, getSlots, getSlotsByLotId };