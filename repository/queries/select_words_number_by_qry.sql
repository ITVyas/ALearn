SELECT COUNT(*) AS words_number
FROM word_spelling
WHERE spelling LIKE '$qry%';