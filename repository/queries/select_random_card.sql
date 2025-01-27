SELECT card_name, data_json
FROM info_cards
$where_stmt
ORDER BY RANDOM()
LIMIT 1;