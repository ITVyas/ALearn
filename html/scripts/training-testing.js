import { Config, ElementBuilder, GlobalWordsData } from "./root.js";

function shuffleArray(array) {
    array = [...array];
    for (let i = array.length - 1; i >= 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function createResultElement() {
    const resultEl = ElementBuilder.create('div')
        .addClasses('results', 'hiding')
        .appendElements(
            ElementBuilder.create('div').addClasses('close-results').setInnerHTML("⟨").addEventListener(
                'click', () => {
                    resultEl.remove();
                    Array.from(document.querySelectorAll('.training-testing')).forEach(el => el.remove());
                    
                    const paramsFormTesting = document.querySelector('.testing-container .settings ');
                    paramsFormTesting.classList.remove('hiding');
                    paramsFormTesting.style.removeProperty('display');

                    paramsFormTesting.querySelector('.form-btn').disabled = false;
                }
            ).get(),
            ElementBuilder.create('h3').setInnerHTML("Test is completed!").addClasses('bold').get(),
            ElementBuilder.create('h3').setInnerHTML("Result").get(),
            ElementBuilder.create('hr').get(),
        ).get();
    return resultEl;
}

function createTestingElement(question, nextElement, questionNumber, questionsNumber) {
    const testEl = ElementBuilder.create('div')
        .addClasses('training-testing', 'hiding')
        .appendElements(
            ElementBuilder.create('div')
                .addClasses('training-title')
                .setInnerHTML(`Question ${questionNumber}/${questionsNumber}`).get(),
            ElementBuilder.create('hr').get(),
            ElementBuilder.create('div').addClasses('word').setInnerHTML(question['word']).get(),
            ElementBuilder.create('div').addClasses('options').appendElements(
                ...question['options'].map(opt => {
                    return ElementBuilder.create('div')
                        .addClasses('option')
                        .setInnerHTML(opt)
                        .addEventListener('click', () => {
                            testEl.classList.add('hiding');
                            nextElement.classList.remove('hiding');
                        }).get();
                })
            ).get()
        ).get();
    return testEl;
}

function createQuestionResultsEl(word, options, pickedStr, answerStr, questionNuber) {
    return ElementBuilder.create('div')
        .addClasses('question-results')
        .appendElements(
            ElementBuilder.create('div').addClasses('question-number').setInnerHTML(`Question ${questionNuber}`).get(),
            ElementBuilder.create('div').addClasses('word').setInnerHTML(word).get(),
            ElementBuilder.create('div').addClasses('options').appendElements(
                ...options.map(option => {
                    const optionEl = ElementBuilder.create('div')
                        .addClasses('option')
                        .setInnerHTML(option).get();
                    if(option === answerStr)
                        optionEl.classList.add('success');
                    if(option === pickedStr && option !== answerStr)
                        optionEl.classList.add('fail');
                    return optionEl;
                })
            ).get()
        ).get();
}

function addQuestionsLogic(answersArr) {
    const questionElements = document.querySelectorAll('.training-testing');
    const optionsElements = Array.from(questionElements).map((qe) => qe.querySelector('.testing-container .options'));
    for(let i = 0; i < optionsElements.length; i++) {
        const questNumber = optionsElements.length - i;
        optionsElements[questNumber - 1].addEventListener('click', (e) => {
            if(e.target === optionsElements[questNumber - 1])
                return;
            const userAnswerStr = e.target.innerHTML;
            const ansEl = createQuestionResultsEl(
                questionElements[questNumber - 1].querySelector('.word').innerHTML, 
                Array.from(questionElements[questNumber - 1].querySelector('.options').children)
                .map((x) => x.innerHTML),
                userAnswerStr,
                answersArr[questNumber - 1],
                i+1
            );
            document.querySelector('.testing-container .results').append(ansEl);

            questionElements[questNumber - 1].classList.add('hiding');
            if(i < optionsElements.length - 1)
                questionElements[questNumber - 2].classList.remove('hiding');
            else 
                document.querySelector('.testing-container .results').classList.remove('hiding');
        });
    }
}

function doVisibleQuestionEl(el) {
    if(el.classList.contains('hiding'))
        el.classList.remove('hiding');
}

export function addInputNumberLogic() {
    const numberInputContainers = Array.from(document.querySelectorAll('.number-input-container'));
    numberInputContainers.forEach(container => {
        const input = container.querySelector('.number-input'),
                decrementBtn = container.querySelector('.btn-decrement'),
                incrementBtn = container.querySelector('.btn-increment');
        
        input.addEventListener('input', (event) => {
            let value = parseInt(event.target.value, 10);
            const min = parseInt(input.min, 10) || 0;
            const max = parseInt(input.max, 10) || 100;
            
            if (isNaN(value) || value < min) {
                value = min;
            } else if (value > max) {
                value = max;
            }
            event.target.value = value;
        });
            
        decrementBtn.addEventListener('click', () => {
        const step = parseInt(input.step, 10) || 1;
        const min = parseInt(input.min, 10) || 0;
        let value = parseInt(input.value, 10) || 0;
        
        value = Math.max(value - step, min);
        input.value = value;
        });
        
        incrementBtn.addEventListener('click', () => {
            const step = parseInt(input.step, 10) || 1;
            const max = parseInt(input.max, 10) || 100;
            let value = parseInt(input.value, 10) || 0;
            
            value = Math.min(value + step, max);
            input.value = value;
        });
    });
}

function createSpellingAndTrainingInfoEl(id, spelling, trainingEnabled, updatedWordTrainingInfos) {
    const elementContainer = document.createElement('div');
    elementContainer.classList.add('instance-info-container');

    const spanSpelling = document.createElement('span');
    spanSpelling.innerHTML = spelling;

    const switchBoxContainer = document.createElement('div');
    switchBoxContainer.classList.add('toggle-switch');
    
    const inputCheckBox = document.createElement('input');
    inputCheckBox.setAttribute("type", "checkbox");
    inputCheckBox.checked = trainingEnabled;
    inputCheckBox.id = `checkbox-${spelling}`;
    inputCheckBox.addEventListener('click', () => {
        const applyBtn = document.querySelector('.word-list-settings-container .buttons .apply-btn');
        if(applyBtn.disabled) applyBtn.disabled = false;
        const updatedIndex = updatedWordTrainingInfos.findIndex(x => x.spelling === spelling);
        if(updatedIndex === -1) updatedWordTrainingInfos.push(
            {
                id: id,
                spelling: spelling, 
                trainingEnabled: inputCheckBox.checked,
                trainingEnabledBefore: !inputCheckBox.checked
            }
        );
        else updatedWordTrainingInfos[updatedIndex].trainingEnabled = inputCheckBox.checked;
    });

    const labelSwitch = document.createElement('label');
    labelSwitch.setAttribute('for', inputCheckBox.id);
    labelSwitch.classList.add('switch');

    switchBoxContainer.append(inputCheckBox, labelSwitch);
    elementContainer.append(spanSpelling, switchBoxContainer);
    return elementContainer;
}

export function addWordListSettingsBtnLogic(btn) {
    btn.addEventListener('click', (e) => {
        let currentPage = 1;

        let updatedWordTrainingInfos = [];
        const backgroundElement = ElementBuilder.create('div').addClasses('gray-background').appendElements(
            ElementBuilder.create('div').addClasses('word-list-settings-container').appendElements(
                ElementBuilder.create('div').addClasses('top-bar').appendElements(
                    ElementBuilder.create('input').setAttribute('id', 'train-settings-search').get()
                ).get(),
                ElementBuilder.create('div').addClasses('content').get(),
                ElementBuilder.create('div').addClasses('pagination-container').appendElements(
                    ElementBuilder.create('button').addClasses('switch-btn').setAttribute('id', 'train-settings-prev-page').setAttribute('disabled', true).appendElements(
                        ElementBuilder.create('i').addClasses('fa-solid', 'fa-arrow-left').get()
                    ).get(),
                    ElementBuilder.create('span').setInnerHTML(currentPage).setAttribute('id', 'train-settings-current-page').get(),
                    ElementBuilder.create('span').setInnerHTML('/').get(),
                    ElementBuilder.create('span').setInnerHTML('...').setAttribute('id', 'train-settings-max-pages').get(),
                    ElementBuilder.create('button').addClasses('switch-btn').setAttribute('id', 'train-settings-next-page').appendElements(
                        ElementBuilder.create('i').addClasses('fa-solid', 'fa-arrow-right').get()
                    ).get(),
                ).get(),
                ElementBuilder.create('div').addClasses('buttons').appendElements(
                    ElementBuilder.create('button').addClasses('apply-btn').setInnerHTML('Apply').setAttribute('disabled', true).get(),
                    ElementBuilder.create('button').addClasses('cancel-btn').setInnerHTML('Cancel').get()
                ).get(),
            ).get()
        ).get();

        const nextBtn = backgroundElement.querySelector('#train-settings-next-page');
        const prevBtn = backgroundElement.querySelector('#train-settings-prev-page');
        const content = backgroundElement.querySelector('.content');
        const curPageEl = backgroundElement.querySelector('#train-settings-current-page');
        const searchInput = backgroundElement.querySelector('#train-settings-search');
        let maxPage;

        searchInput.addEventListener('input', () => {
            currentPage = 1;
            showSettingsPage(currentPage)
        });

        const showSettingsPage = async (pageNumber) => {
            curPageEl.innerHTML = pageNumber;

            const promise1 = GlobalWordsData.getAllWordsNumber(searchInput.value).then(number => {
                maxPage = Math.max(1, Math.ceil(number/Config.TRAINING_SETTINGS_PAGE_CAPACITY));
                backgroundElement.querySelector('#train-settings-max-pages').innerHTML = maxPage;
            }).then(() => {
                if(pageNumber === 1) prevBtn.disabled = true;
                else prevBtn.disabled = false;

                if(pageNumber === maxPage) nextBtn.disabled = true;
                else nextBtn.disabled = false;
            });
           

            const promise2 = window.wordAPI.getWordsTrainingInfo(pageNumber, Config.TRAINING_SETTINGS_PAGE_CAPACITY, searchInput.value)
            .then(infoArr => infoArr.reduce((container, infoEl) => {
                const el = createSpellingAndTrainingInfoEl(infoEl.id, infoEl.spelling, infoEl.trainingEnabled, updatedWordTrainingInfos);
                container.push(el);
                return container;
            }, []))
            .then(container => {
                content.innerHTML = "";
                content.append(...container);
            });

            await Promise.all([promise1, promise2]);
        };

        nextBtn.addEventListener('click', () => {
            currentPage += 1;
            showSettingsPage(currentPage);
        });

        prevBtn.addEventListener('click', () => {
            currentPage -= 1;
            showSettingsPage(currentPage);
        });

        

        backgroundElement.querySelector('.cancel-btn').addEventListener('click', () => {
            backgroundElement.remove();
        });
        backgroundElement.querySelector('.apply-btn').addEventListener('click', () => {
            backgroundElement.remove();
            GlobalWordsData.saveTrainingInfoChanges(updatedWordTrainingInfos).then(() => updatedWordTrainingInfos = []);
        });
        showSettingsPage(currentPage).then(() => {
            document.body.append(backgroundElement);
        });
        
    });
}

function modifyExampleTestsResponse(tests) {
    for(let i = 0; i < tests.length; i++) {
        for(let j = 0; j < tests[i].options.length; j++) {
            const opt_words = tests[i].options[j].text.replace(/[^\w\s\-']/g, ($1) => ` ${$1} `).replace(/[ ]+/g, ' ').split(' ');
            for(let index of tests[i].options[j].positions) 
                opt_words[index] = "______";
            tests[i].options[j] = opt_words.join(' ');
        }
    }
}

function addTestingStartBtnLogic() {
    const startBtn = document.querySelector(".testing-container .settings .form-btn");
    startBtn.addEventListener('click', async (e) => {
        const validity = document.querySelector('.testing-container form').checkValidity();
        if(validity === false)
            return false;
        startBtn.disabled = true;
        const settingsEl = document.querySelector('.testing-container .settings');
        settingsEl.classList.add('hiding');

        const formData = new FormData(document.querySelector('.testing-container form'));
        const questionOptionsNumber = Number(formData.get('question_options_number'));
        const questionsNumber = Number(formData.get('questions_number'));
        const type = formData.get('type').toLowerCase();

        let tests = await window.wordAPI.getWordsTests(questionsNumber, questionOptionsNumber, type);

        if(type === 'examples') modifyExampleTestsResponse(tests);

        const rightAnswers = tests.map((q) => q['options'][0]);
        tests = tests.map((q) => {
            return {
                'word' : q['word'],
                'options' : shuffleArray(q['options'])
            }
        });
        
        settingsEl.style.display = 'none';

        const resultEl = createResultElement();
        document.querySelector('.testing-container').append(resultEl);
        let nextEl = resultEl;
        for(let i = 0; i < questionsNumber; i++) {
            nextEl = createTestingElement(tests[i], nextEl, questionsNumber-i, questionsNumber);
            document.querySelector('.testing-container').append(nextEl);
        }
        addQuestionsLogic(rightAnswers);
        doVisibleQuestionEl(nextEl);
        return false;
    });
}

function setTestingMaxInputValues() {
    const existingWarning = document.querySelector('.testing-container .container .training-form-warning');
    if(existingWarning) {
        existingWarning.remove();
        document.querySelector('.testing-container [name="questions_number"]').min = 1;
        document.querySelector('.testing-container [name="question_options_number"]').min = 2;
        document.querySelector('.testing-container .form-btn').disabled = false;
    }
    
    let type = document.querySelector('.testing-container .select-type').value.toLowerCase(),
        maxQuestionsN = GlobalWordsData.getTableRowsNumber(type),
        maxOptionsN = GlobalWordsData.getTableRowsNumber(type) + 1 - GlobalWordsData.getMaxRecordsNumberOfAllWords(type);
    const twordsN = GlobalWordsData.getTrainingWordsNumber();
    const valid1 = twordsN >= 2,
        valid2 = maxQuestionsN >= 1 && maxOptionsN >= 2;
    if(!(valid1 && valid2)) {
        maxQuestionsN = 0;
        maxOptionsN = 0;
        const warning = ElementBuilder.create('div').addClasses('training-form-warning').setInnerHTML("❗ Add more words to create tests ❗").get();
        document.querySelector('.testing-container .container').append(warning);
    
        document.querySelector('.testing-container [name="questions_number"]').min = 0;
        document.querySelector('.testing-container [name="question_options_number"]').min = 0;
        document.querySelector('.testing-container .form-btn').disabled = true;
    } 
    document.querySelector('.testing-container #testing-max-options-number').innerHTML = maxOptionsN;
    document.querySelector('.testing-container #testing-max-questions-number').innerHTML = maxQuestionsN;

    document.querySelector('.testing-container [name="questions_number"]').max = maxQuestionsN;
    document.querySelector('.testing-container [name="question_options_number"]').max = maxOptionsN;
}

export async function addTestingLogic() {
    const wordsNumberEl = document.querySelector('.testing-container .words-amount-number');
    wordsNumberEl.innerHTML = GlobalWordsData.getTrainingWordsNumber();
    setTestingMaxInputValues();

    addWordListSettingsBtnLogic(document.querySelector('.testing-container .words-list-btn'));
    addTestingStartBtnLogic();

    document.querySelector('.testing-container .select-type').addEventListener('change', setTestingMaxInputValues);

    GlobalWordsData.onUpdateTestingData(() => {
        document.querySelector('.testing-container .words-amount-number').innerHTML = GlobalWordsData.getTrainingWordsNumber();
        setTestingMaxInputValues();
    });

    GlobalWordsData.onUpdateTrainingInfo(() => GlobalWordsData.updateAllTestingData());

    GlobalWordsData.onUpdateWords(() => GlobalWordsData.updateAllTestingData());
}