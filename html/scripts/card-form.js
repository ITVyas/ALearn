import { Config, ElementBuilder, GlobalCardsData } from "./root.js";

function addLogicForOpenInputWindowBtn() {
    const pickingColorBtn = document.querySelector('.card-form-container .picking-color');
    const pickingColorWindow = document.querySelector('.card-form-container .picking-color-window');

    const btnClickListener = (e) => {
        pickingColorBtn.removeEventListener('click', btnClickListener);
        if(pickingColorWindow.style.getPropertyValue('display') !== '') {
            pickingColorWindow.style.removeProperty('display');
            const inputColor = document.querySelector('.card-form-container #hueSlider');
            document.onclick = (event) => {
                if(document.querySelector('.card-form-container .picking-color:hover')) return false;
                if(event.target !== inputColor && event.target !== pickingColorWindow) {
                    document.onclick = null;
                    pickingColorWindow.style.display = 'none';
                }
            };
        } else {
            document.onclick = null;
            pickingColorWindow.style.display = 'none';
        }
        pickingColorBtn.addEventListener('click', btnClickListener);
    }

    pickingColorBtn.addEventListener('click', btnClickListener);
}

function addLogicForInputColor() {
    const cardTextElement = document.querySelector('.card-form-container #card-text');
    const saturationInput = document.querySelector('.card-form-container .saturation-input');
    const brightnessInput = document.querySelector('.card-form-container .brightness-input');

    document.querySelector('#hueSlider').addEventListener('input', (e) => {
        const hueValue = Number(e.target.value);
        const saturationValue = Number(saturationInput.value);
        const brightnessValue = Number(brightnessInput.value);

        cardTextElement.style.backgroundColor = `hsl(${hueValue}, ${saturationValue}%, ${brightnessValue}%)`;
    });
}

function addInputTextLogic() {
    const textarea = document.querySelector('.card-form-container #card-text .text-content');
    textarea.addEventListener('input', (e) => {
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    });
}

function clearCardForm() {
    const textarea = document.querySelector('.card-form-container #card-text .text-content');
    const nameInput = document.querySelector('.card-form-container #card-text .card-name-input');
    textarea.value = "";
    nameInput.value = "";
}

function addSumbitLogic() {
    const textarea = document.querySelector('.card-form-container #card-text .text-content');
    const nameInput = document.querySelector('.card-form-container #card-text .card-name-input');

    textarea.addEventListener('focusout', () => {
        textarea.value = textarea.value.trim();
    });

    nameInput.addEventListener('focusout', () => {
        nameInput.value = nameInput .value.trim();
    });


    document.querySelector('.card-form-container #card-text .save-card-btn').onclick = (e) => {
        const formEl = document.querySelector('.card-form-container form');
        if(!formEl.checkValidity()) return true;

        const cardObject = {};
        const formData = new FormData(document.querySelector('.card-form-container form'));

        cardObject.cardName = formData.get('card-name');
        cardObject.dataObj = {
            'text': formData.get('card-text'),
            'background-color': `hsl(${Number(formData.get('color-hue'))}, ${Number(formData.get('color-saturation'))}%, ${Number(formData.get('color-brightness'))}%)`
        };

        GlobalCardsData.saveCard(cardObject);
        clearCardForm();
        document.querySelector('.menu-container #vocabulary').dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
        document.querySelector('.cards-btn').dispatchEvent(new Event('click'));
        return false;
    };
}

function createDeleteCardWarining(data) {
    const noAction = (e) => {
        warning.remove();
    };

    const yesAction = (e) => {
        GlobalCardsData.deleteCardById(data.id);
        warning.remove();
    };

    var warning = ElementBuilder.create('div').addClasses('delete-card-warning-bg').appendElements(
        ElementBuilder.create('div').addClasses('delete-card-warning').appendElements(
            ElementBuilder.create('div').addClasses('card-delete-warning-msg').setInnerHTML(`Confirm you want to delete card ${data.cardName}`).get(),
            ElementBuilder.create('div').addClasses('card-warning-btns-container').appendElements(
                ElementBuilder.create('button').addClasses('yes-btn').addEventListener('click', yesAction).setInnerHTML('Yes').get(),
                ElementBuilder.create('button').addClasses('no-btn').addEventListener('click', noAction).setInnerHTML('No').get()
            ).get()
        ).get()
    ).get();

   

    return warning;
}

