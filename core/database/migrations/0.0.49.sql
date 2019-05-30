CREATE INDEX block_height_index ON block(height);
CREATE INDEX block_id_index ON trs(block_id);

DROP TABLE IF EXISTS round;
