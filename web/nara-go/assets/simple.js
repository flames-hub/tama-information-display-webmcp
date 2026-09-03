const DATA_URL = './data/timetables.json?v=20260815-2';
const state = {
  data: null,
  direction: localStorage.getItem('naraGoDirection') || 'toOji',
  selectedStop: localStorage.getItem('naraGoStop') || 'hakuhodai2',
  date: new Date(),
  schedule: [],
  unavailable: false,
};
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const pad = (value) => String(value).padStart(2, '0');
const isoDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseDate = (value) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};
const formatDate = (date) => new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(date);
const minutes = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
const shiftTime = (time, offset) => {
  const shifted = minutes(time) + offset;
  return `${pad(Math.floor(shifted / 60) % 24)}:${pad(shifted % 60)}`;
};
const sameDay = (a, b) => isoDate(a) === isoDate(b);

function isHoliday(date) {
  return state.data.calendar.holidays.includes(isoDate(date));
}

function dayType(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = date.getDay();
  const specialSaturday = month === 8 && day >= 13 && day <= 15 && weekday >= 1 && weekday <= 5;
  const yearEndHoliday = (month === 12 && day >= 30) || (month === 1 && day <= 3);
  if (state.direction === 'toOji') return (weekday === 0 || weekday === 6 || isHoliday(date) || specialSaturday || yearEndHoliday) ? 'weekend' : 'weekday';
  if (yearEndHoliday || weekday === 0 || isHoliday(date)) return 'holiday';
  if (weekday === 6 || specialSaturday) return 'saturday';
  return 'weekday';
}

