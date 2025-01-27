import { Config, ElementBuilder, GlobalCardsData, GlobalWordsData } from "./root.js";

function createWordContentPart(name, contentArray) {
    return ElementBuilder.create('div')
        .addClasses('word-content-part')
        .appendElements(
            ElementBuilder.create('span').addClasses('block-title').setInnerHTML(name).get(),
            ElementBuilder.create('ul').appendElements(
                ...contentArray.map((x) => ElementBuilder.create('li').setInnerHTML(x).get())
            ).get()
        ).get();
}

function createExamplePart(name, contentArray) {
    return ElementBuilder.create('div')
        .addClasses('word-content-part')
        .appendElements(
            ElementBuilder.create('span').addClasses('block-title').setInnerHTML(name).get(),
            ElementBuilder.create('ul').appendElements(
                ...contentArray.map((x) =>  ElementBuilder.create('li').setInnerHTML(x['text']).get())
            ).get()
        ).get();
}

function createWarningElement(text, noAction, yesAction) {
    return ElementBuilder.create('div').addClasses('warning-bg').appendElements(
        ElementBuilder.create('div').addClasses('warning').appendElements(
            ElementBuilder.create('div').addClasses('warning-title').setInnerHTML(text).get(),
            ElementBuilder.create('div').addClasses('btn-container').appendElements(
                ElementBuilder.create('button').addClasses('yes-btn').setInnerHTML('Yes').addEventListener('click', yesAction).get(),
                ElementBuilder.create('button').addClasses('no-btn').setInnerHTML('No').addEventListener('click', noAction).get()
            ).get()
        ).get()
    ).get();
}


function getDeleteClickAction(word_id, word_spelling) {
    const warningEL = createWarningElement(
        `Do you really want to remove word "${word_spelling}"?`,
        () => {warningEL.remove()},
        async () => {
            await GlobalWordsData.deleteWordById(word_id);
            warningEL.remove();
        }
    );
    return () => {
        document.body.appendChild(warningEL);
    };
}

function clearEditForm() {
    Array.from(document.querySelectorAll('#edit-word-form input')).forEach(input => {
        input.value = "";
        input.disabled = false;
        input.style.removeProperty('display');
        input.dispatchEvent(new Event('focusout'));

        if(input.name === 'examples[]' && !input.required) input.remove();
    });

    Array.from(document.querySelectorAll('#edit-word-form .fixed-example-container')).forEach(el => el.remove());
}

function getEditClickAction(word) {
    const editWordWindow = document.querySelector('.word-edit-window-bg');
    return () => {
        document.getElementById('edit-word-spelling').innerHTML = word.spelling;
        editWordWindow.querySelector('input[name="spelling"]').value = word.spelling;

        for(let recordsName of ['translations', 'explanations', 'examples']) {
            word[recordsName].forEach(record => {
                const input = editWordWindow.querySelector(`input[name="${recordsName}[]"]:placeholder-shown`);

                if(recordsName !== 'examples') {
                    input.value = record;
                    input.dispatchEvent(new Event('input'));
                } else {
                    input.value = record.text;
                    input.dispatchEvent(new Event('focusout'));

                    const exampleContainer = document.querySelector('.fixed-example-container.warning');
                    const wordElementsCollection = exampleContainer.querySelectorAll('.fixed-example-content .example-word');
                    const wordElArr = Array.from(wordElementsCollection);
                    record.positions.forEach(pos => wordElArr[pos].dispatchEvent(new Event('click')));
                } 
            })
        }

        let currentPopupTimeoutId;
        const submit = (e) => {
            const isFormValidDefault = document.querySelector('#edit-word-form').checkValidity();
            const invalidExamples = document.querySelectorAll('#edit-word-form .fixed-example-container.warning');
            if(!isFormValidDefault) return true;
            
            for(let example of invalidExamples) {
                const existingPopup = example.querySelector('#edit-word-form .pick-word-popup');
                if(existingPopup) {
                    clearTimeout(currentPopupTimeoutId);
                    existingPopup.remove();
                }
                const popup = ElementBuilder.create('div')
                    .addClasses('pick-word-popup')
                    .setInnerHTML('❗ Select at least one word ❗').get();
        
                example.append(popup);
                currentPopupTimeoutId = setTimeout(() => popup.remove(), 3000);
                return false;
            }
            

            document.querySelector('#edit-word-form .add-word-submit').onclick = null;
            const formData = new FormData(document.querySelector('#edit-word-form'));
            const wordObj = {
                id: word.id,
                trainingDisabled: word.trainingDisabled,
                time: word.time,
                spelling: formData.get('spelling').trim(),
                translations: formData.getAll('translations[]').map(x => x.trim()).filter(x => x !== ''),
                explanations: formData.getAll('explanations[]').map(x => x.trim()).filter(x => x !== ''),
                examples: formData.getAll('examples[]').map(x => x.trim()).filter(x => x !== '').map(JSON.parse)
            };
            GlobalWordsData.updateWord(wordObj);
            editWordWindow.style.display = 'none';
            clearEditForm();
            return false;
        };

        document.querySelector('#edit-word-form .add-word-submit').onclick = submit;
        document.querySelector('#edit-word-form #edit-from-cancel').onclick = () => {
            editWordWindow.style.display = 'none';
            clearEditForm();
        };

        editWordWindow.querySelector('.add-word-submit').disabled = true;
        const allInputs = Array.from(editWordWindow.querySelectorAll('input'));
        const removeDisabledFromConfirmAction = () => {
            editWordWindow.querySelector('.add-word-submit').disabled = false;
            allInputs.forEach(el => el.removeEventListener('input', removeDisabledFromConfirmAction));
        };
        allInputs.forEach(el => el.addEventListener('input', removeDisabledFromConfirmAction));

        editWordWindow.style.removeProperty('display');
    };
}

