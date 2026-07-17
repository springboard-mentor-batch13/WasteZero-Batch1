/**
 * Full Verification Script — All APIs, Socket Events, Security
 * Run: node _verify_all.js
 * Server must be running on port 3000
 */

const http = require('http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { io } = require('socket.io-client');
require('dotenv').config();

const BASE = 'http://localhost:3000';
const API = `${BASE}/api/v1`;

let passed = 0;
let failed = 0;
let total = 0;
const failures = [];

function assert(condition, testName, details = '') {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✅ ${testName}`);
  } else {
    failed++;
    const msg = `  ❌ ${testName}${details ? ' — ' + details : ''}`;
    console.log(msg);
    failures.push(msg);
  }
}

async function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const fullPath = new URL(API + path);
    const options = {
      hostname: fullPath.hostname,
      port: fullPath.port,
      path: fullPath.pathname + fullPath.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function reqRaw(method, urlStr, body, token) {
  return new Promise((resolve, reject) => {
    const fullPath = new URL(urlStr);
    const options = {
      hostname: fullPath.hostname,
      port: fullPath.port,
      path: fullPath.pathname + fullPath.search,
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const r = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    r.on('error', reject);
    if (body) r.write(JSON.stringify(body));
    r.end();
  });
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for verification\n');

  console.log('='.repeat(60));
  console.log('  FULL VERIFICATION — WasteZero Backend');
  console.log('='.repeat(60));

  // ─── 1. HEALTH CHECK ───
  console.log('\n── 1. HEALTH CHECK ──');
  {
    const r = await reqRaw('GET', `${BASE}/health`);
    assert(r.status === 200, 'GET /health → 200');
    assert(r.body.success === true, 'Health success = true');
    assert(r.body.data.status === 'UP', 'Health status = UP');
  }

  // ─── 2. AUTH APIs ───
  console.log('\n── 2. AUTH APIs ──');

  const testEmail = `verify_${Date.now()}@test.com`;
  const testPassword = 'Test@1234';
  let accessToken, refreshToken, userId;

  // 2.1 Register
  console.log('\n  [2.1] Register');
  {
    const r = await req('POST', '/auth/register', {
      name: 'Verify User',
      email: testEmail,
      password: testPassword,
      role: 'volunteer'
    });
    assert(r.status === 201, 'Register → 201');
    assert(r.body.success === true, 'Register success = true');
    assert(r.body.data.accessToken, 'Register returns accessToken');
    assert(r.body.data.refreshToken, 'Register returns refreshToken');
    assert(r.body.data.user, 'Register returns user');
    assert(r.body.data.user.email === testEmail, 'Email matches');
    assert(r.body.data.user.role === 'volunteer', 'Role matches');
    assert(!r.body.data.user.password, 'Password not returned');
    accessToken = r.body.data.accessToken;
    refreshToken = r.body.data.refreshToken;
    userId = r.body.data.user.id;
  }

  // 2.2 Duplicate Register
  console.log('\n  [2.2] Duplicate Register');
  {
    const r = await req('POST', '/auth/register', {
      name: 'Verify User',
      email: testEmail,
      password: testPassword,
      role: 'volunteer'
    });
    assert(r.status === 409, 'Duplicate register → 409');
    assert(r.body.success === false, 'Duplicate success = false');
  }

  // 2.3 Register — invalid input
  console.log('\n  [2.3] Register — Invalid Input');
  {
    const r = await req('POST', '/auth/register', { name: '', email: 'bad', password: '123' });
    assert(r.status === 400, 'Invalid register → 400');
    assert(r.body.success === false, 'Invalid register success = false');
  }

  // 2.4 Auto-verify email for test
  console.log('\n  [2.4] Auto-Verify Email (test setup)');
  {
    const User = require('./src/models/User');
    const updated = await User.findOneAndUpdate(
      { email: testEmail },
      { isEmailVerified: true },
      { returnDocument: 'after' }
    );
    assert(!!updated, 'User found and updated in DB');
    assert(updated.isEmailVerified === true, 'isEmailVerified = true');
  }

  // 2.5 Login
  console.log('\n  [2.5] Login');
  {
    const r = await req('POST', '/auth/login', { email: testEmail, password: testPassword });
    assert(r.status === 200, 'Login → 200');
    assert(r.body.success === true, 'Login success = true');
    assert(r.body.data.accessToken, 'Login returns accessToken');
    assert(r.body.data.refreshToken, 'Login returns refreshToken');
    accessToken = r.body.data.accessToken;
    refreshToken = r.body.data.refreshToken;
  }

  // 2.6 Login — wrong password
  console.log('\n  [2.6] Login — Wrong Password');
  {
    const r = await req('POST', '/auth/login', { email: testEmail, password: 'WrongPass@1234' });
    assert(r.status === 401, 'Wrong password → 401');
    assert(r.body.success === false, 'Wrong password success = false');
  }

  // 2.7 Login — nonexistent user
  console.log('\n  [2.7] Login — Nonexistent User');
  {
    const r = await req('POST', '/auth/login', { email: 'noexist@test.com', password: 'Test@1234' });
    assert(r.status === 401, 'Nonexistent → 401');
  }

  // 2.8 Verify Email (already verified — should still work or return informative message)
  console.log('\n  [2.8] Verify Email');
  {
    const r = await req('POST', '/auth/verify-email', { email: testEmail, otp: '123456' });
    assert(r.status === 200 || r.status === 400, 'Verify email → 200 or 400 (already verified)');
  }

  // 2.9 Resend OTP
  console.log('\n  [2.9] Resend OTP');
  {
    const r = await req('POST', '/auth/resend-otp', { email: testEmail });
    assert(r.status === 200 || r.status === 429, 'Resend OTP → 200 or 429');
    if (r.status === 200) assert(r.body.success === true, 'Resend OTP success = true');
  }

  // 2.10 Forgot Password
  console.log('\n  [2.10] Forgot Password');
  {
    const r = await req('POST', '/auth/forgot-password', { email: testEmail });
    assert(r.status === 200, 'Forgot password → 200');
    assert(r.body.success === true, 'Forgot password success = true');
  }

  // 2.11 Forgot Password — nonexistent email
  console.log('\n  [2.11] Forgot Password — Nonexistent Email');
  {
    const r = await req('POST', '/auth/forgot-password', { email: 'noexist@test.com' });
    assert(r.status === 200, 'Forgot password nonexistent → 200 (no email enumeration)');
  }

  // 2.12 Reset Password — invalid OTP
  console.log('\n  [2.12] Reset Password — Invalid OTP');
  {
    const r = await req('POST', '/auth/reset-password', {
      email: testEmail,
      otp: '000000',
      password: 'NewPass@1234'
    });
    assert(r.status === 400 || r.status === 401, 'Reset password invalid OTP → 400/401');
  }

  // 2.13 Refresh Token
  console.log('\n  [2.13] Refresh Token');
  {
    const r = await req('POST', '/auth/refresh-token', { refreshToken });
    assert(r.status === 200, 'Refresh token → 200');
    assert(r.body.success === true, 'Refresh success = true');
    assert(r.body.data.accessToken, 'New accessToken returned');
    assert(r.body.data.refreshToken, 'New refreshToken returned (rotation)');
    const rOld = await req('POST', '/auth/refresh-token', { refreshToken });
    assert(rOld.status === 401, 'Old refresh token revoked → 401');
    accessToken = r.body.data.accessToken;
    refreshToken = r.body.data.refreshToken;
  }

  // 2.14 Get Session
  console.log('\n  [2.14] Get Session');
  {
    const r = await req('GET', '/auth/session', null, accessToken);
    assert(r.status === 200, 'Get session → 200');
    assert(r.body.success === true, 'Session success = true');
    assert(r.body.data.user, 'Session returns user');
    assert(typeof r.body.data.session?.expiresInMinutes === 'number', 'Session has expiresInMinutes');
  }

  // 2.15 Get Session — no token
  console.log('\n  [2.15] Get Session — No Token');
  {
    const r = await req('GET', '/auth/session');
    assert(r.status === 401, 'No token → 401');
  }

  // 2.16 Logout (requires refreshToken in body)
  console.log('\n  [2.16] Logout');
  {
    const r = await req('POST', '/auth/logout', { refreshToken }, accessToken);
    assert(r.status === 200, 'Logout → 200');
    assert(r.body.success === true, 'Logout success = true');
    const login = await req('POST', '/auth/login', { email: testEmail, password: testPassword });
    accessToken = login.body.data.accessToken;
    refreshToken = login.body.data.refreshToken;
  }

  // 2.17 Logout All
  console.log('\n  [2.17] Logout All');
  {
    const r = await req('POST', '/auth/logout-all', null, accessToken);
    assert(r.status === 200, 'Logout all → 200');
    assert(r.body.success === true, 'Logout all success = true');
    assert(typeof r.body.data.revokedSessions === 'number', 'Returns revokedSessions count');
    const rOld = await req('POST', '/auth/refresh-token', { refreshToken });
    assert(rOld.status === 401, 'All tokens revoked → 401 on refresh');
  }

  // Re-login for subsequent tests
  {
    const login = await req('POST', '/auth/login', { email: testEmail, password: testPassword });
    accessToken = login.body.data.accessToken;
    refreshToken = login.body.data.refreshToken;
  }

  // ─── 3. OPPORTUNITY MODULE ───
  console.log('\n── 3. OPPORTUNITY MODULE ──');

  let ngoToken, ngoRefreshToken;
  const ngoEmail = `ngo_verify_${Date.now()}@test.com`;

  console.log('\n  [3.0] Create NGO User');
  {
    const r = await req('POST', '/auth/register', {
      name: 'Verify NGO',
      email: ngoEmail,
      password: testPassword,
      role: 'ngo'
    });
    assert(r.status === 201, 'NGO register → 201');
    const User = require('./src/models/User');
    await User.findOneAndUpdate({ email: ngoEmail }, { isEmailVerified: true }, { returnDocument: 'after' });
    const login = await req('POST', '/auth/login', { email: ngoEmail, password: testPassword });
    ngoToken = login.body.data.accessToken;
    ngoRefreshToken = login.body.data.refreshToken;
  }

  let oppId;
  // 3.1 Create Opportunity
  console.log('\n  [3.1] Create Opportunity');
  {
    const r = await req('POST', '/opportunities', {
      title: 'Beach Cleanup Drive',
      description: 'Join us for a community beach cleanup',
      location: { city: 'Mumbai', state: 'Maharashtra', country: 'India' },
      duration: { value: 4, unit: 'hours' },
      required_skills: ['teamwork', 'physical fitness']
    }, ngoToken);
    assert(r.status === 201, 'Create opportunity → 201');
    assert(r.body.success === true, 'Create success = true');
    assert(r.body.data.opportunity.title === 'Beach Cleanup Drive', 'Title correct');
    assert(r.body.data.opportunity.status === 'OPEN', 'Default status = OPEN');
    oppId = r.body.data.opportunity._id;
  }

  // 3.2 Create — volunteer RBAC
  console.log('\n  [3.2] Create Opportunity — Volunteer (RBAC)');
  {
    const r = await req('POST', '/opportunities', {
      title: 'Volunteer cannot create',
      description: 'Test',
      location: { city: 'Mumbai', state: 'MH', country: 'India' },
      duration: { value: 1, unit: 'hours' }
    }, accessToken);
    assert(r.status === 403, 'Volunteer create → 403');
  }

  // 3.3 List Opportunities
  console.log('\n  [3.3] List Opportunities');
  {
    const r = await req('GET', '/opportunities', null, accessToken);
    assert(r.status === 200, 'List → 200');
    assert(r.body.success === true, 'List success = true');
    assert(Array.isArray(r.body.data.opportunities), 'Data.opportunities is array');
    assert(r.body.data.opportunities.length >= 1, 'At least 1 opportunity');
  }

  // 3.4 List with pagination
  console.log('\n  [3.4] List — Pagination');
  {
    const r = await req('GET', '/opportunities?page=1&limit=5', null, accessToken);
    assert(r.status === 200, 'Paginated list → 200');
    assert(r.body.data.pagination, 'Has pagination object');
    assert(r.body.data.pagination.page === 1, 'Page = 1');
    assert(r.body.data.pagination.limit === 5, 'Limit = 5');
  }

  // 3.5 Get by ID
  console.log('\n  [3.5] Get Opportunity by ID');
  {
    const r = await req('GET', `/opportunities/${oppId}`, null, accessToken);
    assert(r.status === 200, 'Get by ID → 200');
    assert(r.body.data.opportunity._id === oppId, 'Correct opportunity returned');
  }

  // 3.6 Get by invalid ID
  console.log('\n  [3.6] Get — Invalid ID');
  {
    const r = await req('GET', '/opportunities/invalid123', null, accessToken);
    assert(r.status === 400, 'Invalid ID → 400');
  }

  // 3.7 Update Opportunity
  console.log('\n  [3.7] Update Opportunity');
  {
    const r = await req('PUT', `/opportunities/${oppId}`, {
      title: 'Beach Cleanup Drive - Updated',
      description: 'Updated description'
    }, ngoToken);
    assert(r.status === 200, 'Update → 200');
    assert(r.body.data.opportunity.title === 'Beach Cleanup Drive — Updated', 'Title updated');
  }

  // 3.8 Status Change
  console.log('\n  [3.8] Status Change');
  {
    const r = await req('PATCH', `/opportunities/${oppId}/status`, {
      status: 'IN_PROGRESS'
    }, ngoToken);
    assert(r.status === 200, 'Status change → 200');
    assert(r.body.data.opportunity.status === 'IN_PROGRESS', 'Status = IN_PROGRESS');
  }

  // 3.9 Status Change — invalid transition
  console.log('\n  [3.9] Status Change — Invalid Transition');
  {
    const r = await req('PATCH', `/opportunities/${oppId}/status`, {
      status: 'OPEN'
    }, ngoToken);
    assert(r.status === 400 || r.status === 403, 'Invalid transition → 400/403');
  }

  // 3.10 Delete Opportunity
  console.log('\n  [3.10] Delete Opportunity');
  {
    const r = await req('DELETE', `/opportunities/${oppId}`, null, ngoToken);
    assert(r.status === 200, 'Delete → 200');
    assert(r.body.success === true, 'Delete success = true');
    const rGet = await req('GET', `/opportunities/${oppId}`, null, accessToken);
    assert(rGet.status === 404, 'Deleted opportunity → 404 on GET');
  }

  // ─── 4. MESSAGING REST APIs ───
  console.log('\n── 4. MESSAGING REST APIs ──');

  let userBToken, userBRefreshToken;
  const userBEmail = `userb_${Date.now()}@test.com`;

  {
    const r = await req('POST', '/auth/register', {
      name: 'User B',
      email: userBEmail,
      password: testPassword,
      role: 'volunteer'
    });
    assert(r.status === 201, 'UserB register → 201');
    const User = require('./src/models/User');
    await User.findOneAndUpdate({ email: userBEmail }, { isEmailVerified: true }, { returnDocument: 'after' });
    const login = await req('POST', '/auth/login', { email: userBEmail, password: testPassword });
    userBToken = login.body.data.accessToken;
    userBRefreshToken = login.body.data.refreshToken;
  }

  // Insert a test message
  {
    const Message = require('./src/models/Message');
    const decodedA = jwt.decode(accessToken);
    const decodedB = jwt.decode(userBToken);
    await Message.create({
      sender: decodedA.id,
      receiver: decodedB.id,
      content: 'Test message for REST API verification'
    });
  }

  // 4.1 Get Messages
  console.log('\n  [4.1] Get Messages — Chat History');
  {
    const decodedB = jwt.decode(userBToken);
    const r = await req('GET', `/messages/${decodedB.id}`, null, accessToken);
    assert(r.status === 200, 'Get messages → 200');
    assert(r.body.success === true, 'Success = true');
    assert(Array.isArray(r.body.data), 'Data is array');
    assert(r.body.pagination, 'Has pagination');
    assert(r.body.data.length >= 1, 'At least 1 message');
  }

  // 4.2 Get Messages — invalid userId
  console.log('\n  [4.2] Get Messages — Invalid userId');
  {
    const r = await req('GET', '/messages/invalid123', null, accessToken);
    assert(r.status === 400, 'Invalid userId → 400');
  }

  // 4.3 Get Messages — no auth
  console.log('\n  [4.3] Get Messages — No Auth');
  {
    const decodedB = jwt.decode(userBToken);
    const r = await req('GET', `/messages/${decodedB.id}`);
    assert(r.status === 401, 'No auth → 401');
  }

  // 4.4 Get Messages — pagination
  console.log('\n  [4.4] Get Messages — Pagination');
  {
    const decodedB = jwt.decode(userBToken);
    const r = await req('GET', `/messages/${decodedB.id}?page=1&limit=1`, null, accessToken);
    assert(r.status === 200, 'Paginated messages → 200');
    assert(r.body.pagination.page === 1, 'Page = 1');
    assert(r.body.pagination.limit === 1, 'Limit = 1');
  }

  // 4.5 Get Conversations
  console.log('\n  [4.5] Get Conversations');
  {
    const r = await req('GET', '/conversations', null, accessToken);
    assert(r.status === 200, 'Get conversations → 200');
    assert(r.body.success === true, 'Success = true');
    assert(Array.isArray(r.body.data), 'Data is array');
    assert(r.body.pagination, 'Has pagination');
    if (r.body.data.length > 0) {
      assert(r.body.data[0].partnerName, 'Has partnerName');
      assert(r.body.data[0].partnerRole, 'Has partnerRole');
      assert(r.body.data[0].lastMessage, 'Has lastMessage');
    }
  }

  // 4.6 Get Conversations — no auth
  console.log('\n  [4.6] Get Conversations — No Auth');
  {
    const r = await req('GET', '/conversations');
    assert(r.status === 401, 'No auth → 401');
  }

  // ─── 5. NOTIFICATION MODULE ───
  console.log('\n── 5. NOTIFICATION MODULE ──');

  let testNotifId;
  {
    const Notification = require('./src/models/Notification');
    const decodedB = jwt.decode(userBToken);
    const decodedA = jwt.decode(accessToken);
    const notif = await Notification.create({
      receiver: decodedB.id,
      sender: decodedA.id,
      type: 'NEW_MESSAGE',
      title: 'Test Notification',
      message: 'Verification test notification'
    });
    testNotifId = notif._id;
  }

  // 5.1 Get Notifications
  console.log('\n  [5.1] Get Notifications');
  {
    const r = await req('GET', '/notifications', null, userBToken);
    assert(r.status === 200, 'Get notifications → 200');
    assert(r.body.success === true, 'Success = true');
    assert(Array.isArray(r.body.data), 'Data is array');
  }

  // 5.2 Get Unread Count
  console.log('\n  [5.2] Get Unread Count');
  {
    const r = await req('GET', '/notifications/unread-count', null, userBToken);
    assert(r.status === 200, 'Unread count → 200');
    assert(typeof r.body.data.count === 'number', 'Has count number');
    assert(r.body.data.count >= 1, 'Count >= 1');
  }

  // 5.3 Mark As Read
  console.log('\n  [5.3] Mark As Read');
  {
    const r = await req('PATCH', `/notifications/${testNotifId}/read`, null, userBToken);
    assert(r.status === 200, 'Mark read → 200');
    assert(r.body.success === true, 'Success = true');
  }

  // 5.4 Unread count after read
  console.log('\n  [5.4] Unread Count After Read');
  {
    const r = await req('GET', '/notifications/unread-count', null, userBToken);
    assert(r.status === 200, 'Unread count → 200');
    assert(r.body.data.count === 0, 'Count = 0 after marking read');
  }

  // 5.5 Mark All Read
  console.log('\n  [5.5] Mark All Read');
  {
    const Notification = require('./src/models/Notification');
    const decodedB = jwt.decode(userBToken);
    const decodedA = jwt.decode(accessToken);
    await Notification.create({
      receiver: decodedB.id,
      sender: decodedA.id,
      type: 'SYSTEM',
      title: 'System Alert',
      message: 'Test system notification'
    });
    const r = await req('PATCH', '/notifications/read-all', null, userBToken);
    assert(r.status === 200, 'Mark all read → 200');
    assert(r.body.success === true, 'Success = true');
  }

  // 5.6 Delete Notification
  console.log('\n  [5.6] Delete Notification');
  {
    const r = await req('DELETE', `/notifications/${testNotifId}`, null, userBToken);
    assert(r.status === 200, 'Delete notification → 200');
  }

  // 5.7 Ownership — cannot delete other user's notification
  console.log('\n  [5.7] Delete — Ownership Check');
  {
    const Notification = require('./src/models/Notification');
    const decodedB = jwt.decode(userBToken);
    const decodedA = jwt.decode(accessToken);
    const notif = await Notification.create({
      receiver: decodedB.id,
      sender: decodedA.id,
      type: 'SYSTEM',
      title: 'Ownership Test',
      message: 'Cannot delete this'
    });
    const r = await req('DELETE', `/notifications/${notif._id}`, null, accessToken);
    assert(r.status === 403 || r.status === 404, 'Delete other user notification → 403/404');
  }

  // ─── 6. PROFILE APIs ───
  console.log('\n── 6. PROFILE APIs ──');

  console.log('\n  [6.1] Get Profile');
  {
    const r = await req('GET', '/users/profile', null, accessToken);
    assert(r.status === 200, 'Get profile → 200');
    assert(r.body.data.user.email === testEmail, 'Correct user returned');
  }

  console.log('\n  [6.2] Update Profile');
  {
    const r = await req('PUT', '/users/profile', { name: 'Updated Verify User' }, accessToken);
    assert(r.status === 200, 'Update profile → 200');
    assert(r.body.data.user.name === 'Updated Verify User', 'Name updated');
  }

  console.log('\n  [6.3] Role Escalation Blocked');
  {
    const r = await req('PUT', '/users/profile', { role: 'admin' }, accessToken);
    assert(r.status === 400, 'Role escalation → 400');
  }

  console.log('\n  [6.4] Email Change Blocked');
  {
    const r = await req('PUT', '/users/profile', { email: 'hacked@test.com' }, accessToken);
    assert(r.status === 400, 'Email change → 400');
  }

  console.log('\n  [6.5] Profile — No Auth');
  {
    const r = await req('GET', '/users/profile');
    assert(r.status === 401, 'No auth → 401');
  }

  // ─── 7. SECURITY VERIFICATION ───
  console.log('\n── 7. SECURITY VERIFICATION ──');

  console.log('\n  [7.1] Helmet Headers');
  {
    const r = await reqRaw('GET', `${BASE}/health`);
    assert(r.headers['x-content-type-options'] === 'nosniff', 'X-Content-Type-Options: nosniff');
    assert(!!r.headers['x-frame-options'], 'X-Frame-Options present');
    assert(!!r.headers['content-security-policy'], 'CSP header present');
  }

  console.log('\n  [7.2] 404 Handling');
  {
    const r = await req('GET', '/nonexistent');
    assert(r.status === 404, 'Nonexistent route → 404');
    assert(r.body.success === false, '404 success = false');
  }

  console.log('\n  [7.3] Rate Limit Headers');
  {
    const r = await reqRaw('GET', `${BASE}/health`);
    assert(r.headers['ratelimit-remaining'] !== undefined, 'RateLimit-Remaining header present');
  }

  console.log('\n  [7.4] Invalid ObjectId');
  {
    const r = await req('GET', '/opportunities/999999999999999999999999', null, accessToken);
    assert(r.status === 400 || r.status === 404, 'Invalid ObjectId → 400/404');
  }

  console.log('\n  [7.5] JWT — Expired Token');
  {
    const expiredToken = jwt.sign({ userId, role: 'volunteer' }, process.env.JWT_SECRET, { expiresIn: '0s' });
    const r = await req('GET', '/users/profile', null, expiredToken);
    assert(r.status === 401, 'Expired token → 401');
  }

  console.log('\n  [7.6] JWT — Invalid Secret');
  {
    const fakeToken = jwt.sign({ userId, role: 'volunteer' }, 'wrong-secret');
    const r = await req('GET', '/users/profile', null, fakeToken);
    assert(r.status === 401, 'Invalid secret → 401');
  }

  // ─── 8. SOCKET.IO VERIFICATION ───
  console.log('\n── 8. SOCKET.IO VERIFICATION ──');

  await new Promise((resolve) => {
    const decodedA = jwt.decode(accessToken);
    const decodedB = jwt.decode(userBToken);
    let socketA, socketB;
    const events = {};

    const cleanup = () => {
      if (socketA) socketA.disconnect();
      if (socketB) socketB.disconnect();
      setTimeout(resolve, 500);
    };

    socketA = io(BASE, { auth: { token: accessToken }, transports: ['websocket'] });

    socketA.on('connect', () => {
      assert(true, 'UserA connected');

      socketB = io(BASE, { auth: { token: userBToken }, transports: ['websocket'] });

      socketB.on('connect', () => {
        assert(true, 'UserB connected');
        setTimeout(runSocketTests, 1000);
      });

      socketB.on('connect_error', (err) => {
        assert(false, `UserB connect error: ${err.message}`);
        cleanup();
      });
    });

    socketA.on('connect_error', (err) => {
      assert(false, `UserA connect error: ${err.message}`);
      cleanup();
    });

    async function runSocketTests() {
      socketB.on('receiveMessage', (msg) => { events.receiveMessage = msg; });
      socketB.on('typing', (data) => { events.typing = data; });
      socketB.on('stopTyping', (data) => { events.stopTyping = data; });

      socketA.emit('sendMessage', {
        receiver: decodedB.id,
        content: 'Socket verification test'
      }, (response) => {
        assert(response.success === true, 'sendMessage callback success = true');
        assert(response.message.content === 'Socket verification test', 'Message content correct');
        assert(response.message.sender === decodedA.id, 'Message sender correct');
        assert(response.message.receiver === decodedB.id, 'Message receiver correct');

        setTimeout(() => {
          assert(!!events.receiveMessage, 'receiveMessage event received by UserB');

          socketA.emit('typing', { receiver: decodedB.id });
          setTimeout(() => {
            assert(!!events.typing, 'typing event received by UserB');

            socketA.emit('stopTyping', { receiver: decodedB.id });
            setTimeout(() => {
              assert(!!events.stopTyping, 'stopTyping event received by UserB');

              socketA.emit('sendMessage', { content: 'no receiver' }, (resp) => {
                assert(resp.success === false, 'Invalid payload → callback error');
                cleanup();
              });
            }, 300);
          }, 300);
        }, 500);
      });
    }
  });

  // ─── 9. DATABASE VERIFICATION ───
  console.log('\n── 9. DATABASE VERIFICATION ──');
  {
    const collections = await mongoose.connection.db.listCollections();
    const collNames = collections.map(c => c.name);

    assert(collNames.includes('users'), 'Collection: users exists');
    assert(collNames.includes('opportunities'), 'Collection: opportunities exists');
    assert(collNames.includes('applications'), 'Collection: applications exists');
    assert(collNames.includes('messages'), 'Collection: messages exists');
    assert(collNames.includes('notifications'), 'Collection: notifications exists');
    assert(collNames.includes('refreshtokens'), 'Collection: refreshtokens exists');
    assert(collNames.includes('adminlogs'), 'Collection: adminlogs exists');

    const User = require('./src/models/User');
    const userIndexes = await User.collection.indexes();
    assert(userIndexes.length >= 3, `Users has ${userIndexes.length} indexes (≥3)`);
    const emailIndex = userIndexes.find(i => i.key.email);
    assert(!!emailIndex, 'Users email index exists');
    assert(emailIndex.unique === true, 'Users email index is unique');

    const Message = require('./src/models/Message');
    const msgIndexes = await Message.collection.indexes();
    assert(msgIndexes.length >= 3, `Messages has ${msgIndexes.length} indexes (≥3)`);

    const Notification = require('./src/models/Notification');
    const notifIndexes = await Notification.collection.indexes();
    assert(notifIndexes.length >= 2, `Notifications has ${notifIndexes.length} indexes (≥2)`);

    const userCount = await User.countDocuments();
    assert(userCount >= 3, `Users collection: ${userCount} documents (≥3 test users)`);

    const msgCount = await Message.countDocuments();
    assert(msgCount >= 1, `Messages collection: ${msgCount} documents (≥1 test message)`);
  }

  // ─── SUMMARY ───
  console.log('\n' + '='.repeat(60));
  console.log(`  VERIFICATION COMPLETE`);
  console.log('='.repeat(60));
  console.log(`  Total: ${total}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log('='.repeat(60));

  if (failures.length > 0) {
    console.log('\n  FAILURES:');
    failures.forEach(f => console.log(f));
  }

  console.log('\n  Cleaning up test data...');
  const User = require('./src/models/User');
  const Message = require('./src/models/Message');
  const Notification = require('./src/models/Notification');
  const RefreshToken = require('./src/models/RefreshToken');

  const testUsers = await User.find({ email: { $regex: /^(verify_|ngo_verify_|userb_)/ } });
  const testUserIds = testUsers.map(u => u._id);
  await Message.deleteMany({ $or: [{ sender: { $in: testUserIds } }, { receiver: { $in: testUserIds } }] });
  await Notification.deleteMany({ receiver: { $in: testUserIds } });
  await RefreshToken.deleteMany({ user: { $in: testUserIds } });
  await User.deleteMany({ _id: { $in: testUserIds } });
  console.log(`  Cleaned ${testUserIds.length} test users + related data\n`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Verification script error:', err);
  process.exit(1);
});
