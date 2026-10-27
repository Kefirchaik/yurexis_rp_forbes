import mysql from 'mysql2/promise';
import { makeQuery } from '../lib/query.js';
let pool;
export default async function handler(req,res) {
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET') return res.status(405).json({error:'Метод не поддерживается'});
 if(!process.env.MYSQL_HOST || !process.env.MYSQL_USER || !process.env.MYSQL_DATABASE)
   return res.status(503).json({code:'DB_NOT_CONFIGURED',error:'Подключение к базе данных не настроено.'});
 try {
  pool ||= mysql.createPool({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT||3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,charset:'utf8mb4',ssl:process.env.MYSQL_SSL==='false'?undefined:{rejectUnauthorized:true},connectionLimit:2,waitForConnections:true,queueLimit:10,connectTimeout:8000});
  const [rows]=await pool.query({sql:makeQuery(),timeout:12000});
  const players=rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k,k==='name'?v:Number(v)])));
  res.setHeader('Cache-Control','public, s-maxage=30, stale-while-revalidate=30');
  return res.status(200).json({source:'live',updatedAt:new Date().toISOString(),bankMode:process.env.BANK_MODE||'both',players});
 } catch(e) {
  console.error('Forbes database error:',e.code||e.name);
  const known={
   ER_ACCESS_DENIED_ERROR:'DB_ACCESS_DENIED',
   ER_DBACCESS_DENIED_ERROR:'DB_ACCESS_DENIED',
   ER_BAD_DB_ERROR:'DB_DATABASE_NOT_FOUND',
   ER_NO_SUCH_TABLE:'DB_TABLE_NOT_FOUND',
   ER_BAD_FIELD_ERROR:'DB_SCHEMA_MISMATCH',
   ENOTFOUND:'DB_HOST_NOT_FOUND',
   EAI_AGAIN:'DB_HOST_NOT_FOUND',
   ECONNREFUSED:'DB_CONNECTION_REFUSED',
   ETIMEDOUT:'DB_CONNECTION_TIMEOUT',
   HANDSHAKE_SSL_ERROR:'DB_TLS_ERROR',
   HANDSHAKE_NO_SSL_SUPPORT:'DB_TLS_UNSUPPORTED',
   DEPTH_ZERO_SELF_SIGNED_CERT:'DB_TLS_CERTIFICATE',
   SELF_SIGNED_CERT_IN_CHAIN:'DB_TLS_CERTIFICATE',
   UNABLE_TO_VERIFY_LEAF_SIGNATURE:'DB_TLS_CERTIFICATE',
   ER_QUERY_TIMEOUT:'DB_QUERY_TIMEOUT'
  };
  return res.status(503).json({code:known[e.code]||'DB_UNAVAILABLE',error:'База данных временно недоступна.'});
 }
}
