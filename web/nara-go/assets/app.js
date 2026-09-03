const DATA_URL = './data/timetables.json?v=20260815-2';

const state = {
  data: null,
  direction: localStorage.getItem('naraGoDirection') || 'toOji',
  selectedStop: localStorage.getItem('naraGoStop') || 'hakuhodai2',
  selectedDate: new Date(),
  selectedSchedule: [],
  serviceUnavailable: false,
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const pad = (value) => String(value).padStart(2, '0');
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseLocalDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const sameDay = (a, b) => isoDate(a) === isoDate(b);
const minutesFromTime = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
const shiftTime = (time, offset) => {
  const shifted = minutesFromTime(time) + offset;
  return `${pad(Math.floor(shifted / 60) % 24)}:${pad(shifted % 60)}`;
};
const formatJapaneseDate = (date) => new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
}).format(date);

function tickClock() {
  const now = new Date();
  $('#liveClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $('#liveDate').textContent = formatJapaneseDate(now);
  if (state.data && sameDay(state.selectedDate, now)) renderNextDepartures();
}

function isHoliday(date) {
  return state.data.calendar.holidays.includes(isoDate(date));
}

function narakotsuDayType(date, direction) {
  const key = isoDate(date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const specialSaturday = month === 8 && day >= 13 && day <= 15 && weekday >= 1 && weekday <= 5;
  const yearEndHoliday = (month === 12 && day >= 30) || (month === 1 && day <= 3);

  if (direction === 'toOji') {
    return (weekday === 0 || weekday === 6 || isHoliday(date) || specialSaturday || yearEndHoliday) ? 'weekend' : 'weekday';
  }
  if (yearEndHoliday || weekday === 0 || isHoliday(date)) return 'holiday';
  if (weekday === 6 || specialSaturday) return 'saturday';
  return 'weekday';
}

function dayTypeLabel(type) {
  return ({ weekday: '平日ダイヤ', weekend: '土曜・日祝日ダイヤ', saturday: '土曜ダイヤ', holiday: '日祝日ダイヤ' })[type];
}

function getSelectedSchedule() {
  const type = narakotsuDayType(state.selectedDate, state.direction);
  const stop = state.data.narakotsu.stops[state.selectedStop];
  let items = state.data.narakotsu.directions[state.direction].schedules[type];

  if (state.direction === 'toOji' && stop.toOjiAvailable === false) {
    return {
      type,
      items: [],
      unavailable: true,
      message: `${stop.name}には王寺駅方面の奈良交通のりばがありません。`,
    };
  }
  if (state.direction === 'toOji' && stop.toOjiOffsetMinutes) {
    items = items.map((entry) => ({ ...entry, time: shiftTime(entry.time, stop.toOjiOffsetMinutes) }));
  }
  if (state.direction === 'toHakuhodai' && stop.toHakuhodaiViaSouthOnly) {
    items = items.filter((entry) => entry.viaSouth);
  }
  return {
    type,
    items,
    unavailable: false,
  };
}

function entryMeta(entry) {
  const defaults = state.data.narakotsu.directions[state.direction];
  const stop = state.data.narakotsu.stops[state.selectedStop];
  return {
    platform: entry.platform || (state.direction === 'toOji' ? stop.name : defaults.defaultPlatform),
    destination: entry.destination || (state.direction === 'toHakuhodai' ? stop.name : defaults.destination),
    note: entry.note || (stop.toHakuhodaiViaSouthOnly && state.direction === 'toHakuhodai' ? '10系統・白鳳台二丁目南経由' : defaults.note),
  };
}

function arrivalTime(entry) {
  const stop = state.data.narakotsu.stops[state.selectedStop];
  const defaults = state.data.narakotsu.directions[state.direction];
  let variant;
  if (entry.viaSouth) variant = 'viaSouth';
  else if (state.direction === 'toOji') variant = (entry.note || defaults.note).includes('80系統') ? 'north80' : 'south10';
  else variant = (entry.platform || defaults.defaultPlatform) === '北口' ? 'north80' : 'south10';
  const offset = stop.arrivalOffsets[state.direction][variant];
  return Number.isFinite(offset) ? shiftTime(entry.time, offset) : null;
}

function renderBus() {
  const schedule = getSelectedSchedule();
  state.selectedSchedule = schedule.items;
  state.serviceUnavailable = schedule.unavailable;
  const stop = state.data.narakotsu.stops[state.selectedStop];
  const selectedLabel = formatJapaneseDate(state.selectedDate);
  $('#serviceBadge').textContent = dayTypeLabel(schedule.type);
  $('#serviceDescription').textContent = schedule.unavailable
    ? `${selectedLabel}・${schedule.message}`
    : `${selectedLabel}・${state.direction === 'toOji' ? `${stop.name} 発` : `王寺駅 発 → ${stop.name}`}`;
  $('#directionLabel').textContent = state.direction === 'toOji' ? `${stop.name} 発` : `王寺駅 発 → ${stop.name}`;
  renderNextDepartures();
  renderFullTimetable(schedule.items);
}

function renderNextDepartures() {
  if (state.serviceUnavailable) {
    const stop = state.data.narakotsu.stops[state.selectedStop];
    $('#nextTime').textContent = '—';
    $('#countdown').textContent = '王寺駅方面の便はありません';
    $('#nextPlatform').textContent = stop.name;
    $('#nextDestination').textContent = '王寺駅方面';
    $('#nextArrival').textContent = '—';
    $('#nextNote').textContent = '白鳳台二丁目・白鳳台中央・白鳳台一丁目・畠田をご利用ください。二丁目南ではカシバスも確認できます。';
    $('#upcomingList').innerHTML = '<li><div><strong>この方向の奈良交通便はありません</strong><small>停留所か方向を切り替えてください</small></div></li>';
    return;
  }
  const now = new Date();
  const today = sameDay(state.selectedDate, now);
  const currentMinutes = today ? now.getHours() * 60 + now.getMinutes() : -1;
  const upcoming = state.selectedSchedule.filter((entry) => minutesFromTime(entry.time) >= currentMinutes);
  const next = upcoming[0] || null;
  const list = upcoming.slice(next ? 1 : 0, next ? 5 : 4);

  if (!next) {
    $('#nextTime').textContent = '終了';
    $('#countdown').textContent = '本日の運行は終了しました';
    $('#nextPlatform').textContent = '—';
    $('#nextDestination').textContent = '翌日のダイヤを確認';
    $('#nextArrival').textContent = '—';
    $('#nextNote').textContent = '日付を翌日に変更すると、次の運行日を確認できます。';
  } else {
    const meta = entryMeta(next);
    $('#nextTime').textContent = next.time;
    $('#nextPlatform').textContent = meta.platform;
    $('#nextDestination').textContent = meta.destination;
    $('#nextArrival').textContent = arrivalTime(next) || '—';
    $('#nextNote').textContent = `${meta.note}。到着時刻は標準所要時間による予定です。`;
    if (today) {
      const diff = minutesFromTime(next.time) - currentMinutes;
      $('#countdown').textContent = diff === 0 ? 'まもなく発車' : `あと ${diff} 分`;
    } else {
      $('#countdown').textContent = dayTypeLabel(narakotsuDayType(state.selectedDate, state.direction));
    }
  }

  $('#upcomingList').innerHTML = list.length ? list.map((entry) => {
    const meta = entryMeta(entry);
    const arrival = arrivalTime(entry);
    return `<li>
      <time datetime="${entry.time}">${entry.time}</time>
      <div><strong>${meta.destination}</strong><small>${entry.viaSouth ? '白鳳台二丁目南経由' : meta.note}</small></div>
      ${arrival ? `<strong class="upcoming-arrival"><time datetime="${arrival}">${arrival}</time><small>着予定</small></strong>` : ''}
      <span class="platform-pill">${meta.platform}</span>
    </li>`;
  }).join('') : '<li><div><strong>このあとの便はありません</strong><small>翌日のダイヤをご確認ください</small></div></li>';
}

function renderFullTimetable(items) {
  if (!items.length) {
    $('#hourGrid').innerHTML = '<p class="empty-timetable">表示できる便はありません</p>';
    return;
  }
  const groups = new Map();
  items.forEach((entry) => {
    const [hour, minute] = entry.time.split(':');
    if (!groups.has(hour)) groups.set(hour, []);
    groups.get(hour).push({ ...entry, minute });
  });

  $('#hourGrid').innerHTML = [...groups.entries()].map(([hour, entries]) => `
    <div class="hour-row">
      <div class="hour-label">${Number(hour)}</div>
      <div class="minute-list">${entries.map((entry) => {
        const meta = entryMeta(entry);
        const arrival = arrivalTime(entry);
        return `<span class="minute-chip${entry.viaSouth ? ' is-via' : ''}" data-platform="${meta.platform}" title="${entry.time}発 ${arrival ? `${arrival}着予定` : ''} ${meta.destination} / ${meta.platform}"><b>${entry.minute}</b>${arrival ? `<small>着 ${arrival}</small>` : ''}</span>`;
      }).join('')}</div>
    </div>`).join('');
}

function kashibusRuns(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const yearEnd = (month === 12 && day >= 27) || (month === 1 && day <= 4);
  return date.getDay() !== 4 && !isHoliday(date) && !yearEnd;
}

function renderKashibus() {
  const outbound = state.data.kashibus.outboundTrips || state.data.kashibus.outbound;
  const inbound = state.data.kashibus.inboundTrips || state.data.kashibus.inbound;
  const outboundList = $('#kashibusOutbound');
  const inboundList = $('#kashibusInbound');
  outboundList.classList.add('community-trips');
  inboundList.classList.add('community-trips');
  outboundList.innerHTML = outbound.map((trip) => {
    const departure = typeof trip === 'string' ? trip : trip.departure;
    if (typeof trip === 'string') return `<li><time>${departure}</time></li>`;
    return `<li class="community-trip">
      <div class="community-departure"><small>白鳳台二丁目南 発</small><time>${departure}</time></div>
      <div class="community-arrivals">
        <span><small>総合福祉センター</small><b>${trip.welfareCenter}<em>着予定</em></b></span>
        <span><small>香芝市役所</small><b>${trip.cityHall}<em>着予定</em></b></span>
      </div>
    </li>`;
  }).join('');
  inboundList.innerHTML = inbound.map((trip) => {
    const departure = typeof trip === 'string' ? trip : trip.departure;
    if (typeof trip === 'string') return `<li><time>${departure}</time></li>`;
    return `<li class="community-trip">
      <div class="community-departure"><small>香芝市役所 発</small><time>${departure}</time></div>
      <div class="community-arrivals is-three-stops">
        <span><small>総合福祉センター</small><b>${trip.welfareCenter}<em>着予定</em></b></span>
        <span><small>白鳳台二丁目南</small><b>${trip.hakuhodai2South}<em>着予定</em></b></span>
        <span><small>香芝市スポーツ公園</small><b>${trip.sportsPark}<em>着予定</em></b></span>
      </div>
    </li>`;
  }).join('');
  const runs = kashibusRuns(state.selectedDate);
  $('#kashibusStatus .status-word').textContent = runs ? '選択日は運行日' : '選択日は運休日';
  $('#kashibusStatus').classList.toggle('is-off', !runs);
}

function renderTravelLinks() {
  $('#travelLinks').innerHTML = state.data.travelLinks.map((link, index) => `
    <a class="travel-link" href="${link.url}" target="_blank" rel="noopener">
      <small>${pad(index + 1)} / ${link.category}</small>
      <h3>${link.title}</h3>
      <p>${link.description}</p>
      <b>↗</b>
    </a>`).join('');
}

function setDirection(direction) {
  state.direction = direction;
  localStorage.setItem('naraGoDirection', direction);
  $$('.direction-tab').forEach((tab) => {
    const active = tab.dataset.direction === direction;
    tab.classList.toggle('is-active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  $('#narakotsuSource').href = state.data.narakotsu.stops[state.selectedStop].sources[direction];
  renderBus();
}

function setStop(stopId) {
  if (!state.data.narakotsu.stops[stopId]) stopId = 'hakuhodai2';
  state.selectedStop = stopId;
  localStorage.setItem('naraGoStop', stopId);
  const stop = state.data.narakotsu.stops[stopId];
  $$('[data-stop]').forEach((button) => {
    const active = button.dataset.stop === stopId;
    button.classList.toggle('is-active', active);
    if (button.matches('button')) button.setAttribute('aria-pressed', String(active));
  });
  $$('[data-route-stop]').forEach((item) => item.classList.toggle('active', item.dataset.routeStop === stopId));
  $('#heroStopName').textContent = stop.name;
  $('#narakotsuSource').href = stop.sources[state.direction];
  renderBus();
}

function applyMetadata() {
  const { narakotsu, kashibus, verified } = state.data;
  $('#narakotsuRevision').textContent = `${narakotsu.revision.replaceAll('-', '.')} DEMO`;
  $('#kashibusRevision').textContent = `${kashibus.revision.replaceAll('-', '.')} DEMO`;
  $('#footerNarakotsuRevision').textContent = narakotsu.revision.replaceAll('-', '.');
  $('#footerKashibusRevision').textContent = kashibus.revision.replaceAll('-', '.');
  $('#lastVerified').textContent = verified.replaceAll('-', '.');
  $('#footerVerified').textContent = verified.replaceAll('-', '.');
  $('#kashibusSource').href = kashibus.source;
}

async function sharePage() {
  const payload = { title: document.title, text: '白鳳台の交通案内 NARA/GO', url: location.href };
  try {
    if (navigator.share) await navigator.share(payload);
    else {
      await navigator.clipboard.writeText(location.href);
      $('#shareButton').setAttribute('aria-label', 'URLをコピーしました');
    }
  } catch (error) {
    if (error.name !== 'AbortError') console.warn('Share failed', error);
  }
}

function bindEvents() {
  $$('.direction-tab').forEach((tab) => tab.addEventListener('click', () => setDirection(tab.dataset.direction)));
  $$('button[data-stop]').forEach((button) => button.addEventListener('click', () => setStop(button.dataset.stop)));
  $('#serviceDate').addEventListener('change', (event) => {
    state.selectedDate = parseLocalDate(event.target.value);
    renderBus();
    renderKashibus();
  });
  $('#toggleFull').addEventListener('click', () => {
    const panel = $('#fullTimetable');
    const expanded = panel.hidden;
    panel.hidden = !expanded;
    $('#toggleFull').setAttribute('aria-expanded', String(expanded));
    $('#toggleFull').textContent = expanded ? '一日の時刻表を閉じる' : '一日の時刻表をすべて表示';
  });
  $('#shareButton').addEventListener('click', sharePage);
}

async function init() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Data load failed: ${response.status}`);
  state.data = await response.json();
  const today = new Date();
  state.selectedDate = today;
  $('#serviceDate').value = isoDate(today);
  applyMetadata();
  renderTravelLinks();
  bindEvents();
  setStop(state.selectedStop);
  setDirection(state.direction);
  renderKashibus();
  tickClock();
  setInterval(tickClock, 30000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../../sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {});
}

init().catch((error) => {
  console.error(error);
  $('#serviceDescription').textContent = '時刻データを読み込めませんでした。公式リンクをご利用ください。';
  $('#nextTime').textContent = '—';
  $('#countdown').textContent = '再読み込みしてください';
});
