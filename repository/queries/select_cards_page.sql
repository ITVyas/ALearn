SELECT *
FROM info_cards
WHERE card_name LIKE '$qry%'
LIMIT $limit
OFFSET $offset;