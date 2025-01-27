SELECT COUNT(*) AS cards_number
FROM info_cards
WHERE card_name LIKE '$qry%';