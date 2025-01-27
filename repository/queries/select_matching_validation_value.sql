SELECT SUM(min_count) AS validation_value
FROM(
    SELECT word_id, IIF(COUNT(*) > $pairs_N, $pairs_N, COUNT(*)) AS min_count
    FROM word_$mode_name
    LEFT JOIN word_spelling ON word_spelling.id=word_$mode_name.word_id
    WHERE word_spelling.training_disabled = 0
    GROUP BY word_id
);
