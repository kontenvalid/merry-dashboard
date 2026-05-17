const r = require('https').request({
  hostname: 'api.github.com',
  path: '/repos/kontenvalid/merry-dashboard/contents/prisma/schema.prisma',
  headers: { Accept: 'application/vnd.github.raw', 'User-Agent': 'test' }
}, res => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    require('fs').writeFileSync('schema.prisma', d);
    console.log('done');
  });
  res.on('error', e => console.error(e));
});
r.end();