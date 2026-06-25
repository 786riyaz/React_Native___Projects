Great.
Now look. I dont want to modify any UI part in the current application.
I want some backend related changes. the current react native application is working locally which saves all the activity history in the local database.
but i want to store all this data in the database and thats why i has created a nextjs application which is working perfect for browser usecase.
and here i am providing you the API details of that nextjs application so you can also store and fetch data from the database.

http://localhost:3000/api/history
{"2026-05-30":{"daily":{"Fajr Salah":true,"Technical Learning":true,"Islamic Studies":true,"Work Session 1":true,"Gym Workout (30 min)":true,"Wind Down & Sleep":true,"Asr Salah":true,"Qailulah (Power Nap)":true,"Quran Recitation (15 min)":true,"Car Driving Practice":true,"Breakfast & Freshen Up":true,"Reflection Journaling":false,"Family / Social Time":true},"weekly":{"English Mock Interviews + Programming Revision":true}},"2026-05-29":{"daily":{"Islamic Studies":true,"Asr Salah":true,"Quran Reflection":true,"Car Driving Practice":true,"Fajr Salah":true,"Gym Workout (30 min)":true,"Quran Recitation (15 min)":true,"Breakfast & Freshen Up":true,"Technical Learning":true,"Reflection Journaling":true,"Flexible Learning / Creative Practice / Programming":true,"Work Preparation":true,"Work Session 1":true,"Short Break":true,"Dhuhr Salah":true,"Lunch Break":true,"Qailulah (Power Nap)":true,"Work Session 2":true,"Short Break (Stretch)":true,"Work Session 3":true,"Maghrib Salah":true,"Creative Problem Solving / Reading":true,"Isha Salah":true,"Family / Social Time":true,"Wind Down & Sleep":true},"weekly":{"Programming Projects + Jumu'ah & Islamic Studies":true}},"2026-05-24":{"daily":{"Wind Down & Sleep":true,"Quran Reflection":true,"Family / Social Time":true,"Isha Salah":true,"Creative Problem Solving / Reading":true,"Maghrib Salah":true,"Work Session 3":true,"Asr Salah":true,"Short Break (Stretch)":true,"Work Session 2":true,"Qailulah (Power Nap)":true,"Lunch Break":true,"Dhuhr Salah":true,"Short Break":true,"Work Session 1":true,"Work Preparation":true,"Flexible Learning / Creative Practice / Programming":true,"Reflection Journaling":true,"Islamic Studies":true,"Technical Learning":true,"Breakfast & Freshen Up":true,"Car Driving Practice":true,"Quran Recitation (15 min)":true,"Gym Workout (30 min)":true,"Fajr Salah":true},"weekly":{"Sunday Networking (8:30 PM)":true,"Weekly Diverse Content (8:15 AM Block)":true,"Sunday Habit Tracking (8:00 AM)":true,"Networking / Developer Community":true,"Diverse Content (Podcast / Book)":true,"Habit Tracking Review":true,"Family & Friends + Planning":true}},"2026-06-01":{"daily":{"Fajr Salah":true,"Car Driving Practice":true,"Quran Recitation (15 min)":true,"Gym Workout (30 min)":true},"weekly":{}},"2026-05-31":{"daily":{"Fajr Salah":true,"Gym Workout (30 min)":true,"Quran Recitation (15 min)":true,"Car Driving Practice":true},"weekly":{}}}

http://localhost:3000/api/activities/meta
{}