function createWordElementByData(data) {
    return ElementBuilder.create('div').addClasses('word-card').appendElements(
        ElementBuilder.create('div').addClasses('edit').appendElements(
            ElementBuilder.create('i').addClasses('fa-solid', 'fa-pen').get()
        ).addEventListener('click', getEditClickAction(data)).get(),
        ElementBuilder.create('div').addClasses('delete').setInnerHTML('✖').addEventListener('click', getDeleteClickAction(data['id'], data['spelling'])).get(),
        ElementBuilder.create('div').addClasses('word-spelling').setInnerHTML(data['spelling'].toLowerCase()).get(),
        createWordContentPart('translations', data['translations']),
        createWordContentPart('explanations', data['explanations']),
        createExamplePart('examples', data['examples'])
    ).get();
}

function getElementRealHeight(element) {
    const height = document.body.appendChild(element).scrollHeight;
    element.remove();
    return height;
}

export async function showWords() {
    const prevBtn = document.querySelector('#prev-words-page');
    const nextBtn = document.querySelector('#next-words-page');

    GlobalWordsData.getAllWordsNumber(GlobalWordsData.getVariableValue('search-qry'))
        .then(number => {
            const maxPage = Math.max(1, Math.ceil(number/Config.PAGE_CAPACITY));
            document.querySelector('#words-pages-number').innerHTML = maxPage;

            if(GlobalWordsData.getVariableValue('main-page') === 1) prevBtn.disabled = true;
            else prevBtn.disabled = false;

            if(GlobalWordsData.getVariableValue('main-page') === maxPage) nextBtn.disabled = true;
            else nextBtn.disabled = false;
        });
    document.querySelector('#words-current-page').innerHTML = GlobalWordsData.getVariableValue('main-page');
    

    const container = document.querySelector('.words-container');
    const pageElements = await GlobalWordsData.getWordsPage(
        GlobalWordsData.getVariableValue('main-page'),
        Config.PAGE_CAPACITY,
        GlobalWordsData.getVariableValue('search-qry'));
    const extra_space = 18;
    const htmlElements = pageElements.map(data => {
        const el = createWordElementByData(data),
        h = getElementRealHeight(el) + extra_space,
        rowsSpan = Math.ceil(h/10);
        el.style.gridRow = `span ${rowsSpan}`;
        return el; 
    });
    container.innerHTML = "";
    container.append(...htmlElements);
}

function addSwitchWordsCardsLogic() {
    const cardsBtn = document.querySelector('.vocabulary-top-bar .cards-btn');
    const wordsBtn = document.querySelector('.vocabulary-top-bar .words-btn');

    const cardsContainer = document.querySelector('.cards-container');
    const wordsContainer = document.querySelector('.words-container');

    const wordsPagination = document.querySelector('.words-pagination');
    const cardsPagination = document.querySelector('.cards-pagination');

    const wordsBtnClick = (e) => {
        wordsBtn.removeEventListener('click', wordsBtnClick);
        cardsBtn.classList.remove('active');
        wordsBtn.classList.add('active');
        wordsContainer.style.removeProperty('display');
        cardsContainer.style.display = 'none';
        wordsPagination.style.removeProperty('display');
        cardsPagination.style.display = 'none';
        cardsBtn.addEventListener('click', cardsBtnClick);
    };

    const cardsBtnClick = (e) => {
        cardsBtn.removeEventListener('click', cardsBtnClick);
        cardsBtn.classList.add('active');
        wordsBtn.classList.remove('active');
        cardsContainer.style.removeProperty('display');
        wordsContainer.style.display = 'none';
        cardsPagination.style.removeProperty('display');
        wordsPagination.style.display = 'none';
        wordsBtn.addEventListener('click', wordsBtnClick);
    };

    cardsBtn.addEventListener('click', cardsBtnClick);
}

function addSearchLogic() {
    const searchInput = document.querySelector('#global-search-input');

    const searchAction = (e) => {
        const qry = searchInput.value.trim();
        searchInput.value = qry;
        if(GlobalWordsData.getVariableValue('search-qry') !== qry) {
            GlobalWordsData.setVariable('search-qry', qry);
            GlobalWordsData.setVariable('main-page', 1);
        }
        if(GlobalCardsData.getVariableValue('search-qry') !== qry) {
            GlobalCardsData.setVariable('search-qry', qry);
            GlobalCardsData.setVariable('main-page', 1);
        }
    };

    document.querySelector('.search-btn').addEventListener('click', searchAction);
    searchInput.addEventListener('input', searchAction);
}

function addWordsPaginationLogic() {
    const prevBtn = document.querySelector('#prev-words-page');
    const nextBtn = document.querySelector('#next-words-page');

    prevBtn.addEventListener('click', () => GlobalWordsData.setVariable('main-page', GlobalWordsData.getVariableValue('main-page') - 1));
    nextBtn.addEventListener('click', () => GlobalWordsData.setVariable('main-page', GlobalWordsData.getVariableValue('main-page') + 1));
}
 
export function addWordsLogic() {
    GlobalWordsData.setVariable('main-page', 1);
    GlobalWordsData.setVariable('search-qry', '');
    GlobalWordsData.onUpdateWords(showWords);
    GlobalWordsData.onUpdateVariable('main-page', showWords);
    GlobalWordsData.onUpdateVariable('search-qry', showWords);
    addSwitchWordsCardsLogic();
    addSearchLogic();
    addWordsPaginationLogic();
}