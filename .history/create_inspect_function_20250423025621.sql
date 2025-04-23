-- Function to inspect table columns
CREATE OR REPLACE FUNCTION inspect_profiles_columns()
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(row_to_json(col_info))
    FROM (
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = 'profiles'
        AND table_schema = 'public'
      ORDER BY 
        ordinal_position
    ) col_info
  );
END;
$$;

-- Generic function to inspect any table's columns
CREATE OR REPLACE FUNCTION inspect_columns(table_name text)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(row_to_json(col_info))
    FROM (
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM 
        information_schema.columns
      WHERE 
        table_name = table_name
        AND table_schema = 'public'
      ORDER BY 
        ordinal_position
    ) col_info
  );
END;
$$;

-- Create function to add these RPCs
CREATE OR REPLACE FUNCTION create_inspect_columns_function()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- The functions are already created above, so we just return success
  RETURN 'Column inspection functions created';
END;
$$;