http://localhost:3000/api/activities
{"daily":["Fajr Salah","Gym Workout (30 min)","Quran Recitation (15 min)","Breakfast & Freshen Up","Car Driving Practice","Technical Learning","Islamic Studies","Reflection Journaling","Flexible Learning / Creative Practice / Programming","Work Preparation","Work Session 1","Short Break","Dhuhr Salah","Lunch Break","Qailulah (Power Nap)","Work Session 2","Short Break (Stretch)","Asr Salah","Work Session 3","Maghrib Salah","Creative Problem Solving / Reading","Isha Salah","Family / Social Time","Quran Reflection","Wind Down & Sleep"],"weekly":[{"name":"Programming Technology + English Grammar","days":["Mon"]},{"name":"Aptitude Practice + Mock Interviews","days":["Tue"]},{"name":"Programming Concepts (New Tech) + Vocabulary","days":["Wed"]},{"name":"Aptitude Tests + Speaking Practice","days":["Thu"]},{"name":"Programming Projects + Jumu'ah & Islamic Studies","days":["Fri"]},{"name":"English Mock Interviews + Programming Revision","days":["Sat"]},{"name":"Family & Friends + Planning","days":["Sun"]},{"name":"Habit Tracking Review","days":["Sun"]},{"name":"Diverse Content (Podcast / Book)","days":["Sun"]},{"name":"Networking / Developer Community","days":["Sun"]},{"name":"Sunday Habit Tracking (8:00 AM)","days":["Sun"]},{"name":"Weekly Diverse Content (8:15 AM Block)","days":["Sun"]},{"name":"Sunday Networking (8:30 PM)","days":["Sun"]}]}

Here are the api related code of next js for your reference.

src/app/api/activities/meta/route.js
import pool from '@/lib/db';

