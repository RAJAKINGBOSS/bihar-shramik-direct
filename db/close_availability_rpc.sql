-- db/close_availability_rpc.sql
CREATE OR REPLACE FUNCTION close_last_availability(p_worker_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE availability_logs
  SET ended_at = now()
  WHERE id = (
    SELECT id FROM availability_logs
    WHERE worker_id = p_worker_id AND ended_at IS NULL
    ORDER BY started_at DESC
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;
