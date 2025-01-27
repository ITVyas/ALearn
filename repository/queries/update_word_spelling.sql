UPDATE word_spelling
SET spelling = $spelling, training_disabled = $training_disabled, time = $time 
WHERE id = $id;