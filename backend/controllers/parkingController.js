const db = require('../config/db');
const { handleServerError } = require('../utils/errorHandler');

const getLots = async (req, res) => {
    try {
        const p = db.promise();
        const [lots] = await p.query('SELECT * FROM parking_lots');
        const [stateRows] = await p.query('SELECT *, TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) AS sec_since_heartbeat FROM device_state WHERE id = 1');
        const device = stateRows[0] || null;
        const isDeviceOnline = device && device.sec_since_heartbeat !== null && device.sec_since_heartbeat <= 15;

        // Enhance lot data with device status and simulated markings
        const enrichedLots = (lots || []).map(lot => {
            const isL1 = lot.id === 1;
            const isL2 = lot.id === 2;
            const isRealSlot = isL1 || isL2;

            return {
                ...lot,
                is_simulated: !isRealSlot,
                hardware_monitored: isRealSlot,
                device_online: isDeviceOnline,
                total_slots: isRealSlot ? 1 : lot.total_slots // Level 1 and 2 each have 1 real ultrasonic slot in diorama
            };
        });

        res.json(enrichedLots);
    } catch (err) {
        handleServerError(res, err, 'Failed to fetch parking lot data.');
    }
};

const getSlots = async (req, res) => {
    try {
        const p = db.promise();
        const [slots] = await p.query('SELECT * FROM parking_slots');
        const [stateRows] = await p.query('SELECT *, TIMESTAMPDIFF(SECOND, last_heartbeat, NOW()) AS sec_since_heartbeat FROM device_state WHERE id = 1');
        const device = stateRows[0] || null;

        const enrichedSlots = (slots || []).map(slot => {
            let status = slot.status;
            const isL1Real = slot.slot_number === 'L1-01';
            const isL2Real = slot.slot_number === 'L2-01';
            const isReal = isL1Real || isL2Real;

            if (device) {
                if (isL1Real) {
                    status = device.l1_status === 'occupied' ? 'occupied' : (device.l1_status === 'fault' ? 'maintenance' : 'available');
                } else if (isL2Real) {
                    status = device.l2_status === 'occupied' ? 'occupied' : (device.l2_status === 'fault' ? 'maintenance' : 'available');
                }
            }

            return {
                ...slot,
                status,
                is_simulated: !isReal,
                hardware_monitored: isReal
            };
        });

        res.json(enrichedSlots);
    } catch (err) {
        handleServerError(res, err, 'Failed to fetch parking slot data.');
    }
};

const getSlotsByLotId = (req, res) => {
    const { lotId } = req.params;
    parkingModel.getSlotsByLot(lotId, (err, results) => {
        if (err) return handleServerError(res, err, 'Failed to fetch parking slots for specified lot.');
        res.json(results);
    });
};

module.exports = { getLots, getSlots, getSlotsByLotId };
