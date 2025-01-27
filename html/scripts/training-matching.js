import { GlobalWordsData, ElementBuilder } from "./root.js";
import { addWordListSettingsBtnLogic } from "./training-testing.js";

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


function createQuestionElement(leftColValues, rightColValues, nextElement, questionNumber, questionsNumber) {
    const container = document.createElement('div');
    container.setAttribute('id', `question-${questionNumber}`);
    container.classList.add('training-matching', 'hiding');

    const title = document.createElement('div');
    title.classList.add('training-title');
    title.innerHTML = `Question ${questionNumber}/${questionsNumber}`;

    const hr = document.createElement('hr');
    const content = document.createElement('div');
    content.classList.add('content');

    const leftCol = document.createElement('div');
    const rightCol = document.createElement('div');
    leftCol.classList.add('left-col');
    rightCol.classList.add('right-col');

    const leftColElements = [], rightColElements = [];
    for(let leftVal of leftColValues) {
        const el = document.createElement('span');
        el.classList.add('option');
        el.innerHTML = leftVal;
        leftColElements.push(el);
    }
    for(let rightVal of rightColValues) {
        const el = document.createElement('span');
        el.classList.add('option');
        el.innerHTML = rightVal;
        rightColElements.push(el);
    }

    leftCol.append(...leftColElements);
    rightCol.append(...rightColElements);
    content.append(leftCol, rightCol);

    const confirmBtn = document.createElement('button');
    confirmBtn.classList.add('form-btn', 'bt-mrgn15');
    confirmBtn.onclick = (e) => {
        container.classList.add('hiding');
        nextElement.classList.remove('hiding');
    }
    confirmBtn.innerHTML = 'Confirm';
    
    container.append(title, hr, content, confirmBtn);
    return container
}


