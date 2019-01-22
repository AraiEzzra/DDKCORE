/*
 * - Recreate blockRewards data type and function getBlockRewards (simplify milestones)
 * - Recreate calcBlockReward function, improved performance
 * - Create calcSupply_test function - for testing calcSupply
 * - Recreate calcSupply, improved performance, change type to IMMUTABLE
 */

BEGIN;

-- Drop old functions and data type
DROP FUNCTION IF EXISTS getBlockRewards();
DROP FUNCTION IF EXISTS calcBlockReward( INT );
DROP FUNCTION IF EXISTS calcSupply( INT );
DROP TYPE IF EXISTS BLOCKREWARDS;

-- Create new data type which will store block rewards info
CREATE TYPE BLOCKREWARDS AS (supply BIGINT, start INT, distance BIGINT, milestones BIGINT []);

-- Create function that returns blocks rewards data
-- @IMMUTABLE - always returns the same result
CREATE FUNCTION getBlockRewards()
  RETURNS BLOCKREWARDS LANGUAGE PLPGSQL IMMUTABLE AS $$
DECLARE
  res        BLOCKREWARDS;
  supply     BIGINT = 2100000000000000; -- Initial supply
  start      INT = 2160; -- Start rewards at block (n)
  distance   BIGINT = 3000000; -- Distance between each milestone
  milestones BIGINT [] = ARRAY [-- Milestones
  500000000, -- Initial Reward
  400000000, -- Milestone 1
  300000000, -- Milestone 2
  200000000, -- Milestone 3
  100000000  -- Milestone 4
  ];
BEGIN
  res.supply = supply;
  res.start = start;
  res.distance = distance;
  res.milestones = milestones;
  RETURN res;
END $$;

-- Create function that returns blocks rewards data
-- @IMMUTABLE - always returns the same result for the same argument
CREATE FUNCTION calcBlockReward(block_height INT)
  RETURNS BIGINT LANGUAGE PLPGSQL IMMUTABLE AS $$
DECLARE
  r    BLOCKREWARDS;
  mile INT;
BEGIN
  -- Return NULL if supplied height is invalid
  IF block_height IS NULL OR block_height <= 0
  THEN RETURN NULL; END IF;

  -- Get blocks rewards data
  SELECT *
  FROM getBlockRewards()
  INTO r;

  -- If height is below rewards start - return 0
  IF block_height < r.start
  THEN
    RETURN 0;
  END IF;

  -- Calculate milestone for height (we use +1 here because array indexes by default begins from 1 in postgres)
  mile := FLOOR((block_height - r.start) / r.distance) + 1;

  -- If calculated milestone exceeds last milestone
  IF mile > array_length(r.milestones, 1)
  THEN
    -- Use last milestone
    mile := array_length(r.milestones, 1);
  END IF;

  -- Return calculated reward
  RETURN r.milestones [mile];
END $$;

-- Create function that calculate current supply
-- @IMMUTABLE - always returns the same result for the same argument
CREATE FUNCTION calcSupply(block_height INT)
  RETURNS BIGINT LANGUAGE PLPGSQL IMMUTABLE AS $$
DECLARE
  r    BLOCKREWARDS;
  mile INT;
BEGIN
  -- Return NULL if supplied height is invalid
  IF block_height IS NULL OR block_height <= 0
  THEN RETURN NULL; END IF;

  -- Get blocks rewards data
  SELECT *
  FROM getBlockRewards()
  INTO r;

  -- If height is below rewards start - return initial supply
  IF block_height < r.start
  THEN
    RETURN r.supply;
  END IF;

  -- Calculate milestone for height (we use +1 here because array indexes by default begins from 1 in postgres)
  mile := FLOOR((block_height - r.start) / r.distance) + 1;

  -- If calculated milestone exceeds last milestone
  IF mile > array_length(r.milestones, 1)
  THEN
    -- Use last milestone
    mile := array_length(r.milestones, 1);
  END IF;

  -- Iterate over milestones
  FOR m IN 1..mile LOOP
    IF m = mile
    THEN
      -- Not completed milestone
      -- Calculate amount of blocks in milestone, calculate rewards and add to supply
      r.supply := r.supply + (block_height - r.start + 1 - r.distance * (m - 1)) * r.milestones [m];
    ELSE
      -- Completed milestone
      -- Use distance for calculate rewards for blocks in milestone and add to supply
      r.supply := r.supply + r.distance * r.milestones [m];
    END IF;
  END LOOP;

  -- Return calculated supply
  RETURN r.supply;
END $$;

-- Create function for testing calcSupply(int) function
-- @IMMUTABLE - always returns the same result for the same arguments
CREATE FUNCTION calcSupply_test(height_start INT, height_end INT, expected_reward BIGINT)
  RETURNS BOOLEAN LANGUAGE PLPGSQL IMMUTABLE AS $$
DECLARE
  supply      BIGINT;
  prev_supply BIGINT;
BEGIN
  -- Calculate supply for previous height
  SELECT calcSupply(height_start - 1)
  INTO prev_supply;

  -- Iteratating over heights
  FOR height IN height_start..height_end LOOP
    -- Calculate supply for current height
    SELECT calcSupply(height)
    INTO supply;

    -- If supply for previous height + expected block reward is different than supply for current height
    IF (prev_supply + expected_reward) <> supply
    THEN
      -- Break and retun false
      RETURN FALSE;
    END IF;

    -- Update supply for previous height
    prev_supply := supply;
  END LOOP;

  -- All tests passed - return true
  RETURN TRUE;
END $$;

COMMIT;
