SELECT MAX(records_count) AS max_records_count
FROM (
    SELECT word_id, COUNT(*) AS records_count
    FROM word_$mode_name
    LEFT JOIN word_spelling ON word_spelling.id = word_$mode_name.word_id
    WHERE word_spelling.training_disabled = 0
    GROUP BY word_id
);
