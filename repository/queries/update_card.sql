UPDATE info_cards
SET data_json = $data_json, card_name = $card_name, training_disabled = $training_disabled, time = $time 
WHERE id = $card_id;