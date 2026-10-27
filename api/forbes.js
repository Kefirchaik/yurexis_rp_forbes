import mysql from 'mysql2/promise';
import { makeQuery } from '../lib/query.js';
let pool;
export default async function handler(req,res) {
 if(req.method!=='GET') return res.status(405).json({error:'Метод не поддерживается'});
 if(!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE)
   return res.status(503).json({error:'Подключение к базе ещё не настроено. Укажите MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD и MYSQL_DATABASE в Vercel.'});
 try {
  pool ||= mysql.createPool({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,charset:'utf8mb4',ssl:process.env.MYSQL_SSL==='false'?undefined:{rejectUnauthorized:true},connectionLimit:2,waitForConnections:true,queueLimit:10,connectTimeout:8000});
  const [rows]=await pool.query({sql:makeQuery(),timeout:12000});
  const players=rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,k==='name'?v:Number(v)])));
  res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=30');
  return res.status(200).json({source:'live',updatedAt:new Date().toISOString(),bankMode:process.env.BANK_MODE||'both',players});
 } catch(e) {
  console.error('Forbes database error:',e.code||e.name);
  return res.status(503).json({error:'База данных временно недоступна. Проверьте подключение и права чтения таблиц.'});
 }
}
