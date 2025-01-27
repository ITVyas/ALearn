import { ElementBuilder, GlobalCardsData } from "./root.js";
import { addWordListSettingsBtnLogic } from "./training-testing.js";

async function addScaleLogic() {
    const input = document.querySelector('#scale');
    const valueSpan = document.querySelector('#scale-value');
    const updateZoomBtn = document.querySelector('#update-zoom');
    let startScaleFactor;

    window.settingsAPI.getZoomFactor().then(factor => {
        startScaleFactor = Number(factor);
        valueSpan.innerHTML = Number(factor).toFixed(1);
        input.value = factor;
    });
    

    input.addEventListener('input', () => {
        const zoomFactor = Number(input.value);
        valueSpan.innerHTML = zoomFactor.toFixed(1);

        if(startScaleFactor === zoomFactor) updateZoomBtn.style.display = 'none';
        else updateZoomBtn.style.removeProperty('display');
    });

    updateZoomBtn.addEventListener('click', () => {
        const zoomFactor = Number(input.value);
        startScaleFactor = zoomFactor;
        window.settingsAPI.setZoomFactor(zoomFactor);
        updateZoomBtn.style.display = 'none';
    });
}

function addCloseToTrayBtnLogic() {
    const closeToTrayInput = document.querySelector('input[name="close-to-tray"]');

    window.settingsAPI.getCloseToTray().then(val => {
        if(val !== undefined && val !== null) closeToTrayInput.checked = val;
    });

    closeToTrayInput.addEventListener('change', () => {
        window.settingsAPI.setCloseToTray(closeToTrayInput.checked);
    });
}

function createCardTrainingInfoRow(card) {
    const dateN = card.time;
    const cardNameEl = ElementBuilder.create('span').addClasses('card-name').setInnerHTML((() => {
        if(card.cardName) return card.cardName;
        return 'Unnamed';
    })()).get();
    const previewEl = ElementBuilder.create('div').addClasses('card-preview-btn').setInnerHTML('Preview').get();
    const switcherEl = ElementBuilder.create('div').addClasses('toggle-switch').appendElements(
        ElementBuilder.create('input').setAttribute('type', 'checkbox').setAttribute('id', dateN).get(),
        ElementBuilder.create('label').addClasses('switch').setAttribute('for', dateN).get()
    ).get();

    switcherEl.onclick = () => {
        switcherEl.onclick = null;
        document.querySelector('#card-training-window-bg .apply-btn').disabled = false;
    };

    switcherEl.querySelector('input').checked = !card.trainingDisabled;
    switcherEl.querySelector('input').addEventListener('change', (e) => {
        const index = updatedTrainingInfoCards.findIndex(element => element.id === card.id);
        if(index === -1) updatedTrainingInfoCards.push({id: card.id, trainingDisabled: !e.target.checked, trainingDisabledBefore: e.target.checked});
        else updatedTrainingInfoCards[index].trainingDisabled = !e.target.checked;
    });

    previewEl.addEventListener('mouseover', () => {
        document.querySelector('.preview-card-content').innerHTML = card.dataObj.text;
        const previewCard = document.querySelector('.preview-card');
        previewCard.style.backgroundColor = card.dataObj['background-color'];
        previewCard.style.removeProperty('display');
    });

    previewEl.addEventListener('mouseout', () => {
        document.querySelector('.preview-card').style.display = "none";
        document.querySelector('.preview-card-content').innerHTML = "";
    });

    return [cardNameEl, previewEl, switcherEl];
}

let updatedTrainingInfoCards = [];
function setupCardsTrainingInfoPage(pageNumber, pageCapacity) {
    const contentContainer = document.querySelector('#card-training-window-bg .content');
    const prevBtn = document.getElementById('card-training-prev-page');
    const nextBtn = document.getElementById('card-training-next-page');
    const cardTrainingSearch = document.querySelector('.card-training-search');

    document.getElementById('card-training-change-page').innerHTML = pageNumber;

    if(pageNumber === 1) prevBtn.disabled = true;
    else prevBtn.disabled = false;

    window.wordAPI.getCardsNumber(cardTrainingSearch.value).then(number => {
        const maxPage = Math.max(1, Math.ceil(number/pageCapacity));
        if(maxPage === pageNumber) nextBtn.disabled = true;
        else nextBtn.disabled = false;
        document.getElementById('card-training-change-max-page').innerHTML = maxPage;
    });
    
    window.wordAPI.getCardsPage(pageNumber, pageCapacity, cardTrainingSearch.value).then(cards => {
        const cardsElements = cards.map(createCardTrainingInfoRow);
        contentContainer.innerHTML = "";
        cardsElements.forEach(x => contentContainer.append(...x));
    })
}

function initCardsTrainingInfoChange() {
    const cardsTrainingInfoContainer = document.getElementById('card-training-window-bg');
    const applyBtn = cardsTrainingInfoContainer.querySelector('.apply-btn');
    const cancelBtn = cardsTrainingInfoContainer.querySelector('.cancel-btn');
    const prevBtn = document.getElementById('card-training-prev-page');
    const nextBtn = document.getElementById('card-training-next-page');
    const cardTrainingSearch = document.querySelector('.card-training-search');

    let currentPage = 1;
    const pageCapacity = 6;

    setupCardsTrainingInfoPage(currentPage, pageCapacity);

    applyBtn.onclick = () => {
        GlobalCardsData.updateTrainingInfo(updatedTrainingInfoCards);
        cardTrainingSearch.value = '';
        cardTrainingSearch.dispatchEvent(new Event('input'));
        cardsTrainingInfoContainer.style.display = 'none';
    };

    cancelBtn.onclick = () => {
        cardTrainingSearch.value = '';
        cardTrainingSearch.dispatchEvent(new Event('input'));
        cardsTrainingInfoContainer.style.display = 'none';
    };

    prevBtn.addEventListener('click', () => {
        currentPage -= 1;
        setupCardsTrainingInfoPage(currentPage, pageCapacity);
    });

    nextBtn.addEventListener('click', () => {
        currentPage += 1;
        setupCardsTrainingInfoPage(currentPage, pageCapacity);
    });

    document.querySelector('.card-training-search').addEventListener('input', () => {
        currentPage = 1;
        setupCardsTrainingInfoPage(currentPage, pageCapacity);
    });
}

function addCardsListBtnLogic() {
    const btn = document.getElementById('settings-cards-list-btn');
    const cardsTrainingInfoContainer = document.getElementById('card-training-window-bg');

    btn.addEventListener('click', () => {
        setupCardsTrainingInfoPage(1, 6);
        updatedTrainingInfoCards = [];
        cardsTrainingInfoContainer.querySelector('.apply-btn').disabled = true;
        cardsTrainingInfoContainer.style.removeProperty('display');
    });
}


export function addSettingsLogic() {
    addScaleLogic();
    addWordListSettingsBtnLogic(document.querySelector('#settings-words-list-btn'));
    addCloseToTrayBtnLogic();
    initCardsTrainingInfoChange();
    addCardsListBtnLogic();
}