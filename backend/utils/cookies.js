function envBoolean(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === '') return fallback;
  return value.toLowerCase() === 'true';
}

function cookieSameSite() {
  const value = (process.env.COOKIE_SAME_SITE || 'lax').toLowerCase();
  if (['strict', 'lax', 'none'].includes(value)) return value;
  return 'lax';
}

function cookieSecure() {
  return envBoolean('COOKIE_SECURE', process.env.NODE_ENV === 'production');
}

function baseCookieOptions() {
  const options = {
    sameSite: cookieSameSite(),
    secure: cookieSecure(),
    path: '/',
  };

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN;
  }

  return options;
}

module.exports = {
  baseCookieOptions,
  cookieSameSite,
  cookieSecure,
};