function dayLabel(type) {
  return ({ weekday: '平日ダイヤ', weekend: '土曜・日祝日ダイヤ', saturday: '土曜ダイヤ', holiday: '日祝日ダイヤ' })[type];
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

function selectedSchedule(type) {
  const stop = state.data.narakotsu.stops[state.selectedStop];
  let items = state.data.narakotsu.directions[state.direction].schedules[type];
  if (state.direction === 'toOji' && stop.toOjiAvailable === false) return { items: [], unavailable: true };
  if (state.direction === 'toOji' && stop.toOjiOffsetMinutes) {
    items = items.map((entry) => ({ ...entry, time: shiftTime(entry.time, stop.toOjiOffsetMinutes) }));
  }
  if (state.direction === 'toHakuhodai' && stop.toHakuhodaiViaSouthOnly) items = items.filter((entry) => entry.viaSouth);
  return { items, unavailable: false };
}

function renderAllTimes(items) {
  const groups = new Map();
  items.forEach((entry) => {
    const [hour, minute] = entry.time.split(':');
    if (!groups.has(hour)) groups.set(hour, []);
    groups.get(hour).push({ ...entry, minute });
  });
  $('#simpleAllTimes').innerHTML = [...groups.entries()].map(([hour, entries]) => `
    <div class="simple-hour"><b>${Number(hour)}</b><div>${entries.map((entry) => {
      const arrival = arrivalTime(entry);
      return `<span><b>${entry.minute}</b>${arrival ? `<small>着 ${arrival}</small>` : ''}</span>`;
    }).join('')}</div></div>`).join('');
}

function renderBus() {
  const type = dayType(state.date);
  const direction = state.data.narakotsu.directions[state.direction];
  const stop = state.data.narakotsu.stops[state.selectedStop];
  const selection = selectedSchedule(type);
  state.schedule = selection.items;
  state.unavailable = selection.unavailable;
  $('#simpleDayType').textContent = dayLabel(type);
  $('#simpleServiceDescription').textContent = selection.unavailable
    ? `${formatDate(state.date)}・${stop.name}には王寺駅方面の奈良交通のりばがありません`
    : `${formatDate(state.date)}・${state.direction === 'toOji' ? `${stop.name} 発` : `王寺駅 発 → ${stop.name}`}`;
  $('#simpleNarakotsuSource').href = stop.sources[state.direction];

  if (selection.unavailable) {
    $('#simpleNextTime').textContent = '—';
    $('#simpleCountdown').textContent = '王寺駅方面の便はありません';
    $('#simplePlatform').textContent = stop.name;
    $('#simpleDestination').textContent = '王寺駅方面';
    $('#simpleArrival').textContent = '—';
    $('#simpleNote').textContent = '白鳳台二丁目・白鳳台中央・白鳳台一丁目・畠田をご利用ください';
    $('#simpleUpcoming').innerHTML = '<li><div><strong>この方向の奈良交通便はありません</strong><small>停留所か方向を切り替えてください</small></div></li>';
    renderAllTimes([]);
    return;
  }

  const now = new Date();
  const threshold = sameDay(state.date, now) ? now.getHours() * 60 + now.getMinutes() : -1;
  const upcoming = state.schedule.filter((entry) => minutes(entry.time) >= threshold);
  const next = upcoming[0] || null;

  if (!next) {
    $('#simpleNextTime').textContent = '終了';
    $('#simpleCountdown').textContent = '本日の運行は終了しました';
    $('#simplePlatform').textContent = '—';
    $('#simpleDestination').textContent = '翌日を確認';
    $('#simpleArrival').textContent = '—';
    $('#simpleNote').textContent = '日付を変更すると次の運行日を確認できます';
  } else {
    const meta = entryMeta(next);
    $('#simpleNextTime').textContent = next.time;
    $('#simplePlatform').textContent = meta.platform;
    $('#simpleDestination').textContent = meta.destination;
    $('#simpleArrival').textContent = arrivalTime(next) || '—';
    $('#simpleNote').textContent = `${meta.note}。到着時刻は予定です。`;
    const diff = minutes(next.time) - threshold;
    $('#simpleCountdown').textContent = sameDay(state.date, now) ? (diff === 0 ? 'まもなく発車' : `あと ${diff} 分`) : dayLabel(type);
  }

  $('#simpleUpcoming').innerHTML = upcoming.slice(next ? 1 : 0, next ? 6 : 5).map((entry) => {
    const meta = entryMeta(entry);
    const arrival = arrivalTime(entry);
    return `<li><time>${entry.time}</time><div><strong>${meta.destination}</strong><small>${entry.viaSouth ? '白鳳台二丁目南経由' : meta.note}</small></div>${arrival ? `<strong class="simple-arrival">${arrival}<small>着予定</small></strong>` : ''}<span>${meta.platform}</span></li>`;
  }).join('') || '<li><div><strong>このあとの便はありません</strong><small>翌日のダイヤをご確認ください</small></div></li>';
  renderAllTimes(state.schedule);
}

function kashibusRuns(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const yearEnd = (month === 12 && day >= 27) || (month === 1 && day <= 4);
  return date.getDay() !== 4 && !isHoliday(date) && !yearEnd;
}

function renderKashibus() {
  const runs = kashibusRuns(state.date);
  $('#simpleKashibusStatus strong').textContent = runs ? '選択日は運行日' : '選択日は運休日';
  $('#simpleKashibusStatus').classList.toggle('is-off', !runs);
  const outbound = state.data.kashibus.outboundTrips || state.data.kashibus.outbound;
  const inbound = state.data.kashibus.inboundTrips || state.data.kashibus.inbound;
  const outboundList = $('#simpleKashibusOutbound');
  const inboundList = $('#simpleKashibusInbound');
  outboundList.classList.add('simple-kashibus-trips');
  inboundList.classList.add('simple-kashibus-trips');
  outboundList.innerHTML = outbound.map((trip) => {
    const departure = typeof trip === 'string' ? trip : trip.departure;
    if (typeof trip === 'string') return `<li><time>${departure}</time></li>`;
    return `<li class="simple-kashibus-trip">
      <div class="simple-trip-departure"><small>白鳳台二丁目南 発</small><time>${departure}</time></div>
      <div class="simple-trip-arrivals">
        <span><small>総合福祉センター</small><b>${trip.welfareCenter}<em>着予定</em></b></span>
        <span><small>香芝市役所</small><b>${trip.cityHall}<em>着予定</em></b></span>
      </div>
    </li>`;
  }).join('');
  inboundList.innerHTML = inbound.map((trip) => {
    const departure = typeof trip === 'string' ? trip : trip.departure;
    if (typeof trip === 'string') return `<li><time>${departure}</time></li>`;
    return `<li class="simple-kashibus-trip">
      <div class="simple-trip-departure"><small>香芝市役所 発</small><time>${departure}</time></div>
      <div class="simple-trip-arrivals is-three-stops">
        <span><small>総合福祉センター</small><b>${trip.welfareCenter}<em>着予定</em></b></span>
        <span><small>白鳳台二丁目南</small><b>${trip.hakuhodai2South}<em>着予定</em></b></span>
        <span><small>香芝市スポーツ公園</small><b>${trip.sportsPark}<em>着予定</em></b></span>
      </div>
    </li>`;
  }).join('');
}

function setDirection(direction) {
  state.direction = direction;
  localStorage.setItem('naraGoDirection', direction);
  $$('.simple-tabs button').forEach((button) => {
    const active = button.dataset.direction === direction;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-selected', String(active));
  });
  renderBus();
}

function setStop(stopId) {
  if (!state.data.narakotsu.stops[stopId]) stopId = 'hakuhodai2';
  state.selectedStop = stopId;
  localStorage.setItem('naraGoStop', stopId);
  $$('.simple-stop-selector button').forEach((button) => {
    const active = button.dataset.stop === stopId;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  renderBus();
}

function tickClock() {
  const now = new Date();
  $('#simpleClock').textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  $('#simpleToday').textContent = formatDate(now);
  if (state.data && sameDay(state.date, now)) renderBus();
}

async function init() {
  const response = await fetch(DATA_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Data load failed: ${response.status}`);
  state.data = await response.json();
  $('#simpleDate').value = isoDate(state.date);
  $('#simpleRevision').textContent = `${state.data.narakotsu.revision.replaceAll('-', '.')} DEMO`;
  $('#simpleKashibusRevision').textContent = `${state.data.kashibus.revision.replaceAll('-', '.')} DEMO`;
  $('#simpleKashibusSource').href = state.data.kashibus.source;
  $$('.simple-tabs button').forEach((button) => button.addEventListener('click', () => setDirection(button.dataset.direction)));
  $$('.simple-stop-selector button').forEach((button) => button.addEventListener('click', () => setStop(button.dataset.stop)));
  $('#simpleDate').addEventListener('change', (event) => {
    state.date = parseDate(event.target.value);
    renderBus();
    renderKashibus();
  });
  setStop(state.selectedStop);
  setDirection(state.direction);
  renderKashibus();
  tickClock();
  setInterval(tickClock, 30000);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../../sw.js', { updateViaCache: 'none' }).then((registration) => registration.update()).catch(() => {});
}

init().catch((error) => {
  console.error(error);
  $('#simpleServiceDescription').textContent = '時刻データを読み込めませんでした。公式情報をご確認ください。';
  $('#simpleNextTime').textContent = '—';
});
