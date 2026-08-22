import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/api';

const defaultLots = [
  {
    id: 1,
    name: 'HPSB Level 1',
    code: 'HPSB-L1',
    location: 'HPSB Building - Ground Floor',
    total_slots: 15,
    totalSlots: 15,
    occupiedSlots: 15,
    availableSlots: 0,
    status: 'Full'
  },
  {
    id: 2,
    name: 'HPSB Level 2',
    code: 'HPSB-L2',
    location: 'HPSB Building - 2nd Floor',
    total_slots: 15,
    totalSlots: 15,
    occupiedSlots: 10,
    availableSlots: 5,
    status: 'Open'
  },
  {
    id: 3,
    name: 'HPSB Level 3',
    code: 'HPSB-L3',
    location: 'HPSB Building - 3rd Floor',
    total_slots: 15,
    totalSlots: 15,
    occupiedSlots: 5,
    availableSlots: 10,
    status: 'Open'
  },
  {
    id: 4,
    name: 'HPSB Level 4',
    code: 'HPSB-L4',
    location: 'HPSB Building - 4th Floor',
    total_slots: 15,
    totalSlots: 15,
    occupiedSlots: 2,
    availableSlots: 13,
    status: 'Open'
  }
];

const defaultSlots = [
  // Level 1 (L1-01 to L1-15) - ALL FULL (15/15 Occupied)
  { id: 1, lot_id: 1, slot_number: 'L1-01', status: 'occupied' },
  { id: 2, lot_id: 1, slot_number: 'L1-02', status: 'occupied' },
  { id: 3, lot_id: 1, slot_number: 'L1-03', status: 'occupied' },
  { id: 4, lot_id: 1, slot_number: 'L1-04', status: 'occupied' },
  { id: 5, lot_id: 1, slot_number: 'L1-05', status: 'occupied' },
  { id: 6, lot_id: 1, slot_number: 'L1-06', status: 'occupied' },
  { id: 7, lot_id: 1, slot_number: 'L1-07', status: 'occupied' },
  { id: 8, lot_id: 1, slot_number: 'L1-08', status: 'occupied' },
  { id: 9, lot_id: 1, slot_number: 'L1-09', status: 'occupied' },
  { id: 10, lot_id: 1, slot_number: 'L1-10', status: 'occupied' },
  { id: 11, lot_id: 1, slot_number: 'L1-11', status: 'occupied' },
  { id: 12, lot_id: 1, slot_number: 'L1-12', status: 'occupied' },
  { id: 13, lot_id: 1, slot_number: 'L1-13', status: 'occupied' },
  { id: 14, lot_id: 1, slot_number: 'L1-14', status: 'occupied' },
  { id: 15, lot_id: 1, slot_number: 'L1-15', status: 'occupied' },

  // Level 2 (L2-01 to L2-15) - 10 Occupied, 5 Available
  { id: 16, lot_id: 2, slot_number: 'L2-01', status: 'occupied' },
  { id: 17, lot_id: 2, slot_number: 'L2-02', status: 'occupied' },
  { id: 18, lot_id: 2, slot_number: 'L2-03', status: 'available' },
  { id: 19, lot_id: 2, slot_number: 'L2-04', status: 'occupied' },
  { id: 20, lot_id: 2, slot_number: 'L2-05', status: 'occupied' },
  { id: 21, lot_id: 2, slot_number: 'L2-06', status: 'available' },
  { id: 22, lot_id: 2, slot_number: 'L2-07', status: 'occupied' },
  { id: 23, lot_id: 2, slot_number: 'L2-08', status: 'available' },
  { id: 24, lot_id: 2, slot_number: 'L2-09', status: 'occupied' },
  { id: 25, lot_id: 2, slot_number: 'L2-10', status: 'occupied' },
  { id: 26, lot_id: 2, slot_number: 'L2-11', status: 'available' },
  { id: 27, lot_id: 2, slot_number: 'L2-12', status: 'occupied' },
  { id: 28, lot_id: 2, slot_number: 'L2-13', status: 'available' },
  { id: 29, lot_id: 2, slot_number: 'L2-14', status: 'occupied' },
  { id: 30, lot_id: 2, slot_number: 'L2-15', status: 'occupied' },

  // Level 3 (L3-01 to L3-15) - 5 Occupied, 10 Available
  { id: 31, lot_id: 3, slot_number: 'L3-01', status: 'available' },
  { id: 32, lot_id: 3, slot_number: 'L3-02', status: 'occupied' },
  { id: 33, lot_id: 3, slot_number: 'L3-03', status: 'available' },
  { id: 34, lot_id: 3, slot_number: 'L3-04', status: 'available' },
  { id: 35, lot_id: 3, slot_number: 'L3-05', status: 'occupied' },
  { id: 36, lot_id: 3, slot_number: 'L3-06', status: 'available' },
  { id: 37, lot_id: 3, slot_number: 'L3-07', status: 'available' },
  { id: 38, lot_id: 3, slot_number: 'L3-08', status: 'occupied' },
  { id: 39, lot_id: 3, slot_number: 'L3-09', status: 'available' },
  { id: 40, lot_id: 3, slot_number: 'L3-10', status: 'available' },
  { id: 41, lot_id: 3, slot_number: 'L3-11', status: 'occupied' },
  { id: 42, lot_id: 3, slot_number: 'L3-12', status: 'available' },
  { id: 43, lot_id: 3, slot_number: 'L3-13', status: 'available' },
  { id: 44, lot_id: 3, slot_number: 'L3-14', status: 'occupied' },
  { id: 45, lot_id: 3, slot_number: 'L3-15', status: 'available' },

  // Level 4 (L4-01 to L4-15) - 2 Occupied, 13 Available
  { id: 46, lot_id: 4, slot_number: 'L4-01', status: 'available' },
  { id: 47, lot_id: 4, slot_number: 'L4-02', status: 'available' },
  { id: 48, lot_id: 4, slot_number: 'L4-03', status: 'occupied' },
  { id: 49, lot_id: 4, slot_number: 'L4-04', status: 'available' },
  { id: 50, lot_id: 4, slot_number: 'L4-05', status: 'available' },
  { id: 51, lot_id: 4, slot_number: 'L4-06', status: 'available' },
  { id: 52, lot_id: 4, slot_number: 'L4-07', status: 'available' },
  { id: 53, lot_id: 4, slot_number: 'L4-08', status: 'available' },
  { id: 54, lot_id: 4, slot_number: 'L4-09', status: 'available' },
  { id: 55, lot_id: 4, slot_number: 'L4-10', status: 'occupied' },
  { id: 56, lot_id: 4, slot_number: 'L4-11', status: 'available' },
  { id: 57, lot_id: 4, slot_number: 'L4-12', status: 'available' },
  { id: 58, lot_id: 4, slot_number: 'L4-13', status: 'available' },
  { id: 59, lot_id: 4, slot_number: 'L4-14', status: 'available' },
  { id: 60, lot_id: 4, slot_number: 'L4-15', status: 'available' }
];

