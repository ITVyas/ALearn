SELECT *
FROM word_$mode_name
LEFT JOIN word_spelling ON word_$mode_name.word_id = word_spelling.id
WHERE NOT word_id IN ($exclude_word_ids) AND word_spelling.training_disabled=0
ORDER BY RANDOM()
LIMIT $limit;