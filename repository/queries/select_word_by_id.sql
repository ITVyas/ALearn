SELECT 
    ws.id AS id,
    ws.spelling AS spelling,
    ws.training_disabled AS training_disabled,
    ws.time AS time,
    replace(GROUP_CONCAT(DISTINCT wt.translation || $separator), CONCAT($separator, ','), $separator) AS translationsArr,
    replace(GROUP_CONCAT(DISTINCT we.explanation || $separator), CONCAT($separator, ','), $separator) AS explanationsArr,
    replace(GROUP_CONCAT(DISTINCT wx.example_json || $separator), CONCAT($separator, ','), $separator) AS examplesArr
FROM 
    word_spelling ws
LEFT JOIN 
    word_translations wt ON ws.id = wt.word_id
LEFT JOIN 
    word_explanations we ON ws.id = we.word_id
LEFT JOIN 
    word_examples wx ON ws.id = wx.word_id
WHERE ws.id = $id
HAVING ws.id;