const { PrismaClient } = require('@prisma/client');

(async function main(){
  const p = new PrismaClient();
  try {
    const n = await p.reservation.count();
    console.log('reservations:', n);
  } catch(e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
