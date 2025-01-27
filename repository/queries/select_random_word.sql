SELECT spelling
FROM word_spelling
$where_stmt
ORDER BY RANDOM()
LIMIT 1;