function createResultElement() {
    const resultEl = ElementBuilder.create('div')
    .addClasses('results', 'hiding')
    .appendElements(
        ElementBuilder.create('div').addClasses('close-results').setInnerHTML("⟨").addEventListener(
            'click', () => {
                resultEl.remove();
                Array.from(document.querySelectorAll('.training-matching')).forEach(el => el.remove());
                
                const paramsFormTesting = document.querySelector('.matching-container .settings ');
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

function createQuestionResult(leftCol, rightCol, checkedPairs, questionNumber) {
    const container = document.createElement('span');
    const h4 = document.createElement('h4');
    h4.classList.add('question-label');
    h4.innerHTML = `Question ${questionNumber}`;
    const grid = document.createElement('div');
    grid.classList.add('question-result');
    for(let i = 0; i < leftCol.length; i++) {
        const optionLeft = document.createElement('div');
        const secondClass = (checkedPairs[i]) ? "success" : "fail";
        optionLeft.classList.add('left', secondClass);
        optionLeft.innerHTML = leftCol[i];
        const optionRight = document.createElement('div');
        optionRight.classList.add('right');
        optionRight.innerHTML = rightCol[i];
        grid.append(optionLeft, optionRight);
    }
    container.append(h4, grid);
    return container;
}

function doVisibleQuestionEl(el) {
    if(el.classList.contains('hiding'))
        el.classList.remove('hiding');
}

function doHideQuestionEl(el) {
    if(!el.classList.contains('hiding'))
        el.classList.add('hiding');
}

function modifyExampleMatchingResponse(matching) {
    matching.forEach(q => {
        for(let i = 0; i < q.length; i++) {
            const opt_words = q[i].record.text.replace(/[^\w\s\-']/g, ($1) => ` ${$1} `).replace(/[ ]+/g, ' ').split(' ');
            for(let index of q[i].record.positions) 
                opt_words[index] = "______";
            q[i].record = opt_words.join(' ');
        }
    });
}


function addStartBtnLogic() {
    const startBtn = document.querySelector(".matching-container .settings .form-btn");
    startBtn.addEventListener('click', async (e) => {
        const validity = document.querySelector('.matching-container form').checkValidity();
        if(validity === false)
            return true; 
        startBtn.disabled = true;
        const settingsEl = document.querySelector('.matching-container .settings');
        
        settingsEl.classList.add('hiding');

        const formData = new FormData(document.querySelector('.matching-container form'));
        const questionPairs = Number(formData.get('question_pairs_number'));
        const questionsNumber = Number(formData.get('questions_number'));
        const type = formData.get('type').toLowerCase();

        const matching = await window.wordAPI.getWordsMatchings(questionsNumber, questionPairs, type);
        if(type === 'examples') modifyExampleMatchingResponse(matching);


        const rightAnswers = new Map();
        matching.forEach(question => question.forEach(pair => {
                if(rightAnswers.has(pair.word)) rightAnswers.get(pair.word).push(pair.record);
                else rightAnswers.set(pair.word, [pair.record]);
            })
        );

        settingsEl.style.display = 'none';

        const matchingContainer = document.querySelector(".matching-container");
        const resultEl = createResultElement();
        matchingContainer.append(resultEl);
        let nextEl = resultEl;
        let leftColValues = null, rightColValues = null;
        for(let i = 0; i < questionsNumber; i++) {
            leftColValues = shuffleArray(matching[i].map(x => x.word));
            rightColValues = shuffleArray(matching[i].map(x => x.record));
            nextEl = createQuestionElement(leftColValues, rightColValues, nextEl, questionsNumber-i, questionsNumber);
            matchingContainer.append(nextEl);
        }
        addQuestionsLogic(rightAnswers);
        doVisibleQuestionEl(nextEl);

        
        return false;
    });
}




function addQuestionsLogic(answersMap) {
    const margin = 10;
    const questionElements = document.querySelectorAll('.training-matching');
    const leftColElements = Array.from(questionElements).map(qEl => qEl.querySelector('.matching-container .content .left-col'));

    for(let i = 0; i < questionElements.length; i++) {
        const leftCol = leftColElements[i];
        const leftOptions = leftCol.querySelectorAll('.matching-container .option');
        let orderedOptions = [];
        let prevY = 0;

        doVisibleQuestionEl(questionElements[i]);
        const leftColRect = leftCol.getBoundingClientRect();

        for(let i = 0; i < leftOptions.length; i++) {
            orderedOptions.push(leftOptions[i]);
            leftOptions[i].ondragstart = () => false;

            if(i == 0) {
                leftOptions[i].style.top = '0px';
            } else {
                const prevRect = leftOptions[i-1].getBoundingClientRect();
                const height = prevRect.bottom - prevRect.top;
                prevY += height + margin;
                leftOptions[i].style.top = `${prevY}px`;
            }
        }
        doHideQuestionEl(questionElements[i]);
            
        leftCol.addEventListener('mousedown', (e) => {
            if(e.target === leftCol)
                return;

            const targetRect = e.target.getBoundingClientRect();
            let targetStartCenterY = (targetRect.top + targetRect.bottom)/2;
            const dy = e.pageY - leftColRect.top;
            e.target.style.top = `${dy - e.target.offsetHeight/2}px`;
            let targetOrderIndex = orderedOptions.findIndex(el => el === e.target);
            e.target.style.zIndex = 1000;
            let prevMouseY = e.pageY;

            const mouseMoveAction = (event) => {
                const dy = event.pageY - prevMouseY;
                prevMouseY = event.pageY;
                if(dy === 0)
                    return;

                const mouseTop = event.pageY - leftColRect.top;
                e.target.style.top = `${mouseTop - e.target.offsetHeight/2}px`;

                let i = (dy > 0) ? (targetOrderIndex + 1) : (targetOrderIndex - 1);
                const cycleCond = (dy > 0) ? ((i) => (i) < orderedOptions.length) : ((i) => i >= 0);
                const cyclePostAction = (dy > 0) ? () => {i++} : () => {i--};
                while(cycleCond(i)) {
                    const irect = orderedOptions[i].getBoundingClientRect();
                    const icenterY = (irect.top + irect.bottom)/2;
                    const middleY = (targetStartCenterY + icenterY)/2;
                    if((event.pageY >= middleY && dy > 0) || (event.pageY <= middleY && dy < 0)) {
                        const temp = orderedOptions[targetOrderIndex];
                        orderedOptions[targetOrderIndex] = orderedOptions[i];
                        orderedOptions[i] = temp;
                        
                        if(dy > 0) {
                            let newTopY = leftColRect.top;
                            if(i-2 >= 0)
                                newTopY = orderedOptions[i-2].getBoundingClientRect().bottom + margin;
                            orderedOptions[targetOrderIndex].style.top = `${newTopY - leftColRect.top}px`;
                            targetStartCenterY = orderedOptions[targetOrderIndex].getBoundingClientRect().bottom + margin + e.target.offsetHeight/2;
                        } else {
                            const newBotY = targetStartCenterY + e.target.offsetHeight/2;
                            const movingItemRect = orderedOptions[targetOrderIndex].getBoundingClientRect();
                            const targetPotentialNewTop = movingItemRect.top;
                            const newTopY = newBotY - orderedOptions[targetOrderIndex].offsetHeight;
                            orderedOptions[targetOrderIndex].style.top = `${newTopY - leftColRect.top}px`;
                            targetStartCenterY = targetPotentialNewTop + e.target.offsetHeight/2;
                        }
                        targetOrderIndex = i;
                    } else {
                        break;
                    }
                    cyclePostAction();
                }
            };
            document.onmousemove = mouseMoveAction;
            document.onmouseup = (event) => {
                document.onmousemove = null;
                document.onmouseup = null;
                e.target.style.zIndex = 0;
                e.target.style.top = `${targetStartCenterY - e.target.offsetHeight/2 - leftColRect.top}px`;
            }

        });

        const btn = questionElements[i].querySelector('button');
        btn.addEventListener('click', (e) => {
            const rightColOptions = questionElements[i].querySelectorAll('.right-col .option');
            const rightColValues = [];
            for(let option of rightColOptions)
                rightColValues.push(option.innerHTML);
            const leftColValues = [];
            for(let option of orderedOptions)
                leftColValues.push(option.innerHTML);
            const checkedPairs = [];
            for(let i = 0; i < rightColOptions.length; i++)
                checkedPairs.push(answersMap.get(leftColValues[i]).includes(rightColValues[i]));
            const resultEl = createQuestionResult(leftColValues, rightColValues, checkedPairs, questionElements.length - i);
            document.querySelector('.matching-container .results').append(resultEl);
        });
    }
}

function setMatchingMaxInputValues() {
    const existingWarning = document.querySelector('.matching-container .container .training-form-warning');
    if(existingWarning) {
        existingWarning.remove();
        document.querySelector('.matching-container [name="questions_number"]').min = 1;
        document.querySelector('.matching-container [name="question_pairs_number"]').min = 2;
        document.querySelector('.matching-container .form-btn').disabled = false;
    }

    let currentQuestionsN = Number(document.querySelector('.matching-container [name="questions_number"]').value);
    
    let type = document.querySelector('.matching-container .select-type').value.toLowerCase(),
        maxQuestionsN = Math.floor(GlobalWordsData.getMatchingValidSumForTable(type)/2);
    if(currentQuestionsN > maxQuestionsN) {
        currentQuestionsN = maxQuestionsN;
        document.querySelector('.matching-container [name="questions_number"]').value = currentQuestionsN;
    }
    let maxPairsN = Math.min(
            Math.floor(GlobalWordsData.getMatchingValidSumForTable(type)/currentQuestionsN),
            GlobalWordsData.getTrainingWordsNumber()
        );
    
    const currentPairsN = document.querySelector('.matching-container [name="question_pairs_number"]');
    if(currentPairsN > maxPairsN) document.querySelector('.matching-container [name="question_pairs_number"]').value = maxPairsN;
    const valid1 = maxQuestionsN >= 1,
        valid2 = maxPairsN >= 2;
    if(!(valid1 && valid2)) {
        maxQuestionsN = 0;
        maxPairsN = 0;
        const warning = ElementBuilder.create('div').addClasses('training-form-warning').setInnerHTML("❗ Add more words to create tests ❗").get();
        document.querySelector('.matching-container .container').append(warning);
    
        document.querySelector('.matching-container [name="questions_number"]').min = 0;
        document.querySelector('.matching-container [name="question_pairs_number"]').min = 0;
        document.querySelector('.matching-container .form-btn').disabled = true;
    } 
    document.querySelector('.matching-container #matching-max-pairs-number').innerHTML = maxPairsN;
    document.querySelector('.matching-container #matching-max-questions-number').innerHTML = maxQuestionsN;

    document.querySelector('.matching-container [name="questions_number"]').max = maxQuestionsN;
    document.querySelector('.matching-container [name="question_pairs_number"]').max = maxPairsN;
}

function addEventListenerToInputContainer(input, f) {
    const container = input.parentElement;
    const btnIncrement = container.querySelector('.btn-increment');
    const btnDecrement = container.querySelector('.btn-decrement');
    input.addEventListener('input', f);
    btnIncrement.addEventListener('click', f);
    btnDecrement.addEventListener('click', f);
}

export function addMatchingLogic() {
    const wordsNumberEl = document.querySelector('.matching-container .words-amount-number');
    wordsNumberEl.innerHTML = GlobalWordsData.getTrainingWordsNumber();

    addWordListSettingsBtnLogic(document.querySelector('.matching-container .words-list-btn'));
    addStartBtnLogic();
    setMatchingMaxInputValues();

    document.querySelector('.matching-container .select-type').addEventListener('change', setMatchingMaxInputValues);
    
    GlobalWordsData.onUpdateMatchingData(() => {
        document.querySelector('.matching-container .words-amount-number').innerHTML = GlobalWordsData.getTrainingWordsNumber();
        setMatchingMaxInputValues();
    });
    
    GlobalWordsData.onUpdateTrainingInfo(() => GlobalWordsData.updateAllMatchingData());
    GlobalWordsData.onUpdateWords(() => GlobalWordsData.updateAllMatchingData());
    addEventListenerToInputContainer(
        document.querySelector('.matching-container [name="questions_number"]'),
        setMatchingMaxInputValues
    );
}