function createCardElementFromData(data) {
    const match = data.dataObj['background-color'].match(/hsl\((\d+), (\d+)%?, (\d+)%?\)/);
    const [, hue, saturation, lightness] = match.map(Number);
    let newHue = hue;

    const cardElement = ElementBuilder.create('form').addClasses('card').appendElements(
        ElementBuilder.create('div').addClasses('card-name').setInnerHTML(data.cardName).get(),
        ElementBuilder.create('textarea').setAttribute('readonly', true).addClasses('card-text').setInnerHTML(data.dataObj.text).get(),
        ElementBuilder.create('div').addClasses('card-close-btn').setInnerHTML('✖').get()
    ).get();


    cardElement.style.backgroundColor = data.dataObj['background-color'];


    cardElement.addEventListener('click', (e) => {
        if(cardElement.querySelector('.card-close-btn:hover')) {
            document.body.append(createDeleteCardWarining(data))
            return;
        };
        const cardEditContainer = ElementBuilder.create('div').addClasses('card-edit-bg').appendElements(
            ElementBuilder.create('div').addClasses('card-edit-form').setAttribute('style', `background-color: ${data.dataObj['background-color']}`).appendElements(
                ElementBuilder.create('textarea').addClasses('card-edit-text').setInnerHTML(data.dataObj.text).get(),
                ElementBuilder.create('div').addClasses('card-edit-panel').appendElements(
                    ElementBuilder.create('input').addClasses('edit-card-name').setAttribute('value', data.cardName).setAttribute('placeholder', 'enter card name...').get(),
                    ElementBuilder.create('div').addClasses('picking-color').appendElements(
                        ElementBuilder.create('i').addClasses('fa-solid', 'fa-palette').get()
                    ).get(),
                    ElementBuilder.create('div').addClasses('picking-color-window').setAttribute('style','display: none').appendElements(
                        ElementBuilder.create('input').addClasses('hue-slider').setAttribute('type', 'range').setAttribute('min', 0)
                            .setAttribute('max', 360).setAttribute('value', hue).get()
                    ).get()
                ).get()
            ).get()
        ).get();

        const pickingColorBtn = cardEditContainer.querySelector('.picking-color');
        const pickingColorWindow = cardEditContainer.querySelector('.picking-color-window');

        const btnClickListener = (e) => {
            pickingColorBtn.removeEventListener('click', btnClickListener);
            if(pickingColorWindow.style.getPropertyValue('display') !== '') {
                pickingColorWindow.style.removeProperty('display');
                const inputColor = cardEditContainer.querySelector('.hue-slider');
                document.onclick = (event) => {
                    if(cardEditContainer.querySelector('.picking-color:hover')) return false;
                    if(event.target !== inputColor && event.target !== pickingColorWindow) {
                        document.onclick = null;
                        pickingColorWindow.style.display = 'none';
                    }
                };
            } else {
                document.onclick = null;
                pickingColorWindow.style.display = 'none';
            }
            pickingColorBtn.addEventListener('click', btnClickListener);
        }

        pickingColorBtn.addEventListener('click', btnClickListener);
        cardEditContainer.querySelector('.hue-slider').addEventListener('input', (e) => {
            newHue = Number(e.target.value);
            cardEditContainer.querySelector('.card-edit-form').style.backgroundColor = `hsl(${newHue}, ${saturation}%, ${lightness}%)`;
        });
    
        cardEditContainer.addEventListener('mousedown', (e) => {
            if(e.target === cardEditContainer) {
                const mouseupListener = (e) => {
                    if(e.target === cardEditContainer) {
                        GlobalCardsData.updateCard({
                            id: data.id,
                            cardName: cardEditContainer.querySelector('.edit-card-name').value,
                            trainingDisabled: data.trainingDisabled,
                            time: data.time,
                            dataObj: {
                                text: cardEditContainer.querySelector('textarea').value.trim(),
                                'background-color': `hsl(${newHue}, ${saturation}%, ${lightness}%)`
                            }
                        });
                        cardEditContainer.remove();
                    }
                        
                    document.onmouseup = null;
                    document.onmouseout = null;
                };
                document.onmouseup = mouseupListener ;
                document.onmouseout = () => {
                    document.onmouseup = null;
                    document.onmouseout = null;
                };
            } else return false;
        });
        document.body.append(cardEditContainer);
    });
    return cardElement;
}