export const useParkingData = () => {
  const [liveData, setLiveData] = useState({
    lots: [],
    slots: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchParkingData = async () => {
      try {
        const [lotsRes, slotsRes] = await Promise.allSettled([
          fetch(`${API_BASE_URL}/api/lots`),
          fetch(`${API_BASE_URL}/api/slots`)
        ]);

        let fetchedLots = [];
        let fetchedSlots = [];

        if (lotsRes.status === 'fulfilled' && lotsRes.value.ok) {
          const resData = await lotsRes.value.json();
          if (Array.isArray(resData) && resData.length > 0) {
            fetchedLots = resData;
          }
        }

        if (slotsRes.status === 'fulfilled' && slotsRes.value.ok) {
          const resData = await slotsRes.value.json();
          if (Array.isArray(resData)) {
            fetchedSlots = resData;
          }
        }

        const lotsBase = fetchedLots.length > 0 ? fetchedLots : defaultLots;
        const slotsBase = fetchedSlots.length > 0 ? fetchedSlots : defaultSlots;

        const processedLots = lotsBase.map(lot => {
          const totalSlots = Number(lot.total_slots || lot.totalSlots || 0);
          const lotSlots = slotsBase.filter(s => Number(s.lot_id) === Number(lot.id));

          let occupiedCount = 0;
          let availableCount = 0;

          if (lotSlots.length > 0) {
            occupiedCount = lotSlots.filter(s => s.status === 'occupied').length;
            availableCount = lotSlots.filter(s => s.status === 'available').length;
            if (availableCount + occupiedCount < totalSlots) {
              availableCount = totalSlots - occupiedCount;
            }
          } else {
            occupiedCount = lot.occupiedSlots !== undefined ? lot.occupiedSlots : 0;
            availableCount = totalSlots - occupiedCount;
          }

          return {
            ...lot,
            code: lot.code || `LOT-${lot.name.replace(/[^A-Za-z0-9]/g, '') || lot.id}`,
            totalSlots,
            occupiedSlots: occupiedCount,
            availableSlots: availableCount,
            slotsList: lotSlots
          };
        });

        setLiveData({
          lots: processedLots,
          slots: slotsBase,
          loading: false,
          error: null
        });
      } catch (err) {
        setLiveData({
          lots: defaultLots.map(lot => ({
            ...lot,
            slotsList: defaultSlots.filter(s => s.lot_id === lot.id)
          })),
          slots: defaultSlots,
          loading: false,
          error: null
        });
      }
    };

    fetchParkingData();
    const interval = setInterval(fetchParkingData, 15000);
    return () => clearInterval(interval);
  }, []);

  return liveData;
};
