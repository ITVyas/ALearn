WITH WordsSample AS (
    SELECT DISTINCT id, spelling
    FROM word_spelling
    WHERE training_disabled=0 AND id NOT IN ($exclude_word_ids)
    ORDER BY RANDOM()
    LIMIT $words_N
),
RankedRecords AS (
    SELECT
        ws.id AS word_id,
        ws.spelling AS spelling,
        wt.$record_name AS $record_name,
        ROW_NUMBER() OVER (PARTITION BY ws.id ORDER BY RANDOM()) AS rn
    FROM 
        WordsSample ws 
    INNER JOIN 
        word_$table_name wt ON wt.word_id = ws.id
)
SELECT 
    word_id, 
    spelling, 
    replace(GROUP_CONCAT(DISTINCT $record_name || $separator), CONCAT($separator, ','), $separator) AS recordsArr
FROM RankedRecords
WHERE rn <= $records_N
GROUP BY word_id
ORDER BY RANDOM();