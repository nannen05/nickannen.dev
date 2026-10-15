import { json, runDueSteps } from "../_outreach.mjs";
export default async function handler(req,res) { if(req.headers.authorization!==`Bearer ${process.env.CRON_SECRET}`) return json(res,401,{error:"Unauthorized"}); try{return json(res,200,{claimed:await runDueSteps()});}catch(error){return json(res,500,{error:error.message});} }
