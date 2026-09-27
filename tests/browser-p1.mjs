import puppeteer from 'puppeteer-core';

const base = process.env.P1_BASE || 'http://127.0.0.1:5173';
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || '/usr/local/bin/google-chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
const notes = [];
const fail = (message) => { notes.push({ ok: false, message }); throw new Error(message); };
const ok = (message, detail) => notes.push({ ok: true, message, detail });

async function openApp(id) {
  await page.goto(`${base}/?app=${id}`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('header strong');
}
async function text() { return page.evaluate(() => document.body.innerText); }
async function clickButton(label) {
  const clicked = await page.evaluate((label) => {
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === label && !item.disabled);
    if (!button) return false;
    button.click();
    return true;
  }, label);
  if (!clicked) fail(`Bouton introuvable ou désactivé : ${label}`);
}
function pushOrientation(beta, gamma) {
  return page.evaluate((beta, gamma) => {
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', { alpha: 0, beta, gamma, absolute: true }));
  }, beta, gamma);
}
function pushMotion(z) {
  return page.evaluate((z) => {
    window.dispatchEvent(new DeviceMotionEvent('devicemotion', { accelerationIncludingGravity: { x: 0, y: 0, z } }));
  }, z);
}

try {
  await openApp('twinlevel');
  let body = await text();
  if (!body.includes('TwinLevel') || !body.includes('Copy an angle somewhere else.')) fail('TwinLevel : identité absente');
  const logo = await page.$eval('img.applogo', (img) => img.getAttribute('src'));
  if (!logo.includes('logos/twinlevel.svg')) fail(`Logo TwinLevel inattendu : ${logo}`);
  if (!body.includes('Works offline on this phone')) fail('TwinLevel : mention hors ligne absente');
  if (body.includes('RECONNECT')) fail('TwinLevel : reconnexion affichée sans erreur');
  await clickButton('START LEVEL');
  await pushOrientation(10, 4);
  await new Promise((r) => setTimeout(r, 200));
  body = await text();
  if (!body.includes('10.0°') || !body.includes('4.0°')) fail(`TwinLevel : angles non affichés après événement injecté.\n${body}`);
  ok('TwinLevel affiche des degrés après un DeviceOrientationEvent injecté', 'beta 10, gamma 4');
  await clickButton('ZERO HERE');
  await pushOrientation(10, 4);
  await new Promise((r) => setTimeout(r, 100));
  body = await text();
  if (!body.includes('0.0°')) fail(`TwinLevel : le zéro local ne ramène pas la pose à 0°.\n${body}`);
  ok('TwinLevel ZERO HERE ramène la pose injectée à 0°');
  await pushOrientation(12, 4);
  await new Promise((r) => setTimeout(r, 100));
  await clickButton('CAPTURE REFERENCE');
  body = await text();
  if (!body.includes('UNDER 1°') && !body.includes('TOTAL DIFFERENCE')) fail(`TwinLevel : pas de comparaison.\n${body}`);
  const saved = await page.evaluate(() => localStorage.getItem('phab:twinlevel:v1'));
  const parsed = JSON.parse(saved);
  if (!parsed.reference || parsed.zero?.b !== 10) fail(`TwinLevel : sauvegarde inattendue ${saved}`);
  await page.reload({ waitUntil: 'networkidle0' });
  const restored = JSON.parse(await page.evaluate(() => localStorage.getItem('phab:twinlevel:v1')));
  if (restored.reference.b !== parsed.reference.b || restored.zero.g !== 4) fail('TwinLevel : restauration différente de la sauvegarde');
  ok('TwinLevel sauvegarde et retrouve référence et zéro', restored);
  await clickButton('START LEVEL');
  await clickButton('STOP SENSOR');
  await pushOrientation(40, 20);
  await new Promise((r) => setTimeout(r, 100));
  body = await text();
  if (!body.includes('—°')) fail(`TwinLevel : le capteur semble encore afficher une valeur après STOP.\n${body}`);
  ok('TwinLevel n’affiche plus d’angle après STOP SENSOR');

  await openApp('sensorlink');
  body = await text();
  if (!body.includes('dBFS') || !body.includes('m/s²') || !body.includes('degrees')) fail('SensorLink : unités absentes');
  if (!body.includes('Numbers on this phone work offline')) fail('SensorLink : mention hors ligne absente');
  await page.evaluate(() => {
    const box = [...document.querySelectorAll('label')].find((label) => label.textContent.includes('SOUND'))?.querySelector('input');
    box.click();
  });
  await new Promise((r) => setTimeout(r, 50));
  await page.reload({ waitUntil: 'networkidle0' });
  const soundChecked = await page.evaluate(() => [...document.querySelectorAll('label')].find((label) => label.textContent.includes('SOUND')).querySelector('input').checked);
  if (soundChecked) fail('SensorLink : la case SOUND n’est pas restaurée décochée');
  ok('SensorLink restaure la sélection des capteurs');
  const tareDisabled = await page.evaluate(() => [...document.querySelectorAll('button')].find((item) => item.textContent.trim() === 'TARE MOTION').disabled);
  if (!tareDisabled) fail('SensorLink : TARE MOTION devrait être inactif sans capteur');
  await clickButton('START STREAM');
  await pushMotion(9.81);
  await new Promise((r) => setTimeout(r, 300));
  body = await text();
  if (!body.includes('m/s²')) fail('SensorLink : unité mouvement absente pendant le flux');
  if (!body.includes('9.81 m/s²')) fail(`SensorLink : le mouvement injecté n’est pas affiché.\n${body}`);
  ok('SensorLink affiche 9.81 m/s² après un DeviceMotionEvent injecté');
  await clickButton('TARE MOTION');
  await pushMotion(9.81);
  await new Promise((r) => setTimeout(r, 200));
  body = await text();
  if (!body.includes('0.00 m/s²')) fail(`SensorLink : la tare n’a pas soustrait 9.81 m/s².\n${body}`);
  const tareSaved = JSON.parse(await page.evaluate(() => localStorage.getItem('phab:sensorlink:v1')));
  if (Math.abs(tareSaved.tare - 9.81) > 0.001) fail(`SensorLink : tare non enregistrée ${tareSaved.tare}`);
  ok('SensorLink tare : 9.81 m/s² injectés deviennent 0.00 m/s²', { tare: tareSaved.tare });
  await clickButton('STOP STREAM');
  body = await text();
  if (body.includes('STOP STREAM')) fail('SensorLink : le flux ne s’est pas arrêté');
  ok('SensorLink revient à START STREAM après l’arrêt');

  await openApp('syncmark');
  body = await text();
  if (!body.includes('This phone marks even offline')) fail('SyncMark : mention hors ligne absente');
  await clickButton('0 s');
  await clickButton('SYNC MARK');
  await new Promise((r) => setTimeout(r, 250));
  body = await text();
  if (!body.includes('FIRED MARKS')) fail(`SyncMark : aucune marque locale.\n${body}`);
  const marks = JSON.parse(await page.evaluate(() => localStorage.getItem('phab:syncmark:v1')));
  if (marks.delay !== 0 || marks.marks.length !== 1) fail(`SyncMark : sauvegarde inattendue ${JSON.stringify(marks)}`);
  await page.reload({ waitUntil: 'networkidle0' });
  body = await text();
  if (!body.includes('FIRED MARKS')) fail('SyncMark : la marque n’est pas restaurée');
  ok('SyncMark enregistre et restaure une marque locale', { delayMs: marks.delay, count: marks.marks.length });
  await clickButton('CLEAR MARKS');

  await openApp('soundrace');
  body = await text();
  if (!body.includes('milliseconds') || !body.includes('This phone can arm offline')) fail('SoundRace : unités ou hors ligne absents');
  await page.$eval('input[type=range]', (input) => {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, '0.25');
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await new Promise((r) => setTimeout(r, 50));
  await page.reload({ waitUntil: 'networkidle0' });
  body = await text();
  if (!body.includes('0.25')) fail(`SoundRace : seuil non restauré.\n${body}`);
  ok('SoundRace restaure le seuil RMS 0.25');
  await clickButton('CALIBRATE AMBIENT · 1 s');
  await new Promise((r) => setTimeout(r, 1800));
  body = await text();
  const idle = body.includes('ARM MICROPHONE');
  if (!idle) fail(`SoundRace : le micro ne revient pas au repos après calibration.\n${body}`);
  const recommendation = body.split('\n').find((line) => line.includes('Ambient peak')) || '';
  ok('SoundRace relâche l’écran de calibration', { recommendation, visible: body.includes('RMS THRESHOLD 0.35') ? 'seuil affiché 0.35 après le périphérique factice' : body });

  const names = [];
  for (const id of ['twinlevel', 'sensorlink', 'syncmark', 'soundrace']) {
    await openApp(id);
    const name = await page.$eval('header strong', (node) => node.textContent);
    const src = await page.$eval('img.applogo', (img) => img.getAttribute('src'));
    names.push({ id, name, src });
  }
  if (new Set(names.map((item) => item.name)).size !== 4 || new Set(names.map((item) => item.src)).size !== 4) fail(`Identités non distinctes ${JSON.stringify(names)}`);
  ok('Quatre écrans, quatre noms, quatre logos', names);
  console.log(JSON.stringify({ browser: 'google-chrome headless', base, hardware: 'aucun téléphone ; capteurs simulés par événements DOM ; micro = périphérique factice Chromium s’il a répondu', notes }, null, 2));
} catch (error) {
  console.log(JSON.stringify({ failed: String(error.message || error).split('\n')[0], notes }, null, 2));
  process.exitCode = 1;
} finally {
  await browser.close();
}