function getElementRealHeight(element, qry) {
    document.body.appendChild(element);
    if(!qry) {
        const height = element.scrollHeight;
        element.remove();
        return height;
    } else {
        const height = element.querySelector(qry).scrollHeight;
        element.remove();
        return height;
    }
}

async function showCards() {
    const prevBtn = document.querySelector('#prev-cards-page');
    const nextBtn = document.querySelector('#next-cards-page');

    GlobalCardsData.getAllCardsNumber(GlobalCardsData.getVariableValue('search-qry'))
            .then(number => {
                const maxPage = Math.max(1, Math.ceil(number/Config.PAGE_CAPACITY));
                document.querySelector('#cards-pages-number').innerHTML = maxPage;
                if(GlobalCardsData.getVariableValue('main-page') === 1) prevBtn.disabled = true;
                else prevBtn.disabled = false;

                if(GlobalCardsData.getVariableValue('main-page') === maxPage) nextBtn.disabled = true;
                else nextBtn.disabled = false;
            });

    document.querySelector('#cards-current-page').innerHTML = GlobalCardsData.getVariableValue('main-page');

    const cardsPage = await GlobalCardsData.getCardsPage(
        GlobalCardsData.getVariableValue('main-page'),
        Config.PAGE_CAPACITY,
        GlobalCardsData.getVariableValue('search-qry')
    );
    const cardsContainer = document.querySelector('.cards-container');
    
    const cardElements = cardsPage.map(data => {
        const el = createCardElementFromData(data);
        const htextArea = getElementRealHeight(el, 'textarea');
        const calcHeightArea = Math.min(Math.max(30, htextArea), 300);
        el.querySelector('textarea').style.height = `${calcHeightArea}px`;
        const h = getElementRealHeight(el);
        const rowsSpan = Math.ceil((h+20)/10);
         
        el.style.gridRow = `span ${rowsSpan}`;
        return el; 
    });

    cardsContainer.innerHTML = "";
    cardsContainer.append(...cardElements);
}

function addCardsPaginationLogic() {
    const prevBtn = document.querySelector('#prev-cards-page');
    const nextBtn = document.querySelector('#next-cards-page');

    prevBtn.addEventListener('click', () => GlobalCardsData.setVariable('main-page', GlobalCardsData.getVariableValue('main-page') - 1));
    nextBtn.addEventListener('click', () => GlobalCardsData.setVariable('main-page', GlobalCardsData.getVariableValue('main-page') + 1));
}


export function addCardFormLogic() {
    addLogicForOpenInputWindowBtn();
    addLogicForInputColor();
    addInputTextLogic();
    addSumbitLogic();

    GlobalCardsData.setVariable('main-page', 1);
    GlobalCardsData.setVariable('search-qry', '');
    GlobalCardsData.onUpdateCards(showCards);
    GlobalCardsData.onUpdateVariable('main-page', showCards);
    GlobalCardsData.onUpdateVariable('search-qry', showCards);
    showCards();
    addCardsPaginationLogic();
}