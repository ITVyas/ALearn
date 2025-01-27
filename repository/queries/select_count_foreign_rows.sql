SELECT COUNT(*) AS count
FROM word_$mode_name
LEFT JOIN word_spelling ON word_spelling.id = word_$mode_name.word_id 
WHERE word_spelling.training_disabled=0;