export async function GET() {
try {
const [rows] = await pool.query('SELECT name, category, time_val FROM activity_meta');
const meta = {};
rows.forEach(r => { meta[r.name] = { category: r.category, time: r.time_val }; });
return Response.json(meta);
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

export async function POST(req) {
try {
const meta = await req.json(); // { name: { category, time } }
await pool.query('DELETE FROM activity_meta');
const entries = Object.entries(meta);
if (entries.length) {
const vals = entries.map(([name, v]) => [name, v.category || 'Other / Custom', v.time || '']);
await pool.query('INSERT INTO activity_meta (name, category, time_val) VALUES ?', [vals]);
}
return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

src/app/api/activities/route.js
import pool from '@/lib/db';
import { DEFAULT_DAILY_NAMES, DEFAULT_WEEKLY_ITEMS } from '@/lib/activityConfig';

export async function GET() {
try {
const [rows] = await pool.query('SELECT type, name, days FROM activities ORDER BY id');
const daily = rows.filter(r => r.type === 'daily').map(r => r.name);
const weekly = rows.filter(r => r.type === 'weekly').map(r => ({
name: r.name,
days: typeof r.days === 'string' ? JSON.parse(r.days) : (r.days || []),
}));

// Seed defaults if empty
if (daily.length === 0 && weekly.length === 0) {
const dailyVals = DEFAULT_DAILY_NAMES.map(n => ['daily', n, null]);
const weeklyVals = DEFAULT_WEEKLY_ITEMS.map(w => ['weekly', w.name, JSON.stringify(w.days)]);
if (dailyVals.length)
await pool.query('INSERT IGNORE INTO activities (type, name, days) VALUES ?', [dailyVals]);
if (weeklyVals.length)
await pool.query('INSERT IGNORE INTO activities (type, name, days) VALUES ?', [weeklyVals]);
return Response.json({ daily: DEFAULT_DAILY_NAMES, weekly: DEFAULT_WEEKLY_ITEMS });
}

return Response.json({ daily, weekly });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

export async function POST(req) {
try {
const { daily, weekly } = await req.json();

// Replace all activities
await pool.query('DELETE FROM activities');
const vals = [];
(daily || []).forEach(n => vals.push(['daily', n, null]));
(weekly || []).forEach(w => vals.push(['weekly', w.name, JSON.stringify(w.days || [])]));
if (vals.length)
await pool.query('INSERT INTO activities (type, name, days) VALUES ?', [vals]);

return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

src/app/api/backup/route.js
import pool from '@/lib/db';

export async function GET() {
try {
const [actRows] = await pool.query('SELECT type, name, days FROM activities ORDER BY id');
const [metaRows] = await pool.query('SELECT name, category, time_val FROM activity_meta');
const [histRows] = await pool.query('SELECT date_key, type, name, done FROM activity_history');

const daily = actRows.filter(r => r.type === 'daily').map(r => r.name);
const weekly = actRows.filter(r => r.type === 'weekly').map(r => ({
name: r.name,
days: typeof r.days === 'string' ? JSON.parse(r.days) : (r.days || []),
}));

const customMeta = {};
metaRows.forEach(r => { customMeta[r.name] = { category: r.category, time: r.time_val }; });

const history = {};
histRows.forEach(r => {
if (!history[r.date_key]) history[r.date_key] = { daily: {}, weekly: {} };
history[r.date_key][r.type][r.name] = !!r.done;
});

return Response.json({ activities: { daily, weekly }, customMeta, history, exportedAt: new Date().toISOString() });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

export async function POST(req) {
try {
const { activities, customMeta, history } = await req.json();

// Restore activities
await pool.query('DELETE FROM activities');
const vals = [];
(activities?.daily || []).forEach(n => vals.push(['daily', n, null]));
(activities?.weekly || []).forEach(w => vals.push(['weekly', w.name, JSON.stringify(w.days || [])]));
if (vals.length) await pool.query('INSERT INTO activities (type, name, days) VALUES ?', [vals]);

// Restore meta
await pool.query('DELETE FROM activity_meta');
const metaEntries = Object.entries(customMeta || []);
if (metaEntries.length) {
const metaVals = metaEntries.map(([name, v]) => [name, v.category || 'Other / Custom', v.time || '']);
await pool.query('INSERT INTO activity_meta (name, category, time_val) VALUES ?', [metaVals]);
}

// Restore history
await pool.query('DELETE FROM activity_history');
const histVals = [];
Object.entries(history || {}).forEach(([date, entry]) => {
Object.entries(entry.daily || {}).forEach(([name, done]) => histVals.push([date, 'daily', name, done ? 1 : 0]));
Object.entries(entry.weekly || {}).forEach(([name, done]) => histVals.push([date, 'weekly', name, done ? 1 : 0]));
});
if (histVals.length)
await pool.query('INSERT INTO activity_history (date_key, type, name, done) VALUES ?', [histVals]);

return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

src/app/api/history/route.js
import pool from '@/lib/db';

export async function GET() {
try {
const [rows] = await pool.query(
'SELECT date_key, type, name, done FROM activity_history'
);
// Build { "2025-01-01": { daily: { "Fajr Salah": true }, weekly: {} } }
const history = {};
rows.forEach(r => {
if (!history[r.date_key]) history[r.date_key] = { daily: {}, weekly: {} };
history[r.date_key][r.type][r.name] = !!r.done;
});
return Response.json(history);
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

export async function POST(req) {
try {
const { date, type, name, value } = await req.json();
await pool.query(
`INSERT INTO activity_history (date_key, type, name, done)
VALUES (?, ?, ?, ?)
ON DUPLICATE KEY UPDATE done = VALUES(done)`,
[date, type, name, value ? 1 : 0]
);
return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

src/app/api/todos/[id]/route.js
import pool from '@/lib/db';

export async function PATCH(req, { params }) {
try {
const { id } = await params;
const { completed } = await req.json();
await pool.query('UPDATE todos SET completed = ? WHERE id = ?', [completed ? 1 : 0, id]);
return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

export async function DELETE(req, { params }) {
try {
const { id } = await params;
await pool.query('DELETE FROM todos WHERE id = ?', [id]);
return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

src/app/api/todos/route.js
import pool from '@/lib/db';

export async function GET() {
try {
const [rows] = await pool.query('SELECT id, task, category, completed, created_at FROM todos ORDER BY id');
const todos = rows.map(r => ({ ...r, completed: !!r.completed }));
return Response.json(todos);
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

export async function POST(req) {
try {
const { id, task, category, completed, createdAt } = await req.json();
await pool.query(
'INSERT INTO todos (id, task, category, completed, created_at) VALUES (?, ?, ?, ?, ?)',
[id, task, category, completed ? 1 : 0, createdAt]
);
return Response.json({ ok: true });
} catch (e) {
return Response.json({ error: e.message }, { status: 500 });
}
}

let me know if you want anything from myside.
and give me compelte fixed code file so i can replace in my react native application to achive this database storage feature.
and the next js application should not break and the database for both the application will be same so i can do my tracking from mobile and web both.API
keep your code file concise and crisp at the same time using less tokens so we can talk more and more.

I have also tried to do this but facing many errors, I have given reference below. and the generated APK was not working in the mobile ultimately.
so please give me complete solutions with implemented feature to generate the APK file.
