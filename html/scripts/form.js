import { ElementBuilder, GlobalWordsData } from "./root.js";

function constructInput(copy) {
    return ElementBuilder.create('input')
        .setAttribute('name', copy.name)
        .setAttribute('placeholder', copy.placeholder)
        .addClasses(...Array.from(copy.classList))
        .addEventListener('input', changeTextAction)
        .addEventListener('focusout', unfocusInputAction)
        .addEventListener('keypress', inputEnterPressAction).get();
}

function checkIfLastInputInBlock(inputElement) {
    const parentChildren = inputElement.parentElement.children;
    return parentChildren.item(parentChildren.length - 1) === inputElement;
}

function changeTextAction(e) {
    const el = e.target;
    if(el.value !== "" && checkIfLastInputInBlock(el))
        el.parentElement.append(constructInput(el));
}

function unfocusInputAction(e) {
    const el = e.target;
    const parent = el.parentElement;
    el.value = el.value.trim();
    if(el.value === "" && !checkIfLastInputInBlock(el)) {
        el.remove();
        const firstElement = parent.children.item(0);
        if(checkIfLastInputInBlock(firstElement))
            firstElement.required = true;   
    }
}

function constructExampleInput(copy) {
    return ElementBuilder.create('input')
        .setAttribute('name', copy.name)
        .setAttribute('placeholder', copy.placeholder)
        .addClasses(...Array.from(copy.classList))
        .addEventListener("focusout", createExampleBasedOnInput)
        .addEventListener('keypress', inputEnterPressAction).get();
}

function togglePosition(objStr, position) {
    const obj = JSON.parse(objStr);
    if(obj['positions'].includes(position) === false)
        obj['positions'].push(position);
    else 
        obj['positions'].splice(obj['positions'].indexOf(position), 1);
    return JSON.stringify(obj);
}

function constructDeleteExampleBtn() {
    return ElementBuilder.create('span')
        .setInnerHTML('❌')
        .addClasses('remove-example-btn').get();
}

let currentPopupTimeoutId = null;
function createExampleBasedOnInput(e) {
    let text = e.target.value.trim();
    let words = [];
    if(text !== "") {
        words = text.replace(/[^\w\s\-']/g, function ($1) { return ' ' + $1 + ' ';}).replace(/[ ]+/g, ' ').split(' ');
        if(words.at(-1) === '') words.pop();
        const container = ElementBuilder.create('div')
            .addClasses('fixed-example-container', 'warning').get();

        const deleteBtn = ElementBuilder.wrapper(constructDeleteExampleBtn())
            .addEventListener('click', () => {
                const parent = e.target.parentElement;

                container.remove();
                e.target.remove();

                const firstEl = parent.children.item(0);
                if(checkIfLastInputInBlock(firstEl))
                    firstEl.required = true;
            }).get();
        
        const exampleContent = ElementBuilder.create('div')
            .addClasses('fixed-example-content')
            .appendElements(...words.map((word, i) => 
                        ElementBuilder.create('span')
                        .setInnerHTML(word)
                        .addClasses('example-word')
                        .addEventListener('click', (clickEvent) => {
                                const wordEl = clickEvent.target;
                                wordEl.classList.toggle('picked'); 
                                if(wordEl.classList.contains('picked')) {
                                    const popup = container.querySelector('.pick-word-popup');
                                    if(popup) {
                                        clearTimeout(currentPopupTimeoutId);
                                        popup.remove();
                                    } 
                                }
                                    
                                e.target.value = togglePosition(e.target.value, i);
                                const currentPickedWords = JSON.parse(e.target.value).positions.length;
                                if(currentPickedWords === 0) 
                                    container.classList.add('warning');
                                else if(currentPickedWords === 1 && wordEl.classList.contains('picked')) 
                                    container.classList.remove('warning');
                        }).get()
            )).get();
        
        container.append(deleteBtn, exampleContent);

        e.target.after(container, constructExampleInput(e.target));
        e.target.style.display = "none";

        e.target.value = JSON.stringify({
            text: e.target.value, 
            positions: []
        });
    }
}


function validationForm(e) {
    const isFormValidDefault = document.querySelector('.form-container form').checkValidity();
    const invalidExamples = document.querySelectorAll('.form-container form .fixed-example-container.warning');
    if(!isFormValidDefault) return true;

    for(let example of invalidExamples) {
        const existingPopup = example.querySelector('.form-container .pick-word-popup');
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

    const formData = new FormData(document.querySelector('.form-container form'));
    const wordObj = {
        spelling: formData.get('spelling').trim(),
        translationsArr: formData.getAll('translations[]').map(x => x.trim()).filter(x => x !== ''),
        explanationsArr: formData.getAll('explanations[]').map(x => x.trim()).filter(x => x !== ''),
        examplesArr: formData.getAll('examples[]').map(x => x.trim()).filter(x => x !== '').map(JSON.parse)
    };
    GlobalWordsData.saveNewWord(wordObj);
    document.querySelector('.form-container .reset-form').dispatchEvent(new Event('click'));
    document.querySelector('.menu-container #vocabulary').dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
    document.querySelector('.words-btn').dispatchEvent(new Event('click'));
    return false;
}

function addScriptForWordSearchHelp() {
    document.querySelector('.translation-help.cambridge').addEventListener('click', () => {
        const query = document.querySelector('#spelling').value;
        window.open(`https://dictionary.cambridge.org/search/direct/?datasetsearch=english-russian&q=${query}`);
    });

    document.querySelector('.translation-help.oxford').addEventListener('click', () => {
        const query = document.querySelector('#spelling').value;
        window.open(`https://www.oxfordlearnersdictionaries.com/search/english/?q=${query}`);
    });
}

function inputEnterPressAction(e) {
    if (e.key === "Enter") e.preventDefault();
    else return;
    const emptyField = document.querySelector('form input:required:placeholder-shown');
    if(emptyField) emptyField.focus();
    else document.querySelector('form button.add-word-submit').focus();
}

function resetForm(e) {
    Array.from(document.querySelectorAll('#add-word-form input')).forEach(input => {
        input.value = "";
        input.disabled = false;
        input.style.removeProperty('display');
        input.dispatchEvent(new Event('focusout'));

        if(input.name === 'examples[]' && !input.required) input.remove();
    });

    Array.from(document.querySelectorAll('#add-word-form .fixed-example-container')).forEach(el => el.remove());
}

export function addFormLogic() {
    addScriptForWordSearchHelp();
    Array.from(document.querySelectorAll('.spelling')).forEach(
        el => el.addEventListener('focusout', (e) => e.target.value = e.target.value.trim())
    );
    Array.from(document.querySelectorAll('.add-word-form input')).forEach(el => el.addEventListener('keypress', inputEnterPressAction));

    const trnslAndExplInputs = document.querySelectorAll(
        ['input[name="translations[]"]',
        'input[name="explanations[]"]']
    );

    for(let input of trnslAndExplInputs) {
        input.addEventListener("input", changeTextAction);
        input.addEventListener("focusout", unfocusInputAction);
    }

    const exampleInputs = document.querySelectorAll(
        'input[name="examples[]"]'
    );

    for(let input of exampleInputs) {
        input.addEventListener("focusout", createExampleBasedOnInput);
    }
    
    const submitBtn = document.querySelector('#add-word-form button.add-word-submit');
    submitBtn.onclick = validationForm;

    const resetBtn = document.querySelector('#add-word-form button.reset-form');
    resetBtn.addEventListener('click', resetForm);
}

