var darkMode = true;
document.getElementById('scene-change-button').onclick = () => {
    darkMode = !darkMode;
    if(darkMode) {
        document.querySelector('#scene-change-button > span').innerText = 'Dark mode';
        document.documentElement.style.setProperty('--element-color', 'hsl(209, 23%, 22%)');
        document.documentElement.style.setProperty('--bg-color', 'hsl(209, 26%, 17%)');
        document.documentElement.style.setProperty('--text-color', 'hsl(0, 0%, 100%)');
    }
    else {
        document.querySelector('#scene-change-button > span').innerText = 'Light mode';
        document.documentElement.style.setProperty('--element-color', 'hsl(0, 0%, 100%)');
        document.documentElement.style.setProperty('--bg-color', 'hsl(0, 0%, 98%)');
        document.documentElement.style.setProperty('--text-color', 'hsl(200, 15%, 8%)');
    }
}

const selectBox = document.querySelector('#selectBox');

setInterval(() => {
    selectBox.onclick = (document.activeElement === selectBox) ? ()=>selectBox.blur() : ()=>{};
}, 200);

document.querySelector('#searchBox > input').addEventListener('change', genList);
document.querySelectorAll('.option').forEach(element => {
    element.onclick = () => {
        document.querySelector('#selectBox > span').innerText = element.innerText;
        genList();
    }
});

async function localData() {
    return await fetch('./data.json').then(res => res.json());
}
async function getData(textQuery) {
    const res = await fetch(`https://restcountries.com/v3.1/${textQuery ? `name/${textQuery}` : 'all'}?fields=name,flags,population,region,capital,cca3`);
    if(res.ok) {
        return await res.json();
    }
    return await localData();
}

const loadingScreen = document.querySelector('#loading-screen');

async function genList() {
    const textInput = document.querySelector('#searchBox > input');
    const regionFilter = document.querySelector('#selectBox > span');
    const dataOutputContainer = document.getElementById('web-content');
    dataOutputContainer.innerHTML = '';
    loadingScreen.style.setProperty('display', 'block');
    await getData(textInput.value).then(data => {
        loadingScreen.style.setProperty('display', 'none');
        data.forEach((d, index) => {
            if(regionFilter.innerText == 'Filter by Region' || regionFilter.innerText == 'All region' || regionFilter.innerText == d.region) {
                dataOutputContainer.innerHTML += `
                <div class="country-info" cca3="${d.cca3}">
                    <img src="${d.flags.svg}">
                    <div class="info-container">
                        <div class="country-name">${d.name.common}</div>
                        <div class="other-info-container">
                            <div class="other-info"><span>Population: </span>${d.population}</div>
                            <div class="other-info"><span>Region: </span>${d.region}</div>
                            <div class="other-info"><span>Capital: </span>${d.capital}</div>
                        </div>
                    </div>
                </div>
            `;
            }
        })

        Array.from(document.querySelectorAll('.country-info')).forEach(child => {
            child.onclick = async () => {
                loadingScreen.style.setProperty('display', 'block');
                const menu = document.querySelector('#country-expand-info');
                const url = `https://restcountries.com/v3.1/alpha/${child.getAttribute('cca3')}?fields=borders,flags,name,population,region,subregion,capital,tld,currencies,languages`;
                console.log(url);
                await fetch(url).then(res => res.json()).then(data => {
                    let prms = Array(0);
                    data.borders.forEach(a => {
                        prms.push(fetch(`https://restcountries.com/v3.1/alpha/${a}?fields=name`)
                        .then(res => res.json()));
                    });

                    Promise.allSettled(prms).then(borders => {
                        menu.innerHTML = `
                        <div id="back-button">
                            <ion-icon name="arrow-back-outline"></ion-icon>
                            Back
                        </div>
                        <div id="content">
                            <img src="${data.flags.svg}">
                            <div>
                                <div class="country-name">${data.name.common}</div>
                                <div class="more-info">
                                    <div><span>Native Name: </span>${data.name.nativeName[Object.keys(data.name.nativeName)[0]].common}</div>
                                    <div><span>Population: </span>${data.population}</div>
                                    <div><span>Region: </span>${data.region}</div>
                                    <div><span>Sub Region: </span>${data.subregion}</div>
                                    <div><span>Capital: </span>${data.capital}</div>
                                    <div><span>Top Level Domain: </span>${data.tld}</div>
                                    <div><span>Currencies: </span>${data.currencies[Object.keys(data.currencies)[0]].name}</div>
                                    <div>
                                        <span>Languages: </span>
                                        ${ejs.render(`
                                            <% let len = Object.keys(languages).length; %>
                                            <% for(let i = 0; i < len; ++i) { %>
                                                <% let key = Object.keys(languages)[i]; %>
                                                <%= languages[key] %>
                                                <% if(i + 1 < len) { %>
                                                    ,
                                                <% } %>
                                            <% } %>
                                        `, {languages: data.languages}) }
                                    </div>
                                </div>
                                <div class="borders">
                                    <span>Border Countries:</span>
                                    <div>
                                        ${borders.map(c => `<div>${c.value.name.common}</div>`).join('\n')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.querySelector('#back-button').onclick = () => {
                        document.querySelector('#country-expand-info').style.setProperty('display', 'none');
                    }
                    menu.style.setProperty('display', 'block');
                    loadingScreen.style.setProperty('display', 'none');
                    });
                });
            }
        });
    });
}

// init
genList();
