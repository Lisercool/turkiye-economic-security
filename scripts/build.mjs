import {mkdir,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {PROFILE,GROUPS,LEVELS} from '../site/assets/data.js';
import {escapeHTML as esc,pill,snapshot,distribution,summaryRows,detailTable,csv} from '../site/assets/model.js';
import {chart} from '../site/assets/charts.js';

const root=fileURLToPath(new URL('../site/',import.meta.url));
const navItems=[['index.html','Автор'],['analytics.html','Аналітика'],['methodology.html','Методика']];
const totals=distribution(snapshot());
function shell(page,title,description,body){return `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="${esc(description)}"><meta name="referrer" content="no-referrer"><meta name="robots" content="noindex,nofollow">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; script-src-attr 'none'; style-src 'self'; style-src-attr 'none'; img-src 'self'; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-src 'none'; worker-src 'none'">
<meta name="theme-color" content="#8d2938"><title>${esc(title)} · Економічна безпека країни</title>
<link rel="icon" href="./assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="./assets/styles.css"><script type="module" src="./assets/app.js"></script>
</head>
<body>
<a class="skip-link" href="#main">Перейти до вмісту</a>
<header class="site-header"><div class="header-inner">
<a class="brand" href="./index.html">Економічна безпека країни<span>Туреччина</span></a>
<nav aria-label="Основна навігація">${navItems.map(([href,label])=>`<a href="./${href}" ${href===page?'aria-current="page"':''}>${label}</a>`).join('')}</nav>
</div></header>
<main id="main" class="container ${page==='index.html'?'home-page':''}">${body}</main>
<footer class="site-footer"><div class="container footer-inner"><p>© ${PROFILE.year} <span data-profile-name>${esc(PROFILE.name)}</span></p><p>Навчальне дослідження</p></div></footer>
</body></html>`;}

const home=`
<header class="page-heading">
<h1>Економічна безпека Туреччини</h1>
<p>Навчальне дослідження за даними 2019–2025 років.</p>
</header>
<section class="author-section" id="author" aria-labelledby="author-heading">
<h2 id="author-heading">${esc(PROFILE.name)}</h2>
<dl class="profile-details">
<div><dt>Освіта</dt><dd>${esc(PROFILE.education)}</dd></div>
<div><dt>Професійні інтереси</dt><dd>${PROFILE.interests.map(interest=>esc(interest.toLocaleLowerCase('uk-UA'))).join(', ')}.</dd></div>
<div><dt>Телефон</dt><dd><a class="phone-link" href="tel:${PROFILE.phone.replace(/[^+\d]/g,'')}">${esc(PROFILE.phone)}</a></dd></div>
</dl>
</section>
<section class="study-intro" aria-labelledby="study-heading">
<h2 id="study-heading">Про дослідження</h2>
<p>Розглянуто 9 показників: урожайність, тривалість життя, смертність немовлят, зовнішню торгівлю, витрати на дослідження, нерівність доходів і борг центрального уряду.</p>
<p>На аналітичній сторінці наведено таблиці, графіки, порівняння з порогами та висновки.</p>
<a class="button primary" href="./analytics.html">Переглянути аналіз</a>
</section>`;

const panels=GROUPS.map(group=>`
<article class="indicator-panel" id="detail-${group.id}" data-group-panel="${group.id}">
<div class="indicator-heading"><h3>${group.title}</h3><p>${group.description}</p></div>
<div class="plot-block">${chart(group)}</div>
${detailTable(group)}
<div class="interpretation"><h4>Висновок</h4><p>${group.finding}</p><h4>Напрям покращення</h4><p>${group.priority}</p></div>
${['trade','debt'].includes(group.id)?`<p class="context-note">${group.limitation}</p>`:''}
<p class="detail-source">Теоретична частина: стор. ${group.page}, табл. ${group.tables}. <a href="./methodology.html#method-${group.id}">Шкала оцінювання та джерела</a></p>
</article>`).join('');

const analysis=`
<header class="page-heading"><h1>Аналіз економічної безпеки Туреччини</h1><p>9 показників за 2019–2025 роки. Для кожного ряду наведено п’ять спостережень.</p></header>
<div class="report-actions"><a class="button secondary" href="./assets/turkiye-data.csv" download>Завантажити CSV</a><button class="button secondary" id="print-report" type="button">Друк / PDF</button></div>
<section id="overview" class="report-section" aria-labelledby="overview-heading">
<h2 id="overview-heading">Показники та рівні безпеки</h2>
<div class="summary-counts" aria-label="Підсумок оцінок"><p>Доступно: <strong id="available-count">${totals.available}</strong> з 9</p><p>Потребують уваги: <strong id="attention-count">${totals.attention}</strong> <span id="attention-unit">оцінок</span></p><p>Сприятливі: <strong id="favorable-count">${totals.favorable}</strong> <span id="favorable-unit">оцінки</span></p></div>
<div class="snapshot-controls"><label for="snapshot-year">Період<select id="snapshot-year" aria-label="Зріз даних"><option value="latest">Останні спостереження</option>${[2025,2024,2023,2022,2021,2020,2019].map(year=>`<option value="${year}">${year} рік</option>`).join('')}</select></label><label for="snapshot-filter">Рівень безпеки<select id="snapshot-filter" aria-label="Рівень безпеки"><option value="all">Усі оцінки</option><option value="attention">Потребують уваги</option><option value="favorable">Сприятливі</option></select></label></div>
<div class="table-wrap" tabindex="0" aria-label="Прокручувана зведена таблиця"><table class="summary-table"><caption id="snapshot-caption">Останні спостереження з дослідження. Роки різняться між показниками.</caption><thead><tr><th scope="col">Показник</th><th scope="col">Рік</th><th scope="col">Значення</th><th scope="col">Рівень безпеки</th><th scope="col">Оптимальний інтервал</th></tr></thead><tbody id="snapshot-rows">${summaryRows()}</tbody></table></div>
<p class="table-footnote">Сприятливі оцінки — оптимальні та задовільні. Решта потребують уваги. Оцінювання виконується до округлення; інтегральний індекс країни не розраховується.</p>
<p id="unavailable-note" class="context-note" hidden></p><p id="snapshot-announcement" class="sr-only" role="status" aria-live="polite"></p>
</section>
<section class="report-section explorer" id="explorer" aria-labelledby="explorer-heading">
<h2 id="explorer-heading">Динаміка показників</h2>
<div class="explorer-controls"><label for="indicator-select">Група показників<select id="indicator-select" aria-label="Група показників">${GROUPS.map(group=>`<option value="${group.id}">${group.title}</option>`).join('')}</select></label><label class="checkbox-label"><input type="checkbox" id="show-thresholds" checked>Показувати порогові орієнтири</label></div>
<noscript><p>Без JavaScript усі графіки та таблиці наведено послідовно.</p></noscript>
<div id="detail-panels">${panels}</div>
</section>
<section class="report-section conclusion" id="conclusion" aria-labelledby="conclusion-heading">
<h2 id="conclusion-heading">Загальний висновок</h2>
<p>Економічна безпека Туреччини за дослідженими показниками залишається вразливою. Найгостріша проблема — нерівність доходів: усі п’ять оцінок відповідають абсолютній небезпеці.</p>
<p>Сприятливі останні оцінки мають тривалість життя жінок, покриття імпорту експортом і борг центрального уряду. Смертність немовлят та фінансування досліджень залишаються небезпечними; урожайність і тривалість життя чоловіків — незадовільними.</p>
<h3>Основні загрози та пріоритети</h3>
<ul class="priority-list">
<li><strong>Нерівність доходів.</strong> Продуктивна зайнятість, адресна підтримка та доступ до освіти.</li>
<li><strong>Здоров’я населення.</strong> Допомога матерям і дітям, профілактика та доступна медицина.</li>
<li><strong>Недостатнє фінансування досліджень.</strong> Стабільні вкладення й співпраця науки з підприємствами.</li>
<li><strong>Коливання урожайності й торгівлі.</strong> Стійкі агротехнології та конкурентоспроможний експорт.</li>
</ul>
<p class="source-note">Теоретична частина: стор. 8, табл. 15. Висновок стосується обраних показників, а не всієї економіки.</p>
</section>`;

const methods=`
<header class="page-heading"><h1>Методика та джерела</h1><p>Формули, порогові інтервали та походження даних.</p></header>
<section class="method-rules" aria-labelledby="rules-heading"><h2 id="rules-heading">Правила оцінювання</h2>
<ul><li>Дані та шкали перенесено з наданої теоретичної частини: 9 рядів по 5 років.</li><li>Похідні показники розраховуються з початкових величин. Рівень визначається до округлення.</li><li>Пропуски не заповнюються. Різні показники й роки не зводяться в один індекс.</li></ul>
<p class="context-note">Нормативне першоджерело порогів у роботі не вказане. Ці шкали не подаються як офіційні стандарти Туреччини чи Світового банку.</p></section>
<section class="report-section method-scales" aria-labelledby="scales-heading"><h2 id="scales-heading">Шкали за показниками</h2><p class="section-note">Розгорніть потрібний показник. Квадратна дужка включає межу, кругла — виключає.</p>
${GROUPS.map((group,index)=>`<details class="method-card" id="method-${group.id}" ${index===0?'open':''}><summary>${group.title}</summary><div class="method-content"><p>${group.description}</p><p class="formula-block">${group.formula}</p><div class="table-wrap" tabindex="0" aria-label="Шкала: ${esc(group.title)}"><table class="scale-table"><caption>Теоретична частина: стор. ${group.page}, табл. ${group.tables}</caption><thead><tr><th scope="col">Рівень безпеки</th><th scope="col">Інтервал</th></tr></thead><tbody>${LEVELS.map((level,i)=>`<tr><td>${pill(level)}</td><td>${group.scales[i]}</td></tr>`).join('')}</tbody></table></div><p class="context-note">${group.limitation}</p></div></details>`).join('')}
</section>
<section class="report-section sources-section" id="sources" aria-labelledby="sources-heading"><h2 id="sources-heading">Джерела даних</h2>
<p>Числа на сайті відтворюють надану роботу «Аналіз економічної безпеки Туреччини», таблиці 1–15. У ній джерелом статистики зазначено Світовий банк, але дата вивантаження не наведена. Автоматичне оновлення даних відсутнє.</p>
<p>Посилання нижче ведуть до відповідних рядів. Їхні поточні значення можуть відрізнятися після переглядів статистики.</p>
<div class="table-wrap" tabindex="0" aria-label="Джерела статистичних рядів"><table class="sources-table"><caption>World Development Indicators · Туреччина</caption><thead><tr><th scope="col">Показник</th><th scope="col">Статистичні ряди</th><th scope="col">Таблиці роботи</th></tr></thead><tbody>${GROUPS.map(group=>`<tr><th scope="row">${group.title}</th><td>${group.sources.map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${s.code}</a>`).join('<br>')}</td><td>${group.tables}</td></tr>`).join('')}</tbody></table></div>
<p><a href="./assets/turkiye-data.csv" download>Завантажити всі дані у CSV</a></p></section>
<section class="report-section privacy-section"><h2>Приватність відвідування</h2><p>Код сайту не додає аналітики, cookies чи збереження даних у браузері. Фільтри працюють із готовим набором у пам’яті сторінки. Під час завантаження сайту сервери можуть обробляти технічні відомості про відвідування.</p><p>Зовнішні джерела мають власні правила приватності. CSV і роздруківки зберігаються на вашому пристрої.</p></section>`;

await mkdir(root,{recursive:true});
await writeFile(root+'index.html',shell('index.html','Автор · Туреччина','Лошак Ю. О. — автор навчального дослідження економічної безпеки Туреччини.',home));
await writeFile(root+'analytics.html',shell('analytics.html','Аналітика Туреччини','Показники економічної безпеки Туреччини: таблиці, графіки та висновки.',analysis));
await writeFile(root+'methodology.html',shell('methodology.html','Методика та джерела','Формули, пороги та джерела дослідження економічної безпеки Туреччини.',methods));
await writeFile(root+'assets/turkiye-data.csv',csv());
console.log('Built 3 pages, 7 charts, and CSV with 45 observations.');
