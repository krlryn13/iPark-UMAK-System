-- iPark UMAK - HPSB Building Parking Levels SQL Seed Script
-- Run this in phpMyAdmin SQL tab if you want to reset manually

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `parking_slots`;
TRUNCATE TABLE `parking_lots`;
SET FOREIGN_KEY_CHECKS = 1;

-- Insert HPSB Building Parking Levels
INSERT INTO `parking_lots` (`id`, `name`, `location`, `total_slots`) VALUES
(1, 'HPSB Level 1', 'HPSB Building - Ground Floor', 15),
(2, 'HPSB Level 2', 'HPSB Building - 2nd Floor', 15),
(3, 'HPSB Level 3', 'HPSB Building - 3rd Floor', 15),
(4, 'HPSB Level 4', 'HPSB Building - 4th Floor', 15);

-- Insert Parking Slots for Level 1 (L1-01 to L1-15)
INSERT INTO `parking_slots` (`lot_id`, `slot_number`, `status`) VALUES
(1, 'L1-01', 'available'), (1, 'L1-02', 'occupied'), (1, 'L1-03', 'available'), (1, 'L1-04', 'available'), (1, 'L1-05', 'occupied'),
(1, 'L1-06', 'available'), (1, 'L1-07', 'available'), (1, 'L1-08', 'available'), (1, 'L1-09', 'available'), (1, 'L1-10', 'available'),
(1, 'L1-11', 'occupied'), (1, 'L1-12', 'available'), (1, 'L1-13', 'available'), (1, 'L1-14', 'available'), (1, 'L1-15', 'available');

-- Insert Parking Slots for Level 2 (L2-01 to L2-15)
INSERT INTO `parking_slots` (`lot_id`, `slot_number`, `status`) VALUES
(2, 'L2-01', 'available'), (2, 'L2-02', 'occupied'), (2, 'L2-03', 'available'), (2, 'L2-04', 'available'), (2, 'L2-05', 'occupied'),
(2, 'L2-06', 'available'), (2, 'L2-07', 'available'), (2, 'L2-08', 'available'), (2, 'L2-09', 'available'), (2, 'L2-10', 'available'),
(2, 'L2-11', 'occupied'), (2, 'L2-12', 'available'), (2, 'L2-13', 'available'), (2, 'L2-14', 'available'), (2, 'L2-15', 'available');

-- Insert Parking Slots for Level 3 (L3-01 to L3-15)
INSERT INTO `parking_slots` (`lot_id`, `slot_number`, `status`) VALUES
(3, 'L3-01', 'available'), (3, 'L3-02', 'occupied'), (3, 'L3-03', 'available'), (3, 'L3-04', 'available'), (3, 'L3-05', 'occupied'),
(3, 'L3-06', 'available'), (3, 'L3-07', 'available'), (3, 'L3-08', 'available'), (3, 'L3-09', 'available'), (3, 'L3-10', 'available'),
(3, 'L3-11', 'occupied'), (3, 'L3-12', 'available'), (3, 'L3-13', 'available'), (3, 'L3-14', 'available'), (3, 'L3-15', 'available');

-- Insert Parking Slots for Level 4 (L4-01 to L4-15)
INSERT INTO `parking_slots` (`lot_id`, `slot_number`, `status`) VALUES
(4, 'L4-01', 'available'), (4, 'L4-02', 'occupied'), (4, 'L4-03', 'available'), (4, 'L4-04', 'available'), (4, 'L4-05', 'occupied'),
(4, 'L4-06', 'available'), (4, 'L4-07', 'available'), (4, 'L4-08', 'available'), (4, 'L4-09', 'available'), (4, 'L4-10', 'available'),
(4, 'L4-11', 'occupied'), (4, 'L4-12', 'available'), (4, 'L4-13', 'available'), (4, 'L4-14', 'available'), (4, 'L4-15', 'available');
