const parkingModel = require('../models/parkingModel');
const { handleServerError } = require('../utils/errorHandler');

const getLots = (req, res) => {
    parkingModel.getAllLots((err, results) => {
        if (err) return handleServerError(res, err, 'Failed to fetch parking lot data.');
        res.json(results);
    });
};

const getSlots = (req, res) => {
    parkingModel.getAllSlots((err, results) => {
        if (err) return handleServerError(res, err, 'Failed to fetch parking slot data.');
        res.json(results);
    });
};

const getSlotsByLotId = (req, res) => {
    const { lotId } = req.params;
    parkingModel.getSlotsByLot(lotId, (err, results) => {
        if (err) return handleServerError(res, err, 'Failed to fetch parking slots for specified lot.');
        res.json(results);
    });
};

module.exports = { getLots, getSlots, getSlotsByLotId };