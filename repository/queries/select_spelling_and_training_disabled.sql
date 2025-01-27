SELECT id, spelling, training_disabled
FROM word_spelling
WHERE spelling LIKE '$qry%'
LIMIT $limit 
OFFSET $offset;