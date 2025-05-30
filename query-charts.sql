UPDATE query_charts
SET map_config_ids = '{999,1001,1002,1003,1004,1005}',
    query_chart = $$
	SELECT * FROM (VALUES
  ('租屋', 'symbol', 'rental'),
  ('圖書館', 'symbol', 'library'),
  ('醫院', 'symbol', 'hospital'),
  ('商圈', 'symbol', 'shopping_district')
) AS t(name, type, icon);
	$$,
	map_filter = '{"mode":"byLayer","byLayer":{"xParam":"type"}}'
WHERE "index" = 'bear_map';
