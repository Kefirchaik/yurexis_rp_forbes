export function makeQuery(env = process.env) {
 const mode = env.BANK_MODE || 'both';
 if (!['both','accounts','separate'].includes(mode)) throw new Error('Invalid BANK_MODE');
 const bank = mode === 'separate' ? '0' : 'COALESCE(a.bank,0)';
 const separate = mode === 'accounts' ? '0' : 'COALESCE(b.balance,0)';
 const business = env.INCLUDE_BUSINESS_BALANCES === 'false' ? '0' : 'COALESCE(z.balance,0)+COALESCE(f.balance,0)';
 return `SELECT a.id,a.name,a.level,COALESCE(a.money,0) AS cash,${bank} AS bank,
 ${separate} AS deposits,${business} AS business,
 COALESCE(a.money,0)+${bank}+${separate}+${business} AS total,
 COALESCE(h.houses,0) AS houses,COALESCE(h.value,0) AS houseValue,
 COALESCE(z.businesses,0)+COALESCE(f.stations,0) AS businesses,
 COALESCE(c.cars,0) AS cars
 FROM accounts a
 LEFT JOIN (SELECT uid,SUM(balance) balance FROM bank_accounts GROUP BY uid) b ON b.uid=a.id
 LEFT JOIN (SELECT owner_id,SUM(balance) balance,COUNT(*) businesses FROM business WHERE owner_id>0 GROUP BY owner_id) z ON z.owner_id=a.id
 LEFT JOIN (SELECT owner_id,SUM(balance) balance,COUNT(*) stations FROM fuel_stations WHERE owner_id>0 GROUP BY owner_id) f ON f.owner_id=a.id
 LEFT JOIN (SELECT owner_id,COUNT(*) houses,SUM(price) value FROM houses WHERE owner_id>0 GROUP BY owner_id) h ON h.owner_id=a.id
 LEFT JOIN (SELECT owner_id,COUNT(*) cars FROM ownable_cars WHERE owner_id>0 GROUP BY owner_id) c ON c.owner_id=a.id
 WHERE a.id>0 ${env.EXCLUDE_ADMINS === 'true' ? 'AND a.admin=0' : ''}
 ORDER BY total DESC,a.id ASC`;
}
